/**
 * Sistema de caché con TTL, estadísticas y múltiples estrategias de evicción
 * Integrado con EventBus para notificaciones de eventos
 */

// EventBus para manejar eventos del sistema de caché
class EventBus {
  constructor() {
    this.listeners = new Map();
  }

  /**
   * Suscribir un listener a un evento
   * @param {string} event - Nombre del evento
   * @param {Function} callback - Función a ejecutar cuando se dispare el evento
   * @returns {Function} Función para desuscribirse
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    
    // Retornar función para desuscribirse
    return () => this.off(event, callback);
  }

  /**
   * Desuscribir un listener de un evento
   * @param {string} event - Nombre del evento
   * @param {Function} callback - Función a desuscribir
   */
  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  /**
   * Emitir un evento con datos
   * @param {string} event - Nombre del evento
   * @param {*} data - Datos a enviar con el evento
   */
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error en listener del evento ${event}:`, error);
        }
      });
    }
  }

  /**
   * Suscribirse a un evento una sola vez
   * @param {string} event - Nombre del evento
   * @param {Function} callback - Función a ejecutar
   */
  once(event, callback) {
    const onceCallback = (data) => {
      callback(data);
      this.off(event, onceCallback);
    };
    this.on(event, onceCallback);
  }

  /**
   * Eliminar todos los listeners de un evento o de todos los eventos
   * @param {string} [event] - Nombre del evento (opcional)
   */
  clear(event) {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }
}

// Estrategias de evicción
const EvictionStrategy = {
  LRU: 'LRU', 
  FIFO: 'FIRST_IN_FIRST_OUT',
  TTL: 'TTL'
};

/**
 * Sistema de caché con closures
 * @param {Object} options - Opciones de configuración
 * @param {number} options.maxSize - Tamaño máximo de la caché
 * @param {string} options.evictionStrategy - Estrategia de evicción (LRU, FIFO, TTL)
 * @param {number} options.defaultTTL - TTL por defecto en milisegundos
 * @param {EventBus} options.eventBus - Instancia de EventBus para notificaciones
 * @returns {Object} API pública de la caché
 */
function createCacheSystem(options = {}) {
  let {
    maxSize = 100,
    evictionStrategy = EvictionStrategy.LRU,
    defaultTTL = 60000, // 1 minuto por defecto
    eventBus = new EventBus()
  } = options;

  const cache = new Map(); // Almacena los datos: clave -> { valor, expiración, timestamp }
  const accessOrder = new Map(); // Para LRU: clave -> timestamp de último acceso
  const insertionOrder = new Map(); // Para FIFO: clave -> timestamp de inserción
  
  // Estadísticas
  let stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    insertions: 0,
    size: 0
  };

  let cleanupInterval = null;
  const startCleanupTimer = (interval = 30000) => {
    if (cleanupInterval) clearInterval(cleanupInterval);
    cleanupInterval = setInterval(() => {
      cleanupExpired();
    }, interval);
  };

  const stopCleanupTimer = () => {
    if (cleanupInterval) {
      clearInterval(cleanupInterval);
      cleanupInterval = null;
    }
  };

  /**
   * Verificar si un elemento ha expirado
   * @param {Object} cacheEntry - Entrada de caché
   * @returns {boolean} true si ha expirado
   */
  const isExpired = (cacheEntry) => {
    return cacheEntry.expiration && Date.now() > cacheEntry.expiration;
  };

  /**
   * Limpiar elementos expirados de la caché
   */
  const cleanupExpired = () => {
    const now = Date.now();
    let expiredCount = 0;
    
    for (const [key, entry] of cache.entries()) {
      if (entry.expiration && now > entry.expiration) {
        removeFromCache(key, 'expired');
        expiredCount++;
      }
    }
    
    if (expiredCount > 0) {
      eventBus.emit('cache:cleanup', { count: expiredCount });
    }
  };

  /**
   * Eliminar un elemento de todas las estructuras de datos
   * @param {string} key - Clave a eliminar
   * @param {string} reason - Razón de la eliminación
   */
  const removeFromCache = (key, reason = 'manual') => {
    if (cache.has(key)) {
      const entry = cache.get(key);
      cache.delete(key);
      accessOrder.delete(key);
      insertionOrder.delete(key);
      stats.size = cache.size;
      stats.evictions++;
      
      eventBus.emit('cache:eviction', {
        key,
        reason,
        entry
      });
      
      return true;
    }
    return false;
  };

  /**
   * Aplicar estrategia de evicción si la caché está llena
   */
  const applyEvictionPolicy = () => {
    if (cache.size < maxSize) return;
    
    let keyToEvict = null;
    let reason = '';
    
    switch (evictionStrategy) {
      case EvictionStrategy.LRU:
        let oldestAccessTime = Infinity;
        for (const [key, accessTime] of accessOrder.entries()) {
          if (accessTime < oldestAccessTime) {
            oldestAccessTime = accessTime;
            keyToEvict = key;
          }
        }
        reason = 'LRU';
        break;
        
      case EvictionStrategy.FIFO:
        let oldestInsertionTime = Infinity;
        for (const [key, insertionTime] of insertionOrder.entries()) {
          if (insertionTime < oldestInsertionTime) {
            oldestInsertionTime = insertionTime;
            keyToEvict = key;
          }
        }
        reason = 'FIFO';
        break;
        
      case EvictionStrategy.TTL:
        let earliestExpiration = Infinity;
        for (const [key, entry] of cache.entries()) {
          if (entry.expiration && entry.expiration < earliestExpiration) {
            earliestExpiration = entry.expiration;
            keyToEvict = key;
          }
        }
        reason = 'TTL';
        break;
    }
    
    if (keyToEvict) {
      removeFromCache(keyToEvict, reason);
    }
  };

  /**
   * Actualizar el orden de acceso para LRU
   * @param {string} key - Clave accedida
   */
  const updateAccessOrder = (key) => {
    if (evictionStrategy === EvictionStrategy.LRU) {
      accessOrder.set(key, Date.now());
    }
  };

  /**
   * Actualizar el orden de inserción para FIFO
   * @param {string} key - Clave insertada
   */
  const updateInsertionOrder = (key) => {
    if (evictionStrategy === EvictionStrategy.FIFO && !insertionOrder.has(key)) {
      insertionOrder.set(key, Date.now());
    }
  };

  /**
   * CORRECCIÓN: Definir getStats internamente para que esté disponible en el closure
   * Obtener estadísticas de la caché
   * @returns {Object} Estadísticas actuales
   */
  const getStats = () => {
    const totalAccesses = stats.hits + stats.misses;
    const hitRate = totalAccesses > 0 
      ? (stats.hits / totalAccesses) * 100 
      : 0;
    
    return {
      ...stats,
      hitRate: parseFloat(hitRate.toFixed(2)),
      maxSize,
      currentSize: cache.size,
      evictionStrategy
    };
  };

  startCleanupTimer();

  // API pública de la caché
  return {
    /**
     * Almacenar un valor en la caché
     * @param {string} key - Clave para el valor
     * @param {*} value - Valor a almacenar
     * @param {number} ttl - Tiempo de vida en milisegundos (opcional)
     * @returns {boolean} true si se almacenó correctamente
     */
    set: (key, value, ttl = defaultTTL) => {
      if (!key || value === undefined) return false;
      
      applyEvictionPolicy();
      
      const now = Date.now();
      const expiration = ttl > 0 ? now + ttl : null;
      
      const cacheEntry = {
        value,
        expiration,
        timestamp: now
      };
      
      cache.set(key, cacheEntry);
      
      updateAccessOrder(key);
      updateInsertionOrder(key);
      
      stats.insertions++;
      stats.size = cache.size;
      
      eventBus.emit('cache:set', { key, value, ttl, expiration });
      
      return true;
    },
    
    /**
     * Obtener un valor de la caché
     * @param {string} key - Clave del valor
     * @returns {*} Valor almacenado o undefined si no existe o ha expirado
     */
    get: (key) => {
      if (!cache.has(key)) {
        stats.misses++;
        eventBus.emit('cache:miss', { key });
        return undefined;
      }
      
      const entry = cache.get(key);
      
      if (isExpired(entry)) {
        removeFromCache(key, 'expired');
        stats.misses++;
        eventBus.emit('cache:miss', { key, reason: 'expired' });
        return undefined;
      }
      
      updateAccessOrder(key);
      
      stats.hits++;
      eventBus.emit('cache:hit', { key, value: entry.value });
      
      return entry.value;
    },
    
    /**
     * Verificar si una clave existe en la caché (sin contar como acceso)
     * @param {string} key - Clave a verificar
     * @returns {boolean} true si existe y no ha expirado
     */
    has: (key) => {
      if (!cache.has(key)) return false;
      
      const entry = cache.get(key);
      
      if (isExpired(entry)) {
        removeFromCache(key, 'expired');
        return false;
      }
      
      return true;
    },
    
    /**
     * Eliminar un elemento específico de la caché
     * @param {string} key - Clave a eliminar
     * @returns {boolean} true si se eliminó correctamente
     */
    delete: (key) => {
      return removeFromCache(key, 'manual');
    },
    
    /**
     * Limpiar toda la caché
     */
    clear: () => {
      const previousSize = cache.size;
      for (const key of cache.keys()) {
        removeFromCache(key, 'clear');
      }
      
      eventBus.emit('cache:clear', { previousSize });
    },
    
    /**
     * Exponer la función getStats
     */
    getStats,
    
    /**
     * Reiniciar estadísticas
     */
    resetStats: () => {
      stats = {
        hits: 0,
        misses: 0,
        evictions: 0,
        insertions: 0,
        size: cache.size
      };
      eventBus.emit('cache:statsReset');
    },
    
    /**
     * Obtener todas las claves en la caché
     * @returns {Array} Lista de claves
     */
    keys: () => {
      return Array.from(cache.keys());
    },
    
    /**
     * Obtener el tamaño actual de la caché
     * @returns {number} Número de elementos en caché
     */
    size: () => {
      return cache.size;
    },
    
    /**
     * Obtener el EventBus para suscribirse a eventos
     * @returns {EventBus} Instancia del EventBus
     */
    getEventBus: () => {
      return eventBus;
    },
    
    /**
     * Cambiar la estrategia de evicción
     * @param {string} strategy - Nueva estrategia (LRU, FIFO, TTL)
     */
    setEvictionStrategy: (strategy) => {
      if (Object.values(EvictionStrategy).includes(strategy)) {
        if (strategy !== EvictionStrategy.LRU) {
          accessOrder.clear();
        }
        if (strategy !== EvictionStrategy.FIFO) {
          insertionOrder.clear();
        }
        
        evictionStrategy = strategy;
        eventBus.emit('cache:strategyChanged', { strategy });
        
        // Re-inicializar estructuras de orden para la nueva estrategia
        if (strategy === EvictionStrategy.LRU) {
          const now = Date.now();
          for (const key of cache.keys()) {
            accessOrder.set(key, now);
          }
        } else if (strategy === EvictionStrategy.FIFO) {
          const now = Date.now();
          for (const key of cache.keys()) {
            insertionOrder.set(key, now);
          }
        }
      }
    },
    
    /**
     * Cambiar el tamaño máximo de la caché
     * @param {number} newMaxSize - Nuevo tamaño máximo
     */
    setMaxSize: (newMaxSize) => {
      if (newMaxSize <= 0) return;
      
      maxSize = newMaxSize;
      
      // Si el nuevo tamaño es menor, aplicar evicción inmediatamente
      while (cache.size > maxSize) {
        applyEvictionPolicy();
      }
      
      eventBus.emit('cache:maxSizeChanged', { maxSize: newMaxSize });
    },
    
    /**
     * Detener el sistema de caché y liberar recursos
     */
    shutdown: () => {
      stopCleanupTimer();
      // CORRECCIÓN: Llamamos directamente a getStats() del closure, sin 'this'
      eventBus.emit('cache:shutdown', { stats: getStats() });
      eventBus.clear();
    },
    
    /**
     * Obtener información de depuración (solo para desarrollo)
     * @returns {Object} Información interna de la caché
     */
    _debug: () => {
      return {
        cacheSize: cache.size,
        accessOrderSize: accessOrder.size,
        insertionOrderSize: insertionOrder.size,
        evictionStrategy,
        maxSize,
        defaultTTL
      };
    }
  };
}

// Ejemplo de uso e integración
if (require.main === module) {
  const eventBus = new EventBus();
  
  const cache = createCacheSystem({
    maxSize: 5,
    evictionStrategy: EvictionStrategy.LRU,
    defaultTTL: 10000,
    eventBus
  });
  
  // Suscribirse a eventos del caché
  eventBus.on('cache:hit', (data) => {
    console.log(`Cache HIT para clave: ${data.key}`);
  });
  
  eventBus.on('cache:miss', (data) => {
    console.log(`Cache MISS para clave: ${data.key}`, data.reason ? `(Razón: ${data.reason})` : '');
  });
  
  eventBus.on('cache:eviction', (data) => {
    console.log(`EVICTED: ${data.key} (Razón: ${data.reason})`);
  });
  
  eventBus.on('cache:set', (data) => {
    console.log(`SET: ${data.key} (TTL: ${data.ttl}ms)`);
  });
  
  eventBus.on('cache:cleanup', (data) => {
    console.log(`CLEANUP: ${data.count} elementos expirados`);
  });
  

  console.log('=== Ejemplo de uso del Sistema de Caché ===\n');
  

  cache.set('user:1', { id: 1, name: 'Alice' }, 5000);
  cache.set('user:2', { id: 2, name: 'Bob' });
  cache.set('product:1', { id: 1, name: 'Laptop', price: 999 });
  cache.set('config:theme', 'dark');
  cache.set('config:language', 'es');
  

  setTimeout(() => {

    console.log('\n--- Forzando evicción LRU ---');
    cache.set('config:fontSize', 'large');
    

    console.log('\n--- Accediendo a elementos ---');
    console.log('user:2:', cache.get('user:2')); // Hit
    console.log('user:999:', cache.get('user:999')); // Miss
    

    console.log('\n--- Cambiando a estrategia FIFO ---');
    cache.setEvictionStrategy(EvictionStrategy.FIFO);
    

    console.log('\n--- Estadísticas ---');
    console.log(cache.getStats());
    

    console.log('\n--- Esperando a que expire user:1 (5 segundos) ---');
    setTimeout(() => {
      console.log('user:1 después de 5 segundos:', cache.get('user:1'));
      
      console.log('\n--- Estadísticas finales ---');
      console.log(cache.getStats());
      
      cache.shutdown();
    }, 5000);
  }, 100);
}

module.exports = {
  EventBus,
  createCacheSystem,
  EvictionStrategy
};