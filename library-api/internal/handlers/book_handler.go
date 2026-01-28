package handlers

import (
	"net/http"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"

	"github.com/jos3lo89/library-api/config"
	"github.com/jos3lo89/library-api/internal/models"
	"github.com/jos3lo89/library-api/internal/services"
)

type BookHandler struct {
	books       *services.BookService
	s3          *services.S3Service
	enrollments *services.EnrollmentService
	periods     *services.PeriodService
	reviews     *services.ReviewService
	config      *config.Config
}

func NewBookHandler(books *services.BookService, s3 *services.S3Service, enrollments *services.EnrollmentService, periods *services.PeriodService, reviews *services.ReviewService, cfg *config.Config) *BookHandler {
	return &BookHandler{books: books, s3: s3, enrollments: enrollments, periods: periods, reviews: reviews, config: cfg}
}

func (h *BookHandler) List(c *fiber.Ctx) error {
	query := strings.TrimSpace(c.Query("q"))
	categoryParam := c.Query("category_id")
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "10"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 50 {
		limit = 10
	}

	var categoryID *uint
	if categoryParam != "" {
		if parsed, err := strconv.ParseUint(categoryParam, 10, 64); err == nil {
			id := uint(parsed)
			categoryID = &id
		}
	}

	offset := (page - 1) * limit
	books, total, err := h.books.List(query, categoryID, offset, limit)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{
		"items": books,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

func (h *BookHandler) GetByID(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "invalid id"})
	}

	book, err := h.books.FindByID(uint(id))
	if err != nil {
		return c.Status(http.StatusNotFound).JSON(fiber.Map{"error": "book not found"})
	}

	return c.JSON(book)
}

func (h *BookHandler) Create(c *fiber.Ctx) error {
	title := strings.TrimSpace(c.FormValue("title"))
	author := strings.TrimSpace(c.FormValue("author"))
	description := strings.TrimSpace(c.FormValue("description"))
	categoryIDValue := strings.TrimSpace(c.FormValue("category_id"))
	isDownloadableValue := strings.TrimSpace(c.FormValue("is_downloadable"))
	coverURL := strings.TrimSpace(c.FormValue("cover_url"))

	if title == "" || author == "" || categoryIDValue == "" {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "missing fields"})
	}

	categoryIDParsed, err := strconv.ParseUint(categoryIDValue, 10, 64)
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "invalid category id"})
	}

	isDownloadable := false
	if isDownloadableValue != "" {
		if parsed, err := strconv.ParseBool(isDownloadableValue); err == nil {
			isDownloadable = parsed
		}
	}

	file, err := c.FormFile("file")
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "file is required"})
	}

	fileHandle, err := file.Open()
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "failed to open file"})
	}
	defer fileHandle.Close()

	key := buildS3Key(file.Filename)
	contentType := file.Header.Get("Content-Type")
	if contentType == "" {
		contentType = "application/pdf"
	}

	if err := h.s3.Upload(c.Context(), key, fileHandle, contentType); err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "failed to upload"})
	}

	book := &models.Book{
		Title:          title,
		Author:         author,
		Description:    description,
		CoverURL:       coverURL,
		S3Key:          key,
		IsDownloadable: isDownloadable,
		CategoryID:     uint(categoryIDParsed),
	}

	if err := h.books.Create(book); err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(http.StatusCreated).JSON(book)
}

func (h *BookHandler) Read(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "invalid id"})
	}

	book, err := h.books.FindByID(uint(id))
	if err != nil {
		return c.Status(http.StatusNotFound).JSON(fiber.Map{"error": "book not found"})
	}

	userID, ok := c.Locals("user_id").(uint)
	if !ok {
		return c.Status(http.StatusUnauthorized).JSON(fiber.Map{"error": "unauthorized"})
	}

	currentPeriod, err := h.periods.GetCurrent()
	if err != nil {
		return c.Status(http.StatusForbidden).JSON(fiber.Map{"error": "no current period"})
	}

	if _, err := h.enrollments.GetActiveEnrollment(userID, currentPeriod.ID); err != nil {
		return c.Status(http.StatusForbidden).JSON(fiber.Map{"error": "no access"})
	}

	url, err := h.s3.PresignGetURL(c.Context(), book.S3Key, 15*time.Minute)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "failed to generate url"})
	}

	return c.JSON(fiber.Map{"url": url})
}

func (h *BookHandler) ListReviews(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "invalid id"})
	}

	if _, err := h.books.FindByID(uint(id)); err != nil {
		return c.Status(http.StatusNotFound).JSON(fiber.Map{"error": "book not found"})
	}

	userID, ok := c.Locals("user_id").(uint)
	if !ok {
		return c.Status(http.StatusUnauthorized).JSON(fiber.Map{"error": "unauthorized"})
	}

	currentPeriod, err := h.periods.GetCurrent()
	if err != nil {
		return c.Status(http.StatusForbidden).JSON(fiber.Map{"error": "no current period"})
	}

	if _, err := h.enrollments.GetActiveEnrollment(userID, currentPeriod.ID); err != nil {
		return c.Status(http.StatusForbidden).JSON(fiber.Map{"error": "no access"})
	}

	reviews, err := h.reviews.ListTree(uint(id))
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"items": reviews})
}

type createReviewRequest struct {
	ParentID *uint  `json:"parent_id"`
	Rating   *int   `json:"rating"`
	Comment  string `json:"comment"`
}

func (h *BookHandler) CreateReview(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "invalid id"})
	}

	if _, err := h.books.FindByID(uint(id)); err != nil {
		return c.Status(http.StatusNotFound).JSON(fiber.Map{"error": "book not found"})
	}

	var body createReviewRequest
	if err := c.BodyParser(&body); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "invalid payload"})
	}

	if strings.TrimSpace(body.Comment) == "" {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "comment required"})
	}

	if body.ParentID != nil && *body.ParentID == 0 {
		body.ParentID = nil
	}

	if body.Rating != nil {
		if *body.Rating < 1 || *body.Rating > 5 {
			return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "rating must be 1-5"})
		}
	}

	userID, ok := c.Locals("user_id").(uint)
	if !ok {
		return c.Status(http.StatusUnauthorized).JSON(fiber.Map{"error": "unauthorized"})
	}

	currentPeriod, err := h.periods.GetCurrent()
	if err != nil {
		return c.Status(http.StatusForbidden).JSON(fiber.Map{"error": "no current period"})
	}

	enrollment, err := h.enrollments.GetActiveEnrollment(userID, currentPeriod.ID)
	if err != nil {
		return c.Status(http.StatusForbidden).JSON(fiber.Map{"error": "no access"})
	}

	displayName := enrollment.DisplayName
	avatarURL := enrollment.AvatarURL

	review := &models.Review{
		UserID:       userID,
		BookID:       uint(id),
		EnrollmentID: &enrollment.ID,
		ParentID:     body.ParentID,
		Rating:       body.Rating,
		Comment:      strings.TrimSpace(body.Comment),
		DisplayName:  displayName,
		AvatarURL:    avatarURL,
	}

	if err := h.reviews.Create(review, h.config.MaxReviewDepth); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(http.StatusCreated).JSON(review)
}

func buildS3Key(filename string) string {
	ext := filepath.Ext(filename)
	return "books/" + uuid.New().String() + ext
}
