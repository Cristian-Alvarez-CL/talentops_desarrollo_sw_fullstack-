const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
require('dotenv').config(); // Asegúrate de tener dotenv instalado

// Importar Rutas
const authRoutes = require('./src/routes/auth');
const postsRoutes = require('./src/routes/posts');
const commentsRoutes = require('./src/routes/comments');
const adminRoutes = require('./src/routes/admin');

const app = express();

// Middlewares Globales
app.use(helmet()); // Seguridad headers
app.use(cors()); // Permitir peticiones externas
app.use(express.json()); // Parsear JSON body

// Logging simple (para ver qué pasa en consola)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Registrar Rutas
app.use('/api/auth', authRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/api/admin', adminRoutes);

// Manejo de error 404
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Iniciar Servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 Servidor Blog API corriendo exitosamente!`);
  console.log(`👉 http://localhost:${PORT}`);
});