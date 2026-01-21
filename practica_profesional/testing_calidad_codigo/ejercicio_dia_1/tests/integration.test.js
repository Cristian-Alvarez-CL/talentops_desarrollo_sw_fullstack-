import request from 'supertest';
import app from '../src/app';

describe('Integration Tests: Carrito API', () => {
  
  describe('POST /cart/items', () => {
    test('debería añadir un producto y retornar 201', async () => {
      const response = await request(app)
        .post('/cart/items')
        .send({
          product: { id: 1, name: 'MacBook Pro', price: 2000 },
          quantity: 1
        });

      expect(response.statusCode).toBe(201);
      expect(response.body.message).toBe('Producto añadido');
      expect(response.body.items).toBeGreaterThan(0);
    });

    test('debería fallar con 400 si la cantidad es inválida', async () => {
      const response = await request(app)
        .post('/cart/items')
        .send({
          product: { id: 1, price: 2000 },
          quantity: 0
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.error).toBe('La cantidad debe ser mayor a 0');
    });
  });

  describe('GET /cart/total', () => {
    test('debería retornar el total calculado tras añadir productos', async () => {
      await request(app)
        .post('/cart/items')
        .send({ product: { id: 2, price: 100 }, quantity: 2 });

      const response = await request(app).get('/cart/total?coupon=OFF10');

      expect(response.statusCode).toBe(200);
      expect(response.body.total).toBeDefined();
      expect(typeof response.body.total).toBe('number');
    });
  });
});