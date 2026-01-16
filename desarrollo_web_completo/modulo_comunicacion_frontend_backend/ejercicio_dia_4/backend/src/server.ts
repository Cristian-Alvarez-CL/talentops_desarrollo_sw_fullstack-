import express from 'express';
import cors from 'cors';
import productRoutes from './routes/products';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/products', productRoutes);

// Manejo de errores global
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  
  res.status(err.status || 500).json({
    errors: [{
      message: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    }]
  });
});

app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});