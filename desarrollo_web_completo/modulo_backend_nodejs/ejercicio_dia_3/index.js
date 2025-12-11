const ProcesadorArchivos = require('./core/ProcesadorArchivos');
const Logger = require('./utils/Logger');

const logger = new Logger('Main');

async function main() {
  try {
    logger.info('Sistema de Procesamiento de Archivos - Iniciando');
    
    // Ejemplo de uso básico
    const procesador = new ProcesadorArchivos('./mis-archivos');
    
    // Inicializar sistema
    await procesador.inicializar();
    
    logger.success('Sistema listo para usar');
    logger.info('Use "npm run cli -- --help" para ver los comandos disponibles');
    
  } catch (error) {
    logger.error('Error inicializando sistema', error);
    process.exit(1);
  }
}

// Exportar para uso como módulo
module.exports = {
  ProcesadorArchivos,
  main
};

// Ejecutar si es el archivo principal
if (require.main === module) {
  main();
}