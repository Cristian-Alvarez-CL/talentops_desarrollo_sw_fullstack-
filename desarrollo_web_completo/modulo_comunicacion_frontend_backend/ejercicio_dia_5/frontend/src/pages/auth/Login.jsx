import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button, Input, Card } from '../../components/ui';

const loginSchema = z.object({
  email: z.string().email('Email invalido'),
  password: z.string().min(1, 'La contrasena es requerida'),
});

export const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data) => {
    await login(data);
  };

  return (
    <Card padding="lg" className="animate-fade-in">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-secondary-900">
          Bienvenido de vuelta
        </h1>
        <p className="text-secondary-500 mt-2">
          Ingresa tus credenciales para continuar
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Input
          label="Email"
          type="email"
          placeholder="tu@email.com"
          icon={Mail}
          error={errors.email?.message}
          {...register('email')}
        />

        <div className="relative">
          <Input
            label="Contrasena"
            type={showPassword ? 'text' : 'password'}
            placeholder="Tu contrasena"
            icon={Lock}
            error={errors.password?.message}
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-9 text-secondary-400 hover:text-secondary-600"
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-secondary-600">Recordarme</span>
          </label>
          <a
            href="#"
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Olvidaste tu contrasena?
          </a>
        </div>

        <Button
          type="submit"
          loading={isSubmitting}
          className="w-full"
          size="lg"
        >
          Iniciar Sesion
        </Button>
      </form>

      <p className="text-center text-secondary-600 mt-6">
        No tienes cuenta?{' '}
        <Link
          to="/register"
          className="text-primary-600 hover:text-primary-700 font-medium"
        >
          Registrate
        </Link>
      </p>
    </Card>
  );
};

export default Login;
