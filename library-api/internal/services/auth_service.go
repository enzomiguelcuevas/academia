package services

import (
	"errors"
	"time"

	"github.com/jos3lo89/library-api/internal/models"
	"github.com/jos3lo89/library-api/internal/repositories"
	"github.com/jos3lo89/library-api/pkg/utils"
)

type AuthService struct {
	users     *repositories.UserRepository
	jwtSecret string
	tokenTTL  time.Duration
}

func NewAuthService(users *repositories.UserRepository, jwtSecret string) *AuthService {
	return &AuthService{
		users:     users,
		jwtSecret: jwtSecret,
		tokenTTL:  24 * time.Hour,
	}
}

func (s *AuthService) Register(dni, fullName, password string) (*models.User, error) {
	hashed, err := utils.HashPassword(password)
	if err != nil {
		return nil, err
	}

	user := &models.User{
		DNI:          dni,
		FullName:     fullName,
		PasswordHash: hashed,
		Role:         models.RoleStudent,
		IsActive:     true,
	}

	if err := s.users.Create(user); err != nil {
		return nil, err
	}

	return user, nil
}

func (s *AuthService) Login(dni, password string) (string, *models.User, error) {
	user, err := s.users.FindByDNI(dni)
	if err != nil {
		return "", nil, err
	}

	if !user.IsActive {
		return "", nil, errors.New("user is inactive")
	}

	if !utils.CheckPassword(password, user.PasswordHash) {
		return "", nil, errors.New("invalid credentials")
	}

	token, err := utils.GenerateToken(user.ID, string(user.Role), s.jwtSecret, s.tokenTTL)
	if err != nil {
		return "", nil, err
	}

	return token, user, nil
}
