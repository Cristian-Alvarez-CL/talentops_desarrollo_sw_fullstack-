import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/auth.service';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = authService.getStoredUser();
    if (storedUser && authService.isAuthenticated()) {
      setUser(storedUser);
    }
    setLoading(false);
  }, []);

  const register = useCallback(async (data) => {
    try {
      const response = await authService.register(data);

      if (response.success) {
        localStorage.setItem('accessToken', response.data.accessToken);
        localStorage.setItem('refreshToken', response.data.refreshToken);
        authService.setStoredUser(response.data.user);
        setUser(response.data.user);
        toast.success('Registro exitoso');
        navigate('/dashboard');
        return { success: true };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Error al registrar';
      toast.error(message);
      return { success: false, error: message };
    }
  }, [navigate]);

  const login = useCallback(async (data) => {
    try {
      const response = await authService.login(data);

      if (response.success) {
        localStorage.setItem('accessToken', response.data.accessToken);
        localStorage.setItem('refreshToken', response.data.refreshToken);
        authService.setStoredUser(response.data.user);
        setUser(response.data.user);
        toast.success('Bienvenido de vuelta');
        navigate('/dashboard');
        return { success: true };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Error al iniciar sesion';
      toast.error(message);
      return { success: false, error: message };
    }
  }, [navigate]);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
      navigate('/login');
      toast.success('Sesion cerrada');
    }
  }, [navigate]);

  const updateUser = useCallback(async (data) => {
    try {
      const response = await authService.updateProfile(data);

      if (response.success) {
        setUser(response.data);
        authService.setStoredUser(response.data);
        toast.success('Perfil actualizado');
        return { success: true };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Error al actualizar perfil';
      toast.error(message);
      return { success: false, error: message };
    }
  }, []);

  const updateAvatar = useCallback(async (file) => {
    try {
      const response = await authService.uploadAvatar(file);

      if (response.success) {
        const updatedUser = { ...user, avatar: response.data.avatar };
        setUser(updatedUser);
        authService.setStoredUser(updatedUser);
        toast.success('Avatar actualizado');
        return { success: true };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Error al subir avatar';
      toast.error(message);
      return { success: false, error: message };
    }
  }, [user]);

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    register,
    login,
    logout,
    updateUser,
    updateAvatar,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
