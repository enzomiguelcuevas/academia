import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { User, Lock, Mail } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { useAuthStore } from '@/stores/authStore';
import { RegisterRequest } from '@/types';

interface RegisterForm {
  dni: string;
  full_name: string;
  password: string;
  confirmPassword: string;
}

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register: registerUser, isLoading } = useAuthStore();
  const [error, setError] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterForm>();

  const password = watch('password');

  const onSubmit = async (data: RegisterForm) => {
    try {
      setError('');
      await registerUser({
        dni: data.dni,
        full_name: data.full_name,
        password: data.password,
      });
      navigate('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrarse');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-2xl font-bold">
              Crear Cuenta
            </CardTitle>
            <p className="text-center text-gray-600 dark:text-gray-400">
              Regístrate para acceder a la biblioteca
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <Input
                label="DNI"
                type="text"
                placeholder="Tu número de DNI"
                icon={<User className="h-5 w-5" />}
                {...register('dni', {
                  required: 'El DNI es requerido',
                  pattern: {
                    value: /^\d+$/,
                    message: 'El DNI debe contener solo números',
                  },
                })}
                error={errors.dni?.message}
              />

              <Input
                label="Nombre Completo"
                type="text"
                placeholder="Tu nombre completo"
                icon={<Mail className="h-5 w-5" />}
                {...register('full_name', {
                  required: 'El nombre es requerido',
                  minLength: {
                    value: 3,
                    message: 'El nombre debe tener al menos 3 caracteres',
                  },
                })}
                error={errors.full_name?.message}
              />

              <Input
                label="Contraseña"
                type="password"
                placeholder="Crea una contraseña"
                icon={<Lock className="h-5 w-5" />}
                {...register('password', {
                  required: 'La contraseña es requerida',
                  minLength: {
                    value: 6,
                    message: 'La contraseña debe tener al menos 6 caracteres',
                  },
                })}
                error={errors.password?.message}
              />

              <Input
                label="Confirmar Contraseña"
                type="password"
                placeholder="Confirma tu contraseña"
                icon={<Lock className="h-5 w-5" />}
                {...register('confirmPassword', {
                  required: 'Confirma tu contraseña',
                  validate: (value) =>
                    value === password || 'Las contraseñas no coinciden',
                })}
                error={errors.confirmPassword?.message}
              />

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md dark:bg-red-900/20 dark:border-red-800">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                loading={isLoading}
                disabled={isLoading}
              >
                {isLoading ? 'Registrando...' : 'Registrarse'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                ¿Ya tienes una cuenta?{' '}
                <button
                  onClick={() => navigate('/login')}
                  className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400"
                >
                  Inicia sesión aquí
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};