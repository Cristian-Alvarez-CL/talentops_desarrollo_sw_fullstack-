const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

// Importar rutas
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const orderRoutes = require('./routes/orderRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

// Middlewares
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/productos', productRoutes);
app.use('/api/resenas', reviewRoutes);
app.use('/api/pedidos', orderRoutes);
app.use('/api/usuarios', userRoutes);

// Ruta de prueba
app.get('/api/estadisticas', async (req, res) => {
  const pool = require('./config/database');
  
  try {
    const [
      [users],
      [products],
      [orders],
      [categories]
    ] = await Promise.all([
      pool.execute('SELECT COUNT(*) as total FROM usuarios'),
      pool.execute('SELECT COUNT(*) as total FROM productos WHERE activo = TRUE'),
      pool.execute('SELECT COUNT(*) as total FROM pedidos'),
      pool.execute('SELECT COUNT(*) as total FROM categorias')
    ]);

    res.json({
      usuarios: users[0].total,
      productos: products[0].total,
      pedidos: orders[0].total,
      categorias: categories[0].total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error obteniendo estadísticas' });
  }
});

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'El archivo es demasiado grande' });
  }
  
  res.status(err.status || 500).json({
    message: err.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Ruta no encontrada
app.use((req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
});

const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📁 Entorno: ${process.env.NODE_ENV}`);
    console.log(`🗄️  Base de datos: ${process.env.DB_NAME}`);
    console.log(`🔐 Autenticación JWT: Habilitada`);
    console.log(`📨 Email: ${process.env.EMAIL_USER ? 'Configurado' : 'No configurado'}`);
    console.log(`🧠 Redis: ${process.env.REDIS_HOST ? 'Conectado' : 'No configurado'}`);
  });
}

module.exports = app;