package models

import "gorm.io/gorm"

type Enrollment struct {
	gorm.Model
	UserID      uint           `gorm:"not null;index;uniqueIndex:idx_user_period" json:"user_id"`
	PeriodID    uint           `gorm:"not null;index;uniqueIndex:idx_user_period" json:"period_id"`
	DisplayName string         `gorm:"not null" json:"display_name"`
	AvatarURL   string         `json:"avatar_url"`
	Career      string         `json:"career"`
	Semester    string         `json:"semester"`
	CanAccess   bool           `gorm:"default:true" json:"can_access"`
	IsActive    bool           `gorm:"default:true" json:"is_active"`
	User        User           `gorm:"foreignKey:UserID" json:"-"`
	Period      AcademicPeriod `gorm:"foreignKey:PeriodID" json:"-"`
	Reviews     []Review       `json:"-"`
}
