import React, { memo, useCallback } from 'react';
import { useProductContext } from '../context/ProductContext';

const Favorites = memo(() => {
  const { favorites, toggleFavorite } = useProductContext();

  const handleToggleFavorite = useCallback(async (id) => {
    try {
      await toggleFavorite(id);
    } catch (error) {
      console.error('Error al actualizar favorito:', error);
    }
  }, [toggleFavorite]);

  if (favorites.length === 0) {
    return (
      <div className="card">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-8 w-8 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-gray-900">Favoritos</h3>
            <p className="text-sm text-gray-600">No tienes productos favoritos</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <svg className="h-6 w-6 text-yellow-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <h3 className="text-lg font-bold text-gray-900">Favoritos ({favorites.length})</h3>
        </div>
        <span className="text-sm text-gray-600">
          {favorites.length} {favorites.length === 1 ? 'producto' : 'productos'}
        </span>
      </div>

      <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
        {favorites.map(product => (
          <div
            key={product.id}
            className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-100"
          >
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-900 truncate">
                {product.name}
              </h4>
              <div className="flex items-center mt-1 space-x-4">
                <span className="text-xs text-gray-600">${product.price.toFixed(2)}</span>
                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                  {product.category}
                </span>
              </div>
            </div>
            <button
              onClick={() => handleToggleFavorite(product.id)}
              className="ml-3 text-yellow-600 hover:text-yellow-800 p-1 transition-colors"
              title="Quitar de favoritos"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Total valorado:</span>
          <span className="font-semibold">
            ${favorites.reduce((sum, p) => sum + p.price, 0).toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between text-sm mt-1">
          <span className="text-gray-600">Stock total:</span>
          <span className="font-semibold">
            {favorites.reduce((sum, p) => sum + p.stock, 0)} unidades
          </span>
        </div>
      </div>
    </div>
  );
});

Favorites.displayName = 'Favorites';

export default Favorites;