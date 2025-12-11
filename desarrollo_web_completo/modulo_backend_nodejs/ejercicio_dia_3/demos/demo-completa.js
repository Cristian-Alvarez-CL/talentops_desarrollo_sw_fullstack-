const ProcesadorArchivos = require('../core/ProcesadorArchivos');
const Logger = require('../utils/Logger');

const logger = new Logger('Demo');

async function ejecutarDemo() {
  logger.info('🚀 INICIANDO DEMOSTRACIÓN COMPLETA DEL SISTEMA\n');
  
  const procesador = new ProcesadorArchivos('./demo-completa');
  
  try {
    // 1. Inicializar sistema
    logger.info('1. Inicializando sistema...');
    await procesador.inicializar();
    logger.success('✅ Sistema inicializado\n');
    
    // 2. Crear archivos de ejemplo
    logger.info('2. Creando archivos de ejemplo...');
    const fs = require('fs').promises;
    const archivosEjemplo = [
      {
        nombre: 'documento1.txt',
        contenido: 'Este es el primer documento de prueba para el sistema de procesamiento. Contiene varias palabras y frases importantes.'
      },
      {
        nombre: 'documento2.txt',
        contenido: 'El segundo documento tiene contenido diferente. Aquí hablamos de Node.js, streams, y sistemas de archivos avanzados.'
      },
      {
        nombre: 'notas.md',
        contenido: '# Notas Importantes\n\n## Tareas Pendientes\n1. Aprender principios SOLID\n2. Implementar sistema de backup\n3. Crear interfaz CLI\n\n## Conceptos Clave\n- Programación Orientada a Objetos\n- Streams en Node.js\n- Indexación de contenido'
      },
      {
        nombre: 'config.json',
        contenido: JSON.stringify({
          sistema: 'ProcesadorArchivos',
          version: '2.0.0',
          caracteristicas: ['backup', 'busqueda', 'cli', 'procesamiento'],
          autor: 'Equipo Desarrollo'
        }, null, 2)
      }
    ];
    
    for (const archivo of archivosEjemplo) {
      await fs.writeFile(`./demo-completa/${archivo.nombre}`, archivo.contenido);
      logger.info(`   Creado: ${archivo.nombre}`);
    }
    logger.success('✅ Archivos de ejemplo creados\n');
    
    // 3. Procesar directorio
    logger.info('3. Procesando directorio completo...');
    const resultados = await procesador.procesarDirectorio('./demo-completa', {
      backupAutomatico: true,
      indexar: true,
      generarReporte: true
    });
    logger.success(`✅ Procesados ${resultados.length} archivos\n`);
    
    // 4. Demostrar búsqueda
    logger.info('4. Demostrando sistema de búsqueda...');
    const busquedaNode = await procesador.buscarContenido('Node.js');
    logger.info(`   Resultados para "Node.js": ${busquedaNode.length}`);
    
    const busquedaSistema = await procesador.buscarContenido('sistema procesamiento', {
      fraseCompleta: true
    });
    logger.info(`   Resultados para frase "sistema procesamiento": ${busquedaSistema.length}\n`);
    
    // 5. Demostrar conversión
    logger.info('5. Demostrando conversión de archivos...');
    await procesador.convertirArchivo(
      './demo-completa/documento1.txt',
      './demo-completa/documento1-MAYUSCULAS.txt',
      'mayusculas'
    );
    logger.success('✅ Archivo convertido a mayúsculas\n');
    
    // 6. Obtener estadísticas
    logger.info('6. Obteniendo estadísticas del sistema...');
    const estadisticas = await procesador.obtenerEstadisticasSistema();
    
    console.log('\n📈 RESUMEN DE ESTADÍSTICAS:');
    console.log('===========================');
    console.log(`• Documentos procesados: ${estadisticas.indices.totalDocumentos}`);
    console.log(`• Palabras únicas indexadas: ${estadisticas.indices.totalPalabrasUnicas}`);
    console.log(`• Backups almacenados: ${estadisticas.backups.length}`);
    console.log(`• Tamaño total: ${Math.round(estadisticas.directorios.tamañoTotal / 1024)} KB\n`);
    
    // 7. Demostrar gestión de backups
    logger.info('7. Demostrando gestión de backups...');
    const backups = await procesador.backupManager.listarBackups();
    if (backups.length > 0) {
      const ultimoBackup = backups[0];
      logger.info(`   Último backup: ${ultimoBackup.archivoOriginal}`);
      logger.info(`   Fecha: ${new Date(ultimoBackup.fechaBackup).toLocaleString()}`);
    }
    
    // 8. Limpieza (opcional)
    logger.info('\n8. Limpiando sistema de demostración...');
    await procesador.limpiarSistema(0); // 0 días para demo
    logger.success('✅ Limpieza completada\n');
    
    logger.success('🎯 DEMOSTRACIÓN COMPLETADA EXITOSAMENTE!\n');
    logger.info('💡 Pruebe los comandos CLI:');
    console.log('   npm run cli -- procesar ./demo-completa');
    console.log('   npm run cli -- buscar "Node.js"');
    console.log('   npm run cli -- estadisticas');
    
  } catch (error) {
    logger.error('❌ Error en la demostración', error);
    process.exit(1);
  }
}

// Ejecutar demostración
if (require.main === module) {
  ejecutarDemo();
}

module.exports = { ejecutarDemo };