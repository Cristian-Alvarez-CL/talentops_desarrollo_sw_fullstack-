const BASE_URL = 'http://localhost:3000';
const TOKEN = 'Bearer mi-token-secreto';

async function runTests() {
  console.log('🚀 Iniciando Suite de Pruebas Avanzada...\n');

  // --- 1. TEST: Internacionalización (i18n) ---
  console.log('--- Test i18n ---');
  const resEn = await fetch(`${BASE_URL}/`, { headers: { 'Accept-Language': 'en' } });
  const dataEn = await resEn.json();
  console.log(`[EN] Mensaje: ${dataEn.mensaje}`);

  const resEs = await fetch(`${BASE_URL}/`, { headers: { 'Accept-Language': 'es' } });
  const dataEs = await resEs.json();
  console.log(`[ES] Mensaje: ${dataEs.mensaje}`);

  // --- 2. TEST: Validación con Joi (Error provocado) ---
  console.log('\n--- Test Validación Joi ---');
  const resJoi = await fetch(`${BASE_URL}/api/productos`, {
    method: 'POST',
    headers: { 
      'Authorization': TOKEN,
      'Content-Type': 'application/json' 
    },
    body: JSON.stringify({ nombre: 'L', precio: -10 })
  });
  const dataJoi = await resJoi.json();
  console.log(`Estado 400 esperado: ${resJoi.status}`);
  console.log('Errores detectados:', dataJoi.detalles);

  // --- 3. TEST: Caché ---
  console.log('\n--- Test de Caché ---');
  console.time('Petición 1 (Sin Caché)');
  await fetch(`${BASE_URL}/api/usuarios`, { headers: { 'Authorization': TOKEN } });
  console.timeEnd('Petición 1 (Sin Caché)');

  console.time('Petición 2 (Desde Caché)');
  await fetch(`${BASE_URL}/api/usuarios`, { headers: { 'Authorization': TOKEN } });
  console.timeEnd('Petición 2 (Desde Caché)');

  // --- 4. TEST: Rate Limiting ---
  console.log('\n--- Test Rate Limiting (POST /api/usuarios) ---');
  console.log('Ejecutando ráfaga de peticiones...');
  for (let i = 0; i < 7; i++) {
    const resRate = await fetch(`${BASE_URL}/api/usuarios`, {
      method: 'POST',
      headers: { 
        'Authorization': TOKEN,
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ nombre: 'Test User', email: 'test@test.com' })
    });
    
    if (resRate.status === 429) {
      console.log(`Petición ${i+1}: 🛑 Bloqueado por Rate Limit (429)`);
      break;
    } else {
      console.log(`Petición ${i+1}: ✅ Exitosa (${resRate.status})`);
    }
  }

  // --- 5. TEST: Endpoints Protegidos ---
  console.log('\n--- Test Seguridad ---');
  const resAuth = await fetch(`${BASE_URL}/api/usuarios`);
  console.log(`Acceso sin token (401 esperado): ${resAuth.status}`);

  console.log('\n✅ Suite de pruebas completada.');
}

runTests().catch(err => console.error('❌ Error en los tests:', err));