import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, BookOpen, Star, MessageCircle } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { useBookStore } from '@/stores/bookStore';
import { useAuthStore } from '@/stores/authStore';
import type { Book, Review } from '@/types';

export const BookDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    currentBook,
    isLoading,
    error,
    fetchBookById,
    getBookReadUrl,
  } = useBookStore();

  const [readUrl, setReadUrl] = useState<string | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoadingReadUrl, setIsLoadingReadUrl] = useState(false);

  useEffect(() => {
    if (id) {
      fetchBookById(Number(id));
      // TODO: Fetch reviews when the service is implemented
    }
  }, [id, fetchBookById]);

  const handleReadBook = async () => {
    if (!currentBook) return;
    
    setIsLoadingReadUrl(true);
    try {
      const response = await getBookReadUrl(currentBook.id);
      setReadUrl(response.url);
      window.open(response.url, '_blank');
    } catch (error) {
      console.error('Error getting read URL:', error);
    } finally {
      setIsLoadingReadUrl(false);
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </MainLayout>
    );
  }

  if (error || !currentBook) {
    return (
      <MainLayout>
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Error al cargar el libro
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {error || 'El libro no fue encontrado.'}
            </p>
            <Button onClick={() => navigate('/books')}>
              Volver al catálogo
            </Button>
          </CardContent>
        </Card>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Back Button */}
        <Button
          variant="secondary"
          onClick={() => navigate('/books')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al catálogo
        </Button>

        {/* Book Details */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Book Cover */}
              <div className="md:col-span-1">
                {currentBook.cover_url ? (
                  <img
                    src={currentBook.cover_url}
                    alt={currentBook.title}
                    className="w-full rounded-lg shadow-md"
                  />
                ) : (
                  <div className="w-full h-96 bg-gray-200 flex items-center justify-center rounded-lg dark:bg-gray-700">
                    <BookOpen className="h-24 w-24 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Book Info */}
              <div className="md:col-span-2 space-y-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {currentBook.title}
                  </h1>
                  <p className="text-xl text-gray-600 dark:text-gray-400 mb-4">
                    por {currentBook.author}
                  </p>
                  
                  {currentBook.category && (
                    <span className="inline-block px-3 py-1 text-sm font-medium bg-primary-100 text-primary-800 rounded-full dark:bg-primary-900/30 dark:text-primary-300 mb-4">
                      {currentBook.category.name}
                    </span>
                  )}
                </div>

                {currentBook.description && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Descripción
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {currentBook.description}
                    </p>
                  </div>
                )}

                <div className="flex flex-wrap gap-4 pt-4">
                  <Button
                    onClick={handleReadBook}
                    loading={isLoadingReadUrl}
                    disabled={isLoadingReadUrl}
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    {isLoadingReadUrl ? 'Cargando...' : 'Leer libro'}
                  </Button>
                  
                  {currentBook.is_downloadable && (
                    <Button variant="secondary">
                      <Download className="h-4 w-4 mr-2" />
                      Descargar
                    </Button>
                  )}
                </div>

                <div className="text-sm text-gray-500 dark:text-gray-400 pt-4">
                  <p>Agregado: {new Date(currentBook.created_at).toLocaleDateString()}</p>
                  {currentBook.is_downloadable && (
                    <p className="text-green-600 dark:text-green-400">
                      ✓ Disponible para descarga
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reviews Section */}
        {user && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageCircle className="h-5 w-5 mr-2" />
                Reseñas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>Las reseñas estarán disponibles próximamente.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
};