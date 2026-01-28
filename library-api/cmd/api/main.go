package main

import (
	"log"

	"github.com/gofiber/fiber/v2"

	"github.com/jos3lo89/library-api/config"
	"github.com/jos3lo89/library-api/internal/handlers"
	"github.com/jos3lo89/library-api/internal/models"
	"github.com/jos3lo89/library-api/internal/repositories"
	"github.com/jos3lo89/library-api/internal/routes"
	"github.com/jos3lo89/library-api/internal/services"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatal(err)
	}
	if cfg.JWTSecret == "" {
		log.Fatal("JWT_SECRET is required")
	}

	db, err := config.ConnectDatabase(cfg)
	if err != nil {
		log.Fatal(err)
	}

	if err := db.AutoMigrate(
		&models.User{},
		&models.AcademicPeriod{},
		&models.Enrollment{},
		&models.Category{},
		&models.Book{},
		&models.Review{},
	); err != nil {
		log.Fatal(err)
	}

	userRepo := repositories.NewUserRepository(db)
	bookRepo := repositories.NewBookRepository(db)

	authService := services.NewAuthService(userRepo, cfg.JWTSecret)
	userService := services.NewUserService(db)
	bookService := services.NewBookService(bookRepo)
	categoryService := services.NewCategoryService(db)
	enrollmentService := services.NewEnrollmentService(db)
	periodService := services.NewPeriodService(db)
	reviewService := services.NewReviewService(db)

	s3Service, err := services.NewS3Service(cfg)
	if err != nil {
		log.Fatal(err)
	}

	authHandler := handlers.NewAuthHandler(authService, cfg)
	userHandler := handlers.NewUserHandler(userService)
	categoryHandler := handlers.NewCategoryHandler(categoryService)
	bookHandler := handlers.NewBookHandler(bookService, s3Service, enrollmentService, periodService, reviewService, cfg)
	enrollmentHandler := handlers.NewEnrollmentHandler(enrollmentService)
	periodHandler := handlers.NewPeriodHandler(periodService)

	app := fiber.New()

	routes.RegisterRoutes(app, &routes.Dependencies{
		Auth:        authHandler,
		Users:       userHandler,
		Books:       bookHandler,
		Categories:  categoryHandler,
		Enrollments: enrollmentHandler,
		Periods:     periodHandler,
		JWTSecret:   cfg.JWTSecret,
	})

	log.Fatal(app.Listen(":" + cfg.Port))
}
