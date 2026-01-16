import React from 'react';
import ProductForm from './components/ProductForm/ProductForm';

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Sistema de Gestión de Productos</h1>
      </header>
      <main className="app-main">
        <ProductForm />
      </main>
    </div>
  );
}

export default App;