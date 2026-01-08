class ApiExternoController {
    constructor(db) {
        this.db = db;
    }

    // External System pide sincronizar stock
    async sincronizarStock(req, res) {
        try {
            const { skus } = req.body; // Array de códigos ['ELE001', 'ROP001']
            
            if (!Array.isArray(skus)) return res.status(400).json({ error: 'Formato inválido' });

            // Busca solo los solicitados
            const placeholders = skus.map(() => '?').join(',');
            const sql = `SELECT codigo, stock_actual, precio_venta FROM productos WHERE codigo IN (${placeholders})`;
            
            const [productos] = await this.db.query(sql, skus);
            
            res.json({
                timestamp: new Date(),
                data: productos
            });
        } catch (error) {
            res.status(500).json({ error: 'Error de sincronización' });
        }
    }

    // Webhook: Venta realizada en E-commerce (Shopify/WooCommerce simulación)
    async procesarVentaExterna(req, res) {
        const connection = await this.db.getConnection();
        try {
            await connection.beginTransaction();
            
            const { order_id, items } = req.body; // items: [{ sku: 'X', qty: 1 }]

            const resultados = [];

            for (const item of items) {
                // Buscar ID por SKU
                const [prod] = await connection.execute('SELECT id, stock_actual FROM productos WHERE codigo = ? FOR UPDATE', [item.sku]);
                
                if (prod.length > 0) {
                    const productoId = prod[0].id;
                    const cantidad = item.qty; // Cantidad vendida (positiva en el json, negativa para stock)
                    
                    // Restar Stock
                    await connection.execute('UPDATE productos SET stock_actual = stock_actual - ? WHERE id = ?', [cantidad, productoId]);
                    
                    // Registrar Movimiento (ID 2 = Venta a Cliente)
                    await connection.execute(`
                        INSERT INTO movimientos_inventario 
                        (producto_id, tipo_movimiento_id, cantidad, stock_anterior, stock_nuevo, referencia, notas)
                        VALUES (?, 2, ?, ?, ?, ?, 'Venta E-commerce')
                    `, [productoId, -cantidad, prod[0].stock_actual, prod[0].stock_actual - cantidad, `WEB-${order_id}`]);

                    resultados.push({ sku: item.sku, status: 'procesado' });
                } else {
                    resultados.push({ sku: item.sku, status: 'no_encontrado' });
                }
            }

            await connection.commit();
            res.json({ message: 'Webhook procesado', detalles: resultados });

        } catch (error) {
            await connection.rollback();
            console.error(error);
            res.status(500).json({ error: 'Error procesando webhook' });
        } finally {
            connection.release();
        }
    }
}

module.exports = ApiExternoController;