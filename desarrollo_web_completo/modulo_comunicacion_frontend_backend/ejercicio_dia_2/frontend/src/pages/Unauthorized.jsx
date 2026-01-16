import React from 'react';
import { Link } from 'react-router-dom';

const Unauthorized = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-red-600">403</h1>
        <h2 className="text-3xl font-semibold text-gray-800 mt-4">
          Acceso Denegado
        </h2>
        <p className="text-gray-600 mt-2 max-w-md mx-auto">
          No tienes los permisos necesarios para acceder a esta página.
        </p>
        
        <div className="mt-8 space-x-4">
          <Link
            to="/dashboard"
            className="inline-block bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition"
          >
            Volver al Dashboard
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-block bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition"
          >
            Volver Atrás
          </button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;