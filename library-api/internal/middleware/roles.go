package middleware

import (
	"net/http"

	"github.com/gofiber/fiber/v2"
)

func RequireRole(role string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		currentRole, ok := c.Locals("role").(string)
		if !ok || currentRole == "" {
			return c.Status(http.StatusUnauthorized).JSON(fiber.Map{"error": "missing role"})
		}
		if currentRole != role {
			return c.Status(http.StatusForbidden).JSON(fiber.Map{"error": "insufficient role"})
		}
		return c.Next()
	}
}
