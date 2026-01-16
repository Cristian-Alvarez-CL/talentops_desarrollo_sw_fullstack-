import { useState, useEffect } from 'react';

export function useLocalStorage(key, initialValue) {
  // Estado para almacenar nuestro valor
  const [storedValue, setStoredValue] = useState(() => {
    try {
      // Obtener del localStorage por key
      const item = window.localStorage.getItem(key);
      // Parsear JSON almacenado o retornar initialValue
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error('Error reading localStorage:', error);
      return initialValue;
    }
  });

  // Retornar una versión envuelta del setter useState que también persiste el nuevo valor en localStorage
  const setValue = (value) => {
    try {
      // Permitir que value sea una función para que tengamos la misma API que useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Guardar en estado
      setStoredValue(valueToStore);
      
      // Guardar en localStorage
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  };

  // Escuchar cambios en otras pestañas
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === key && e.newValue !== JSON.stringify(storedValue)) {
        setStoredValue(JSON.parse(e.newValue));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, storedValue]);

  return [storedValue, setValue];
}