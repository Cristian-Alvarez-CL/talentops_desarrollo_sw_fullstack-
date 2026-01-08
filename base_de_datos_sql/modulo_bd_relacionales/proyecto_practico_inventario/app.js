const express = require('express');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

// Importar Controladores
const ProductosController = require('./controllers/productosController');
const OrdenesController = require('./controllers/ordenesController');
const ApiExternoController = require('./controllers/apiExternoController');

dotenv.config();

const app = express();
app.use(express.json());

// Servir archivos estáticos (Frontend)
app.use(express.static(path.join(__dirname, 'public')));

// Configuración de base de datos
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'sistema_inventario',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

// Inicializar controladores
const productosController = new ProductosController(pool);
const ordenesController = new OrdenesController(pool);
const apiExternoController = new ApiExternoController(pool);

// Middleware de logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// --- RUTAS API ---

// 1. Productos e Inventario
app.get('/api/productos', productosController.listarProductos.bind(productosController));
app.get('/api/productos/:id', productosController.obtenerProducto.bind(productosController));
app.get('/api/productos/:id/etiqueta', productosController.obtenerEtiqueta.bind(productosController)); // Nuevo: Código de barras
app.post('/api/productos', productosController.crearProducto.bind(productosController));
app.patch('/api/productos/:id/stock', productosController.actualizarStock.bind(productosController));

// 2. Órdenes de Compra (Nuevo)
app.get('/api/ordenes', ordenesController.listarOrdenes.bind(ordenesController));
app.post('/api/ordenes', ordenesController.crearOrden.bind(ordenesController));
app.post('/api/ordenes/:id/recibir', ordenesController.recibirOrden.bind(ordenesController));

// 3. API Integración Externa (ERP/E-commerce)
// Middleware simple de seguridad para API externa
const verifyApiKey = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    if (apiKey !== process.env.EXTERNAL_API_KEY && apiKey !== 'secret-123') { // Fallback para dev
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
};
app.post('/api/external/sync-stock', verifyApiKey, apiExternoController.sincronizarStock.bind(apiExternoController));
app.post('/api/external/webhook-venta', verifyApiKey, apiExternoController.procesarVentaExterna.bind(apiExternoController));

// 4. Datos Maestros y Dashboard
app.get('/api/categorias', async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM categorias WHERE activa = 1');
    res.json({ categorias: rows });
});
app.get('/api/proveedores', async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM proveedores WHERE activo = 1');
    res.json({ proveedores: rows });
});

app.get('/api/dashboard', async (req, res) => {
  try {
    const [stats] = await pool.execute(`
      SELECT
        COUNT(CASE WHEN activo = 1 THEN 1 END) AS productos_activos,
        COUNT(CASE WHEN stock_actual <= stock_minimo THEN 1 END) AS productos_stock_bajo,
        (SELECT COUNT(*) FROM ordenes_compra WHERE estado = 'pendiente') as ordenes_pendientes
      FROM productos WHERE activo = 1
    `);
    
    // Top 5 movimientos recientes
    const [movimientos] = await pool.execute(`
        SELECT m.fecha_movimiento, p.nombre, m.cantidad, t.tipo 
        FROM movimientos_inventario m
        JOIN productos p ON m.producto_id = p.id
        JOIN tipos_movimiento t ON m.tipo_movimiento_id = t.id
        ORDER BY m.fecha_movimiento DESC LIMIT 5
    `);

    res.json({ estadisticas: stats[0], movimientos_recientes: movimientos });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Manejo de errores
app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ error: 'Error interno del servidor', details: error.message });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Sistema de Inventario v2.0 ejecutándose en http://localhost:${PORT}`);
});