const fs = require('fs').promises;
const path = require('path');

class Logger {
  constructor(nombreArchivo = 'app.log') {
    this.archivoLog = path.join(__dirname, '..', 'logs', nombreArchivo);
    this.niveles = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
    this.nivelActual = process.env.LOG_LEVEL || 'INFO';
  }

  async inicializar() {
    try {
      await fs.mkdir(path.dirname(this.archivoLog), { recursive: true });
      const mensaje = `\n=== LOG INICIADO: ${new Date().toISOString()} ===\n`;
      await fs.appendFile(this.archivoLog, mensaje, 'utf8');
    } catch (error) {
      console.error('Error al inicializar logger:', error.message);
    }
  }

  puedeLoggear(nivel) {
    return this.niveles.indexOf(nivel) >= this.niveles.indexOf(this.nivelActual);
  }

  async log(nivel, mensaje, datos = {}) {
    if (!this.puedeLoggear(nivel)) return;

    const timestamp = new Date().toISOString();
    const entrada = {
      timestamp,
      nivel,
      mensaje,
      datos
    };

    const linea = `${timestamp} [${nivel}] ${mensaje} ${Object.keys(datos).length > 0 ? JSON.stringify(datos) : ''}\n`;

    console.log(linea.trim());

    try {
      await fs.appendFile(this.archivoLog, linea, 'utf8');
    } catch (error) {
      console.error('Error al escribir en log:', error.message);
    }
  }

  async info(mensaje, datos = {}) {
    await this.log('INFO', mensaje, datos);
  }

  async warn(mensaje, datos = {}) {
    await this.log('WARN', mensaje, datos);
  }

  async error(mensaje, datos = {}) {
    await this.log('ERROR', mensaje, datos);
  }

  async debug(mensaje, datos = {}) {
    await this.log('DEBUG', mensaje, datos);
  }
}

module.exports = Logger;