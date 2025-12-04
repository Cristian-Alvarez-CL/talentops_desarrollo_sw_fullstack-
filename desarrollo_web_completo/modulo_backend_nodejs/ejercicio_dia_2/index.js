const GestorTareas = require('./services/gestor-tareas');

async function demostrarSistemaModularExtendido() {
  console.log(' DEMOSTRACIÓN: SISTEMA MODULAR EXTENDIDO DE GESTIÓN DE TAREAS\n');

  // Inicializar el gestor
  const gestor = new GestorTareas();
  await gestor.inicializar();

  console.log(' ESTADO INICIAL:');
  console.log(gestor.obtenerEstadisticas());

  // Crear tareas con validación
  console.log('\n CREANDO TAREAS CON VALIDACIÓN:');
  
  try {
    gestor.crearTarea('Aprender Node.js', 'Completar tutoriales de fundamentos', 'alta');
    gestor.crearTarea('Practicar módulos', 'Crear sistema modular', 'media');
    gestor.crearTarea('Hacer ejercicio', '30 minutos de cardio', 'baja');
    gestor.crearTarea('Revisar código', 'Code review del proyecto', 'urgente');
    
  } catch (error) {
    console.log(` Error de validación: ${error.message}`);
  }

  await gestor.guardar();

  console.log('\n ESTADO DESPUÉS DE CREAR:');
  console.log(gestor.obtenerEstadisticas());

  // Completar tareas
  console.log('\n COMPLETANDO TAREAS:');
  const tareas = gestor.obtenerTodasTareas({ completada: false });
  if (tareas.length > 0) {
    await gestor.completarTarea(tareas[0].id);
    await gestor.completarTarea(tareas[1].id);
  }

  // Exportar tareas
  console.log('\n EXPORTANDO TAREAS:');
  try {
    const resultadoJSON = await gestor.exportarTareas('json');
    console.log(` Exportado JSON: ${resultadoJSON.cantidad} tareas en ${resultadoJSON.ruta}`);
    
    const resultadoCSV = await gestor.exportarTareas('csv', { completada: false });
    console.log(` Exportado CSV: ${resultadoCSV.cantidad} tareas pendientes en ${resultadoCSV.ruta}`);
  } catch (error) {
    console.log(` Error en exportación: ${error.message}`);
  }

  // Obtener reporte
  console.log('\n GENERANDO REPORTE:');
  const reporte = await gestor.obtenerReporte();
  console.log(reporte.resumen);
  console.log('Tareas recientes:');
  reporte.tareasRecientes.forEach(t => {
    console.log(`  - ${t.titulo} (${t.prioridad}) - ${t.completada ? '✅' : '⏳'}`);
  });

  // Buscar tareas
  console.log('\n BUSCANDO TAREAS:');
  const tareasNode = gestor.obtenerTodasTareas({ buscar: 'node' });
  console.log(`Tareas encontradas con "node": ${tareasNode.length}`);
  tareasNode.forEach(t => console.log(`  - ${t.titulo}`));

  console.log('\n ESTADÍSTICAS FINALES:');
  const estadisticas = gestor.obtenerEstadisticas();
  console.log(`Total: ${estadisticas.total}`);
  console.log(`Completadas: ${estadisticas.completadas} (${estadisticas.porcentajeCompletadas}%)`);
  console.log(`Pendientes: ${estadisticas.pendientes}`);
  console.log('Por prioridad:', estadisticas.porPrioridad);

  console.log('\n Sistema modular extendido completado exitosamente!');
  console.log('Los logs están disponibles en la carpeta logs/');
  console.log('Las exportaciones están disponibles en la carpeta exportaciones/');
}

demostrarSistemaModularExtendido().catch(error => {
  console.error('Error en la demostración:', error.message);
  process.exit(1);
});