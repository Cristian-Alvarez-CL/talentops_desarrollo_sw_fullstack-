import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Mock database
let products = [
  { 
    id: '1', 
    name: 'Laptop Gaming', 
    description: 'Laptop de alto rendimiento para gaming', 
    price: 1299.99, 
    category: 'Electrónica', 
    stock: 15,
    isFavorite: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  { 
    id: '2', 
    name: 'Smartphone Pro', 
    description: 'Teléfono inteligente con cámara avanzada', 
    price: 899.99, 
    category: 'Electrónica', 
    stock: 25,
    isFavorite: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  { 
    id: '3', 
    name: 'Auriculares Bluetooth', 
    description: 'Auriculares inalámbricos con cancelación de ruido', 
    price: 199.99, 
    category: 'Accesorios', 
    stock: 50,
    isFavorite: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  { 
    id: '4', 
    name: 'Monitor 4K', 
    description: 'Monitor de 27 pulgadas con resolución 4K', 
    price: 499.99, 
    category: 'Electrónica', 
    stock: 20,
    isFavorite: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  { 
    id: '5', 
    name: 'Teclado Mecánico', 
    description: 'Teclado gaming con switches mecánicos', 
    price: 129.99, 
    category: 'Accesorios', 
    stock: 35,
    isFavorite: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Simular delay de red
const simulateDelay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

// Middleware para logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// GET all products
app.get('/api/products', async (req, res) => {
  await simulateDelay();
  res.json(products);
});

// GET single product
app.get('/api/products/:id', async (req, res) => {
  await simulateDelay();
  const product = products.find(p => p.id === req.params.id);
  if (!product) {
    return res.status(404).json({ error: 'Producto no encontrado' });
  }
  res.json(product);
});

// POST create product
app.post('/api/products', async (req, res) => {
  await simulateDelay();
  const newProduct = {
    id: uuidv4(),
    ...req.body,
    isFavorite: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  products.push(newProduct);
  res.status(201).json(newProduct);
});

// PUT update product
app.put('/api/products/:id', async (req, res) => {
  await simulateDelay();
  const index = products.findIndex(p => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Producto no encontrado' });
  }
  
  const updatedProduct = {
    ...products[index],
    ...req.body,
    updatedAt: new Date().toISOString()
  };
  
  products[index] = updatedProduct;
  res.json(updatedProduct);
});

// PATCH toggle favorite
app.patch('/api/products/:id/favorite', async (req, res) => {
  await simulateDelay();
  const index = products.findIndex(p => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Producto no encontrado' });
  }
  
  products[index].isFavorite = !products[index].isFavorite;
  products[index].updatedAt = new Date().toISOString();
  
  res.json(products[index]);
});

// DELETE product
app.delete('/api/products/:id', async (req, res) => {
  await simulateDelay();
  const index = products.findIndex(p => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Producto no encontrado' });
  }
  
  const deletedProduct = products[index];
  products = products.filter(p => p.id !== req.params.id);
  res.json(deletedProduct);
});

// GET categories
app.get('/api/categories', async (req, res) => {
  await simulateDelay();
  const categories = [...new Set(products.map(p => p.category))];
  res.json(categories);
});

// Search products
app.get('/api/products/search/:query', async (req, res) => {
  await simulateDelay();
  const query = req.params.query.toLowerCase();
  const filtered = products.filter(p => 
    p.name.toLowerCase().includes(query) ||
    p.description.toLowerCase().includes(query)
  );
  res.json(filtered);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(PORT, () => {
  console.log(`✅ Servidor backend corriendo en http://localhost:${PORT}`);
});