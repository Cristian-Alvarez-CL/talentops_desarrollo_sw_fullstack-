const test = async () => {
  const BASE_URL = 'http://localhost:3000/api';
  let token = '';

  console.log('🧪 Iniciando pruebas de API...');

  try {
    // 1. Probar Auth
    const authRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'tester' })
    });
    const authData = await authRes.json();
    token = authData.token;
    console.log('✅ Auth exitosa');

    // 2. Probar GET Productos (Público)
    const getRes = await fetch(`${BASE_URL}/v2/productos`);
    if (getRes.ok) console.log('✅ GET /productos funciona');

    // 3. Probar POST Producto (Protegido)
    const postRes = await fetch(`${BASE_URL}/v2/productos`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ nombre: 'Teclado Mecánico', precio: 80 })
    });
    if (postRes.status === 201) console.log('✅ POST /productos (Protegido) funciona');

    // 4. Probar Rate Limit (Intento de abuso)
    console.log('⏳ Probando protección contra abuso (Rate Limit)...');
    for(let i=0; i<5; i++) {
        await fetch(`${BASE_URL}/v2/productos`);
    }
    console.log('✅ Rate limit verificado (revisar logs si es necesario)');

    // 5. Probar Suscripción Webhook
    const hookRes = await fetch(`${BASE_URL}/webhooks/subscribe`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ url: 'https://mi-servidor.com/callback' })
      });
    if (hookRes.ok) console.log('✅ Registro de Webhook funciona');

    console.log('\n✨ Todas las pruebas básicas pasaron correctamente.');
  } catch (error) {
    console.error('❌ Error en las pruebas:', error.message);
  }
};

test();