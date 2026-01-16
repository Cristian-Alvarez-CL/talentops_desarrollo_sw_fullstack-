import React, { memo, useCallback } from 'react';
import { useProductContext } from '../context/ProductContext';

const ProductFilters = memo(() => {
  const { 
    filters, 
    setFilters, 
    clearFilters, 
    searchQuery, 
    setSearchQuery,
    categories 
  } = useProductContext();

  const handleSearchChange = useCallback((e) => {
    setSearchQuery(e.target.value);
  }, [setSearchQuery]);

  const handleCategoryChange = useCallback((e) => {
    setFilters({ category: e.target.value });
  }, [setFilters]);

  const handleMinPriceChange = useCallback((e) => {
    setFilters({ minPrice: e.target.value });
  }, [setFilters]);

  const handleMaxPriceChange = useCallback((e) => {
    setFilters({ maxPrice: e.target.value });
  }, [setFilters]);

  const handleSortByChange = useCallback((e) => {
    setFilters({ sortBy: e.target.value });
  }, [setFilters]);

  const handleSortOrderChange = useCallback((order) => {
    return () => setFilters({ sortOrder: order });
  }, [setFilters]);

  const handleClearFilters = useCallback(() => {
    clearFilters();
  }, [clearFilters]);

  return (
    <div className="card">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Filtros y Búsqueda</h2>
        <p className="text-gray-600">Filtra y busca productos en tiempo real</p>
      </div>

      <div className="space-y-6">
        {/* Búsqueda */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Buscar productos
          </label>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Buscar por nombre o descripción..."
              className="input-field pl-10"
            />
          </div>
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Categoría */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoría
            </label>
            <select
              value={filters.category}
              onChange={handleCategoryChange}
              className="input-field"
            >
              <option value="">Todas las categorías</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {/* Precio mínimo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Precio mínimo
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                $
              </span>
              <input
                type="number"
                value={filters.minPrice}
                onChange={handleMinPriceChange}
                placeholder="Min"
                className="input-field pl-8"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          {/* Precio máximo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Precio máximo
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                $
              </span>
              <input
                type="number"
                value={filters.maxPrice}
                onChange={handleMaxPriceChange}
                placeholder="Max"
                className="input-field pl-8"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          {/* Ordenar por */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ordenar por
            </label>
            <select
              value={filters.sortBy}
              onChange={handleSortByChange}
              className="input-field"
            >
              <option value="name">Nombre</option>
              <option value="price">Precio</option>
              <option value="stock">Stock</option>
            </select>
          </div>
        </div>

        {/* Orden */}
        <div className="flex items-center space-x-4">
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              checked={filters.sortOrder === 'asc'}
              onChange={handleSortOrderChange('asc')}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 cursor-pointer"
            />
            <span className="ml-2 text-sm text-gray-700 cursor-pointer">Ascendente</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              checked={filters.sortOrder === 'desc'}
              onChange={handleSortOrderChange('desc')}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 cursor-pointer"
            />
            <span className="ml-2 text-sm text-gray-700 cursor-pointer">Descendente</span>
          </label>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-gray-600">
            {filters.category || filters.minPrice || filters.maxPrice ? (
              <span>Filtros activos</span>
            ) : (
              <span>Sin filtros activos</span>
            )}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleClearFilters}
              className="btn-secondary"
            >
              Limpiar filtros
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

ProductFilters.displayName = 'ProductFilters';

export default ProductFilters;