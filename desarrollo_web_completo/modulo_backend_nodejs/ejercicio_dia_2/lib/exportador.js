const fs = require('fs').promises;
const path = require('path');
const { Parser } = require('json2csv');

class ExportadorTareas {
  constructor() {
    this.formatosSoportados = ['json', 'csv'];
  }

  async exportarJSON(tareas, rutaArchivo) {
    try {
      const datos = {
        tareas: tareas.map(t => t.obtenerInformacion()),
        metadata: {
          exportado: new Date().toISOString(),
          cantidad: tareas.length
        }
      };

      await fs.mkdir(path.dirname(rutaArchivo), { recursive: true });
      await fs.writeFile(rutaArchivo, JSON.stringify(datos, null, 2), 'utf8');
      
      return {
        exito: true,
        ruta: rutaArchivo,
        cantidad: tareas.length
      };
    } catch (error) {
      return {
        exito: false,
        error: error.message
      };
    }
  }

  async exportarCSV(tareas, rutaArchivo) {
    try {
      if (tareas.length === 0) {
        throw new Error('No hay tareas para exportar');
      }

      const datos = tareas.map(t => t.obtenerInformacion());
      const campos = Object.keys(datos[0]);
      
      const parser = new Parser({ campos });
      const csv = parser.parse(datos);

      await fs.mkdir(path.dirname(rutaArchivo), { recursive: true });
      await fs.writeFile(rutaArchivo, csv, 'utf8');
      
      return {
        exito: true,
        ruta: rutaArchivo,
        cantidad: tareas.length
      };
    } catch (error) {
      return {
        exito: false,
        error: error.message
      };
    }
  }

  async exportar(tareas, formato = 'json', nombreBase = 'tareas') {
    if (!this.formatosSoportados.includes(formato.toLowerCase())) {
      throw new Error(`Formato no soportado. Formatos disponibles: ${this.formatosSoportados.join(', ')}`);
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const nombreArchivo = `${nombreBase}_${timestamp}.${formato}`;
    const rutaArchivo = path.join(__dirname, '..', 'exportaciones', nombreArchivo);

    if (formato.toLowerCase() === 'json') {
      return await this.exportarJSON(tareas, rutaArchivo);
    } else if (formato.toLowerCase() === 'csv') {
      return await this.exportarCSV(tareas, rutaArchivo);
    }
  }
}

module.exports = ExportadorTareas;