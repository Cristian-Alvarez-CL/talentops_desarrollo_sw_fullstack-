import React, { memo, useState, useCallback } from 'react';
import { useProductContext } from '../context/ProductContext';

const ProductForm = memo(() => {
  const { addProduct, categories } = useProductContext();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      await addProduct({
        ...formData,
        price: parseFloat(formData.price) || 0,
        stock: parseInt(formData.stock) || 0
      });
      
      setFormData({
        name: '',
        description: '',
        price: '',
        category: '',
        stock: ''
      });
      
      alert('✅ Producto agregado exitosamente');
    } catch (error) {
      console.error('Error al agregar producto:', error);
      alert('❌ Error al agregar producto');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, addProduct, isSubmitting]);

  return (
    <div className="card">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Agregar Nuevo Producto</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="input-field"
            placeholder="Ej: Laptop Gaming"
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descripción *
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows="3"
            className="input-field"
            placeholder="Descripción del producto..."
            disabled={isSubmitting}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Precio *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                $
              </span>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                step="0.01"
                min="0"
                className="input-field pl-8"
                placeholder="0.00"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stock *
            </label>
            <input
              type="number"
              name="stock"
              value={formData.stock}
              onChange={handleChange}
              required
              min="0"
              className="input-field"
              placeholder="0"
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Categoría *
          </label>
          <div className="flex gap-2">
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              className="input-field flex-1"
              disabled={isSubmitting}
            >
              <option value="">Seleccionar categoría</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full btn-primary ${isSubmitting ? 'opacity-75 cursor-not-allowed' : ''}`}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Agregando...
              </span>
            ) : 'Agregar Producto'}
          </button>
        </div>
      </form>
    </div>
  );
});

ProductForm.displayName = 'ProductForm';

export default ProductForm;