import React from 'react';
import RegisterForm from '../components/RegisterForm';

const Register = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-3xl font-extrabold text-gray-900">
          Crear Cuenta
        </h1>
        <p className="mt-2 text-center text-sm text-gray-600">
          Regístrate para acceder al sistema
        </p>
      </div>
      <RegisterForm />
    </div>
  );
};

export default Register;