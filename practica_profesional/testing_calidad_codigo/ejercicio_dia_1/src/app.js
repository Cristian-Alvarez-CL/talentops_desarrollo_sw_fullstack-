import express from 'express';
import { ShoppingCart } from './cart';

const app = express();
app.use(express.json());

const stockService = { checkStock: async () => true };
const discountService = { getDiscount: async () => 0.1 };
const cart = new ShoppingCart(stockService, discountService);

app.post('/cart/items', (req, res) => {
  try {
    const { product, quantity } = req.body;
    cart.addItem(product, quantity);
    res.status(201).json({ message: 'Producto añadido', items: cart.items.length });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/cart/total', async (req, res) => {
  const { coupon } = req.query;
  const total = await cart.getTotal(coupon);
  res.json({ total });
});

export default app;