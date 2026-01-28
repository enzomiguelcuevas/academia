package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"

	"github.com/jos3lo89/library-api/internal/models"
	"github.com/jos3lo89/library-api/internal/services"
)

type PeriodHandler struct {
	periods *services.PeriodService
}

func NewPeriodHandler(periods *services.PeriodService) *PeriodHandler {
	return &PeriodHandler{periods: periods}
}

type createPeriodRequest struct {
	Name      string `json:"name"`
	StartDate string `json:"start_date"`
	EndDate   string `json:"end_date"`
	IsCurrent bool   `json:"is_current"`
}

func (h *PeriodHandler) List(c *fiber.Ctx) error {
	items, err := h.periods.List()
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"items": items})
}

func (h *PeriodHandler) Create(c *fiber.Ctx) error {
	var body createPeriodRequest
	if err := c.BodyParser(&body); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "invalid payload"})
	}
	if body.Name == "" {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "missing name"})
	}

	startDate, err := time.Parse("2006-01-02", body.StartDate)
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "invalid start_date"})
	}
	endDate, err := time.Parse("2006-01-02", body.EndDate)
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "invalid end_date"})
	}

	period := &models.AcademicPeriod{
		Name:      body.Name,
		StartDate: startDate,
		EndDate:   endDate,
		IsCurrent: body.IsCurrent,
	}

	if err := h.periods.Create(period); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	if body.IsCurrent {
		if err := h.periods.SetCurrent(period.ID); err != nil {
			return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
		}
	}

	return c.Status(http.StatusCreated).JSON(period)
}

func (h *PeriodHandler) SetCurrent(c *fiber.Ctx) error {
	parsed, err := strconv.Atoi(c.Params("id"))
	if err != nil || parsed < 1 {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "invalid id"})
	}

	if err := h.periods.SetCurrent(uint(parsed)); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"message": "current period updated"})
}
