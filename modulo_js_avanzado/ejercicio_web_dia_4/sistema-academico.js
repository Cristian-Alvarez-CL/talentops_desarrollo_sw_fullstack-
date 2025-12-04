// ==========================================
//   SISTEMA UNIVERSITARIO AVANZADO
// ==========================================

const CONFIG = {
  MAX_CREDITOS: 50,
  GPA_SCALE: [
    { min: 8.5, points: 4.0, label: 'A' },
    { min: 7.0, points: 3.0, label: 'B' },
    { min: 6.0, points: 2.0, label: 'C' },
    { min: 5.0, points: 1.0, label: 'D' },
    { min: 0.0, points: 0.0, label: 'F' }
  ]
};

const SistemaAvanzado = {
  
  // ------------------------------------------------------------------
  // 1. SISTEMA DE MATRÍCULA (INMUTABLE)
  // ------------------------------------------------------------------
  /**
   * Intenta matricular una asignatura a un estudiante.
   * Retorna un objeto con el nuevo estado de estudiantes y mensajes de resultado.
   */
  matricularEstudiante(listaEstudiantes, idEstudiante, nuevaAsignatura) {
    const estudiante = listaEstudiantes.find(e => e.id === idEstudiante);

    if (!estudiante) return { success: false, error: 'Estudiante no encontrado', data: listaEstudiantes };
    if (!estudiante.activo) return { success: false, error: 'El estudiante no está activo', data: listaEstudiantes };
    
    const asignaturaExiste = estudiante.calificaciones.some(c => c.asignatura === nuevaAsignatura.asignatura);
    if (asignaturaExiste) return { success: false, error: 'Asignatura ya cursada o inscrita', data: listaEstudiantes };

    const creditosActuales = estudiante.calificaciones.reduce((sum, c) => sum + c.creditos, 0);
    if (creditosActuales + nuevaAsignatura.creditos > CONFIG.MAX_CREDITOS) {
      return { success: false, error: 'Excede límite de créditos permitidos', data: listaEstudiantes };
    }

    // Operación Inmutable: Crear copia profunda del estudiante modificado
    const nuevosEstudiantes = listaEstudiantes.map(est => {
      if (est.id === idEstudiante) {
        return {
          ...est,
          calificaciones: [...est.calificaciones, nuevaAsignatura]
        };
      }
      return est;
    });

    return { 
      success: true, 
      msg: `Matrícula exitosa: ${nuevaAsignatura.asignatura}`, 
      data: nuevosEstudiantes 
    };
  },

  // ------------------------------------------------------------------
  // 2. CÁLCULO DE GPA (4.0 SCALE)
  // ------------------------------------------------------------------
  calcularGPA(estudiante) {
    const { calificaciones } = estudiante;
    if (calificaciones.length === 0) return 0;

    const totalPuntosCreditos = calificaciones.reduce((acc, cal) => {
      // Mapear nota 1-10 a GPA points
      const escala = CONFIG.GPA_SCALE.find(s => cal.nota >= s.min) || CONFIG.GPA_SCALE[CONFIG.GPA_SCALE.length - 1];
      return acc + (escala.points * cal.creditos);
    }, 0);

    const totalCreditos = calificaciones.reduce((sum, cal) => sum + cal.creditos, 0);
    return Number((totalPuntosCreditos / totalCreditos).toFixed(2));
  },

  // ------------------------------------------------------------------
  // 3. PREDICCIÓN DE RENDIMIENTO (ALGORITMO)
  // ------------------------------------------------------------------
  /**
   * Usa una regresión lineal simple basada en el historial para predecir
   * la nota de la próxima asignatura.
   */
  predecirRendimiento(estudiante) {
    const notas = estudiante.calificaciones.map((c, i) => ({ x: i + 1, y: c.nota }));
    const n = notas.length;

    if (n < 2) return { prediccion: estudiante.calificaciones[0]?.nota || 0, tendencia: 'Insuficientes datos' };

    const sumX = notas.reduce((acc, p) => acc + p.x, 0);
    const sumY = notas.reduce((acc, p) => acc + p.y, 0);
    const sumXY = notas.reduce((acc, p) => acc + (p.x * p.y), 0);
    const sumXX = notas.reduce((acc, p) => acc + (p.x * p.x), 0);

    const m = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const b = (sumY - m * sumX) / n;

    // Predecir nota para la siguiente materia (x = n + 1)
    const proximaNota = (m * (n + 1)) + b;
    
    // Limitar entre 1.0 y 10.0
    const prediccionFinal = Math.min(Math.max(proximaNota, 1.0), 10.0);

    return {
      prediccion: Number(prediccionFinal.toFixed(2)),
      tendencia: m > 0 ? 'Ascendente 📈' : m < 0 ? 'Descendente 📉' : 'Estable ➡️',
      confianza: n > 4 ? 'Alta' : 'Baja'
    };
  },

  // ------------------------------------------------------------------
  // 4. GENERADOR DE REPORTES PDF SIMULADOS
  // ------------------------------------------------------------------
  generarPDFSimulado(estudiante) {
    const gpa = this.calcularGPA(estudiante);
    const fecha = new Date().toLocaleDateString();
    
    // Template Literal para simular estructura de documento
    return `
    %PDF-1.4
    ----------------------------------------------------------
    INSTITUTO ACADÉMICO DE CIENCIAS  |  REPORTE OFICIAL DE NOTAS
    ----------------------------------------------------------
    FECHA: ${fecha}
    ALUMNO: ${estudiante.nombre.toUpperCase()} (ID: ${estudiante.id})
    CARRERA: ${estudiante.carrera}
    ESTADO: ${estudiante.activo ? 'ACTIVO' : 'SUSPENDIDO'}
    
    RESUMEN ACADÉMICO
    ----------------------------------------------------------
    GPA ACUMULADO: [ ${gpa} / 4.0 ]
    
    DETALLE DE ASIGNATURAS:
    ${estudiante.calificaciones.map(c => 
      `[${c.nota >= 6 ? 'APROBADO' : 'REPROBADO'}] ${c.asignatura.padEnd(20)} | Nota: ${c.nota} | Cr: ${c.creditos}`
    ).join('\n    ')}
    
    ----------------------------------------------------------
    FIRMA DIGITAL: x8s7-d9f0-a2s3-k4l5
    FIN DEL DOCUMENTO
    `;
  }
};

// ==========================================
//   DEMOSTRACIÓN DE NUEVAS FUNCIONALIDADES
// ==========================================

// Estado inicial (importado de tu código anterior)
const baseDeDatosInicial = [
  {
    id: 1,
    nombre: 'Ana García',
    edad: 22,
    carrera: 'Ingeniería Informática',
    calificaciones: [
      { asignatura: 'Matemáticas', nota: 8.5, creditos: 6 },
      { asignatura: 'Programación', nota: 9.0, creditos: 8 },
      { asignatura: 'Bases de Datos', nota: 7.5, creditos: 4 }
    ],
    activo: true
  }
];

console.log('--- 1. PRUEBA DE MATRÍCULA INMUTABLE ---');
const nuevaMateria = { asignatura: 'Inteligencia Artificial', nota: 0, creditos: 5 }; // Nota 0 representa cursando

// Intento de matrícula
const resultadoMatricula = SistemaAvanzado.matricularEstudiante(baseDeDatosInicial, 1, nuevaMateria);

if (resultadoMatricula.success) {
  console.log('✅', resultadoMatricula.msg);
  
  // Verificación de inmutabilidad
  console.log('¿El array original cambió?:', baseDeDatosInicial[0].calificaciones.length === 3 ? 'No (Correcto)' : 'Sí (Error)');
  console.log('¿El nuevo array tiene la materia?:', resultadoMatricula.data[0].calificaciones.length === 4 ? 'Sí (Correcto)' : 'No (Error)');
  
  // Usamos el nuevo estado para las siguientes pruebas
  const estudianteActualizado = resultadoMatricula.data[0];

  console.log('\n--- 2. CÁLCULO DE GPA UNIVERSITARIO ---');
  const gpa = SistemaAvanzado.calcularGPA(estudianteActualizado);
  console.log(`Estudiante: ${estudianteActualizado.nombre}`);
  console.log(`GPA: ${gpa} / 4.0`);

  console.log('\n--- 3. PREDICCIÓN DE RENDIMIENTO ---');
  // Usamos el estudiante original (con notas) para predecir, ignorando la materia recién inscrita con nota 0
  const prediccion = SistemaAvanzado.predecirRendimiento(baseDeDatosInicial[0]);
  console.log(`Basado en su historial, su próxima nota probable es: ${prediccion.prediccion}`);
  console.log(`Tendencia actual: ${prediccion.tendencia}`);

  console.log('\n--- 4. GENERACIÓN DE REPORTE PDF ---');
  const pdfContent = SistemaAvanzado.generarPDFSimulado(baseDeDatosInicial[0]);
  console.log(pdfContent);

} else {
  console.error('❌ Error:', resultadoMatricula.error);
}