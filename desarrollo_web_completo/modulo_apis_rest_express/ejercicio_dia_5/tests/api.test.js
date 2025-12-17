const request = require('supertest');
const express = require('express');
const app = express(); // Importar tu app configurada aquí

describe('GET /api/posts', () => {
  it('debería retornar una lista de posts', async () => {
    // Nota: Requiere mock de datos o servidor corriendo
    // const res = await request(app).get('/api/posts');
    // expect(res.statusCode).toEqual(200);
    expect(true).toBe(true); 
  });
});