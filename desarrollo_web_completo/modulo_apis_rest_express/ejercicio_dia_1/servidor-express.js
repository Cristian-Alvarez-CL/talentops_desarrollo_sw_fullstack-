const express = require('express');
const Joi = require('joi');
const winston = require('winston');
const { Parser } = require('json2csv');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

// --- CONFIGURACIÓN DE LOGGING (Winston) ---
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({ format: winston.format.simple() })
  ],
});

// Middleware de Logging para cada request
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`, { body: req.body, query: req.query });
  next();
});

// --- BASE DE DATOS SIMULADA ---
let tareas = [
  { id: 1, titulo: 'Aprender Express', descripcion: 'Completar tutorial', completada: false, fechaCreacion: new Date().toISOString() },
  { id: 2, titulo: 'Crear API', descripcion: 'Implementar endpoints REST', completada: true, fechaCreacion: new Date().toISOString() }
];
let siguienteId = 3;

// --- ESQUEMAS DE VALIDACIÓN (Joi) ---
const tareaSchema = Joi.object({
  titulo: Joi.string().min(3).required(),
  descripcion: Joi.string().allow('', null),
  completada: Joi.boolean().default(false)
});

// --- NUEVOS ENDPOINTS ---

/**
 * GET /tareas/estadisticas
 * Proporciona un resumen del estado de las tareas.
 */
app.get('/tareas/estadisticas', (req, res) => {
  const total = tareas.length;
  const completadas = tareas.filter(t => t.completada).length;
  const pendientes = total - completadas;
  
  const estadisticas = {
    total_tareas: total,
    completadas,
    pendientes,
    porcentaje_completado: total > 0 ? `${((completadas / total) * 100).toFixed(2)}%` : '0%'
  };

  res.json(estadisticas);
});

/**
 * GET /tareas/exportar/csv
 * Exporta la lista de tareas actual a un archivo CSV.
 */
app.get('/tareas/exportar/csv', (req, res) => {
  try {
    const fields = ['id', 'titulo', 'descripcion', 'completada', 'fechaCreacion'];
    const opts = { fields };
    const parser = new Parser(opts);
    const csv = parser.parse(tareas);

    res.header('Content-Type', 'text/csv');
    res.attachment('tareas.csv');
    return res.send(csv);
  } catch (err) {
    logger.error('Error al exportar CSV', err);
    res.status(500).json({ error: 'No se pudo generar el reporte' });
  }
});

// --- ENDPOINTS EXISTENTES (MEJORADOS) ---

app.post('/tareas', (req, res) => {
  const { error, value } = tareaSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({ 
      error: 'Validación fallida', 
      detalles: error.details.map(d => d.message) 
    });
  }

  const nuevaTarea = {
    id: siguienteId++,
    ...value,
    fechaCreacion: new Date().toISOString()
  };

  tareas.push(nuevaTarea);
  logger.info(`Tarea creada: ${nuevaTarea.id}`);
  res.status(201).json(nuevaTarea);
});

// GET /tareas con búsqueda avanzada
app.get('/tareas', (req, res) => {
  let resultados = [...tareas];
  const { q, completada, desde } = req.query;

  if (completada) resultados = resultados.filter(t => t.completada === (completada === 'true'));
  
  if (q) {
    resultados = resultados.filter(t => 
      t.titulo.toLowerCase().includes(q.toLowerCase()) || 
      t.descripcion.toLowerCase().includes(q.toLowerCase())
    );
  }

  // Búsqueda por fecha (Tareas creadas después de...)
  if (desde) {
    resultados = resultados.filter(t => new Date(t.fechaCreacion) >= new Date(desde));
  }

  res.json(resultados);
});

// DELETE con logging
app.delete('/tareas/:id', (req, res) => {
  const index = tareas.findIndex(t => t.id === parseInt(req.params.id));
  if (index === -1) return res.status(404).json({ error: 'No encontrado' });

  const eliminada = tareas.splice(index, 1);
  logger.warn(`Tarea eliminada: ${req.params.id}`);
  res.json({ mensaje: 'Eliminado', tarea: eliminada[0] });
});

// Iniciar servidor
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor en puerto ${PORT}`);
  logger.info('Servidor iniciado correctamente');
});