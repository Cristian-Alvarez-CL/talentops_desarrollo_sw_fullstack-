const BASE_URL = 'http://localhost:3000';

async function ejecutarTests() {
  console.log('🧪 Iniciando pruebas de la API...\n');

  try {
    // 1. TEST: Crear Tarea (POST) - Validación Correcta
    const postRes = await fetch(`${BASE_URL}/tareas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo: 'Nueva tarea de test', descripcion: 'Probando Joi' })
    });
    console.log(`✅ POST /tareas: ${postRes.status === 201 ? 'PASÓ' : 'FALLÓ'}`);

    // 2. TEST: Validar error (POST) - Título muy corto
    const postFailRes = await fetch(`${BASE_URL}/tareas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo: 'No' })
    });
    console.log(`✅ POST /tareas (Validación Joi): ${postFailRes.status === 400 ? 'PASÓ (Error detectado)' : 'FALLÓ'}`);

    // 3. TEST: Obtener Estadísticas (GET)
    const statsRes = await fetch(`${BASE_URL}/tareas/estadisticas`);
    const statsData = await statsRes.json();
    console.log(`✅ GET /tareas/estadisticas: ${statsData.total_tareas !== undefined ? 'PASÓ' : 'FALLÓ'}`);

    // 4. TEST: Búsqueda Avanzada (GET con query)
    const searchRes = await fetch(`${BASE_URL}/tareas?q=test`);
    const searchData = await searchRes.json();
    console.log(`✅ GET /tareas?q=test: ${searchData.length > 0 ? 'PASÓ' : 'FALLÓ'}`);

    // 5. TEST: Exportar CSV (GET)
    const csvRes = await fetch(`${BASE_URL}/tareas/exportar/csv`);
    const isCsv = csvRes.headers.get('content-type').includes('text/csv');
    console.log(`✅ GET /tareas/exportar/csv: ${isCsv ? 'PASÓ' : 'FALLÓ'}`);

    // 6. TEST: Eliminar Tarea (DELETE)
    const delRes = await fetch(`${BASE_URL}/tareas/1`, { method: 'DELETE' });
    console.log(`✅ DELETE /tareas/1: ${delRes.status === 200 ? 'PASÓ' : 'FALLÓ'}`);

    console.log('\n--- Pruebas Finalizadas ---');
    console.log('Revisa los archivos "combined.log" y "error.log" para confirmar el logging.');

  } catch (error) {
    console.error('❌ Error ejecutando los tests:', error.message);
    console.log('¿Está el servidor encendido en el puerto 3000?');
  }
}

ejecutarTests();