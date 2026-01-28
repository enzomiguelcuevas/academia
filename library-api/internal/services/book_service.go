package services

import (
	"github.com/jos3lo89/library-api/internal/models"
	"github.com/jos3lo89/library-api/internal/repositories"
)

type BookService struct {
	books *repositories.BookRepository
}

func NewBookService(books *repositories.BookRepository) *BookService {
	return &BookService{books: books}
}

func (s *BookService) Create(book *models.Book) error {
	return s.books.Create(book)
}

func (s *BookService) FindByID(id uint) (*models.Book, error) {
	return s.books.FindByID(id)
}

func (s *BookService) List(query string, categoryID *uint, offset int, limit int) ([]models.Book, int64, error) {
	return s.books.List(query, categoryID, offset, limit)
}
