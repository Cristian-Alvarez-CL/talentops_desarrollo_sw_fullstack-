const request = require('supertest');
const app = require('../server');
const pool = require('../config/database');
const redisClient = require('../config/redis');

let authToken;
let userId;
let productId;
let orderId;
let testEmail; 

describe('API REST con MySQL, JWT, Redis y Multer', () => {
  

  beforeAll(async () => {
    await pool.execute('DELETE FROM usuarios WHERE email LIKE "test%@example.com"');
    await redisClient.flushAll();
  });

  afterAll(async () => {
    await pool.end();
    if (redisClient.isOpen) {
      await redisClient.disconnect();
    }
  });

  describe('1. Sistema de Autenticación JWT', () => {
    test('POST /api/auth/register - Debe registrar un nuevo usuario', async () => {
      testEmail = `test${Date.now()}@example.com`;
      
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          nombre: 'Test User',
          email: testEmail,
          password: 'Test1234',
          edad: 25
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      
      userId = response.body.usuario.id;
      authToken = response.body.token;

      await pool.execute('UPDATE usuarios SET rol = "admin" WHERE id = ?', [userId]);
    }, 10000);

    test('POST /api/auth/login - Debe hacer login y devolver token', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: 'Test1234'
        });

      expect(response.status).toBe(200);
      expect(response.body.token).toBeDefined();
      
      authToken = response.body.token;
    });

    test('GET /api/productos - Debe fallar sin token', async () => {

      const response = await request(app)
        .post('/api/productos')
        .send({ nombre: 'Fallo' });

      expect(response.status).toBe(401);
    });
  });

  describe('2. Sistema de Productos con Imágenes', () => {
    test('POST /api/productos - Debe crear un producto (con autenticación)', async () => {
      const response = await request(app)
        .post('/api/productos')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          nombre: 'Producto de Prueba',
          descripcion: 'Descripción generada en test',
          precio: 99.99,
          stock: 10,
          categoria_id: 1
        });

      expect(response.status).toBe(201);
      expect(response.body.producto.nombre).toBe('Producto de Prueba');
      
      productId = response.body.producto.id;
    });

    test('POST /api/productos/:id/upload - Debe subir imagen del producto', async () => {
      const response = await request(app)
        .post(`/api/productos/${productId}/upload`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('imagen', Buffer.from('fake image data'), 'test.jpg');

      expect(response.status).toBe(200);
      expect(response.body.imagen).toContain('/uploads/products/');
    });
  });

  describe('3. Sistema de Reseñas y Calificaciones', () => {
    test('POST /api/resenas - Debe crear una reseña', async () => {
      const response = await request(app)
        .post('/api/resenas')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          producto_id: productId,
          calificacion: 5,
          comentario: 'Excelente producto probado en test!'
        });

      expect(response.status).toBe(201);
      expect(response.body.reseña.calificacion).toBe(5);
    });

    test('GET /api/resenas/product/:producto_id - Debe obtener reseñas del producto', async () => {
      const response = await request(app)
        .get(`/api/resenas/product/${productId}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.reseñas)).toBe(true);
    });
  });

  describe('4. Sistema de Pedidos con Stock real', () => {
    test('POST /api/pedidos - Debe crear un pedido y descontar stock', async () => {
      const response = await request(app)
        .post('/api/pedidos')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productos: [
            { producto_id: productId, cantidad: 2 }
          ],
          direccion_envio: 'Dirección de Test 123',
          telefono: '555-TEST',
          notas: 'Pedido de integración'
        });

      expect(response.status).toBe(201);
      expect(response.body.pedido.total).toBeGreaterThan(0);
      
      orderId = response.body.pedido.id;
      const [rows] = await pool.execute('SELECT stock FROM productos WHERE id = ?', [productId]);
      expect(rows[0].stock).toBe(8);
    });

    test('GET /api/pedidos/my-orders - Debe obtener pedidos del usuario', async () => {
      const response = await request(app)
        .get('/api/pedidos/my-orders')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.pedidos)).toBe(true);
    });
  });

  describe('5. Sistema de Caché con Redis', () => {
    test('GET /api/productos - Debe usar caché para segunda solicitud', async () => {
      const response1 = await request(app).get('/api/productos');
      expect(response1.status).toBe(200);

      const response2 = await request(app).get('/api/productos');
      expect(response2.status).toBe(200);
      expect(response1.body).toEqual(response2.body);
    });

    test('Cache debe limpiarse al crear nuevo producto', async () => {
      await request(app).get('/api/productos');

      await request(app)
        .post('/api/productos')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          nombre: 'Producto Invalida Cache',
          precio: 10.00,
          stock: 5,
          categoria_id: 1
        });

      const response = await request(app).get('/api/productos');
      const encontrado = response.body.productos.find(p => p.nombre === 'Producto Invalida Cache');
      expect(encontrado).toBeDefined();
    });
  });

  describe('6. Endpoints de Estadísticas', () => {
    test('GET /api/estadisticas - Debe devolver conteos reales de la DB', async () => {
      const response = await request(app).get('/api/estadisticas');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('usuarios');
      expect(response.body).toHaveProperty('productos');
      expect(response.body).toHaveProperty('pedidos');
      expect(response.body.pedidos).toBeGreaterThan(0); // Al menos el que creamos arriba
    });
  });
});