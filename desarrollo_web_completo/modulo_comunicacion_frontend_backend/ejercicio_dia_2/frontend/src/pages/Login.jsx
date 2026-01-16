import React from 'react';
import LoginForm from '../components/LoginForm';

const Login = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-3xl font-extrabold text-gray-900">
          Sistema de Autenticación
        </h1>
        <p className="mt-2 text-center text-sm text-gray-600">
          Ingresa tus credenciales para acceder
        </p>
      </div>
      <LoginForm />
    </div>
  );
};

export default Login;