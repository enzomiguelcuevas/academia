package models

import "gorm.io/gorm"

type Role string

const (
	RoleAdmin   Role = "ADMIN"
	RoleStudent Role = "STUDENT"
)

type User struct {
	gorm.Model
	DNI          string       `gorm:"uniqueIndex;not null;size:20" json:"dni"`
	FullName     string       `gorm:"not null" json:"full_name"`
	PasswordHash string       `gorm:"not null" json:"-"`
	Role         Role         `gorm:"type:varchar(20);default:'STUDENT'" json:"role"`
	IsActive     bool         `gorm:"default:true" json:"is_active"`
	Enrollments  []Enrollment `json:"-"`
	Reviews      []Review     `json:"-"`
}
