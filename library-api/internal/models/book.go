package models

import "gorm.io/gorm"

type Book struct {
	gorm.Model
	Title          string   `gorm:"not null;index" json:"title"`
	Author         string   `gorm:"not null" json:"author"`
	Description    string   `gorm:"type:text" json:"description"`
	CoverURL       string   `json:"cover_url"`
	S3Key          string   `gorm:"not null" json:"-"`
	IsDownloadable bool     `gorm:"default:false" json:"is_downloadable"`
	CategoryID     uint     `json:"category_id"`
	Category       Category `gorm:"foreignKey:CategoryID" json:"category"`
	Reviews        []Review `json:"reviews,omitempty"`
}
