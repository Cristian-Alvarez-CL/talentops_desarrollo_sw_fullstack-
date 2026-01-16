import axios from 'axios';
import { ProductFormData } from '../lib/validation/productSchema';

const API_BASE_URL = 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

api.interceptors.response.use(
  response => response,
  error => {
    // Mapear errores del servidor a errores específicos
    if (error.response?.data?.errors) {
      const mappedErrors = error.response.data.errors.map((err: any) => ({
        field: err.field || undefined,
        message: err.message,
        code: err.code
      }));
      error.response.data.errors = mappedErrors;
    }
    return Promise.reject(error);
  }
);

export const createProduct = async (
  data: ProductFormData,
  onProgress?: (progress: number) => void
) => {
  const formData = new FormData();
  
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (key === 'tags' && Array.isArray(value)) {
        formData.append(key, JSON.stringify(value));
      } else if (key === 'specifications' && typeof value === 'object') {
        formData.append(key, JSON.stringify(value));
      } else if (value instanceof File) {
        formData.append(key, value);
      } else {
        formData.append(key, String(value));
      }
    }
  });

  return api.post('/products', formData, {
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const progress = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress(progress);
      }
    },
    timeout: 30000, // 30 segundos timeout
  });
};

// Función para reintentos automáticos
export const retryRequest = async <T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    if (retries > 0 && error.response?.status >= 500) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryRequest(fn, retries - 1, delay * 2);
    }
    throw error;
  }
};

export const simulateSuccessReset = (): Promise<{ success: boolean }> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true });
    }, 500);
  });
};