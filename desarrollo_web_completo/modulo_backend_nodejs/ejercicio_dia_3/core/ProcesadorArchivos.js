const path = require('path');
const GestorDirectorios = require('./GestorDirectorios');
const BackupManager = require('../modules/BackupManager');
const SearchIndex = require('../modules/SearchIndex');
const FileProcessor = require('../modules/FileProcessor');
const ErrorHandler = require('../utils/ErrorHandler');
const Logger = require('../utils/Logger');

class ProcesadorArchivos {
  constructor(directorioBase = './archivos') {
    this.directorioBase = directorioBase;
    this.logger = new Logger('ProcesadorArchivos');
    
    // Inicializar componentes
    this.gestorDirectorios = new GestorDirectorios(directorioBase);
    this.errorHandler = new ErrorHandler(path.join(directorioBase, 'errores'));
    this.backupManager = new BackupManager(
      path.join(directorioBase, 'backups'),
      new Logger('BackupManager')
    );
    this.searchIndex = new SearchIndex(
      path.join(directorioBase, 'indices'),
      new Logger('SearchIndex')
    );
    this.fileProcessor = new FileProcessor(
      path.join(directorioBase, 'procesados'),
      new Logger('FileProcessor')
    );
  }

  async inicializar() {
    try {
      this.logger.info('Inicializando sistema de procesamiento de archivos...');
      
      await this.gestorDirectorios.inicializarEstructura();
      await this.searchIndex.cargarIndice();
      
      this.logger.success('Sistema inicializado correctamente');
      return true;
    } catch (error) {
      await this.errorHandler.manejarError(error, { operacion: 'inicializacion' });
      throw error;
    }
  }

  async procesarArchivo(rutaArchivo, opciones = {}) {
    try {
      this.logger.info(`Procesando archivo: ${rutaArchivo}`);
      
      // Crear backup automático si está habilitado
      if (opciones.backupAutomatico !== false) {
        await this.backupManager.crearBackup(rutaArchivo);
      }
      
      // Procesar según tipo de archivo
      const extension = path.extname(rutaArchivo).toLowerCase();
      let resultado;
      
      switch (extension) {
        case '.json':
          resultado = await this.fileProcessor.procesarArchivoJSON(rutaArchivo);
          break;
        case '.txt':
        case '.md':
        default:
          resultado = await this.fileProcessor.procesarArchivoTexto(rutaArchivo);
      }
      
      // Indexar contenido si está habilitado
      if (opciones.indexar !== false) {
        await this.searchIndex.indexarArchivo(rutaArchivo, {
          procesado: true,
          estadisticas: resultado
        });
      }
      
      this.logger.success(`Archivo procesado exitosamente: ${rutaArchivo}`);
      return resultado;
    } catch (error) {
      await this.errorHandler.manejarError(error, {
        operacion: 'procesarArchivo',
        archivo: rutaArchivo
      });
      
      // Mover a errores si falla
      await this.errorHandler.moverArchivoAErrores(rutaArchivo, error.message);
      throw error;
    }
  }

  async procesarDirectorio(rutaDirectorio, opciones = {}) {
    try {
      this.logger.info(`Procesando directorio: ${rutaDirectorio}`);
      
      // Crear backup del directorio si está habilitado
      if (opciones.backupAutomatico !== false) {
        await this.backupManager.crearBackupDirectorio(rutaDirectorio);
      }
      
      const archivos = await this.gestorDirectorios.listarArchivos(rutaDirectorio, [
        '.txt', '.md', '.json'
      ]);
      
      this.logger.info(`Encontrados ${archivos.length} archivos para procesar`);
      
      const resultados = [];
      for (const archivo of archivos) {
        const rutaCompleta = path.join(rutaDirectorio, archivo);
        
        try {
          const resultado = await this.procesarArchivo(rutaCompleta, opciones);
          resultados.push(resultado);
        } catch (error) {
          this.logger.error(`Error procesando ${archivo}`, error);
          // Continuar con el siguiente archivo
        }
      }
      
      // Generar reporte consolidado
      if (resultados.length > 0 && opciones.generarReporte !== false) {
        await this.fileProcessor.generarReporteConsolidado(resultados);
      }
      
      this.logger.success(`Directorio procesado: ${resultados.length}/${archivos.length} archivos exitosos`);
      return resultados;
    } catch (error) {
      await this.errorHandler.manejarError(error, {
        operacion: 'procesarDirectorio',
        directorio: rutaDirectorio
      });
      throw error;
    }
  }

  async buscarContenido(termino, opciones = {}) {
    try {
      this.logger.info(`Buscando: "${termino}"`);
      
      let resultados;
      if (opciones.fraseCompleta) {
        resultados = this.searchIndex.buscarFrase(termino, opciones);
      } else {
        resultados = this.searchIndex.buscar(termino, opciones);
      }
      
      this.logger.info(`Encontrados ${resultados.length} resultados`);
      return resultados;
    } catch (error) {
      await this.errorHandler.manejarError(error, {
        operacion: 'buscarContenido',
        termino
      });
      throw error;
    }
  }

  async obtenerEstadisticasSistema() {
    try {
      const estadisticas = {
        fecha: new Date().toISOString(),
        directorios: await this.gestorDirectorios.obtenerEstadisticasDirectorio(this.directorioBase),
        indices: this.searchIndex.obtenerEstadisticas(),
        backups: await this.backupManager.listarBackups()
      };
      
      return estadisticas;
    } catch (error) {
      await this.errorHandler.manejarError(error, {
        operacion: 'obtenerEstadisticasSistema'
      });
      throw error;
    }
  }

  async convertirArchivo(rutaEntrada, rutaSalida, operacion = 'mayusculas') {
    try {
      this.logger.info(`Convirtiendo archivo: ${operacion}`);
      
      let resultado;
      switch (operacion) {
        case 'mayusculas':
          resultado = await this.fileProcessor.convertirAMayusculas(rutaEntrada, rutaSalida);
          break;
        case 'minusculas':
          resultado = await this.fileProcessor.convertirAMinusculas(rutaEntrada, rutaSalida);
          break;
        default:
          throw new Error(`Operación no soportada: ${operacion}`);
      }
      
      // Crear backup del archivo convertido
      await this.backupManager.crearBackup(rutaSalida, `converted_${path.basename(rutaSalida)}`);
      
      return resultado;
    } catch (error) {
      await this.errorHandler.manejarError(error, {
        operacion: 'convertirArchivo',
        entrada: rutaEntrada,
        salida: rutaSalida
      });
      throw error;
    }
  }

  async limpiarSistema(diasRetencion = 30) {
    try {
      this.logger.info('Limpiando sistema...');
      
      const backupsEliminados = await this.backupManager.limpiarBackupsAntiguos(diasRetencion);
      
      this.logger.success(`Limpieza completada: ${backupsEliminados} backups antiguos eliminados`);
      return { backupsEliminados };
    } catch (error) {
      await this.errorHandler.manejarError(error, { operacion: 'limpiarSistema' });
      throw error;
    }
  }
}

module.exports = ProcesadorArchivos;