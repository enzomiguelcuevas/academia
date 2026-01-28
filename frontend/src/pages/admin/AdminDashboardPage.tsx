import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Users, Tags, Settings, BarChart3 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

export const AdminDashboardPage: React.FC = () => {
  const adminActions = [
    {
      title: 'Gestionar Libros',
      description: 'Agregar, editar o eliminar libros del catálogo',
      icon: BookOpen,
      href: '/admin/books',
      color: 'text-primary-600 dark:text-primary-400',
    },
    {
      title: 'Gestionar Usuarios',
      description: 'Administrar cuentas de estudiantes',
      icon: Users,
      href: '/admin/users',
      color: 'text-green-600 dark:text-green-400',
    },
    {
      title: 'Gestionar Categorías',
      description: 'Administrar categorías de libros',
      icon: Tags,
      href: '/admin/categories',
      color: 'text-blue-600 dark:text-blue-400',
    },
    {
      title: 'Reportes',
      description: 'Ver estadísticas y reportes de uso',
      icon: BarChart3,
      href: '/admin/reports',
      color: 'text-purple-600 dark:text-purple-400',
    },
    {
      title: 'Configuración',
      description: 'Configuración general del sistema',
      icon: Settings,
      href: '/admin/settings',
      color: 'text-gray-600 dark:text-gray-400',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Panel de Administración
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Gestiona tu biblioteca digital desde aquí
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.title}
              to={action.href}
              className="block transition-transform duration-200 hover:scale-105"
            >
              <Card className="h-full hover:shadow-lg cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-full bg-gray-100 dark:bg-gray-800`}>
                      <Icon className={`h-6 w-6 ${action.color}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {action.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Libros
                </p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  --
                </p>
              </div>
              <BookOpen className="h-8 w-8 text-primary-600 dark:text-primary-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Usuarios Activos
                </p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  --
                </p>
              </div>
              <Users className="h-8 w-8 text-green-600 dark:text-green-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Categorías
                </p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  --
                </p>
              </div>
              <Tags className="h-8 w-8 text-blue-600 dark:text-blue-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Lecturas Hoy
                </p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  --
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-600 dark:text-purple-400 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};