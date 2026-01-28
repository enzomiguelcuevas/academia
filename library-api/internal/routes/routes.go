package routes

import (
	"github.com/gofiber/fiber/v2"

	"github.com/jos3lo89/library-api/internal/handlers"
	"github.com/jos3lo89/library-api/internal/middleware"
	"github.com/jos3lo89/library-api/internal/models"
)

type Dependencies struct {
	Auth        *handlers.AuthHandler
	Users       *handlers.UserHandler
	Books       *handlers.BookHandler
	Categories  *handlers.CategoryHandler
	Enrollments *handlers.EnrollmentHandler
	Periods     *handlers.PeriodHandler
	JWTSecret   string
}

func RegisterRoutes(app *fiber.App, deps *Dependencies) {
	api := app.Group("/api")

	api.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok"})
	})

	auth := api.Group("/auth")
	auth.Post("/register", deps.Auth.Register)
	auth.Post("/login", deps.Auth.Login)
	auth.Get("/me", middleware.AuthRequired(deps.JWTSecret), deps.Auth.Me)
	auth.Post("/logout", middleware.AuthRequired(deps.JWTSecret), deps.Auth.Logout)

	admin := api.Group("/admin", middleware.AuthRequired(deps.JWTSecret), middleware.RequireRole(string(models.RoleAdmin)))

	admin.Post("/users", deps.Users.Create)
	admin.Post("/categories", deps.Categories.Create)
	admin.Post("/books", deps.Books.Create)
	admin.Post("/enrollments", deps.Enrollments.Create)
	admin.Get("/enrollments", deps.Enrollments.List)
	admin.Post("/periods", deps.Periods.Create)
	admin.Patch("/periods/:id/current", deps.Periods.SetCurrent)

	api.Get("/categories", deps.Categories.List)
	api.Get("/books", deps.Books.List)
	api.Get("/books/:id", deps.Books.GetByID)

	api.Get("/periods", deps.Periods.List)

	api.Get("/books/:id/reviews", middleware.AuthRequired(deps.JWTSecret), deps.Books.ListReviews)
	api.Post("/books/:id/reviews", middleware.AuthRequired(deps.JWTSecret), deps.Books.CreateReview)
	api.Get("/books/:id/read", middleware.AuthRequired(deps.JWTSecret), deps.Books.Read)
}
