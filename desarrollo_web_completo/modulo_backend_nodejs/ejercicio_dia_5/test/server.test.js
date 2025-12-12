const request = require('supertest');
const server = require('../server');

describe('Server Integration Tests', () => {
  
  afterAll(() => {
    server.close(); // Cerrar servidor al terminar
  });

  test('GET / debe devolver status 200 y HTML', async () => {
    const response = await request(server).get('/');
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/text\/html/);
    expect(response.text).toContain('Bienvenido'); // Del template home
  });

  test('GET /api/productos debe devolver JSON', async () => {
    const response = await request(server).get('/api/productos');
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/application\/json/);
    expect(Array.isArray(JSON.parse(response.text))).toBeTruthy();
  });

  test('404 para rutas inexistentes', async () => {
    const response = await request(server).get('/ruta-falsa');
    expect(response.status).toBe(404);
    expect(response.text).toContain('No Encontrado');
  });

  // Test de Auth
  test('POST /login debe crear cookie de sesión', async () => {
    const response = await request(server)
      .post('/login')
      .send('user=admin');
    
    expect(response.status).toBe(302);
    expect(response.headers['set-cookie']).toBeDefined();
  });
});