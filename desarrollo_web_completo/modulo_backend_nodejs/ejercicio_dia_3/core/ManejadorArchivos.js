const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

class ManejadorArchivos {
  static async leerArchivo(rutaArchivo, encoding = 'utf8') {
    try {
      return await fs.readFile(rutaArchivo, encoding);
    } catch (error) {
      throw new Error(`Error leyendo archivo ${rutaArchivo}: ${error.message}`);
    }
  }

  static async escribirArchivo(rutaArchivo, contenido, encoding = 'utf8') {
    try {
      await fs.writeFile(rutaArchivo, contenido, encoding);
      return rutaArchivo;
    } catch (error) {
      throw new Error(`Error escribiendo archivo ${rutaArchivo}: ${error.message}`);
    }
  }

  static async copiarArchivo(rutaOrigen, rutaDestino) {
    try {
      const contenido = await this.leerArchivo(rutaOrigen);
      return await this.escribirArchivo(rutaDestino, contenido);
    } catch (error) {
      throw new Error(`Error copiando archivo: ${error.message}`);
    }
  }

  static async moverArchivo(rutaOrigen, rutaDestino) {
    try {
      await fs.rename(rutaOrigen, rutaDestino);
      return rutaDestino;
    } catch (error) {
      throw new Error(`Error moviendo archivo: ${error.message}`);
    }
  }

  static async eliminarArchivo(rutaArchivo) {
    try {
      await fs.unlink(rutaArchivo);
      return true;
    } catch (error) {
      throw new Error(`Error eliminando archivo: ${error.message}`);
    }
  }

  static async existeArchivo(rutaArchivo) {
    try {
      await fs.access(rutaArchivo);
      return true;
    } catch {
      return false;
    }
  }

  static async obtenerEstadisticas(rutaArchivo) {
    try {
      const stat = await fs.stat(rutaArchivo);
      return {
        tamaño: stat.size,
        creado: stat.birthtime,
        modificado: stat.mtime,
        esDirectorio: stat.isDirectory(),
        esArchivo: stat.isFile()
      };
    } catch (error) {
      throw new Error(`Error obteniendo estadísticas: ${error.message}`);
    }
  }

  static async crearArchivosEjemplo(directorio, archivos) {
    const creados = [];
    for (const archivo of archivos) {
      const ruta = path.join(directorio, archivo.nombre);
      await this.escribirArchivo(ruta, archivo.contenido);
      creados.push(ruta);
    }
    return creados;
  }
}

module.exports = ManejadorArchivos;