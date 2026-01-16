import axios from 'axios';
import TokenStorage from '../utils/tokenStorage';

// Crear instancia de axios
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para agregar token a las solicitudes
api.interceptors.request.use(
  (config) => {
    const token = TokenStorage.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas y refresh automático
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Si el error es 401 y no es una solicitud de refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Intentar refrescar el token
        const refreshToken = TokenStorage.getRefreshToken();
        
        if (!refreshToken) {
          throw new Error('No hay refresh token disponible');
        }

        const response = await axios.post('/api/auth/refresh', {
          refreshToken
        });

        const { accessToken } = response.data;

        // Guardar nuevo token
        const rememberMe = TokenStorage.isRememberMe();
        TokenStorage.setTokens(accessToken, refreshToken, rememberMe);

        // Reintentar la solicitud original
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);

      } catch (refreshError) {
        // Si el refresh falla, limpiar todo y redirigir a login
        TokenStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Servicios de autenticación
export const authService = {
  // Login
  login: async (email, password, rememberMe = false) => {
    const response = await api.post('/auth/login', { 
      email, 
      password,
      rememberMe 
    });
    
    // Guardar tokens y usuario
    if (response.data.tokens) {
      TokenStorage.setTokens(
        response.data.tokens.accessToken,
        response.data.tokens.refreshToken,
        rememberMe
      );
      TokenStorage.setUser(response.data.user, rememberMe);
    }
    
    return response.data;
  },

  // Registro
  register: async (name, email, password) => {
    const response = await api.post('/auth/register', { 
      name, 
      email, 
      password 
    });
    
    // Guardar tokens y usuario después del registro
    if (response.data.tokens) {
      TokenStorage.setTokens(
        response.data.tokens.accessToken,
        response.data.tokens.refreshToken,
        false
      );
      TokenStorage.setUser(response.data.user, false);
    }
    
    return response.data;
  },

  // Logout
  logout: async () => {
    const refreshToken = TokenStorage.getRefreshToken();
    
    if (refreshToken) {
      try {
        await api.post('/auth/logout', { refreshToken });
      } catch (error) {
        console.error('Error en logout:', error);
      }
    }
    
    TokenStorage.clear();
  },

  // Verificar token
  verifyToken: async () => {
    try {
      const response = await api.get('/auth/verify');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Obtener perfil
  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  }
};

export default api;