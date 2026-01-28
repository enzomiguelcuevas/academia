package services

import (
	"errors"

	"gorm.io/gorm"

	"github.com/jos3lo89/library-api/internal/models"
)

type EnrollmentService struct {
	db *gorm.DB
}

func NewEnrollmentService(db *gorm.DB) *EnrollmentService {
	return &EnrollmentService{db: db}
}

func (s *EnrollmentService) Create(enrollment *models.Enrollment) error {
	return s.db.Create(enrollment).Error
}

func (s *EnrollmentService) GetActiveEnrollment(userID uint, periodID uint) (*models.Enrollment, error) {
	var enrollment models.Enrollment
	err := s.db.Where("user_id = ? AND period_id = ? AND is_active = ?", userID, periodID, true).First(&enrollment).Error
	if err != nil {
		return nil, err
	}
	if !enrollment.CanAccess {
		return nil, errors.New("access denied")
	}
	return &enrollment, nil
}

func (s *EnrollmentService) List() ([]models.Enrollment, error) {
	var enrollments []models.Enrollment
	if err := s.db.Preload("User").Preload("Period").Order("created_at DESC").Find(&enrollments).Error; err != nil {
		return nil, err
	}
	return enrollments, nil
}
