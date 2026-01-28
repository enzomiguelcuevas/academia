package services

import (
	"gorm.io/gorm"

	"github.com/jos3lo89/library-api/internal/models"
)

type CategoryService struct {
	db *gorm.DB
}

func NewCategoryService(db *gorm.DB) *CategoryService {
	return &CategoryService{db: db}
}

func (s *CategoryService) Create(category *models.Category) error {
	return s.db.Create(category).Error
}

func (s *CategoryService) List() ([]models.Category, error) {
	var categories []models.Category
	if err := s.db.Order("name ASC").Find(&categories).Error; err != nil {
		return nil, err
	}
	return categories, nil
}
