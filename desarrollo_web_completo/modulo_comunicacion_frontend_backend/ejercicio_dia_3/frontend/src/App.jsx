import React from 'react';
import { ProductProvider } from './context/ProductContext';
import ProductList from './components/ProductList';
import ProductForm from './components/ProductForm';
import ProductFilters from './components/ProductFilters';
import CacheStatus from './components/CacheStatus';
import Favorites from './components/Favorites';

function App() {
  return (
    <ProductProvider>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Gestión de Productos</h1>
                <p className="text-gray-600 mt-1">Sistema completo con cache y persistencia</p>
              </div>
              <CacheStatus />
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="md:col-span-2">
                  <ProductFilters />
                </div>
                <div className="md:col-span-2">
                  <ProductList />
                </div>
              </div>
            </div>
            
            <div className="space-y-8">
              <ProductForm />
              <Favorites />
            </div>
          </div>
        </main>

        <footer className="bg-white border-t mt-12">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <p className="text-center text-gray-600">
              Sistema de gestión de productos con React 18 y Context API
            </p>
          </div>
        </footer>
      </div>
    </ProductProvider>
  );
}

export default App;