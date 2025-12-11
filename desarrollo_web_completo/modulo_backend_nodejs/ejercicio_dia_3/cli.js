#!/usr/bin/env node

const { Command } = require('commander');
const path = require('path');
const ProcesadorArchivos = require('./core/ProcesadorArchivos');
const Logger = require('./utils/Logger');

const program = new Command();
const logger = new Logger('CLI');

program
  .name('procesador-archivos')
  .description('Sistema avanzado de procesamiento de archivos')
  .version('2.0.0');

// Comando: inicializar
program
  .command('inicializar')
  .description('Inicializa la estructura del sistema')
  .option('-d, --directorio <ruta>', 'Directorio base', './archivos')
  .action(async (options) => {
    try {
      const procesador = new ProcesadorArchivos(options.directorio);
      await procesador.inicializar();
      logger.success(`Sistema inicializado en: ${path.resolve(options.directorio)}`);
    } catch (error) {
      logger.error('Error inicializando sistema', error);
      process.exit(1);
    }
  });

// Comando: procesar
program
  .command('procesar')
  .description('Procesa un archivo o directorio')
  .argument('<ruta>', 'Ruta del archivo o directorio')
  .option('--sin-backup', 'Deshabilitar backup automático')
  .option('--sin-indexar', 'Deshabilitar indexación automática')
  .option('--sin-reporte', 'Deshabilitar generación de reporte')
  .action(async (ruta, options) => {
    try {
      const procesador = new ProcesadorArchivos();
      await procesador.inicializar();
      
      const opciones = {
        backupAutomatico: !options.sinBackup,
        indexar: !options.sinIndexar,
        generarReporte: !options.sinReporte
      };
      
      const resultado = await procesador.procesarDirectorio(ruta, opciones);
      logger.success(`Procesados ${resultado.length} archivos`);
    } catch (error) {
      logger.error('Error procesando', error);
      process.exit(1);
    }
  });

// Comando: buscar
program
  .command('buscar')
  .description('Busca contenido en archivos indexados')
  .argument('<termino>', 'Término a buscar')
  .option('-f, --frase', 'Buscar como frase completa')
  .option('-l, --limite <numero>', 'Límite de resultados', '10')
  .action(async (termino, options) => {
    try {
      const procesador = new ProcesadorArchivos();
      await procesador.inicializar();
      
      const resultados = await procesador.buscarContenido(termino, {
        fraseCompleta: options.frase,
        limite: parseInt(options.limite)
      });
      
      if (resultados.length === 0) {
        logger.info('No se encontraron resultados');
        return;
      }
      
      logger.info(`Encontrados ${resultados.length} resultados:`);
      resultados.forEach((resultado, index) => {
        const doc = resultado.documento;
        console.log(`\n${index + 1}. ${doc.id}`);
        console.log(`   Ruta: ${doc.ruta}`);
        console.log(`   Relevancia: ${Math.round(resultado.relevancia * 100)}%`);
        
        if (resultado.palabrasEncontradas) {
          console.log(`   Palabras encontradas: ${resultado.palabrasEncontradas.join(', ')}`);
        }
      });
    } catch (error) {
      logger.error('Error buscando', error);
      process.exit(1);
    }
  });

// Comando: backup
program
  .command('backup')
  .description('Gestiona copias de seguridad')
  .option('-c, --crear <ruta>', 'Crear backup')
  .option('-l, --listar', 'Listar backups')
  .option('-r, --restaurar <nombre>', 'Restaurar backup')
  .option('-d, --destino <ruta>', 'Ruta destino para restauración')
  .action(async (options) => {
    try {
      const procesador = new ProcesadorArchivos();
      await procesador.inicializar();
      
      if (options.crear) {
        logger.info(`Creando backup de: ${options.crear}`);
        // Implementación específica
      } else if (options.listar) {
        const backups = await procesador.backupManager.listarBackups();
        
        if (backups.length === 0) {
          logger.info('No hay backups disponibles');
          return;
        }
        
        logger.info(`Backups disponibles (${backups.length}):`);
        backups.forEach((backup, index) => {
          const fecha = new Date(backup.fechaBackup).toLocaleString();
          console.log(`\n${index + 1}. ${backup.archivoOriginal}`);
          console.log(`   Fecha: ${fecha}`);
          console.log(`   Tamaño: ${Math.round(backup.tamaño / 1024)} KB`);
          console.log(`   Ruta: ${backup.rutaBackup}`);
        });
      } else if (options.restaurar) {
        logger.info(`Restaurando backup: ${options.restaurar}`);
        const rutaDestino = await procesador.backupManager.restaurarBackup(
          options.restaurar,
          options.destino
        );
        logger.success(`Backup restaurado en: ${rutaDestino}`);
      } else {
        logger.warn('Especifique una operación (--crear, --listar, --restaurar)');
      }
    } catch (error) {
      logger.error('Error en operación de backup', error);
      process.exit(1);
    }
  });

// Comando: estadisticas
program
  .command('estadisticas')
  .description('Muestra estadísticas del sistema')
  .action(async () => {
    try {
      const procesador = new ProcesadorArchivos();
      await procesador.inicializar();
      
      const stats = await procesador.obtenerEstadisticasSistema();
      
      console.log('\n📊 ESTADÍSTICAS DEL SISTEMA');
      console.log('==========================');
      console.log(`Fecha: ${new Date(stats.fecha).toLocaleString()}`);
      console.log(`\nDirectorios:`);
      console.log(`  - Archivos: ${stats.directorios.totalArchivos}`);
      console.log(`  - Tamaño total: ${Math.round(stats.directorios.tamañoTotal / 1024)} KB`);
      
      console.log(`\nÍndices:`);
      console.log(`  - Documentos: ${stats.indices.totalDocumentos}`);
      console.log(`  - Palabras únicas: ${stats.indices.totalPalabrasUnicas}`);
      console.log(`  - Tokens totales: ${stats.indices.totalTokens}`);
      
      console.log(`\nBackups:`);
      console.log(`  - Total: ${stats.backups.length}`);
      
      if (stats.indices.palabrasMasFrecuentes.length > 0) {
        console.log(`\nPalabras más frecuentes:`);
        stats.indices.palabrasMasFrecuentes.forEach((p, i) => {
          console.log(`  ${i + 1}. ${p.palabra} (${p.frecuenciaTotal} veces)`);
        });
      }
    } catch (error) {
      logger.error('Error obteniendo estadísticas', error);
      process.exit(1);
    }
  });

// Comando: convertir
program
  .command('convertir')
  .description('Convierte archivos')
  .argument('<operacion>', 'Operación (mayusculas|minusculas)')
  .argument('<entrada>', 'Archivo de entrada')
  .argument('<salida>', 'Archivo de salida')
  .action(async (operacion, entrada, salida) => {
    try {
      const procesador = new ProcesadorArchivos();
      await procesador.inicializar();
      
      const resultado = await procesador.convertirArchivo(entrada, salida, operacion);
      logger.success(`Archivo convertido: ${resultado}`);
    } catch (error) {
      logger.error('Error convirtiendo archivo', error);
      process.exit(1);
    }
  });

// Comando: limpiar
program
  .command('limpiar')
  .description('Limpia backups antiguos')
  .option('-d, --dias <dias>', 'Días de retención', '30')
  .action(async (options) => {
    try {
      const procesador = new ProcesadorArchivos();
      await procesador.inicializar();
      
      const resultado = await procesador.limpiarSistema(parseInt(options.dias));
      logger.success(`Limpieza completada: ${resultado.backupsEliminados} backups eliminados`);
    } catch (error) {
      logger.error('Error limpiando sistema', error);
      process.exit(1);
    }
  });

// Manejo de errores global
program.configureOutput({
  writeOut: (str) => process.stdout.write(str),
  writeErr: (str) => process.stderr.write(str)
});

// Ejecutar CLI
if (require.main === module) {
  program.parse(process.argv);
}

module.exports = program;