import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { BookCard } from '@/components/common/BookCard';
import { SearchBar } from '@/components/common/SearchBar';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { useBookStore } from '@/stores/bookStore';
import type { Book } from '@/types';

export const BooksPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const {
    books,
    categories,
    isLoading,
    error,
    pagination,
    searchQuery,
    selectedCategory,
    fetchBooks,
    fetchCategories,
    setSearchQuery,
    setSelectedCategory,
    clearError,
  } = useBookStore();

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchBooks({
      q: searchQuery,
      category_id: selectedCategory || undefined,
      page: currentPage,
      limit: 12,
    });
  }, [fetchBooks, searchQuery, selectedCategory, currentPage]);

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleCategoryChange = (categoryId: number | null) => {
    setSelectedCategory(categoryId);
    setCurrentPage(1);
  };

  const handleBookClick = (book: Book) => {
    navigate(`/books/${book.id}`);
  };

  const handleNextPage = () => {
    if (currentPage < Math.ceil(pagination.total / pagination.limit)) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  if (isLoading && books.length === 0) {
    return (
      <MainLayout title="Libros">
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Catálogo de Libros">
      <div className="space-y-6">
        {/* Search and Filters */}
        <SearchBar
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
          categories={categories}
        />

        {/* Error Message */}
        {error && (
          <Card>
            <CardContent>
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md dark:bg-red-900/20 dark:border-red-800">
                {error}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={clearError}
                  className="ml-4"
                >
                  Reintentar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {pagination.total > 0
              ? `${pagination.total} libro${pagination.total !== 1 ? 's' : ''} encontrado${pagination.total !== 1 ? 's' : ''}`
              : 'No se encontraron libros'}
          </h2>
        </div>

        {/* Books Grid */}
        {books.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {books.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  onClick={handleBookClick}
                />
              ))}
            </div>

            {/* Pagination */}
            {pagination.total > pagination.limit && (
              <div className="flex justify-center items-center space-x-4 mt-8">
                <Button
                  variant="secondary"
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Página {currentPage} de {Math.ceil(pagination.total / pagination.limit)}
                </span>
                <Button
                  variant="secondary"
                  onClick={handleNextPage}
                  disabled={currentPage >= Math.ceil(pagination.total / pagination.limit)}
                >
                  Siguiente
                </Button>
              </div>
            )}
          </>
        ) : (
          !isLoading && (
            <Card>
              <CardContent className="text-center py-12">
                <div className="text-gray-500 dark:text-gray-400">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400 mb-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No se encontraron libros
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Intenta ajustar tu búsqueda o filtros.
                  </p>
                </div>
              </CardContent>
            </Card>
          )
        )}

        {/* Loading Overlay */}
        {isLoading && books.length > 0 && (
          <div className="flex justify-center py-4">
            <LoadingSpinner />
          </div>
        )}
      </div>
    </MainLayout>
  );
};