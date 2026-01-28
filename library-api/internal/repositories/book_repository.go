package repositories

import (
	"gorm.io/gorm"

	"github.com/jos3lo89/library-api/internal/models"
)

type BookRepository struct {
	db *gorm.DB
}

func NewBookRepository(db *gorm.DB) *BookRepository {
	return &BookRepository{db: db}
}

func (r *BookRepository) Create(book *models.Book) error {
	return r.db.Create(book).Error
}

func (r *BookRepository) FindByID(id uint) (*models.Book, error) {
	var book models.Book
	if err := r.db.Preload("Category").First(&book, id).Error; err != nil {
		return nil, err
	}
	return &book, nil
}

func (r *BookRepository) List(query string, categoryID *uint, offset int, limit int) ([]models.Book, int64, error) {
	var books []models.Book
	var total int64

	q := r.db.Model(&models.Book{}).Preload("Category")
	if query != "" {
		like := "%" + query + "%"
		q = q.Where("title ILIKE ? OR author ILIKE ?", like, like)
	}
	if categoryID != nil {
		q = q.Where("category_id = ?", *categoryID)
	}

	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if err := q.Order("created_at DESC").Offset(offset).Limit(limit).Find(&books).Error; err != nil {
		return nil, 0, err
	}

	return books, total, nil
}
