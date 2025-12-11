class Logger {
  constructor(nombreModulo = 'Sistema') {
    this.nombreModulo = nombreModulo;
  }

  info(mensaje, datos = null) {
    this.log('INFO', mensaje, datos);
  }

  error(mensaje, error = null) {
    this.log('ERROR', mensaje, error);
  }

  warn(mensaje, datos = null) {
    this.log('WARN', mensaje, datos);
  }

  success(mensaje, datos = null) {
    this.log('SUCCESS', mensaje, datos);
  }

  debug(mensaje, datos = null) {
    if (process.env.DEBUG === 'true') {
      this.log('DEBUG', mensaje, datos);
    }
  }

  log(nivel, mensaje, datos = null) {
    const timestamp = new Date().toISOString();
    const prefijo = this.getPrefijoNivel(nivel);
    
    console.log(`${timestamp} ${prefijo} [${this.nombreModulo}] ${mensaje}`);
    
    if (datos) {
      if (datos instanceof Error) {
        console.error(datos.stack);
      } else if (typeof datos === 'object') {
        console.log(JSON.stringify(datos, null, 2));
      } else {
        console.log(datos);
      }
    }
  }

  getPrefijoNivel(nivel) {
    const prefijos = {
      'INFO': 'ℹ️',
      'ERROR': '❌',
      'WARN': '⚠️',
      'SUCCESS': '✅',
      'DEBUG': '🐛'
    };
    return prefijos[nivel] || '📝';
  }

  static crearLogger(nombreModulo) {
    return new Logger(nombreModulo);
  }
}

module.exports = Logger;