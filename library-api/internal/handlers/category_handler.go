package handlers

import (
	"net/http"
	"strings"

	"github.com/gofiber/fiber/v2"

	"github.com/jos3lo89/library-api/internal/models"
	"github.com/jos3lo89/library-api/internal/services"
)

type CategoryHandler struct {
	categories *services.CategoryService
}

func NewCategoryHandler(categories *services.CategoryService) *CategoryHandler {
	return &CategoryHandler{categories: categories}
}

type createCategoryRequest struct {
	Name string `json:"name"`
	Slug string `json:"slug"`
}

func (h *CategoryHandler) List(c *fiber.Ctx) error {
	categories, err := h.categories.List()
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"items": categories})
}

func (h *CategoryHandler) Create(c *fiber.Ctx) error {
	var body createCategoryRequest
	if err := c.BodyParser(&body); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "invalid payload"})
	}
	if strings.TrimSpace(body.Name) == "" || strings.TrimSpace(body.Slug) == "" {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "missing fields"})
	}

	category := &models.Category{
		Name: strings.TrimSpace(body.Name),
		Slug: strings.TrimSpace(body.Slug),
	}

	if err := h.categories.Create(category); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(http.StatusCreated).JSON(category)
}
