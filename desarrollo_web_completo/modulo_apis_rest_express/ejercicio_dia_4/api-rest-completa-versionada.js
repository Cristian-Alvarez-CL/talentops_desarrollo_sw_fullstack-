const express = require('express');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();
const SECRET_KEY = 'tu_clave_secreta_global';

// --- CONFIGURACIÓN DE MIDDLEWARES ---
app.use(express.json());
app.use(morgan('dev'));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Demasiadas peticiones, intente más tarde.' }
});
app.use('/api/', limiter);

// --- BASE DE DATOS Y WEBHOOKS ---
let productos = [
  { id: 1, nombre: 'Laptop', precio: 1000, categoria: 'Electrónica', stock: 5, activo: true },
  { id: 2, nombre: 'Mouse', precio: 25, categoria: 'Accesorios', stock: 10, activo: true }
];
let webhooks = [];

// --- SISTEMA DE AUTENTICACIÓN ---
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Token no proporcionado' });

  const token = authHeader.split(' ')[1];
  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Token inválido o expirado' });
    req.user = decoded;
    next();
  });
};

// --- DOCUMENTACIÓN OPENAPI (Swagger) ---
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: { title: 'API de Productos Versionada', version: '2.0.0' },
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
      }
    }
  },
  apis: ['./server.js'], 
};
const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// --- HELPER WEBHOOKS ---
const notifyWebhooks = (evento, data) => {
  console.log(`[Webhook] Notificando evento: ${evento}`);
  webhooks.forEach(url => {
    console.log(`Enviando POST a ${url} con datos de ${data.nombre}`);
  });
};

// --- RUTAS DE AUTENTICACIÓN ---
app.post('/api/auth/login', (req, res) => {
  const { username } = req.body;
  const token = jwt.sign({ username, role: 'admin' }, SECRET_KEY, { expiresIn: '1h' });
  res.json({ token });
});

// --- API V2 (EXTENDIDA) ---
const v2Router = express.Router();

/**
 * @openapi
 * /api/v2/productos:
 * get:
 * summary: Obtiene la lista de productos
 * responses:
 * 200:
 * description: Lista devuelta con éxito
 */
v2Router.get('/productos', (req, res) => {
  res.json({ success: true, data: productos });
});

/**
 * @openapi
 * /api/v2/productos:
 * post:
 * summary: Crea un producto (Requiere Auth)
 * security:
 * - bearerAuth: []
 */
v2Router.post('/productos', authMiddleware, (req, res) => {
  const nuevo = { id: productos.length + 1, ...req.body };
  productos.push(nuevo);
  notifyWebhooks('PRODUCT_CREATED', nuevo);
  res.status(201).json(nuevo);
});

// --- SISTEMA DE WEBHOOKS ENDPOINT ---
app.post('/api/webhooks/subscribe', authMiddleware, (req, res) => {
  const { url } = req.body;
  webhooks.push(url);
  res.status(201).json({ message: 'Suscrito a notificaciones' });
});

app.use('/api/v2', v2Router);

const PORT = 3000;
app.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT}`));