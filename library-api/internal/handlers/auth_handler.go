package handlers

import (
	"net/http"
	"time"

	"github.com/gofiber/fiber/v2"

	"github.com/jos3lo89/library-api/config"
	"github.com/jos3lo89/library-api/internal/services"
)

type AuthHandler struct {
	auth   *services.AuthService
	config *config.Config
}

func NewAuthHandler(auth *services.AuthService, cfg *config.Config) *AuthHandler {
	return &AuthHandler{auth: auth, config: cfg}
}

type registerRequest struct {
	DNI      string `json:"dni"`
	FullName string `json:"full_name"`
	Password string `json:"password"`
}

type loginRequest struct {
	DNI      string `json:"dni"`
	Password string `json:"password"`
}

func (h *AuthHandler) Register(c *fiber.Ctx) error {
	var body registerRequest
	if err := c.BodyParser(&body); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "invalid payload"})
	}
	if body.DNI == "" || body.FullName == "" || body.Password == "" {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "missing fields"})
	}

	user, err := h.auth.Register(body.DNI, body.FullName, body.Password)
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(http.StatusCreated).JSON(user)
}

func (h *AuthHandler) Login(c *fiber.Ctx) error {
	var body loginRequest
	if err := c.BodyParser(&body); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "invalid payload"})
	}
	if body.DNI == "" || body.Password == "" {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "missing credentials"})
	}

	token, user, err := h.auth.Login(body.DNI, body.Password)
	if err != nil {
		return c.Status(http.StatusUnauthorized).JSON(fiber.Map{"error": err.Error()})
	}

	h.setAuthCookie(c, token)
	return c.JSON(fiber.Map{"user": user})
}

func (h *AuthHandler) Me(c *fiber.Ctx) error {
	userID, ok := c.Locals("user_id").(uint)
	if !ok {
		return c.Status(http.StatusUnauthorized).JSON(fiber.Map{"error": "unauthorized"})
	}
	return c.JSON(fiber.Map{"user_id": userID, "role": c.Locals("role")})
}

func (h *AuthHandler) Logout(c *fiber.Ctx) error {
	cookie := fiber.Cookie{
		Name:     "access_token",
		Value:    "",
		Expires:  time.Unix(0, 0),
		HTTPOnly: true,
		Secure:   h.config.CookieSecure,
		SameSite: parseSameSite(h.config.CookieSameSite),
	}
	c.Cookie(&cookie)
	return c.Status(http.StatusOK).JSON(fiber.Map{"message": "logged out"})
}

func (h *AuthHandler) setAuthCookie(c *fiber.Ctx, token string) {
	cookie := fiber.Cookie{
		Name:     "access_token",
		Value:    token,
		Expires:  time.Now().Add(24 * time.Hour),
		HTTPOnly: true,
		Secure:   h.config.CookieSecure,
		SameSite: parseSameSite(h.config.CookieSameSite),
	}
	c.Cookie(&cookie)
}

func parseSameSite(value string) string {
	switch value {
	case "Strict", "strict":
		return "Strict"
	case "None", "none":
		return "None"
	default:
		return "Lax"
	}
}
