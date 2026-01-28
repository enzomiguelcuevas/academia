package services

import (
	"errors"

	"gorm.io/gorm"

	"github.com/jos3lo89/library-api/internal/models"
)

type PeriodService struct {
	db *gorm.DB
}

func NewPeriodService(db *gorm.DB) *PeriodService {
	return &PeriodService{db: db}
}

func (s *PeriodService) Create(period *models.AcademicPeriod) error {
	return s.db.Create(period).Error
}

func (s *PeriodService) List() ([]models.AcademicPeriod, error) {
	var periods []models.AcademicPeriod
	if err := s.db.Order("start_date DESC").Find(&periods).Error; err != nil {
		return nil, err
	}
	return periods, nil
}

func (s *PeriodService) GetCurrent() (*models.AcademicPeriod, error) {
	var period models.AcademicPeriod
	if err := s.db.Where("is_current = ?", true).First(&period).Error; err != nil {
		return nil, err
	}
	return &period, nil
}

func (s *PeriodService) SetCurrent(id uint) error {
	return s.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&models.AcademicPeriod{}).Where("is_current = ?", true).Update("is_current", false).Error; err != nil {
			return err
		}
		result := tx.Model(&models.AcademicPeriod{}).Where("id = ?", id).Update("is_current", true)
		if result.Error != nil {
			return result.Error
		}
		if result.RowsAffected == 0 {
			return errors.New("period not found")
		}
		return nil
	})
}
