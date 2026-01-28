package models

import "gorm.io/gorm"

type Review struct {
	gorm.Model
	UserID       uint     `gorm:"not null;index" json:"user_id"`
	BookID       uint     `gorm:"not null;index" json:"book_id"`
	EnrollmentID *uint    `gorm:"index" json:"enrollment_id,omitempty"`
	ParentID     *uint    `gorm:"index" json:"parent_id,omitempty"`
	Rating       *int     `json:"rating,omitempty"`
	Comment      string   `gorm:"type:text;not null" json:"comment"`
	DisplayName  string   `gorm:"not null" json:"display_name"`
	AvatarURL    string   `json:"avatar_url"`
	User         User     `gorm:"foreignKey:UserID" json:"-"`
	Book         Book     `gorm:"foreignKey:BookID" json:"-"`
	Parent       *Review  `gorm:"foreignKey:ParentID" json:"-"`
	Children     []Review `gorm:"foreignKey:ParentID" json:"children,omitempty"`
}
