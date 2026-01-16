import React, { memo, useEffect, useState } from 'react';
import { useProductContext } from '../context/ProductContext';

const CacheStatus = memo(() => {
  const { invalidateCache } = useProductContext();
  const [cacheAge, setCacheAge] = useState(null);
  const [isValid, setIsValid] = useState(true);

  useEffect(() => {
    const checkCache = () => {
      const timestamp = localStorage.getItem('products_cache_timestamp');
      if (timestamp) {
        const age = Date.now() - parseInt(timestamp);
        const ttl = 5 * 60 * 1000; // 5 minutos
        setCacheAge(age);
        setIsValid(age < ttl);
      } else {
        setCacheAge(null);
        setIsValid(false);
      }
    };

    checkCache();
    const interval = setInterval(checkCache, 30000); // Verificar cada 30 segundos
    return () => clearInterval(interval);
  }, []);

  const formatTime = (ms) => {
    if (!ms) return 'N/A';
    if (ms < 60000) {
      return `${Math.floor(ms / 1000)} segundos`;
    }
    return `${Math.floor(ms / 60000)} minutos`;
  };

  const handleInvalidate = () => {
    if (window.confirm('¿Estás seguro de que quieres invalidar el cache?')) {
      invalidateCache();
      setCacheAge(null);
      setIsValid(false);
      alert('Cache invalidado. Los datos se recargarán en la próxima actualización.');
    }
  };

  if (cacheAge === null) {
    return (
      <div className="flex items-center space-x-2 px-3 py-2 bg-gray-100 rounded-lg">
        <div className="w-3 h-3 rounded-full bg-gray-400"></div>
        <span className="text-sm text-gray-600">Sin datos en cache</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-3 px-4 py-2 rounded-lg ${isValid ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
      <div className="flex items-center">
        <div className={`w-3 h-3 rounded-full mr-2 ${isValid ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
        <span className="text-sm font-medium">
          Cache: {formatTime(cacheAge)}
        </span>
      </div>
      {!isValid && (
        <button
          onClick={handleInvalidate}
          className="text-sm text-yellow-700 hover:text-yellow-900 underline"
          title="Forzar recarga de datos"
        >
          Actualizar
        </button>
      )}
    </div>
  );
});

CacheStatus.displayName = 'CacheStatus';

export default CacheStatus;