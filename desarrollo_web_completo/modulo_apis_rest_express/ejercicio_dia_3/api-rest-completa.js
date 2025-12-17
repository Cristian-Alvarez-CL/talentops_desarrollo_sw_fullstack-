const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');
const { AppError, ValidationError, NotFoundError } = require('./errores');

const app = express();
app.use(express.json());
const logStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' });

const loggerMiddleware = (req, res, next) => {
  const logEntry = `[${new Date().toISOString()}] ${req.method} ${req.url} - Usuario: ${req.headers.authorization || 'Anonimo'}\n`;
  logStream.write(logEntry);
  next();
};
app.use(loggerMiddleware);

// --- BASE DE DATOS SIMULADA ---
let categorias = [
  { id: 1, nombre: 'Trabajo', color: 'blue' },
  { id: 2, nombre: 'Personal', color: 'green' }
];

let tareas = [
  { id: 1, titulo: 'Aprender Express', descripcion: 'Completar tutorial', completada: false, prioridad: 'alta', usuarioId: 1, categoriaId: 1, fechaCreacion: '2025-12-10T10:00:00Z' }
];

let siguienteIdTarea = 2;

// --- MIDDLEWARES Y HELPERS ---
const validarErrores = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw new ValidationError('Datos invalidos', errors.array());
  next();
};

function autenticar(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError('Token de autenticacion requerido', 401);
  }
  req.usuario = { userId: authHeader.includes('admin') ? 1 : 2 };
  next();
}

// --- ROUTERS ---
const tareasRouter = express.Router();
const statsRouter = express.Router();
const categoriasRouter = express.Router();

tareasRouter.use(autenticar);
statsRouter.use(autenticar);
categoriasRouter.use(autenticar);

// --- ENDPOINTS DE CATEGORÍAS ---
categoriasRouter.get('/', (req, res) => res.json(categorias));

// --- ENDPOINTS DE ESTADÍSTICAS ---
statsRouter.get('/productividad', (req, res) => {
  const misTareas = tareas.filter(t => t.usuarioId === req.usuario.userId);
  const completadas = misTareas.filter(t => t.completada);
  
  const porDia = completadas.reduce((acc, t) => {
    const fecha = t.fechaCompletada ? t.fechaCompletada.split('T')[0] : 'Sin fecha';
    acc[fecha] = (acc[fecha] || 0) + 1;
    return acc;
  }, {});

  res.json({
    totalAsignadas: misTareas.length,
    totalCompletadas: completadas.length,
    tasaExito: misTareas.length ? `${((completadas.length / misTareas.length) * 100).toFixed(2)}%` : '0%',
    completadasPorDia: porDia
  });
});

// --- ENDPOINTS DE TAREAS (BÚSQUEDA AVANZADA) ---
tareasRouter.get('/',
  [
    query('q').optional().isString(),
    query('match').optional().isIn(['AND', 'OR']).withMessage('match debe ser AND o OR')
  ],
  validarErrores,
  (req, res) => {
    let resultados = tareas.filter(t => t.usuarioId === req.usuario.userId);
    const { q, match = 'AND' } = req.query;

    if (q) {
      const terminos = q.toLowerCase().split(/\s+/);
      resultados = resultados.filter(t => {
        const contenido = `${t.titulo} ${t.descripcion}`.toLowerCase();
        return match === 'AND' 
          ? terminos.every(term => contenido.includes(term))
          : terminos.some(term => contenido.includes(term));
      });
    }
    res.json(resultados);
  }
);

tareasRouter.post('/',
  [
    body('titulo').isLength({ min: 3 }),
    body('categoriaId').optional().isInt()
  ],
  validarErrores,
  (req, res) => {
    const nuevaTarea = {
      id: siguienteIdTarea++,
      ...req.body,
      completada: false,
      usuarioId: req.usuario.userId,
      fechaCreacion: new Date().toISOString()
    };
    tareas.push(nuevaTarea);
    res.status(201).json(nuevaTarea);
  }
);

tareasRouter.patch('/:id/completar', (req, res) => {
  const tarea = tareas.find(t => t.id === parseInt(req.params.id) && t.usuarioId === req.usuario.userId);
  if (!tarea) throw new NotFoundError('Tarea');
  
  tarea.completada = true;
  tarea.fechaCompletada = new Date().toISOString();
  res.json({ mensaje: 'Tarea completada', tarea });
});


app.use('/api/tareas', tareasRouter);
app.use('/api/categorias', categoriasRouter);
app.use('/api/stats', statsRouter);


app.use((err, req, res, next) => {
  const status = err.statusCode || 500;
  const mensaje = err.message || 'Error interno del servidor';
  
  logStream.write(`[ERROR][${new Date().toISOString()}] ${status} - ${mensaje}\n`);

  res.status(status).json({
    error: mensaje,
    detalles: err.errors || null,
    timestamp: new Date().toISOString()
  });
});


if (process.env.NODE_ENV !== 'test') {
  const PORT = 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Servidor en http://localhost:${PORT}`);
  });
}

module.exports = app;