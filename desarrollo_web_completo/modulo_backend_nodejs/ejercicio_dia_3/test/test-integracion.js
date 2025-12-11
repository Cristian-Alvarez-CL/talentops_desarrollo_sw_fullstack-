const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const Logger = require('../utils/Logger');

const logger = new Logger('Test');
const TEST_DIR = './test-integracion';

async function ejecutarComando(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        reject({ error, stderr });
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

async function limpiarDirectorioTest() {
  try {
    await fs.rm(TEST_DIR, { recursive: true, force: true });
  } catch (error) {
    // Ignorar si no existe
  }
}

async function testInicializacion() {
  logger.info('Test 1: Inicialización del sistema');
  
  const { stdout } = await ejecutarComando(`node cli.js inicializar -d ${TEST_DIR}`);
  
  // Verificar que se crearon los directorios
  const directorios = await fs.readdir(TEST_DIR);
  const directoriosEsperados = ['procesados', 'errores', 'backups', 'indices'];
  
  const todosCreados = directoriosEsperados.every(dir => 
    directorios.includes(dir)
  );
  
  if (todosCreados) {
    logger.success('✅ Test de inicialización pasado');
    return true;
  } else {
    logger.error('❌ Test de inicialización fallado');
    return false;
  }
}

async function testProcesamiento() {
  logger.info('Test 2: Procesamiento de archivos');
  
  // Crear archivo de prueba
  await fs.writeFile(
    path.join(TEST_DIR, 'test.txt'),
    'Archivo de prueba para test de procesamiento.'
  );
  
  // Procesar archivo
  await ejecutarComando(`node cli.js procesar ${TEST_DIR}/test.txt`);
  
  // Verificar que se crearon estadísticas
  const archivosProcesados = await fs.readdir(path.join(TEST_DIR, 'procesados'));
  const tieneEstadisticas = archivosProcesados.some(f => f.includes('test.estadisticas.json'));
  
  if (tieneEstadisticas) {
    logger.success('✅ Test de procesamiento pasado');
    return true;
  } else {
    logger.error('❌ Test de procesamiento fallado');
    return false;
  }
}

async function testBusqueda() {
  logger.info('Test 3: Sistema de búsqueda');
  
  // Indexar contenido
  const procesador = new (require('../core/ProcesadorArchivos'))(TEST_DIR);
  await procesador.inicializar();
  
  // Buscar
  const resultados = await procesador.buscarContenido('prueba');
  
  if (resultados.length > 0) {
    logger.success(`✅ Test de búsqueda pasado (${resultados.length} resultados)`);
    return true;
  } else {
    logger.error('❌ Test de búsqueda fallado');
    return false;
  }
}

async function testBackup() {
  logger.info('Test 4: Sistema de backup');
  
  const procesador = new (require('../core/ProcesadorArchivos'))(TEST_DIR);
  await procesador.inicializar();
  
  // Crear backup
  await procesador.backupManager.crearBackup(
    path.join(TEST_DIR, 'test.txt'),
    'test_backup.txt'
  );
  
  // Listar backups
  const backups = await procesador.backupManager.listarBackups();
  
  if (backups.length > 0) {
    logger.success(`✅ Test de backup pasado (${backups.length} backups)`);
    return true;
  } else {
    logger.error('❌ Test de backup fallado');
    return false;
  }
}

async function ejecutarTodosLosTests() {
  logger.info('🧪 INICIANDO SUITE DE TESTS DE INTEGRACIÓN\n');
  
  let todosPasados = true;
  const resultados = [];
  
  try {
    await limpiarDirectorioTest();
    
    // Ejecutar tests
    resultados.push(await testInicializacion());
    resultados.push(await testProcesamiento());
    resultados.push(await testBusqueda());
    resultados.push(await testBackup());
    
    // Resumen
    console.log('\n📋 RESUMEN DE TESTS:');
    console.log('===================');
    
    resultados.forEach((pasado, index) => {
      console.log(`Test ${index + 1}: ${pasado ? '✅ PASADO' : '❌ FALLADO'}`);
    });
    
    todosPasados = resultados.every(r => r === true);
    
    if (todosPasados) {
      logger.success('\n🎉 TODOS LOS TESTS PASADOS EXITOSAMENTE!');
    } else {
      logger.error('\n⚠️ ALGUNOS TESTS FALLARON');
      process.exit(1);
    }
    
  } catch (error) {
    logger.error('❌ Error ejecutando tests', error);
    process.exit(1);
  } finally {
    // Limpiar
    await limpiarDirectorioTest();
  }
}

// Ejecutar tests
if (require.main === module) {
  ejecutarTodosLosTests();
}

module.exports = {
  ejecutarTodosLosTests,
  testInicializacion,
  testProcesamiento,
  testBusqueda,
  testBackup
};