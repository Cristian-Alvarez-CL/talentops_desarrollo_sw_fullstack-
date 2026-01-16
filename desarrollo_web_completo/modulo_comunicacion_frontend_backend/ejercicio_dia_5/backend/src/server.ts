import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import routes from './routes/index.js';
import env from './config/env.js';

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (uploads)
app.use('/uploads', express.static(path.join(process.cwd(), env.UPLOAD_DIR)));

// API Routes
app.use('/api', routes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint no encontrado',
    errors: [{ code: 'NOT_FOUND', message: `${req.method} ${req.path} no existe` }]
  });
});

// Global error handler
app.use((err: Error & { status?: number }, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);

  // Handle multer errors
  if (err.message.includes('File too large')) {
    res.status(413).json({
      success: false,
      message: 'Archivo demasiado grande',
      errors: [{ code: 'FILE_TOO_LARGE', message: 'El archivo excede el tamaño máximo permitido' }]
    });
    return;
  }

  if (err.message.includes('Tipo de archivo no permitido')) {
    res.status(415).json({
      success: false,
      message: 'Tipo de archivo no permitido',
      errors: [{ code: 'INVALID_FILE_TYPE', message: err.message }]
    });
    return;
  }

  res.status(err.status || 500).json({
    success: false,
    message: 'Error interno del servidor',
    errors: [{
      code: 'INTERNAL_ERROR',
      message: env.NODE_ENV === 'development' ? err.message : 'Ha ocurrido un error inesperado'
    }]
  });
});

// Start server
const PORT = parseInt(env.PORT);
app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════════════╗
  ║                                               ║
  ║   🚀 TaskFlow API Server                      ║
  ║                                               ║
  ║   Server running on: http://localhost:${PORT} ║
  ║   Environment: ${env.NODE_ENV.padEnd(27)}     ║
  ║                                               ║
  ╚═══════════════════════════════════════════════╝
  `);
});

export default app;
