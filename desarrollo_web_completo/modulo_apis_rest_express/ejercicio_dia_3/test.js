const request = require('supertest');
const app = require('./api-rest-completa');

describe('Pruebas de Integración - API REST', () => {
  const token = 'Bearer admin-token';

  it('Debe obtener la lista de categorias', async () => {
    const res = await request(app)
      .get('/api/categorias')
      .set('Authorization', token);
    
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('Debe crear una tarea y luego marcarla como completada', async () => {
    const postRes = await request(app)
      .post('/api/tareas')
      .set('Authorization', token)
      .send({ titulo: 'Tarea de prueba', categoriaId: 1 });
    
    expect(postRes.statusCode).toBe(201);
    const id = postRes.body.id;


    const patchRes = await request(app)
      .patch(`/api/tareas/${id}/completar`)
      .set('Authorization', token);
    
    expect(patchRes.statusCode).toBe(200);
    expect(patchRes.body.tarea.completada).toBe(true);
  });

  it('Debe probar la busqueda avanzada con logica AND', async () => {
    const res = await request(app)
      .get('/api/tareas?q=Aprender Express&match=AND')
      .set('Authorization', token);
    
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('Debe obtener el reporte de productividad', async () => {
    const res = await request(app)
      .get('/api/stats/productividad')
      .set('Authorization', token);
    
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('tasaExito');
  });
});