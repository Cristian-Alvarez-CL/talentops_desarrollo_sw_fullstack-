const { enviarAlertaStock, generarBarcode } = require('../services/notificationService');

class ProductosController {
  constructor(db) {
    this.db = db;
  }

  // Listar productos con filtros avanzados
  async listarProductos(req, res) {
    try {
      const {
        categoria,
        proveedor,
        stock_bajo,
        activo = 'true',
        pagina = 1,
        limite = 20,
        ordenar = 'nombre',
        busqueda
      } = req.query;

      let sql = `
        SELECT
          p.id, p.codigo, p.nombre, p.descripcion,
          p.precio_compra, p.precio_venta,
          p.stock_actual, p.stock_minimo, p.stock_maximo,
          c.nombre AS categoria,
          pr.nombre AS proveedor,
          p.activo,
          CASE
            WHEN p.stock_actual <= p.stock_minimo THEN 'bajo'
            WHEN p.stock_actual > p.stock_maximo * 0.8 THEN 'alto'
            ELSE 'normal'
          END AS estado_stock
        FROM productos p
        LEFT JOIN categorias c ON p.categoria_id = c.id
        LEFT JOIN proveedores pr ON p.proveedor_id = pr.id
        WHERE 1=1
      `;
      const params = [];

      // Filtros
      if (activo !== 'all') {
        sql += ' AND p.activo = ?';
        params.push(activo === 'true');
      }

      if (categoria) {
        sql += ' AND c.nombre = ?';
        params.push(categoria);
      }

      if (proveedor) {
        sql += ' AND pr.nombre = ?';
        params.push(proveedor);
      }

      if (stock_bajo === 'true') {
        sql += ' AND p.stock_actual <= p.stock_minimo';
      }

      if (busqueda) {
        sql += ' AND (p.nombre LIKE ? OR p.descripcion LIKE ? OR p.codigo LIKE ?)';
        const searchTerm = `%${busqueda}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      // Ordenamiento
      const ordenesValidos = {
        nombre: 'p.nombre',
        precio: 'p.precio_venta',
        stock: 'p.stock_actual',
        categoria: 'c.nombre'
      };

      sql += ` ORDER BY ${ordenesValidos[ordenar] || 'p.nombre'} ASC`;

      // Paginación
      const offset = (parseInt(pagina) - 1) * parseInt(limite);
      sql += ' LIMIT ? OFFSET ?';
      params.push(parseInt(limite), offset);

      // CORRECCIÓN 1: Usar destructuring [productos] para obtener solo las filas
      const [productos] = await this.db.query(sql, params);

      // Obtener total para paginación
      const countSql = `
        SELECT COUNT(*) as total
        FROM productos p
        LEFT JOIN categorias c ON p.categoria_id = c.id
        LEFT JOIN proveedores pr ON p.proveedor_id = pr.id
        WHERE 1=1
      `;
      const countParams = params.slice(0, -2); // Remover LIMIT y OFFSET
      
      // CORRECCIÓN 2: Destructuring y acceso correcto al total (rows[0].total)
      const [countRows] = await this.db.query(countSql + this.getWhereClause(activo, categoria, proveedor, stock_bajo, busqueda), countParams);
      const totalRegistros = countRows[0].total;

      res.json({
        productos,
        paginacion: {
          pagina: parseInt(pagina),
          limite: parseInt(limite),
          total: totalRegistros,
          paginas: Math.ceil(totalRegistros / parseInt(limite))
        }
      });

    } catch (error) {
      console.error('Error listando productos:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Obtener producto por ID
  async obtenerProducto(req, res) {
    try {
      const { id } = req.params;

      // CORRECCIÓN 3: Destructuring
      const [productos] = await this.db.query(`
        SELECT
          p.*,
          c.nombre AS categoria_nombre,
          pr.nombre AS proveedor_nombre
        FROM productos p
        LEFT JOIN categorias c ON p.categoria_id = c.id
        LEFT JOIN proveedores pr ON p.proveedor_id = pr.id
        WHERE p.id = ?
      `, [id]);

      if (productos.length === 0) {
        return res.status(404).json({ error: 'Producto no encontrado' });
      }

      const producto = productos[0];

      // Obtener últimos movimientos (CORRECCIÓN 4: Destructuring)
      const [movimientos] = await this.db.query(`
        SELECT
          mi.cantidad, mi.fecha_movimiento,
          tm.nombre AS tipo_movimiento, tm.tipo,
          mi.referencia, mi.notas
        FROM movimientos_inventario mi
        JOIN tipos_movimiento tm ON mi.tipo_movimiento_id = tm.id
        WHERE mi.producto_id = ?
        ORDER BY mi.fecha_movimiento DESC
        LIMIT 10
      `, [id]);

      res.json({
        producto,
        movimientos_recientes: movimientos
      });

    } catch (error) {
      console.error('Error obteniendo producto:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Crear producto
  async crearProducto(req, res) {
    const connection = await this.db.getConnection();

    try {
      await connection.beginTransaction();

      const {
        codigo, nombre, descripcion, precio_compra, precio_venta,
        stock_actual = 0, stock_minimo = 0, stock_maximo = 1000,
        categoria_id, proveedor_id
      } = req.body;

      // Validaciones
      if (!codigo || !nombre || !precio_venta) {
        await connection.rollback();
        return res.status(400).json({
          error: 'Código, nombre y precio de venta son obligatorios'
        });
      }

      // Verificar que el código no exista
      const [existing] = await connection.execute(
        'SELECT id FROM productos WHERE codigo = ?',
        [codigo]
      );

      if (existing.length > 0) {
        await connection.rollback();
        return res.status(409).json({ error: 'El código del producto ya existe' });
      }

      // Insertar producto
      const [result] = await connection.execute(`
        INSERT INTO productos
        (codigo, nombre, descripcion, precio_compra, precio_venta,
         stock_actual, stock_minimo, stock_maximo, categoria_id, proveedor_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [codigo, nombre, descripcion, precio_compra, precio_venta,
           stock_actual, stock_minimo, stock_maximo, categoria_id, proveedor_id]);

      const productoId = result.insertId;

      // Registrar movimiento de inventario si hay stock inicial
      if (stock_actual > 0) {
        await connection.execute(`
          INSERT INTO movimientos_inventario
          (producto_id, tipo_movimiento_id, cantidad, stock_anterior, stock_nuevo, referencia, notas)
          VALUES (?, 4, ?, 0, ?, 'CREACION', 'Stock inicial al crear producto')
        `, [productoId, stock_actual, stock_actual]);
      }

      await connection.commit();

      res.status(201).json({
        message: 'Producto creado exitosamente',
        producto: {
          id: productoId,
          codigo,
          nombre,
          precio_venta,
          stock_actual
        }
      });

    } catch (error) {
      await connection.rollback();
      console.error('Error creando producto:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    } finally {
      connection.release();
    }
  }

  // Generar y servir imagen de código de barras
  async obtenerEtiqueta(req, res) {
    try {
      const { id } = req.params;
      const [rows] = await this.db.query('SELECT codigo, nombre FROM productos WHERE id = ?', [id]);
      
      if (rows.length === 0) {
        return res.status(404).send('Producto no encontrado');
      }
      
      const producto = rows[0];
      const pngBuffer = await generarBarcode(producto.codigo);
      
      res.writeHead(200, {
        'Content-Type': 'image/png',
        'Content-Length': pngBuffer.length
      });
      res.end(pngBuffer);
      
    } catch (error) {
      console.error('Error generando barcode:', error);
      res.status(500).send('Error generando etiqueta');
    }
  }

  // Actualizar stock de producto
  async actualizarStock(req, res) {
    const connection = await this.db.getConnection();

    try {
      await connection.beginTransaction();

      const { id } = req.params;
      const { cantidad, tipo_movimiento_id, referencia, notas } = req.body;

      const [productos] = await connection.execute(
        'SELECT id, stock_actual, stock_minimo, nombre, codigo FROM productos WHERE id = ? FOR UPDATE',
        [id]
      );

      if (productos.length === 0) {
        await connection.rollback();
        return res.status(404).json({ error: 'Producto no encontrado' });
      }

      const producto = productos[0];
      const stockActual = producto.stock_actual;
      const nuevoStock = stockActual + parseInt(cantidad);

      if (nuevoStock < 0) {
        await connection.rollback();
        return res.status(400).json({ error: 'Stock insuficiente' });
      }

      await connection.execute(
        'UPDATE productos SET stock_actual = ? WHERE id = ?',
        [nuevoStock, id]
      );

      await connection.execute(`
        INSERT INTO movimientos_inventario
        (producto_id, tipo_movimiento_id, cantidad, stock_anterior, stock_nuevo, referencia, notas)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [id, tipo_movimiento_id, cantidad, stockActual, nuevoStock, referencia, notas]);

      await connection.commit();

      if (nuevoStock <= producto.stock_minimo) {
        enviarAlertaStock({ 
            ...producto, 
            stock_actual: nuevoStock 
        }).catch(err => console.error('Fallo al enviar alerta de stock:', err));
      }

      res.json({
        message: 'Stock actualizado exitosamente',
        producto_id: id,
        stock_anterior: stockActual,
        stock_nuevo: nuevoStock,
        movimiento: cantidad,
        alerta_enviada: nuevoStock <= producto.stock_minimo
      });

    } catch (error) {
      await connection.rollback();
      console.error('Error actualizando stock:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    } finally {
      connection.release();
    }
  }

  getWhereClause(activo, categoria, proveedor, stockBajo, busqueda) {
    let where = '';

    if (activo !== 'all') {
      where += ' AND p.activo = ' + (activo === 'true' ? '1' : '0');
    }

    if (categoria) {
      where += ' AND c.nombre = ?';
    }

    if (proveedor) {
      where += ' AND pr.nombre = ?';
    }

    if (stockBajo === 'true') {
      where += ' AND p.stock_actual <= p.stock_minimo';
    }

    if (busqueda) {
      where += ' AND (p.nombre LIKE ? OR p.descripcion LIKE ? OR p.codigo LIKE ?)';
    }

    return where;
  }
}

module.exports = ProductosController;