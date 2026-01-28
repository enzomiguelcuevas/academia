package services

import (
	"errors"

	"gorm.io/gorm"

	"github.com/jos3lo89/library-api/internal/models"
)

type ReviewNode struct {
	ID           uint          `json:"id"`
	BookID       uint          `json:"book_id"`
	ParentID     *uint         `json:"parent_id,omitempty"`
	UserID       uint          `json:"user_id"`
	EnrollmentID *uint         `json:"enrollment_id,omitempty"`
	Rating       *int          `json:"rating,omitempty"`
	Comment      string        `json:"comment"`
	DisplayName  string        `json:"display_name"`
	AvatarURL    string        `json:"avatar_url"`
	CreatedAt    int64         `json:"created_at"`
	Children     []*ReviewNode `json:"children"`
}

type ReviewService struct {
	db *gorm.DB
}

func NewReviewService(db *gorm.DB) *ReviewService {
	return &ReviewService{db: db}
}

func (s *ReviewService) Create(review *models.Review, maxDepth int) error {
	if maxDepth < 1 {
		maxDepth = 1
	}
	if review.ParentID != nil {
		var parent models.Review
		if err := s.db.First(&parent, *review.ParentID).Error; err != nil {
			return err
		}
		if parent.BookID != review.BookID {
			return errors.New("parent review belongs to a different book")
		}
		if review.Rating != nil {
			return errors.New("rating allowed only on root comments")
		}
		depth, err := s.getDepth(&parent, maxDepth)
		if err != nil {
			return err
		}
		if depth+1 > maxDepth {
			return errors.New("max comment depth exceeded")
		}
	}
	return s.db.Create(review).Error
}

func (s *ReviewService) getDepth(review *models.Review, maxDepth int) (int, error) {
	depth := 1
	current := review
	for current.ParentID != nil {
		if depth >= maxDepth {
			return depth, nil
		}
		var parent models.Review
		if err := s.db.First(&parent, *current.ParentID).Error; err != nil {
			return 0, err
		}
		depth++
		current = &parent
	}
	return depth, nil
}

func (s *ReviewService) ListTree(bookID uint) ([]ReviewNode, error) {
	var reviews []models.Review
	if err := s.db.Where("book_id = ?", bookID).Order("created_at ASC").Find(&reviews).Error; err != nil {
		return nil, err
	}

	nodes := make(map[uint]*ReviewNode, len(reviews))
	for _, review := range reviews {
		node := ReviewNode{
			ID:           review.ID,
			BookID:       review.BookID,
			ParentID:     review.ParentID,
			UserID:       review.UserID,
			EnrollmentID: review.EnrollmentID,
			Rating:       review.Rating,
			Comment:      review.Comment,
			DisplayName:  review.DisplayName,
			AvatarURL:    review.AvatarURL,
			CreatedAt:    review.CreatedAt.Unix(),
			Children:     []*ReviewNode{},
		}
		nodes[review.ID] = &node
	}

	for _, review := range reviews {
		node := nodes[review.ID]
		if review.ParentID == nil {
			continue
		}
		parentNode, ok := nodes[*review.ParentID]
		if !ok {
			continue
		}
		parentNode.Children = append(parentNode.Children, node)
	}

	roots := make([]ReviewNode, 0)
	for _, review := range reviews {
		node := nodes[review.ID]
		if review.ParentID == nil || nodes[*review.ParentID] == nil {
			roots = append(roots, *node)
		}
	}

	return roots, nil
}
