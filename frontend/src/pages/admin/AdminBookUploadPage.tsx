import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Upload } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { useBookStore } from '@/stores/bookStore';
import { useAuthStore } from '@/stores/authStore';
import type { CreateBookRequest } from '@/types';

interface BookFormData {
  title: string;
  author: string;
  description: string;
  category_id: string;
  cover_url: string;
  is_downloadable: boolean;
  file: FileList;
}

export const AdminBookUploadPage: React.FC = () => {
  const { user } = useAuthStore();
  const {
    categories,
    isLoading,
    error,
    createBook,
    fetchCategories,
    clearError,
  } = useBookStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [successMessage, setSuccessMessage] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<BookFormData>();

  const selectedFile = watch('file');

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const onSubmit = async (data: BookFormData) => {
    if (!data.file || data.file.length === 0) {
      return;
    }

    setIsSubmitting(true);
    setSuccessMessage('');

    try {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('author', data.author);
      formData.append('description', data.description);
      formData.append('category_id', data.category_id);
      formData.append('cover_url', data.cover_url);
      formData.append('is_downloadable', data.is_downloadable.toString());
      formData.append('file', data.file[0]);

      await createBook(formData);
      
      setSuccessMessage('Libro agregado exitosamente');
      reset();
      setUploadProgress(0);
    } catch (error) {
      console.error('Error creating book:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user || user.role !== 'ADMIN') {
    return (
      <MainLayout title="Acceso Denegado">
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Acceso Denegado
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              No tienes permisos para acceder a esta página.
            </p>
          </CardContent>
        </Card>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Agregar Nuevo Libro">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Plus className="h-5 w-5 mr-2" />
              Información del Libro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Título del Libro"
                  placeholder="Ingrese el título"
                  {...register('title', {
                    required: 'El título es requerido',
                    minLength: {
                      value: 3,
                      message: 'El título debe tener al menos 3 caracteres',
                    },
                  })}
                  error={errors.title?.message}
                />

                <Input
                  label="Autor"
                  placeholder="Nombre del autor"
                  {...register('author', {
                    required: 'El autor es requerido',
                    minLength: {
                      value: 3,
                      message: 'El autor debe tener al menos 3 caracteres',
                    },
                  })}
                  error={errors.author?.message}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Categoría
                </label>
                <select
                  {...register('category_id', {
                    required: 'Debes seleccionar una categoría',
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                >
                  <option value="">Selecciona una categoría</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {errors.category_id && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.category_id.message}
                  </p>
                )}
              </div>

              <Input
                label="URL de Portada (Opcional)"
                placeholder="https://ejemplo.com/portada.jpg"
                {...register('cover_url')}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Descripción (Opcional)
                </label>
                <textarea
                  {...register('description')}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                  placeholder="Breve descripción del libro..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Archivo PDF (Requerido)
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors dark:border-gray-600">
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600 dark:text-gray-400">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500 dark:bg-gray-800"
                      >
                        <span>Subir archivo</span>
                        <input
                          id="file-upload"
                          type="file"
                          accept=".pdf"
                          {...register('file', {
                            required: 'Debes seleccionar un archivo PDF',
                            validate: {
                              lessThan10MB: (files) =>
                                files[0]?.size <= 10 * 1024 * 1024 ||
                                'El archivo debe pesar menos de 10MB',
                              isPdf: (files) =>
                                files[0]?.type === 'application/pdf' ||
                                'El archivo debe ser un PDF',
                            },
                          })}
                          className="sr-only"
                        />
                      </label>
                      <p className="pl-1">o arrastra y suelta</p>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      PDF hasta 10MB
                    </p>
                    {selectedFile && selectedFile[0] && (
                      <p className="text-sm text-green-600 dark:text-green-400">
                        Archivo seleccionado: {selectedFile[0].name}
                      </p>
                    )}
                  </div>
                </div>
                {errors.file && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.file.message}
                  </p>
                )}
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_downloadable"
                  {...register('is_downloadable')}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="is_downloadable"
                  className="ml-2 block text-sm text-gray-900 dark:text-gray-300"
                >
                  Permitir descarga del libro
                </label>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md dark:bg-red-900/20 dark:border-red-800">
                  {error}
                </div>
              )}

              {/* Success Message */}
              {successMessage && (
                <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md dark:bg-green-900/20 dark:border-green-800">
                  {successMessage}
                </div>
              )}

              {/* Upload Progress */}
              {isSubmitting && (
                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                  <div
                    className="bg-primary-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    reset();
                    clearError();
                    setSuccessMessage('');
                  }}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  loading={isSubmitting}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Subiendo...' : 'Agregar Libro'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};