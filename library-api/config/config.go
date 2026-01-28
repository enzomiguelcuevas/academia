package config

import (
	"os"
	"strconv"
	"strings"

	"github.com/joho/godotenv"
)

type Config struct {
	Port           string
	DBHost         string
	DBUser         string
	DBPassword     string
	DBName         string
	DBPort         string
	DBSSLMode      string
	JWTSecret      string
	CookieSecure   bool
	CookieSameSite string
	AWSAccessKey   string
	AWSSecretKey   string
	AWSRegion      string
	AWSBucket      string
	S3PublicURL    string
	MaxReviewDepth int
}

func Load() (*Config, error) {
	_ = godotenv.Load()

	return &Config{
		Port:           getEnv("PORT", "3000"),
		DBHost:         getEnv("DB_HOST", "localhost"),
		DBUser:         getEnv("DB_USER", "postgres"),
		DBPassword:     getEnv("DB_PASSWORD", ""),
		DBName:         getEnv("DB_NAME", "biblioteca_db"),
		DBPort:         getEnv("DB_PORT", "5432"),
		DBSSLMode:      getEnv("DB_SSLMODE", "disable"),
		JWTSecret:      getEnv("JWT_SECRET", ""),
		CookieSecure:   getEnvBool("COOKIE_SECURE", false),
		CookieSameSite: getEnv("COOKIE_SAMESITE", "Lax"),
		AWSAccessKey:   getEnv("AWS_ACCESS_KEY_ID", ""),
		AWSSecretKey:   getEnv("AWS_SECRET_ACCESS_KEY", ""),
		AWSRegion:      getEnv("AWS_REGION", ""),
		AWSBucket:      getEnv("AWS_BUCKET_NAME", ""),
		S3PublicURL:    getEnv("AWS_PUBLIC_URL", ""),
		MaxReviewDepth: getEnvInt("MAX_REVIEW_DEPTH", 3),
	}, nil
}

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}

func getEnvBool(key string, fallback bool) bool {
	value, ok := os.LookupEnv(key)
	if !ok {
		return fallback
	}
	lower := strings.ToLower(strings.TrimSpace(value))
	if lower == "true" || lower == "1" || lower == "yes" {
		return true
	}
	if lower == "false" || lower == "0" || lower == "no" {
		return false
	}
	return fallback
}

func getEnvInt(key string, fallback int) int {
	value, ok := os.LookupEnv(key)
	if !ok {
		return fallback
	}
	parsed, err := strconv.Atoi(value)
	if err != nil {
		return fallback
	}
	return parsed
}
