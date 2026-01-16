import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo, useRef } from 'react';
import axios from 'axios';

const ProductContext = createContext();

// Action Types
const ACTIONS = {
  FETCH_START: 'FETCH_START',
  FETCH_SUCCESS: 'FETCH_SUCCESS',
  FETCH_ERROR: 'FETCH_ERROR',
  ADD_PRODUCT: 'ADD_PRODUCT',
  UPDATE_PRODUCT: 'UPDATE_PRODUCT',
  DELETE_PRODUCT: 'DELETE_PRODUCT',
  TOGGLE_FAVORITE: 'TOGGLE_FAVORITE',
  SET_FILTERS: 'SET_FILTERS',
  SET_SEARCH: 'SET_SEARCH',
  SET_FILTERED_PRODUCTS: 'SET_FILTERED_PRODUCTS',
  INVALIDATE_CACHE: 'INVALIDATE_CACHE',
  UPDATE_CACHE_TIMESTAMP: 'UPDATE_CACHE_TIMESTAMP'
};

// LocalStorage keys
const STORAGE_KEYS = {
  PRODUCTS: 'products_cache',
  FAVORITES: 'products_favorites',
  FILTERS: 'products_filters',
  CACHE_TIMESTAMP: 'products_cache_timestamp'
};

// Estado inicial
const initialState = {
  products: [],
  favorites: [],
  filteredProducts: [],
  categories: [],
  loading: false,
  error: null,
  filters: {
    category: '',
    minPrice: '',
    maxPrice: '',
    sortBy: 'name',
    sortOrder: 'asc'
  },
  searchQuery: '',
  cacheValid: false
};

// Reducer
function productReducer(state, action) {
  switch (action.type) {
    case ACTIONS.FETCH_START:
      return { ...state, loading: true, error: null };
    
    case ACTIONS.FETCH_SUCCESS:
      const products = action.payload;
      const categories = [...new Set(products.map(p => p.category))];
      const favorites = products.filter(p => p.isFavorite);
      
      return {
        ...state,
        products,
        categories,
        favorites,
        loading: false,
        cacheValid: true
      };
    
    case ACTIONS.FETCH_ERROR:
      return { ...state, loading: false, error: action.payload };
    
    case ACTIONS.ADD_PRODUCT:
      const newProducts = [...state.products, action.payload];
      const newCategories = [...new Set([...state.categories, action.payload.category])];
      
      return {
        ...state,
        products: newProducts,
        categories: newCategories
      };
    
    case ACTIONS.UPDATE_PRODUCT:
      const updatedProducts = state.products.map(p =>
        p.id === action.payload.id ? action.payload : p
      );
      const updatedFavorites = updatedProducts.filter(p => p.isFavorite);
      
      return {
        ...state,
        products: updatedProducts,
        favorites: updatedFavorites
      };
    
    case ACTIONS.DELETE_PRODUCT:
      const filteredProducts = state.products.filter(p => p.id !== action.payload);
      const filteredFavorites = filteredProducts.filter(p => p.isFavorite);
      
      return {
        ...state,
        products: filteredProducts,
        favorites: filteredFavorites
      };
    
    case ACTIONS.TOGGLE_FAVORITE:
      const toggledProducts = state.products.map(p =>
        p.id === action.payload
          ? { ...p, isFavorite: !p.isFavorite }
          : p
      );
      const toggledFavorites = toggledProducts.filter(p => p.isFavorite);
      
      return {
        ...state,
        products: toggledProducts,
        favorites: toggledFavorites
      };
    
    case ACTIONS.SET_FILTERS:
      return { ...state, filters: { ...state.filters, ...action.payload } };
    
    case ACTIONS.SET_SEARCH:
      return { ...state, searchQuery: action.payload };
    
    case ACTIONS.SET_FILTERED_PRODUCTS:
      return { ...state, filteredProducts: action.payload };
    
    case ACTIONS.INVALIDATE_CACHE:
      return { ...state, cacheValid: false };
    
    case ACTIONS.UPDATE_CACHE_TIMESTAMP:
      return { ...state, cacheValid: true };
    
    default:
      return state;
  }
}

// Provider Component
export function ProductProvider({ children }) {
  const [state, dispatch] = useReducer(productReducer, initialState);
  const hasFetched = useRef(false);

  // Cargar desde localStorage al iniciar
  useEffect(() => {
    const savedFilters = localStorage.getItem(STORAGE_KEYS.FILTERS);
    const savedFavorites = localStorage.getItem(STORAGE_KEYS.FAVORITES);
    const cacheTimestamp = localStorage.getItem(STORAGE_KEYS.CACHE_TIMESTAMP);
    
    if (savedFilters) {
      try {
        const filters = JSON.parse(savedFilters);
        dispatch({ type: ACTIONS.SET_FILTERS, payload: filters });
      } catch (error) {
        console.error('Error parsing saved filters:', error);
      }
    }

    // Verificar cache (5 minutos)
    const isCacheValid = cacheTimestamp && 
      (Date.now() - parseInt(cacheTimestamp)) < (5 * 60 * 1000);
    
    if (isCacheValid) {
      const cachedProducts = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (cachedProducts) {
        try {
          const products = JSON.parse(cachedProducts);
          dispatch({ type: ACTIONS.FETCH_SUCCESS, payload: products });
        } catch (error) {
          console.error('Error parsing cached products:', error);
        }
      }
    }
  }, []);

  // Guardar en localStorage cuando cambian los datos
  useEffect(() => {
    if (state.products.length > 0) {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(state.products));
      localStorage.setItem(STORAGE_KEYS.CACHE_TIMESTAMP, Date.now().toString());
    }
  }, [state.products]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.FILTERS, JSON.stringify(state.filters));
  }, [state.filters]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(state.favorites));
  }, [state.favorites]);

  // Filtrar productos cuando cambian los filtros, búsqueda o productos
  useEffect(() => {
    if (state.products.length === 0) return;

    let filtered = [...state.products];

    // Aplicar búsqueda
    if (state.searchQuery.trim()) {
      const query = state.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query)
      );
    }

    // Aplicar filtros
    if (state.filters.category) {
      filtered = filtered.filter(p => p.category === state.filters.category);
    }
    if (state.filters.minPrice) {
      filtered = filtered.filter(p => p.price >= parseFloat(state.filters.minPrice));
    }
    if (state.filters.maxPrice) {
      filtered = filtered.filter(p => p.price <= parseFloat(state.filters.maxPrice));
    }

    // Ordenar
    filtered.sort((a, b) => {
      let aVal, bVal;
      switch (state.filters.sortBy) {
        case 'price':
          aVal = a.price;
          bVal = b.price;
          break;
        case 'stock':
          aVal = a.stock;
          bVal = b.stock;
          break;
        default:
          aVal = a.name;
          bVal = b.name;
      }
      
      if (state.filters.sortOrder === 'desc') {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
      return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
    });

    dispatch({ type: ACTIONS.SET_FILTERED_PRODUCTS, payload: filtered });
  }, [state.products, state.searchQuery, state.filters]);

  // API calls - memoizadas con useCallback
  const fetchProducts = useCallback(async () => {
    if (state.loading || hasFetched.current) return;
    
    dispatch({ type: ACTIONS.FETCH_START });
    hasFetched.current = true;
    
    try {
      const response = await axios.get('/api/products');
      dispatch({ type: ACTIONS.FETCH_SUCCESS, payload: response.data });
      dispatch({ type: ACTIONS.UPDATE_CACHE_TIMESTAMP });
    } catch (error) {
      dispatch({ type: ACTIONS.FETCH_ERROR, payload: error.message });
      hasFetched.current = false;
    }
  }, [state.loading]);

  const addProduct = useCallback(async (productData) => {
    try {
      const response = await axios.post('/api/products', productData);
      dispatch({ type: ACTIONS.ADD_PRODUCT, payload: response.data });
      dispatch({ type: ACTIONS.INVALIDATE_CACHE });
      return response.data;
    } catch (error) {
      throw error;
    }
  }, []);

  const updateProduct = useCallback(async (id, productData) => {
    try {
      const response = await axios.put(`/api/products/${id}`, productData);
      dispatch({ type: ACTIONS.UPDATE_PRODUCT, payload: response.data });
      return response.data;
    } catch (error) {
      throw error;
    }
  }, []);

  const deleteProduct = useCallback(async (id) => {
    try {
      await axios.delete(`/api/products/${id}`);
      dispatch({ type: ACTIONS.DELETE_PRODUCT, payload: id });
    } catch (error) {
      throw error;
    }
  }, []);

  const toggleFavorite = useCallback(async (id) => {
    try {
      const response = await axios.patch(`/api/products/${id}/favorite`);
      dispatch({ type: ACTIONS.TOGGLE_FAVORITE, payload: id });
      return response.data;
    } catch (error) {
      throw error;
    }
  }, []);

  const setFilters = useCallback((filters) => {
    dispatch({ type: ACTIONS.SET_FILTERS, payload: filters });
  }, []);

  const setSearchQuery = useCallback((query) => {
    dispatch({ type: ACTIONS.SET_SEARCH, payload: query });
  }, []);

  const invalidateCache = useCallback(() => {
    dispatch({ type: ACTIONS.INVALIDATE_CACHE });
    localStorage.removeItem(STORAGE_KEYS.CACHE_TIMESTAMP);
    localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
    hasFetched.current = false;
  }, []);

  const clearFilters = useCallback(() => {
    dispatch({ type: ACTIONS.SET_FILTERS, payload: initialState.filters });
    dispatch({ type: ACTIONS.SET_SEARCH, payload: '' });
  }, []);

  // Memoizar el valor del contexto
  const contextValue = useMemo(() => ({
    ...state,
    fetchProducts,
    addProduct,
    updateProduct,
    deleteProduct,
    toggleFavorite,
    setFilters,
    setSearchQuery,
    invalidateCache,
    clearFilters
  }), [
    state,
    fetchProducts,
    addProduct,
    updateProduct,
    deleteProduct,
    toggleFavorite,
    setFilters,
    setSearchQuery,
    invalidateCache,
    clearFilters
  ]);

  return (
    <ProductContext.Provider value={contextValue}>
      {children}
    </ProductContext.Provider>
  );
}

// Hook personalizado para usar el contexto
export function useProductContext() {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProductContext debe usarse dentro de ProductProvider');
  }
  return context;
}