import React from 'react';
import { BookOpen, TrendingUp, Users } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { useAuthStore } from '@/stores/authStore';

export const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();

  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Bienvenido, {user?.full_name}!
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {isAdmin
            ? 'Panel de administración de la biblioteca'
            : 'Explora nuestro catálogo de libros digitales'}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-primary-600 dark:text-primary-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Libros disponibles
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  --
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {isAdmin ? (
          <>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-green-600 dark:text-green-400" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Usuarios registrados
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      --
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <TrendingUp className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Lecturas este mes
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      --
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Libros leídos
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    --
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isAdmin ? (
              <>
                <a
                  href="/admin/books"
                  className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                >
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    Gestionar Libros
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Agregar, editar o eliminar libros
                  </p>
                </a>
                <a
                  href="/admin/categories"
                  className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                >
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    Gestionar Categorías
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Administrar categorías de libros
                  </p>
                </a>
                <a
                  href="/admin/users"
                  className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                >
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    Gestionar Usuarios
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Administrar cuentas de usuarios
                  </p>
                </a>
              </>
            ) : (
              <>
                <a
                  href="/books"
                  className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                >
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    Explorar Libros
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Descubre nuevos títulos
                  </p>
                </a>
                <a
                  href="/profile"
                  className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                >
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    Mi Perfil
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Gestiona tu información
                  </p>
                </a>
                <a
                  href="/books/favorites"
                  className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                >
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    Favoritos
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Tu colección personal
                  </p>
                </a>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};