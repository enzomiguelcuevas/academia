import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './components/ThemeProvider';
import { useAuthStore } from './stores/authStore';

// Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { BooksPage } from './pages/books/BooksPage';
import { BookDetailPage } from './pages/books/BookDetailPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminBookUploadPage } from './pages/admin/AdminBookUploadPage';

import { PrivateRoute } from './hooks/usePrivateRoute';

// Layouts
import { MainLayout } from './components/layout/MainLayout';

const AppContent: React.FC = () => {
  const { isAuthenticated, checkAuth } = useAuthStore();

  React.useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <Routes>
      {/* Public Routes */}
      <Route 
        path="/login" 
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
        } 
      />
      <Route 
        path="/register" 
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />
        } 
      />

      {/* Protected Routes */}
      <Route
        path="/"
        element={<Navigate to="/dashboard" replace />}
      />
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <MainLayout>
              <DashboardPage />
            </MainLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/books"
        element={
          <PrivateRoute>
            <MainLayout title="Catálogo de Libros">
              <BooksPage />
            </MainLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/books/:id"
        element={
          <PrivateRoute>
            <BookDetailPage />
          </PrivateRoute>
        }
      />

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <PrivateRoute requireAdmin>
            <MainLayout title="Administración">
              <AdminDashboardPage />
            </MainLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/books/upload"
        element={
          <PrivateRoute requireAdmin>
            <AdminBookUploadPage />
          </PrivateRoute>
        }
      />

      {/* 404 */}
      <Route
        path="*"
        element={
          <MainLayout>
            <div className="text-center py-12">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                404
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                Página no encontrada
              </p>
              <button
                onClick={() => window.history.back()}
                className="btn btn-primary"
              >
                Volver
              </button>
            </div>
          </MainLayout>
        }
      />
    </Routes>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;