const fs = require('fs').promises;
const path = require('path');

class GestorDirectorios {
  constructor(directorioBase) {
    this.directorioBase = directorioBase;
  }

  async inicializarEstructura() {
    try {
      const directorios = [
        this.directorioBase,
        path.join(this.directorioBase, 'procesados'),
        path.join(this.directorioBase, 'errores'),
        path.join(this.directorioBase, 'backups'),
        path.join(this.directorioBase, 'indices')
      ];

      for (const directorio of directorios) {
        await fs.mkdir(directorio, { recursive: true });
      }

      return true;
    } catch (error) {
      throw new Error(`Error inicializando estructura: ${error.message}`);
    }
  }

  async listarArchivos(rutaDirectorio, extensiones = []) {
    try {
      const archivos = await fs.readdir(rutaDirectorio);
      
      if (extensiones.length === 0) {
        return archivos;
      }

      return archivos.filter(archivo => {
        return extensiones.some(ext => archivo.endsWith(ext));
      });
    } catch (error) {
      throw new Error(`Error listando archivos: ${error.message}`);
    }
  }

  async crearDirectorioSiNoExiste(rutaDirectorio) {
    try {
      await fs.access(rutaDirectorio);
      return false; // Ya existe
    } catch {
      await fs.mkdir(rutaDirectorio, { recursive: true });
      return true; // Creado
    }
  }

  async obtenerEstadisticasDirectorio(rutaDirectorio) {
    try {
      const archivos = await this.listarArchivos(rutaDirectorio);
      const stats = await Promise.all(
        archivos.map(async archivo => {
          const rutaCompleta = path.join(rutaDirectorio, archivo);
          const stat = await fs.stat(rutaCompleta);
          return {
            nombre: archivo,
            tamaño: stat.size,
            esDirectorio: stat.isDirectory(),
            modificado: stat.mtime
          };
        })
      );

      return {
        totalArchivos: stats.length,
        totalDirectorios: stats.filter(s => s.esDirectorio).length,
        tamañoTotal: stats.reduce((sum, s) => sum + s.tamaño, 0),
        archivos: stats
      };
    } catch (error) {
      throw new Error(`Error obteniendo estadísticas: ${error.message}`);
    }
  }
}

module.exports = GestorDirectorios;