const fs = require('fs').promises;
const path = require('path');
const ManejadorArchivos = require('../core/ManejadorArchivos');
const StreamUtils = require('../utils/StreamUtils');
const Logger = require('../utils/Logger');

class BackupManager {
  constructor(directorioBackups, logger = null) {
    this.directorioBackups = directorioBackups;
    this.logger = logger || new Logger('BackupManager');
  }

  async crearBackup(rutaArchivo, nombrePersonalizado = null) {
    try {
      const nombreArchivo = path.basename(rutaArchivo);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const extension = path.extname(nombreArchivo);
      const nombreBase = path.basename(nombreArchivo, extension);
      
      const nombreBackup = nombrePersonalizado || 
        `${nombreBase}_backup_${timestamp}${extension}`;
      
      const rutaBackup = path.join(this.directorioBackups, nombreBackup);

      // Usar streams para copia eficiente
      await StreamUtils.copiarConStreams(rutaArchivo, rutaBackup);

      // Crear metadata
      const metadata = await this.generarMetadata(rutaArchivo, rutaBackup);
      await this.guardarMetadata(metadata, nombreBackup);

      this.logger.success(`Backup creado: ${nombreBackup}`);
      return metadata;
    } catch (error) {
      this.logger.error(`Error creando backup de ${rutaArchivo}`, error);
      throw error;
    }
  }

  async crearBackupDirectorio(rutaDirectorio) {
    try {
      const archivos = await fs.readdir(rutaDirectorio);
      const backups = [];
      
      this.logger.info(`Creando backup de directorio: ${rutaDirectorio}`);

      for (const archivo of archivos) {
        const rutaCompleta = path.join(rutaDirectorio, archivo);
        const stats = await ManejadorArchivos.obtenerEstadisticas(rutaCompleta);

        if (stats.esArchivo) {
          try {
            const backup = await this.crearBackup(rutaCompleta);
            backups.push(backup);
          } catch (error) {
            this.logger.error(`Error en backup de ${archivo}`, error);
          }
        }
      }

      const reporte = await this.generarReporteBackup(rutaDirectorio, backups);
      this.logger.success(`Backup de directorio completado: ${backups.length} archivos`);
      
      return reporte;
    } catch (error) {
      this.logger.error('Error en backup de directorio', error);
      throw error;
    }
  }

  async listarBackups() {
    try {
      const archivos = await fs.readdir(this.directorioBackups);
      const metadatos = archivos.filter(f => f.endsWith('.meta.json'));
      
      const backups = [];
      for (const meta of metadatos) {
        const rutaMeta = path.join(this.directorioBackups, meta);
        const contenido = await ManejadorArchivos.leerArchivo(rutaMeta);
        backups.push(JSON.parse(contenido));
      }

      return backups.sort((a, b) => 
        new Date(b.fechaBackup) - new Date(a.fechaBackup)
      );
    } catch (error) {
      this.logger.error('Error listando backups', error);
      return [];
    }
  }

  async restaurarBackup(nombreBackup, rutaDestino = null) {
    try {
      const backups = await this.listarBackups();
      const backup = backups.find(b => 
        path.basename(b.rutaBackup) === nombreBackup || 
        path.basename(b.rutaBackup).includes(nombreBackup)
      );

      if (!backup) {
        throw new Error(`Backup no encontrado: ${nombreBackup}`);
      }

      const rutaDestinoFinal = rutaDestino || backup.rutaOriginal;
      
      // Verificar si ya existe
      if (await ManejadorArchivos.existeArchivo(rutaDestinoFinal)) {
        this.logger.warn(`El archivo ya existe en ${rutaDestinoFinal}, se sobrescribirá`);
      }

      await StreamUtils.copiarConStreams(backup.rutaBackup, rutaDestinoFinal);
      
      this.logger.success(`Backup restaurado: ${nombreBackup} → ${rutaDestinoFinal}`);
      return rutaDestinoFinal;
    } catch (error) {
      this.logger.error(`Error restaurando backup ${nombreBackup}`, error);
      throw error;
    }
  }

  async limpiarBackupsAntiguos(diasRetencion = 30) {
    try {
      const backups = await this.listarBackups();
      const fechaLimite = new Date();
      fechaLimite.setDate(fechaLimite.getDate() - diasRetencion);

      const backupsEliminar = backups.filter(b => 
        new Date(b.fechaBackup) < fechaLimite
      );

      let eliminados = 0;
      for (const backup of backupsEliminar) {
        try {
          await ManejadorArchivos.eliminarArchivo(backup.rutaBackup);
          
          const rutaMeta = `${backup.rutaBackup}.meta.json`;
          await ManejadorArchivos.eliminarArchivo(rutaMeta);
          
          eliminados++;
        } catch (error) {
          this.logger.error(`Error eliminando backup antiguo`, error);
        }
      }

      this.logger.info(`Eliminados ${eliminados} backups antiguos`);
      return eliminados;
    } catch (error) {
      this.logger.error('Error limpiando backups antiguos', error);
      throw error;
    }
  }

  async generarMetadata(rutaArchivo, rutaBackup) {
    const stats = await ManejadorArchivos.obtenerEstadisticas(rutaArchivo);
    const hash = await this.calcularHashSimple(rutaArchivo);

    return {
      archivoOriginal: path.basename(rutaArchivo),
      rutaOriginal: rutaArchivo,
      fechaBackup: new Date().toISOString(),
      tamaño: stats.tamaño,
      hash,
      rutaBackup,
      version: '1.0'
    };
  }

  async guardarMetadata(metadata, nombreBackup) {
    const rutaMetadata = path.join(
      this.directorioBackups, 
      `${nombreBackup}.meta.json`
    );
    await ManejadorArchivos.escribirArchivo(
      rutaMetadata, 
      JSON.stringify(metadata, null, 2)
    );
  }

  async generarReporteBackup(rutaDirectorio, backups) {
    return {
      fecha: new Date().toISOString(),
      directorioOrigen: rutaDirectorio,
      totalArchivos: backups.length,
      tamañoTotal: backups.reduce((sum, b) => sum + b.tamaño, 0),
      backups: backups.map(b => ({
        archivo: b.archivoOriginal,
        tamaño: b.tamaño,
        fecha: b.fechaBackup
      }))
    };
  }

  async calcularHashSimple(rutaArchivo) {
    // Implementación simple de hash para demostración
    const contenido = await ManejadorArchivos.leerArchivo(rutaArchivo);
    let hash = 0;
    for (let i = 0; i < contenido.length; i++) {
      hash = ((hash << 5) - hash) + contenido.charCodeAt(i);
      hash |= 0; // Convertir a entero de 32 bits
    }
    return hash.toString(16);
  }
}

module.exports = BackupManager;