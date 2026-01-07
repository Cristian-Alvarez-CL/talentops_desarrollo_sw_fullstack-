const pool = require('../config/database');
const { clearCache } = require('../middleware/cache');


const addReview = async (req, res) => {
  const { producto_id, calificacion, comentario } = req.body;
  const usuario_id = req.user.id;

  if (!producto_id) {
    return res.status(400).json({ message: 'ID de producto requerido' });
  }

  try {
    const [existing] = await pool.execute(
      'SELECT id FROM reseñas WHERE producto_id = ? AND usuario_id = ?',
      [producto_id, usuario_id]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: 'Ya has calificado este producto' });
    }

    const [result] = await pool.execute(
      `INSERT INTO reseñas (producto_id, usuario_id, calificacion, comentario) 
       VALUES (?, ?, ?, ?)`,
      [producto_id, usuario_id, calificacion, comentario || null]
    );

    await pool.execute(`
      UPDATE productos 
      SET total_calificaciones = (SELECT COUNT(*) FROM reseñas WHERE producto_id = ?),
          calificacion_promedio = (SELECT AVG(calificacion) FROM reseñas WHERE producto_id = ?)
      WHERE id = ?
    `, [producto_id, producto_id, producto_id]);

    await clearCache(`cache:/api/productos/${producto_id}`);

    try {
      const [product] = await pool.execute('SELECT nombre FROM productos WHERE id = ?', [producto_id]);
      await pool.execute(
        `INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje, metadata) 
         VALUES (1, 'review', 'Nueva reseña', 
                 'El usuario ${req.user.nombre} ha dejado una reseña en ${product[0].nombre}',
                 ?)`,
        [JSON.stringify({ producto_id, reseña_id: result.insertId })]
      );
    } catch (notifyError) {
      console.error('Error al crear notificación de reseña:', notifyError.message);
    }

    res.status(201).json({
      success: true,
      reseña: {
        id: result.insertId,
        calificacion,
        comentario: comentario || null,
        fecha_creacion: new Date()
      }
    });
  } catch (error) {
    console.error('Error en addReview:', error);
    res.status(500).json({ message: 'Error creando reseña' });
  }
};


const getProductReviews = async (req, res) => {
  const { producto_id } = req.params;
  const { page = 1, limit = 10 } = req.query;
  
  const numericLimit = parseInt(limit) || 10;
  const numericOffset = (parseInt(page) - 1) * numericLimit;

  try {

    const [reviews] = await pool.query(
      `SELECT r.*, u.nombre as usuario_nombre, u.avatar 
       FROM reseñas r 
       JOIN usuarios u ON r.usuario_id = u.id 
       WHERE r.producto_id = ? 
       ORDER BY r.fecha_creacion DESC 
       LIMIT ? OFFSET ?`,
      [producto_id, numericLimit, numericOffset]
    );

    const [countResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM reseñas WHERE producto_id = ?',
      [producto_id]
    );

    const total = countResult[0].total;

    res.json({
      reseñas: reviews,
      paginacion: {
        pagina: parseInt(page),
        limite: numericLimit,
        total,
        totalPaginas: Math.ceil(total / numericLimit)
      }
    });
  } catch (error) {
    console.error('Error en getProductReviews:', error);
    res.status(500).json({ message: 'Error obteniendo reseñas' });
  }
};


const updateReview = async (req, res) => {
  const { id } = req.params;
  const { calificacion, comentario } = req.body;

  try {
    const [result] = await pool.execute(
      `UPDATE reseñas 
       SET calificacion = ?, comentario = ? 
       WHERE id = ? AND usuario_id = ?`,
      [calificacion, comentario || null, id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Reseña no encontrada o no autorizada' });
    }

    const [review] = await pool.execute('SELECT producto_id FROM reseñas WHERE id = ?', [id]);

    if (review.length > 0) {
      const pId = review[0].producto_id;
      await pool.execute(`
        UPDATE productos 
        SET calificacion_promedio = (SELECT AVG(calificacion) FROM reseñas WHERE producto_id = ?)
        WHERE id = ?
      `, [pId, pId]);

      await clearCache(`cache:/api/productos/${pId}`);
    }

    res.json({ success: true, message: 'Reseña actualizada' });
  } catch (error) {
    console.error('Error en updateReview:', error);
    res.status(500).json({ message: 'Error actualizando reseña' });
  }
};


const deleteReview = async (req, res) => {
  const { id } = req.params;

  try {
    const [review] = await pool.execute('SELECT producto_id FROM reseñas WHERE id = ?', [id]);
    
    const [result] = await pool.execute(
      'DELETE FROM reseñas WHERE id = ? AND usuario_id = ?', 
      [id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Reseña no encontrada o no autorizada' });
    }
    
    if (review.length > 0) {
      const pId = review[0].producto_id;
      await pool.execute(`
        UPDATE productos 
        SET total_calificaciones = (SELECT COUNT(*) FROM reseñas WHERE producto_id = ?),
            calificacion_promedio = (SELECT IFNULL(AVG(calificacion), 0) FROM reseñas WHERE producto_id = ?) 
        WHERE id = ?
      `, [pId, pId, pId]);

      await clearCache(`cache:/api/productos/${pId}`);
    }

    res.json({ success: true, message: 'Reseña eliminada' });
  } catch (error) {
    console.error('Error en deleteReview:', error);
    res.status(500).json({ message: 'Error al eliminar reseña' });
  }
};

module.exports = {
  addReview,
  getProductReviews,
  updateReview,
  deleteReview
};