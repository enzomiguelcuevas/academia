package models

import (
	"time"

	"gorm.io/gorm"
)

type AcademicPeriod struct {
	gorm.Model
	Name        string       `gorm:"uniqueIndex;not null" json:"name"`
	StartDate   time.Time    `json:"start_date"`
	EndDate     time.Time    `json:"end_date"`
	IsCurrent   bool         `gorm:"default:false" json:"is_current"`
	Enrollments []Enrollment `gorm:"foreignKey:PeriodID" json:"-"`
}
