package handlers

import (
	"net/http"

	"github.com/gofiber/fiber/v2"

	"github.com/jos3lo89/library-api/internal/models"
	"github.com/jos3lo89/library-api/internal/services"
)

type EnrollmentHandler struct {
	enrollments *services.EnrollmentService
}

func NewEnrollmentHandler(enrollments *services.EnrollmentService) *EnrollmentHandler {
	return &EnrollmentHandler{enrollments: enrollments}
}

type createEnrollmentRequest struct {
	UserID      uint   `json:"user_id"`
	PeriodID    uint   `json:"period_id"`
	DisplayName string `json:"display_name"`
	AvatarURL   string `json:"avatar_url"`
	Career      string `json:"career"`
	Semester    string `json:"semester"`
	CanAccess   *bool  `json:"can_access"`
}

func (h *EnrollmentHandler) List(c *fiber.Ctx) error {
	items, err := h.enrollments.List()
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"items": items})
}

func (h *EnrollmentHandler) Create(c *fiber.Ctx) error {
	var body createEnrollmentRequest
	if err := c.BodyParser(&body); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "invalid payload"})
	}
	if body.UserID == 0 || body.PeriodID == 0 || body.DisplayName == "" {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "missing fields"})
	}

	canAccess := true
	if body.CanAccess != nil {
		canAccess = *body.CanAccess
	}

	enrollment := &models.Enrollment{
		UserID:      body.UserID,
		PeriodID:    body.PeriodID,
		DisplayName: body.DisplayName,
		AvatarURL:   body.AvatarURL,
		Career:      body.Career,
		Semester:    body.Semester,
		CanAccess:   canAccess,
		IsActive:    true,
	}

	if err := h.enrollments.Create(enrollment); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(http.StatusCreated).JSON(enrollment)
}
