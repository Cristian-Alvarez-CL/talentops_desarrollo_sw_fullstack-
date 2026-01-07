const pool = require('../config/database');
const { clearCache } = require('../middleware/cache');
const redisClient = require('../config/redis');

const getProducts = async (req, res) => {
  const {
    page = 1,
    limit = 10,
    categoria,
    minPrecio,
    maxPrecio,
    ordenarPor = 'fecha_creacion',
    orden = 'DESC'
  } = req.query;

  const numericLimit = parseInt(limit) || 10;
  const numericOffset = (parseInt(page) - 1) * numericLimit;
  
  const validOrderFields = ['nombre', 'precio', 'calificacion_promedio', 'fecha_creacion'];
  const orderField = validOrderFields.includes(ordenarPor) ? ordenarPor : 'fecha_creacion';

  try {
    let query = `
      SELECT p.*, c.nombre as categoria_nombre, 
             COUNT(r.id) as total_resenas
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      LEFT JOIN reseñas r ON p.id = r.producto_id
      WHERE p.activo = TRUE
    `;
    const params = [];

    if (categoria) {
      query += ' AND p.categoria_id = ?';
      params.push(categoria);
    }

    if (minPrecio) {
      query += ' AND p.precio >= ?';
      params.push(minPrecio);
    }

    if (maxPrecio) {
      query += ' AND p.precio <= ?';
      params.push(maxPrecio);
    }

    query += ` GROUP BY p.id ORDER BY p.${orderField} ${orden} LIMIT ? OFFSET ?`;
    params.push(numericLimit, numericOffset);

    const [products] = await pool.query(query, params);

    let countQuery = 'SELECT COUNT(*) as total FROM productos WHERE activo = TRUE';
    const countParams = [];

    if (categoria) {
      countQuery += ' AND categoria_id = ?';
      countParams.push(categoria);
    }

    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      productos: products,
      paginacion: {
        pagina: parseInt(page),
        limite: numericLimit,
        total,
        totalPaginas: Math.ceil(total / numericLimit)
      }
    });
  } catch (error) {
    console.error('Error en getProducts:', error);
    res.status(500).json({ message: 'Error obteniendo productos' });
  }
};

const getProductById = async (req, res) => {
  try {
    const [product] = await pool.execute(
      `SELECT p.*, c.nombre as categoria_nombre 
       FROM productos p 
       LEFT JOIN categorias c ON p.categoria_id = c.id 
       WHERE p.id = ? AND p.activo = TRUE`,
      [req.params.id]
    );

    if (product.length === 0) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    const [reviews] = await pool.execute(
      `SELECT r.*, u.nombre as usuario_nombre 
       FROM reseñas r 
       JOIN usuarios u ON r.usuario_id = u.id 
       WHERE r.producto_id = ? 
       ORDER BY r.fecha_creacion DESC`,
      [req.params.id]
    );

    res.json({
      ...product[0],
      reseñas: reviews
    });
  } catch (error) {
    console.error('Error en getProductById:', error);
    res.status(500).json({ message: 'Error obteniendo producto' });
  }
};


const createProduct = async (req, res) => {
  const { nombre, descripcion, precio, stock, categoria_id } = req.body;
  const imagen = req.file ? `/uploads/products/${req.file.filename}` : null;

  try {
    const [result] = await pool.execute(
      `INSERT INTO productos 
       (nombre, descripcion, precio, stock, categoria_id, imagen) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [nombre, descripcion || null, precio, stock, categoria_id, imagen]
    );

    await clearCache('cache:/api/productos*');

    res.status(201).json({
      success: true,
      producto: { id: result.insertId, nombre, precio, imagen }
    });
  } catch (error) {
    console.error('Error en createProduct:', error);
    res.status(500).json({ message: 'Error creando producto' });
  }
};


const updateProduct = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  if (req.file) {
    updates.imagen = `/uploads/products/${req.file.filename}`;
  }

  try {
    const fields = [];
    const values = [];

    Object.keys(updates).forEach(key => {
      fields.push(`${key} = ?`);
      values.push(updates[key]);
    });

    if (fields.length === 0) {
      return res.status(400).json({ message: 'No hay campos para actualizar' });
    }

    values.push(id);

    const [result] = await pool.execute(
      `UPDATE productos SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    await clearCache('cache:/api/productos*');
    await redisClient.del(`cache:/api/productos/${id}`);

    res.json({ success: true, message: 'Producto actualizado' });
  } catch (error) {
    console.error('Error en updateProduct:', error);
    res.status(500).json({ message: 'Error actualizando producto' });
  }
};


const uploadProductImage = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No se subió ninguna imagen' });
  }

  try {
    const imageUrl = `/uploads/products/${req.file.filename}`;
    
    await pool.execute(
      'UPDATE productos SET imagen = ? WHERE id = ?',
      [imageUrl, req.params.id]
    );

    await redisClient.del(`cache:/api/productos/${req.params.id}`);
    await clearCache('cache:/api/productos*');

    res.json({
      success: true,
      imagen: imageUrl,
      message: 'Imagen subida correctamente'
    });
  } catch (error) {
    console.error('Error en uploadProductImage:', error);
    res.status(500).json({ message: 'Error subiendo imagen' });
  }
};


const deleteProduct = async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.execute(
      'UPDATE productos SET activo = FALSE WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    await clearCache('cache:/api/productos*');
    await redisClient.del(`cache:/api/productos/${id}`);

    res.json({ success: true, message: 'Producto desactivado correctamente' });
  } catch (error) {
    console.error('Error en deleteProduct:', error);
    res.status(500).json({ message: 'Error eliminando producto' });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  uploadProductImage,
  deleteProduct
};