const express = require('express');
const cors = require('cors');
const app = express();

// --- Configuración CORS ---
const corsOptions = {
  origin: 'http://localhost:5173', // URL de tu frontend (Vite/CRA)
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'], // Permitir header de token
  credentials: true // Permitir cookies/sessions si fuera necesario
};

app.use(cors(corsOptions));
app.use(express.json());

// Simulación de Base de Datos
let posts = { 1: { id: 1, title: "Post Demo", likes: 42 } };

// --- Endpoints ---

// Endpoint para Formulario de Contacto
app.post('/api/contact', (req, res) => {
  const { email, message } = req.body;
  
  // Simular delay de red y validación
  setTimeout(() => {
    if (!email || !message) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }
    // Simular éxito
    res.status(200).json({ success: true, message: 'Mensaje recibido correctamente' });
  }, 1500);
});

// Endpoint para sistema de Likes
app.post('/api/posts/:id/like', (req, res) => {
  const { id } = req.params;
  
  setTimeout(() => {
    // Simular error aleatorio (20% de probabilidad) para probar manejo de errores
    if (Math.random() < 0.2) {
      return res.status(500).json({ error: 'Error de servidor al procesar like' });
    }

    if (posts[id]) {
      posts[id].likes += 1;
      res.json({ id, likes: posts[id].likes });
    } else {
      res.status(404).json({ error: 'Post no encontrado' });
    }
  }, 800);
});

app.listen(3000, () => console.log('Backend corriendo en puerto 3000'));