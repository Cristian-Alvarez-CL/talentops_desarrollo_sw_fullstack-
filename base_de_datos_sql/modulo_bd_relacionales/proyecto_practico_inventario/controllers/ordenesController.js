class OrdenesController {
    constructor(db) {
        this.db = db;
    }

    // Listar órdenes con detalles del proveedor
    async listarOrdenes(req, res) {
        try {
            const sql = `
                SELECT o.*, p.nombre as proveedor_nombre,
                (SELECT COUNT(*) FROM detalle_ordenes_compra d WHERE d.orden_compra_id = o.id) as items_count
                FROM ordenes_compra o
                JOIN proveedores p ON o.proveedor_id = p.id
                ORDER BY o.fecha_creacion DESC
            `;
            const [ordenes] = await this.db.query(sql);
            res.json({ ordenes });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // Crear una nueva orden de compra
    async crearOrden(req, res) {
        const connection = await this.db.getConnection();
        try {
            await connection.beginTransaction();
            const { proveedor_id, fecha_entrega_esperada, items } = req.body;
            
            const numeroOrden = `OC-${Date.now()}`; // Generador simple de ID

            // 1. Cabecera
            const [result] = await connection.execute(`
                INSERT INTO ordenes_compra (numero_orden, proveedor_id, fecha_orden, fecha_entrega_esperada, estado)
                VALUES (?, ?, NOW(), ?, 'pendiente')
            `, [numeroOrden, proveedor_id, fecha_entrega_esperada]);

            const ordenId = result.insertId;
            let totalOrden = 0;

            // 2. Detalles
            for (const item of items) {
                const subtotal = item.cantidad * item.precio_unitario;
                totalOrden += subtotal;
                await connection.execute(`
                    INSERT INTO detalle_ordenes_compra (orden_compra_id, producto_id, cantidad_solicitada, precio_unitario, subtotal)
                    VALUES (?, ?, ?, ?, ?)
                `, [ordenId, item.producto_id, item.cantidad, item.precio_unitario, subtotal]);
            }

            // Actualizar total
            await connection.execute('UPDATE ordenes_compra SET total = ? WHERE id = ?', [totalOrden, ordenId]);

            await connection.commit();
            res.status(201).json({ message: 'Orden creada', numero_orden: numeroOrden, id: ordenId });

        } catch (error) {
            await connection.rollback();
            console.error(error);
            res.status(500).json({ error: 'Error creando orden' });
        } finally {
            connection.release();
        }
    }

    // Recibir Orden (Impacta Inventario)
    async recibirOrden(req, res) {
        const connection = await this.db.getConnection();
        try {
            await connection.beginTransaction();
            const { id } = req.params; // ID de la orden

            // Verificar orden
            const [orden] = await connection.execute('SELECT * FROM ordenes_compra WHERE id = ?', [id]);
            if (orden.length === 0 || orden[0].estado === 'completa') {
                await connection.rollback();
                return res.status(400).json({ error: 'Orden no existe o ya fue procesada' });
            }

            // Obtener detalles
            const [detalles] = await connection.execute('SELECT * FROM detalle_ordenes_compra WHERE orden_compra_id = ?', [id]);

            // Procesar entrada de stock por cada item
            for (const item of detalles) {
                // Actualizar stock producto
                await connection.execute(`
                    UPDATE productos SET stock_actual = stock_actual + ? WHERE id = ?
                `, [item.cantidad_solicitada, item.producto_id]);

                // Registrar movimiento (ID 1 = Compra a proveedor según schema)
                await connection.execute(`
                    INSERT INTO movimientos_inventario 
                    (producto_id, tipo_movimiento_id, cantidad, stock_anterior, stock_nuevo, referencia, notas)
                    SELECT ?, 1, ?, stock_actual - ?, stock_actual, ?, 'Recepción OC'
                    FROM productos WHERE id = ?
                `, [item.producto_id, item.cantidad_solicitada, item.cantidad_solicitada, orden[0].numero_orden, item.producto_id]);

                // Marcar item recibido
                await connection.execute('UPDATE detalle_ordenes_compra SET cantidad_recibida = ? WHERE id = ?', 
                    [item.cantidad_solicitada, item.id]);
            }

            // Actualizar estado orden
            await connection.execute("UPDATE ordenes_compra SET estado = 'completa', fecha_entrega_real = NOW() WHERE id = ?", [id]);

            await connection.commit();
            res.json({ message: 'Orden recibida e inventario actualizado' });

        } catch (error) {
            await connection.rollback();
            console.error(error);
            res.status(500).json({ error: 'Error recibiendo orden' });
        } finally {
            connection.release();
        }
    }
}

module.exports = OrdenesController;