import React, { memo, useState, useCallback } from 'react';
import { useProductContext } from '../context/ProductContext';

const ProductItem = memo(({ product }) => {
  const { deleteProduct, toggleFavorite, updateProduct } = useProductContext();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ ...product });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = useCallback(async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await updateProduct(product.id, editData);
      setIsEditing(false);
    } catch (error) {
      console.error('Error al actualizar producto:', error);
      alert('Error al actualizar el producto');
    } finally {
      setIsSubmitting(false);
    }
  }, [product.id, editData, updateProduct, isSubmitting]);

  const handleDelete = useCallback(async () => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      try {
        await deleteProduct(product.id);
      } catch (error) {
        console.error('Error al eliminar producto:', error);
        alert('Error al eliminar el producto');
      }
    }
  }, [product.id, deleteProduct]);

  const handleToggleFavorite = useCallback(async () => {
    try {
      await toggleFavorite(product.id);
    } catch (error) {
      console.error('Error al actualizar favorito:', error);
    }
  }, [product.id, toggleFavorite]);

  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden border ${product.isFavorite ? 'border-yellow-400' : 'border-gray-200'} hover:shadow-lg transition-shadow`}>
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            {isEditing ? (
              <input
                type="text"
                value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                className="input-field text-lg font-semibold"
                disabled={isSubmitting}
              />
            ) : (
              <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
            )}
            <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full mt-1">
              {product.category}
            </span>
          </div>
          <button
            onClick={handleToggleFavorite}
            disabled={isSubmitting}
            className={`p-2 rounded-full ${product.isFavorite ? 'text-yellow-500 bg-yellow-50' : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50'} disabled:opacity-50`}
          >
            {product.isFavorite ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            )}
          </button>
        </div>

        <div className="mb-4">
          {isEditing ? (
            <textarea
              value={editData.description}
              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              className="input-field"
              rows="2"
              disabled={isSubmitting}
            />
          ) : (
            <p className="text-gray-600">{product.description}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <span className="text-sm text-gray-500">Precio</span>
            {isEditing ? (
              <input
                type="number"
                value={editData.price}
                onChange={(e) => setEditData({ ...editData, price: parseFloat(e.target.value) || 0 })}
                className="input-field"
                step="0.01"
                min="0"
                disabled={isSubmitting}
              />
            ) : (
              <p className="text-xl font-bold text-gray-900">${product.price.toFixed(2)}</p>
            )}
          </div>
          <div>
            <span className="text-sm text-gray-500">Stock</span>
            {isEditing ? (
              <input
                type="number"
                value={editData.stock}
                onChange={(e) => setEditData({ ...editData, stock: parseInt(e.target.value) || 0 })}
                className="input-field"
                min="0"
                disabled={isSubmitting}
              />
            ) : (
              <p className={`text-xl font-bold ${product.stock > 10 ? 'text-green-600' : product.stock > 0 ? 'text-yellow-600' : 'text-red-600'}`}>
                {product.stock} unidades
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="text-xs text-gray-500">
            Actualizado: {new Date(product.updatedAt).toLocaleDateString()}
          </div>
          <div className="flex space-x-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={isSubmitting}
                  className="btn-primary text-sm px-3 py-1"
                >
                  {isSubmitting ? 'Guardando...' : 'Guardar'}
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditData({ ...product });
                  }}
                  disabled={isSubmitting}
                  className="btn-secondary text-sm px-3 py-1"
                >
                  Cancelar
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Editar
                </button>
                <button
                  onClick={handleDelete}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Eliminar
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

ProductItem.displayName = 'ProductItem';

export default ProductItem;