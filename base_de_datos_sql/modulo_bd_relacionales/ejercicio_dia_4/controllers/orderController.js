const pool = require('../config/database');
const { sendEmail } = require('../utils/emailService');
const redisClient = require('../config/redis');

const createOrder = async (req, res) => {
  const { productos, direccion_envio, telefono, notas } = req.body;
  const usuario_id = req.user.id;

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    let total = 0;
    const orderProducts = [];

    for (const item of productos) {
      const [product] = await connection.execute(
        'SELECT precio, stock FROM productos WHERE id = ? AND activo = TRUE',
        [item.producto_id]
      );

      if (product.length === 0) {
        throw new Error(`Producto ${item.producto_id} no disponible`);
      }

      if (product[0].stock < item.cantidad) {
        throw new Error(`Stock insuficiente para producto ${item.producto_id}`);
      }

      const subtotal = product[0].precio * item.cantidad;
      total += subtotal;

      orderProducts.push({
        ...item,
        precio_unitario: product[0].precio,
        subtotal
      });
    }

    const [orderResult] = await connection.execute(
      `INSERT INTO pedidos 
       (usuario_id, total, direccion_envio, telefono, notas) 
       VALUES (?, ?, ?, ?, ?)`,
      [usuario_id, total, direccion_envio, telefono, notas || null]
    );

    const orderId = orderResult.insertId;

    for (const item of orderProducts) {
      await connection.execute(
        `INSERT INTO detalle_pedidos 
         (pedido_id, producto_id, cantidad, precio_unitario) 
         VALUES (?, ?, ?, ?)`,
        [orderId, item.producto_id, item.cantidad, item.precio_unitario]
      );

      await connection.execute(
        'UPDATE productos SET stock = stock - ? WHERE id = ?',
        [item.cantidad, item.producto_id]
      );
    }

    const [user] = await connection.execute(
      'SELECT nombre, email FROM usuarios WHERE id = ?',
      [usuario_id]
    );

    await connection.commit();

    sendEmail({
      to: user[0].email,
      subject: 'Confirmación de pedido #' + orderId,
      html: `<h1>¡Gracias por tu pedido, ${user[0].nombre}!</h1><p>Pedido #${orderId} recibido.</p>`
    }).catch(err => console.error('Error email ignorado:', err.message));

    await pool.execute(
      `INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje, metadata) 
       VALUES (?, 'order', 'Pedido creado', 'Tu pedido #${orderId} ha sido creado', ?)`,
      [usuario_id, JSON.stringify({ pedido_id: orderId })]
    );

    res.status(201).json({
      success: true,
      pedido: { id: orderId, total, productos: orderProducts }
    });
  } catch (error) {
    await connection.rollback();
    res.status(400).json({ message: error.message });
  } finally {
    connection.release();
  }
};

const getUserOrders = async (req, res) => {
  const usuario_id = req.user.id;
  const { page = 1, limit = 10 } = req.query;
  
  // Conversión crítica a números para evitar ER_WRONG_ARGUMENTS
  const numericLimit = parseInt(limit) || 10;
  const numericOffset = (parseInt(page) - 1) * numericLimit;

  try {
    // Se usa pool.query por compatibilidad con LIMIT/OFFSET en este entorno
    const [orders] = await pool.query(
      `SELECT p.*, 
              COUNT(dp.id) as total_productos,
              SUM(dp.cantidad) as total_items
       FROM pedidos p
       LEFT JOIN detalle_pedidos dp ON p.id = dp.pedido_id
       WHERE p.usuario_id = ?
       GROUP BY p.id
       ORDER BY p.fecha_pedido DESC
       LIMIT ? OFFSET ?`,
      [usuario_id, numericLimit, numericOffset]
    );

    const [countResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM pedidos WHERE usuario_id = ?',
      [usuario_id]
    );

    res.json({
      pedidos: orders,
      paginacion: {
        pagina: parseInt(page),
        limite: numericLimit,
        total: countResult[0].total
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error obteniendo pedidos' });
  }
};

const getOrderById = async (req, res) => {
  try {
    const [order] = await pool.execute('SELECT * FROM pedidos WHERE id = ?', [req.params.id]);
    if (order.length === 0) return res.status(404).json({ message: 'Pedido no encontrado' });
    res.json(order[0]);
  } catch (error) { res.status(500).json({ message: 'Error' }); }
};

const updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;
  try {
    const [result] = await pool.execute('UPDATE pedidos SET estado = ? WHERE id = ?', [estado, id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Pedido no encontrado' });
    res.json({ success: true, message: 'Estado actualizado' });
  } catch (error) { res.status(500).json({ message: 'Error' }); }
};

const cancelOrder = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [items] = await connection.execute('SELECT producto_id, cantidad FROM detalle_pedidos WHERE pedido_id = ?', [req.params.id]);
    for (const item of items) {
      await connection.execute('UPDATE productos SET stock = stock + ? WHERE id = ?', [item.cantidad, item.producto_id]);
    }
    await connection.execute('UPDATE pedidos SET estado = "cancelado" WHERE id = ?', [req.params.id]);
    await connection.commit();
    res.json({ success: true, message: 'Pedido cancelado' });
  } catch (error) { await connection.rollback(); res.status(500).json({ message: 'Error' }); }
  finally { connection.release(); }
};

module.exports = { createOrder, getUserOrders, updateOrderStatus, getOrderById, cancelOrder };