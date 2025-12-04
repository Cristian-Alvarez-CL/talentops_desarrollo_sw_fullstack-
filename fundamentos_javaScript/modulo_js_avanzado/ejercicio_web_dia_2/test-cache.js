const { createCacheSystem, EventBus, EvictionStrategy } = require('./event-system.js');

console.log('=== PRUEBAS DEL SISTEMA DE CACHÉ ===\n');

// Crear una caché de prueba
const cache = createCacheSystem({
  maxSize: 3,
  evictionStrategy: EvictionStrategy.LRU,
  defaultTTL: 5000 // 5 segundos
});

const eventBus = cache.getEventBus();

// Configurar listeners para eventos
eventBus.on('cache:hit', (data) => {
  console.log(`✅ HIT: ${data.key}`);
});

eventBus.on('cache:miss', (data) => {
  console.log(`❌ MISS: ${data.key}${data.reason ? ` (${data.reason})` : ''}`);
});

eventBus.on('cache:eviction', (data) => {
  console.log(`🗑️  EVICTED: ${data.key} - Razón: ${data.reason}`);
});

eventBus.on('cache:set', (data) => {
  console.log(`📝 SET: ${data.key} con TTL: ${data.ttl}ms`);
});

// Prueba 1: Comportamiento básico
console.log('1. Prueba de comportamiento básico:');
console.log('-'.repeat(50));
cache.set('clave1', 'valor1');
cache.set('clave2', 'valor2');
console.log('clave1:', cache.get('clave1')); // Debería ser hit
console.log('clave3:', cache.get('clave3')); // Debería ser miss
console.log('Tiene clave2?', cache.has('clave2'));
console.log('Tamaño actual:', cache.size());

// Prueba 2: Evicción LRU
console.log('\n2. Prueba de evicción LRU:');
console.log('-'.repeat(50));
cache.set('clave3', 'valor3');
cache.set('clave4', 'valor4'); // Debería causar evicción (tamaño máximo: 3)
console.log('Claves en caché:', cache.keys());

// Prueba 3: Expiración TTL
console.log('\n3. Prueba de expiración TTL:');
console.log('-'.repeat(50));
cache.set('temporal', 'expirará pronto', 1000); // 1 segundo TTL
setTimeout(() => {
  console.log('Después de 1.5 segundos:');
  console.log('temporal:', cache.get('temporal')); // Debería ser miss (expired)
  console.log('Estadísticas:', cache.getStats());
  
  // Prueba 4: Cambiar estrategia
  console.log('\n4. Prueba cambio de estrategia FIFO:');
  console.log('-'.repeat(50));
  cache.clear();
  cache.setEvictionStrategy(EvictionStrategy.FIFO);
  
  // Llenar caché
  cache.set('A', 1);
  cache.set('B', 2);
  cache.set('C', 3);
  cache.get('A'); // En FIFO, acceder no cambia el orden
  cache.set('D', 4); // Debería evictar 'A' (primero en entrar)
  
  console.log('Claves después de FIFO eviction:', cache.keys());
  
  // Prueba 5: Estadísticas
  console.log('\n5. Estadísticas finales:');
  console.log('-'.repeat(50));
  console.log(JSON.stringify(cache.getStats(), null, 2));
  
  // Limpiar
  cache.shutdown();
  console.log('\n✅ Todas las pruebas completadas.');
}, 1500);