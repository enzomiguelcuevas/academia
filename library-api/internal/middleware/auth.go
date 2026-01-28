package middleware

import (
	"net/http"

	"github.com/gofiber/fiber/v2"

	"github.com/jos3lo89/library-api/pkg/utils"
)

func AuthRequired(jwtSecret string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		token := c.Cookies("access_token")
		if token == "" {
			return c.Status(http.StatusUnauthorized).JSON(fiber.Map{"error": "missing token"})
		}

		claims, err := utils.ParseToken(token, jwtSecret)
		if err != nil {
			return c.Status(http.StatusUnauthorized).JSON(fiber.Map{"error": "invalid token"})
		}

		c.Locals("user_id", claims.UserID)
		c.Locals("role", claims.Role)

		return c.Next()
	}
}
