const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const Joi = require('joi');
const i18next = require('i18next');
const i18nMiddleware = require('i18next-http-middleware');

// --- CONFIGURACIÓN DE INTERNACIONALIZACIÓN (i18n) ---
i18next.use(i18nMiddleware.LanguageDetector).init({
  fallbackLng: 'es',
  resources: {
    en: {
      translation: {
        "WELCOME": "Welcome to the Middleware API",
        "ERROR_404": "Route not found",
        "RATE_LIMIT": "Too many requests, please try again later.",
        "AUTH_REQUIRED": "Authentication token required",
        "AUTH_INVALID": "Invalid token",
        "INSUFFICIENT_PERMISSIONS": "Insufficient permissions"
      }
    },
    es: {
      translation: {
        "WELCOME": "Bienvenido a la API con Middleware",
        "ERROR_404": "Ruta no encontrada",
        "RATE_LIMIT": "Demasiadas peticiones, por favor intenta más tarde.",
        "AUTH_REQUIRED": "Token de autenticación requerido",
        "AUTH_INVALID": "Token inválido",
        "INSUFFICIENT_PERMISSIONS": "Permisos insuficientes"
      }
    }
  }
});

const app = express();

// --- MIDDLEWARES DE TERCEROS ---
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(i18nMiddleware.handle(i18next));

// --- SISTEMA DE CACHÉ EN MEMORIA ---
const cache = new Map();
const cacheMiddleware = (durationSeconds) => (req, res, next) => {
  const key = req.originalUrl;
  const cachedResponse = cache.get(key);

  if (cachedResponse && (Date.now() - cachedResponse.time < durationSeconds * 1000)) {
    return res.json(cachedResponse.data);
  }

  const originalJson = res.json;
  res.json = function(body) {
    cache.set(key, { data: body, time: Date.now() });
    return originalJson.call(this, body);
  };
  next();
};

// --- RATE LIMITER PERSONALIZADO POR RUTA ---
const rateLimits = new Map();
const rateLimiter = (maxRequests, windowMs) => (req, res, next) => {
  const ip = req.ip;
  const now = Date.now();
  
  if (!rateLimits.has(ip)) rateLimits.set(ip, []);
  
  const timestamps = rateLimits.get(ip).filter(t => now - t < windowMs);
  
  if (timestamps.length >= maxRequests) {
    return res.status(429).json({ 
      error: req.t('RATE_LIMIT'),
      timestamp: new Date().toISOString()
    });
  }
  
  timestamps.push(now);
  rateLimits.set(ip, timestamps);
  next();
};

// --- VALIDACIÓN CON JOI ---
const validarEsquema = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      error: 'Validación de datos fallida',
      detalles: error.details.map(d => d.message),
      timestamp: new Date().toISOString()
    });
  }
  next();
};

// --- ESQUEMAS DE VALIDACIÓN ---
const usuarioSchema = Joi.object({
  nombre: Joi.string().min(3).required(),
  email: Joi.string().email().required(),
  activo: Joi.boolean().default(true)
});

const productoSchema = Joi.object({
  nombre: Joi.string().min(2).required(),
  precio: Joi.number().positive().required(),
  categoria: Joi.string().required(),
  stock: Joi.number().integer().min(0).default(0)
});

// --- BASE DE DATOS SIMULADA ---
let usuarios = [
  { id: 1, nombre: 'Ana García', email: 'ana@example.com', activo: true }
];

let productos = [
  { id: 1, nombre: 'Laptop', precio: 1200, categoria: 'Electrónica', stock: 5 }
];

// --- MIDDLEWARES DE AUTH Y PERMISOS (Mejorados con i18n) ---
function validarAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: req.t('AUTH_REQUIRED') });
  }
  const token = authHeader.substring(7);
  if (token !== 'mi-token-secreto') {
    return res.status(401).json({ error: req.t('AUTH_INVALID') });
  }
  req.usuario = { id: 1, nombre: 'Admin', role: 'admin' };
  next();
}

function validarPermisos(permisoRequerido) {
  return (req, res, next) => {
    const permisosUsuario = { 1: ['leer', 'escribir', 'admin'] };
    const permisos = permisosUsuario[req.usuario.id] || [];
    if (!permisos.includes(permisoRequerido)) {
      return res.status(403).json({ error: req.t('INSUFFICIENT_PERMISSIONS') });
    }
    next();
  };
}

// --- RUTAS ---

app.get('/', (req, res) => {
  res.json({ mensaje: req.t('WELCOME'), version: '2.0.0' });
});

// Ruta con Caché (30 seg) y Rate Limit (20 peticiones por minuto)
app.get('/api/usuarios', validarAuth, rateLimiter(20, 60000), cacheMiddleware(30), (req, res) => {
  res.json({ usuarios, total: usuarios.length });
});

// Ruta con Validación Joi y Rate Limit estricto
app.post('/api/usuarios', validarAuth, validarPermisos('escribir'), rateLimiter(5, 60000), validarEsquema(usuarioSchema), (req, res) => {
  const nuevo = { id: usuarios.length + 1, ...req.body };
  usuarios.push(nuevo);
  res.status(201).json(nuevo);
});

app.get('/api/productos', validarAuth, cacheMiddleware(60), (req, res) => {
  res.json(productos);
});

app.post('/api/productos', validarAuth, validarPermisos('escribir'), validarEsquema(productoSchema), (req, res) => {
  const nuevo = { id: productos.length + 1, ...req.body };
  productos.push(nuevo);
  res.status(201).json(nuevo);
});

// --- MANEJO DE ERRORES Y 404 ---
app.use((req, res) => {
  res.status(404).json({ error: req.t('ERROR_404') });
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 API avanzada ejecutándose en http://localhost:${PORT}`);
});