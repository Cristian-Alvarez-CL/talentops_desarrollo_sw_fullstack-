const fs = require('fs');
const path = require('path');

class Migration {
  constructor(db) {
    this.db = db;
  }

  async up() {
    console.log('🚀 Ejecutando migración inicial...');

    // Leer archivo SQL de migración
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, '001_create_tables.sql'),
      'utf8'
    );

    // Ejecutar múltiples statements
    await this.db.execute(migrationSQL, [], { multipleStatements: true });

    console.log('✅ Migración completada');
  }

  async down() {
    console.log('🔄 Revirtiendo migración...');

    // Eliminar tablas en orden inverso
    await this.db.execute('DROP TABLE IF EXISTS detalle_ordenes_compra');
    await this.db.execute('DROP TABLE IF EXISTS ordenes_compra');
    await this.db.execute('DROP TABLE IF EXISTS movimientos_inventario');
    await this.db.execute('DROP TABLE IF EXISTS tipos_movimiento');
    await this.db.execute('DROP TABLE IF EXISTS productos');
    await this.db.execute('DROP TABLE IF EXISTS proveedores');
    await this.db.execute('DROP TABLE IF EXISTS categorias');

    console.log('✅ Migración revertida');
  }
}

module.exports = Migration;
