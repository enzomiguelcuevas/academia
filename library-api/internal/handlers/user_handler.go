package handlers

import (
	"net/http"
	"strings"

	"github.com/gofiber/fiber/v2"

	"github.com/jos3lo89/library-api/internal/models"
	"github.com/jos3lo89/library-api/internal/services"
)

type UserHandler struct {
	users *services.UserService
}

func NewUserHandler(users *services.UserService) *UserHandler {
	return &UserHandler{users: users}
}

type createUserRequest struct {
	DNI      string `json:"dni"`
	FullName string `json:"full_name"`
	Password string `json:"password"`
	Role     string `json:"role"`
}

func (h *UserHandler) Create(c *fiber.Ctx) error {
	var body createUserRequest
	if err := c.BodyParser(&body); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "invalid payload"})
	}
	if strings.TrimSpace(body.DNI) == "" || strings.TrimSpace(body.FullName) == "" || body.Password == "" {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "missing fields"})
	}

	role := models.RoleStudent
	if body.Role != "" {
		normalized := strings.ToUpper(body.Role)
		if normalized != string(models.RoleAdmin) && normalized != string(models.RoleStudent) {
			return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "invalid role"})
		}
		role = models.Role(normalized)
	}

	user := &models.User{
		DNI:      strings.TrimSpace(body.DNI),
		FullName: strings.TrimSpace(body.FullName),
		Role:     role,
		IsActive: true,
	}

	if err := h.users.CreateUser(user, body.Password); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(http.StatusCreated).JSON(user)
}
