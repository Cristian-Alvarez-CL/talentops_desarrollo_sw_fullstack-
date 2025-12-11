const fs = require('fs').promises;
const path = require('path');

class ErrorHandler {
  constructor(directorioErrores) {
    this.directorioErrores = directorioErrores;
  }

  async manejarError(error, contexto = {}) {
    const errorData = {
      mensaje: error.message,
      stack: error.stack,
      tipo: error.constructor.name,
      contexto,
      timestamp: new Date().toISOString()
    };

    await this.guardarErrorEnDisco(errorData);
    this.mostrarErrorEnConsola(errorData);

    return errorData;
  }

  async guardarErrorEnDisco(errorData) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const nombreArchivo = `error_${timestamp}.json`;
      const rutaError = path.join(this.directorioErrores, nombreArchivo);

      await fs.writeFile(rutaError, JSON.stringify(errorData, null, 2));
      return rutaError;
    } catch (error) {
      console.error('Error guardando error en disco:', error);
      return null;
    }
  }

  mostrarErrorEnConsola(errorData) {
    console.error('\n=== ERROR DETECTADO ===');
    console.error(`Mensaje: ${errorData.mensaje}`);
    console.error(`Tipo: ${errorData.tipo}`);
    console.error(`Timestamp: ${errorData.timestamp}`);
    
    if (errorData.contexto && Object.keys(errorData.contexto).length > 0) {
      console.error('Contexto:', errorData.contexto);
    }

    if (process.env.DEBUG === 'true' && errorData.stack) {
      console.error('\nStack Trace:');
      console.error(errorData.stack);
    }
    console.error('======================\n');
  }

  async moverArchivoAErrores(rutaArchivo, mensajeError) {
    try {
      const nombreArchivo = path.basename(rutaArchivo);
      const rutaError = path.join(this.directorioErrores, nombreArchivo);

      await fs.rename(rutaArchivo, rutaError);

      const logError = {
        archivoOriginal: nombreArchivo,
        error: mensajeError,
        fecha: new Date().toISOString(),
        rutaError
      };

      const rutaLog = path.join(this.directorioErrores, `${nombreArchivo}.log.json`);
      await fs.writeFile(rutaLog, JSON.stringify(logError, null, 2));

      return rutaError;
    } catch (error) {
      console.error('Error moviendo archivo a errores:', error);
      throw error;
    }
  }
}

module.exports = ErrorHandler;