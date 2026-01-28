package services

import (
	"gorm.io/gorm"

	"github.com/jos3lo89/library-api/internal/models"
	"github.com/jos3lo89/library-api/pkg/utils"
)

type UserService struct {
	db *gorm.DB
}

func NewUserService(db *gorm.DB) *UserService {
	return &UserService{db: db}
}

func (s *UserService) CreateUser(user *models.User, password string) error {
	hashed, err := utils.HashPassword(password)
	if err != nil {
		return err
	}
	user.PasswordHash = hashed
	return s.db.Create(user).Error
}

func (s *UserService) FindByID(id uint) (*models.User, error) {
	var user models.User
	if err := s.db.First(&user, id).Error; err != nil {
		return nil, err
	}
	return &user, nil
}
