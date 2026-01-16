import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authService } from '../services/api';
import TokenStorage from '../utils/tokenStorage';

// Estado inicial
const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  rememberMe: false
};

// Tipos de acciones
const ActionTypes = {
  LOGIN_REQUEST: 'LOGIN_REQUEST',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  REGISTER_REQUEST: 'REGISTER_REQUEST',
  REGISTER_SUCCESS: 'REGISTER_SUCCESS',
  REGISTER_FAILURE: 'REGISTER_FAILURE',
  LOGOUT: 'LOGOUT',
  REFRESH_TOKEN_SUCCESS: 'REFRESH_TOKEN_SUCCESS',
  SET_LOADING: 'SET_LOADING',
  CLEAR_ERROR: 'CLEAR_ERROR'
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.LOGIN_REQUEST:
    case ActionTypes.REGISTER_REQUEST:
      return {
        ...state,
        isLoading: true,
        error: null
      };

    case ActionTypes.LOGIN_SUCCESS:
    case ActionTypes.REGISTER_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        rememberMe: action.payload.rememberMe
      };

    case ActionTypes.LOGIN_FAILURE:
    case ActionTypes.REGISTER_FAILURE:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload.error
      };

    case ActionTypes.LOGOUT:
      return {
        ...initialState,
        isLoading: false
      };

    case ActionTypes.REFRESH_TOKEN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true
      };

    case ActionTypes.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };

    case ActionTypes.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };

    default:
      return state;
  }
};

// Crear contexto
const AuthContext = createContext();

// Provider
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Efecto para verificar autenticación al cargar
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Verificar si hay tokens guardados
        if (TokenStorage.hasTokens()) {
          // Verificar token con el backend
          const response = await authService.verifyToken();
          
          dispatch({
            type: ActionTypes.LOGIN_SUCCESS,
            payload: {
              user: response.user,
              rememberMe: TokenStorage.isRememberMe()
            }
          });
        }
      } catch (error) {
        console.error('Error verificando autenticación:', error);
        TokenStorage.clear();
      } finally {
        dispatch({
          type: ActionTypes.SET_LOADING,
          payload: false
        });
      }
    };

    checkAuth();
  }, []);

  // Sincronizar estado entre pestañas
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === null) {
        // Se limpió todo el storage
        dispatch({ type: ActionTypes.LOGOUT });
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Acciones
  const login = async (email, password, rememberMe = false) => {
    try {
      dispatch({ type: ActionTypes.LOGIN_REQUEST });

      const response = await authService.login(email, password, rememberMe);

      dispatch({
        type: ActionTypes.LOGIN_SUCCESS,
        payload: {
          user: response.user,
          rememberMe
        }
      });

      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Error en el login';
      
      dispatch({
        type: ActionTypes.LOGIN_FAILURE,
        payload: { error: errorMessage }
      });

      return { success: false, error: errorMessage };
    }
  };

  const register = async (name, email, password) => {
    try {
      dispatch({ type: ActionTypes.REGISTER_REQUEST });

      const response = await authService.register(name, email, password);

      dispatch({
        type: ActionTypes.REGISTER_SUCCESS,
        payload: {
          user: response.user,
          rememberMe: false
        }
      });

      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Error en el registro';
      
      dispatch({
        type: ActionTypes.REGISTER_FAILURE,
        payload: { error: errorMessage }
      });

      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    await authService.logout();
    dispatch({ type: ActionTypes.LOGOUT });
  };

  const clearError = () => {
    dispatch({ type: ActionTypes.CLEAR_ERROR });
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizado
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};