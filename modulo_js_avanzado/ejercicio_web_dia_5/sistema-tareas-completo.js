// Sistema completo de gestión de tareas usando múltiples patrones de diseño

// 1. Singleton para el gestor principal
class GestorTareas {
  constructor() {
    if (GestorTareas.instancia) {
      return GestorTareas.instancia;
    }

    this.tareas = new Map();
    this.siguienteId = 1;
    this.observadores = new Set();
    
    // Historial para undo/redo (Command Pattern)
    this.historial = [];
    this.posicionHistorial = -1;
    
    // Estrategia de filtrado actual (Strategy Pattern)
    this.estrategiaFiltrado = new EstrategiaFiltradoBasico();
    
    GestorTareas.instancia = this;
  }

  // Observer Pattern: notificar cambios
  suscribir(observador) {
    this.observadores.add(observador);
  }

  desuscribir(observador) {
    this.observadores.delete(observador);
  }

  notificar(evento, datos) {
    this.observadores.forEach(observador => {
      try {
        observador.notificar(evento, datos);
      } catch (error) {
        console.error('Error en observador:', error);
      }
    });
  }

  // Factory Pattern: crear tareas de diferentes tipos
  crearTarea(tipo, datos) {
    const fabrica = new FabricaTareas();
    const tarea = fabrica.crearTarea(tipo, {
      id: this.siguienteId++,
      ...datos,
      fechaCreacion: new Date()
    });

    // Command Pattern: registrar operación en el historial
    this.registrarComando(new CrearTareaComando(tarea, this));
    
    this.tareas.set(tarea.id, tarea);
    this.notificar('tarea_creada', tarea);
    return tarea;
  }

  obtenerTarea(id) {
    return this.tareas.get(id);
  }

  actualizarTarea(id, cambios) {
    const tarea = this.tareas.get(id);
    if (tarea) {
      const estadoAnterior = { ...tarea };
      Object.assign(tarea, cambios);
      
      // Command Pattern: registrar operación en el historial
      this.registrarComando(new ActualizarTareaComando(id, estadoAnterior, cambios, this));
      
      this.notificar('tarea_actualizada', tarea);
      return true;
    }
    return false;
  }

  eliminarTarea(id) {
    const tarea = this.tareas.get(id);
    if (tarea) {
      // Command Pattern: registrar operación en el historial
      this.registrarComando(new EliminarTareaComando(tarea, this));
      
      this.tareas.delete(id);
      this.notificar('tarea_eliminada', tarea);
      return true;
    }
    return false;
  }

  obtenerTareas(filtro = {}) {
    // Strategy Pattern: usar estrategia actual para filtrar
    return this.estrategiaFiltrado.filtrar(Array.from(this.tareas.values()), filtro);
  }

  obtenerEstadisticas() {
    const tareas = Array.from(this.tareas.values());
    return {
      total: tareas.length,
      completadas: tareas.filter(t => t.completada).length,
      pendientes: tareas.filter(t => !t.completada).length,
      porTipo: tareas.reduce((acc, t) => {
        acc[t.tipo] = (acc[t.tipo] || 0) + 1;
        return acc;
      }, {}),
      porPrioridad: tareas.reduce((acc, t) => {
        acc[t.prioridad] = (acc[t.prioridad] || 0) + 1;
        return acc;
      }, {})
    };
  }

  // Strategy Pattern: cambiar estrategia de filtrado
  setEstrategiaFiltrado(estrategia) {
    this.estrategiaFiltrado = estrategia;
    this.notificar('estrategia_cambiada', { estrategia: estrategia.constructor.name });
  }

  // Command Pattern: métodos para undo/redo
  registrarComando(comando) {
    // Eliminar comandos después de la posición actual (si hay rehaceres pendientes)
    this.historial = this.historial.slice(0, this.posicionHistorial + 1);
    
    this.historial.push(comando);
    this.posicionHistorial++;
    
    // Limitar historial a 50 operaciones
    if (this.historial.length > 50) {
      this.historial.shift();
      this.posicionHistorial--;
    }
  }

  deshacer() {
    if (this.posicionHistorial >= 0) {
      const comando = this.historial[this.posicionHistorial];
      comando.deshacer();
      this.posicionHistorial--;
      this.notificar('operacion_deshacer', { comando: comando.constructor.name });
      return true;
    }
    return false;
  }

  rehacer() {
    if (this.posicionHistorial < this.historial.length - 1) {
      this.posicionHistorial++;
      const comando = this.historial[this.posicionHistorial];
      comando.ejecutar();
      this.notificar('operacion_rehacer', { comando: comando.constructor.name });
      return true;
    }
    return false;
  }

  obtenerHistorial() {
    return {
      comandos: this.historial.map(c => ({
        tipo: c.constructor.name,
        descripcion: c.obtenerDescripcion()
      })),
      posicionActual: this.posicionHistorial,
      puedeDeshacer: this.posicionHistorial >= 0,
      puedeRehacer: this.posicionHistorial < this.historial.length - 1
    };
  }
}

// 2. Factory Pattern para crear diferentes tipos de tareas
class FabricaTareas {
  crearTarea(tipo, datosBase) {
    switch (tipo.toLowerCase()) {
      case 'basica':
        return new TareaBasica(datosBase);
      case 'con-fecha-limite':
        return new TareaConFechaLimite(datosBase);
      case 'recurrente':
        return new TareaRecurrente(datosBase);
      case 'con-subtareas':
        return new TareaConSubtareas(datosBase);
      default:
        throw new Error(`Tipo de tarea '${tipo}' no soportado`);
    }
  }
}

// 3. Clases para diferentes tipos de tareas (usando herencia)
class TareaBasica {
  constructor({ id, titulo, descripcion = '', prioridad = 'media' }) {
    this.id = id;
    this.titulo = titulo;
    this.descripcion = descripcion;
    this.prioridad = prioridad;
    this.completada = false;
    this.fechaCreacion = new Date();
    this.tipo = 'basica';
    
    // Decorator Pattern: funcionalidades adicionales
    this.decoradores = [];
  }

  completar() {
    this.completada = true;
    
    // Notificar a todos los decoradores
    this.decoradores.forEach(decorador => {
      if (decorador.onCompletar) {
        decorador.onCompletar(this);
      }
    });
    
    return true;
  }

  obtenerInformacion() {
    let info = {
      id: this.id,
      titulo: this.titulo,
      descripcion: this.descripcion,
      prioridad: this.prioridad,
      completada: this.completada,
      tipo: this.tipo,
      fechaCreacion: this.fechaCreacion,
      decoradores: this.decoradores.map(d => d.constructor.name)
    };

    // Aplicar decoradores
    this.decoradores.forEach(decorador => {
      info = decorador.decorarInformacion(info);
    });

    return info;
  }

  // Decorator Pattern: agregar funcionalidad
  agregarDecorador(decorador) {
    this.decoradores.push(decorador);
    decorador.tarea = this;
    return this;
  }

  quitarDecorador(tipoDecorador) {
    this.decoradores = this.decoradores.filter(d => d.constructor.name !== tipoDecorador);
  }
}

class TareaConFechaLimite extends TareaBasica {
  constructor(datos) {
    super(datos);
    this.fechaLimite = datos.fechaLimite;
    this.tipo = 'con-fecha-limite';
  }

  estaVencida() {
    return new Date() > this.fechaLimite && !this.completada;
  }

  diasRestantes() {
    const diferencia = this.fechaLimite - new Date();
    return Math.ceil(diferencia / (1000 * 60 * 60 * 24));
  }

  obtenerInformacion() {
    let info = super.obtenerInformacion();
    info.fechaLimite = this.fechaLimite;
    info.estaVencida = this.estaVencida();
    info.diasRestantes = this.diasRestantes();
    
    return info;
  }
}

class TareaRecurrente extends TareaBasica {
  constructor(datos) {
    super(datos);
    this.intervalo = datos.intervalo || 'diario'; // diario, semanal, mensual
    this.ocurrencias = datos.ocurrencias || 1;
    this.ocurrenciaActual = 1;
    this.tipo = 'recurrente';
  }

  completar() {
    this.ocurrenciaActual++;
    if (this.ocurrenciaActual > this.ocurrencias) {
      this.completada = true;
    }
    
    // Notificar a todos los decoradores
    this.decoradores.forEach(decorador => {
      if (decorador.onCompletar) {
        decorador.onCompletar(this);
      }
    });
    
    return this.ocurrenciaActual <= this.ocurrencias;
  }

  obtenerInformacion() {
    let info = super.obtenerInformacion();
    info.intervalo = this.intervalo;
    info.ocurrencias = this.ocurrencias;
    info.ocurrenciaActual = this.ocurrenciaActual;
    info.progreso = `${this.ocurrenciaActual}/${this.ocurrencias}`;
    
    return info;
  }
}

class TareaConSubtareas extends TareaBasica {
  constructor(datos) {
    super(datos);
    this.subtareas = datos.subtareas || [];
    this.tipo = 'con-subtareas';
  }

  agregarSubtarea(titulo, descripcion = '') {
    const nuevaSubtarea = {
      id: Date.now(),
      titulo,
      descripcion,
      completada: false
    };
    
    this.subtareas.push(nuevaSubtarea);
    return nuevaSubtarea;
  }

  completarSubtarea(idSubtarea) {
    const subtarea = this.subtareas.find(st => st.id === idSubtarea);
    if (subtarea) {
      subtarea.completada = true;

      // Si todas las subtareas están completas, completar la tarea principal
      const todasCompletas = this.subtareas.every(st => st.completada);
      if (todasCompletas) {
        this.completada = true;
        
        // Notificar a todos los decoradores
        this.decoradores.forEach(decorador => {
          if (decorador.onCompletar) {
            decorador.onCompletar(this);
          }
        });
      }

      return true;
    }
    return false;
  }

  obtenerInformacion() {
    const subtareasCompletas = this.subtareas.filter(st => st.completada).length;
    let info = super.obtenerInformacion();
    info.subtareas = this.subtareas;
    info.progresoSubtareas = `${subtareasCompletas}/${this.subtareas.length}`;
    
    return info;
  }
}

// 4. Command Pattern: Comandos para undo/redo
class Comando {
  constructor(gestor) {
    this.gestor = gestor;
  }

  ejecutar() {}
  deshacer() {}
  obtenerDescripcion() {
    return "Comando genérico";
  }
}

class CrearTareaComando extends Comando {
  constructor(tarea, gestor) {
    super(gestor);
    this.tarea = tarea;
  }

  ejecutar() {
    this.gestor.tareas.set(this.tarea.id, this.tarea);
    this.gestor.notificar('tarea_creada', this.tarea);
  }

  deshacer() {
    this.gestor.tareas.delete(this.tarea.id);
    this.gestor.notificar('tarea_eliminada', this.tarea);
  }

  obtenerDescripcion() {
    return `Crear tarea: ${this.tarea.titulo}`;
  }
}

class ActualizarTareaComando extends Comando {
  constructor(id, estadoAnterior, cambios, gestor) {
    super(gestor);
    this.id = id;
    this.estadoAnterior = estadoAnterior;
    this.cambios = cambios;
  }

  ejecutar() {
    const tarea = this.gestor.tareas.get(this.id);
    if (tarea) {
      Object.assign(tarea, this.cambios);
      this.gestor.notificar('tarea_actualizada', tarea);
    }
  }

  deshacer() {
    const tarea = this.gestor.tareas.get(this.id);
    if (tarea) {
      // Restaurar solo las propiedades que fueron cambiadas
      for (const key in this.cambios) {
        if (this.estadoAnterior.hasOwnProperty(key)) {
          tarea[key] = this.estadoAnterior[key];
        }
      }
      this.gestor.notificar('tarea_actualizada', tarea);
    }
  }

  obtenerDescripcion() {
    return `Actualizar tarea ID: ${this.id}`;
  }
}

class EliminarTareaComando extends Comando {
  constructor(tarea, gestor) {
    super(gestor);
    this.tarea = tarea;
  }

  ejecutar() {
    this.gestor.tareas.delete(this.tarea.id);
    this.gestor.notificar('tarea_eliminada', this.tarea);
  }

  deshacer() {
    this.gestor.tareas.set(this.tarea.id, this.tarea);
    this.gestor.notificar('tarea_creada', this.tarea);
  }

  obtenerDescripcion() {
    return `Eliminar tarea: ${this.tarea.titulo}`;
  }
}

// 5. Strategy Pattern: Estrategias de filtrado
class EstrategiaFiltrado {
  filtrar(tareas, filtro) {
    throw new Error("Método 'filtrar' debe ser implementado");
  }
}

class EstrategiaFiltradoBasico extends EstrategiaFiltrado {
  filtrar(tareas, filtro = {}) {
    let resultado = [...tareas];

    if (filtro.completada !== undefined) {
      resultado = resultado.filter(t => t.completada === filtro.completada);
    }

    if (filtro.prioridad) {
      resultado = resultado.filter(t => t.prioridad === filtro.prioridad);
    }

    if (filtro.tipo) {
      resultado = resultado.filter(t => t.tipo === filtro.tipo);
    }

    return resultado;
  }
}

class EstrategiaFiltradoAvanzado extends EstrategiaFiltrado {
  filtrar(tareas, filtro = {}) {
    let resultado = [...tareas];

    // Filtro básico
    if (filtro.completada !== undefined) {
      resultado = resultado.filter(t => t.completada === filtro.completada);
    }

    if (filtro.prioridad) {
      resultado = resultado.filter(t => t.prioridad === filtro.prioridad);
    }

    if (filtro.tipo) {
      resultado = resultado.filter(t => t.tipo === filtro.tipo);
    }

    // Filtros avanzados
    if (filtro.busqueda) {
      const termino = filtro.busqueda.toLowerCase();
      resultado = resultado.filter(t => 
        t.titulo.toLowerCase().includes(termino) || 
        t.descripcion.toLowerCase().includes(termino)
      );
    }

    if (filtro.fechaInicio) {
      resultado = resultado.filter(t => t.fechaCreacion >= filtro.fechaInicio);
    }

    if (filtro.fechaFin) {
      resultado = resultado.filter(t => t.fechaCreacion <= filtro.fechaFin);
    }

    // Ordenamiento
    if (filtro.ordenarPor) {
      resultado.sort((a, b) => {
        if (filtro.ordenarPor === 'prioridad') {
          const prioridades = { 'alta': 3, 'media': 2, 'baja': 1 };
          return (prioridades[b.prioridad] || 0) - (prioridades[a.prioridad] || 0);
        }
        if (filtro.ordenarPor === 'fecha') {
          return b.fechaCreacion - a.fechaCreacion;
        }
        if (filtro.ordenarPor === 'titulo') {
          return a.titulo.localeCompare(b.titulo);
        }
        return 0;
      });
    }

    return resultado;
  }
}

class EstrategiaFiltradoInteligente extends EstrategiaFiltrado {
  filtrar(tareas, filtro = {}) {
    let resultado = [...tareas];

    // Filtro básico
    if (filtro.completada !== undefined) {
      resultado = resultado.filter(t => t.completada === filtro.completada);
    }

    // Filtros inteligentes
    if (filtro.vencimientoProximo) {
      resultado = resultado.filter(t => {
        if (t.tipo === 'con-fecha-limite') {
          return t.diasRestantes() <= 3 && !t.completada;
        }
        return false;
      });
    }

    if (filtro.progreso) {
      resultado = resultado.filter(t => {
        if (t.tipo === 'con-subtareas') {
          const completadas = t.subtareas.filter(st => st.completada).length;
          const porcentaje = (completadas / t.subtareas.length) * 100;
          return porcentaje >= filtro.progreso;
        }
        return false;
      });
    }

    // Priorización automática
    resultado.sort((a, b) => {
      let puntajeA = this.calcularPuntaje(a);
      let puntajeB = this.calcularPuntaje(b);
      
      return puntajeB - puntajeA;
    });

    return resultado;
  }

  calcularPuntaje(tarea) {
    let puntaje = 0;
    
    // Prioridad
    const prioridades = { 'alta': 30, 'media': 20, 'baja': 10 };
    puntaje += prioridades[tarea.prioridad] || 0;
    
    // Tareas con fecha límite cercana
    if (tarea.tipo === 'con-fecha-limite' && !tarea.completada) {
      const diasRestantes = tarea.diasRestantes();
      if (diasRestantes <= 1) puntaje += 40;
      else if (diasRestantes <= 3) puntaje += 30;
      else if (diasRestantes <= 7) puntaje += 20;
    }
    
    // Tareas recientes
    const diasDesdeCreacion = (new Date() - tarea.fechaCreacion) / (1000 * 60 * 60 * 24);
    if (diasDesdeCreacion <= 1) puntaje += 15;
    
    return puntaje;
  }
}

// 6. Decorator Pattern: Funcionalidades adicionales para tareas
class TareaDecorador {
  constructor() {
    this.tarea = null;
  }

  decorarInformacion(informacion) {
    return informacion;
  }
}

class NotificacionEmailDecorador extends TareaDecorador {
  constructor(email, config = {}) {
    super();
    this.email = email;
    this.notificarCompletada = config.notificarCompletada || true;
    this.notificarVencimiento = config.notificarVencimiento || true;
  }

  onCompletar(tarea) {
    if (this.notificarCompletada) {
      console.log(`📧 Enviando email a ${this.email}: Tarea "${tarea.titulo}" completada!`);
      // Aquí iría la lógica real de envío de email
    }
  }

  decorarInformacion(informacion) {
    return {
      ...informacion,
      notificacionesEmail: true,
      emailDestino: this.email
    };
  }
}

class IntegracionCalendarioDecorador extends TareaDecorador {
  constructor(calendarioId = 'default') {
    super();
    this.calendarioId = calendarioId;
    this.eventoId = null;
  }

  onCompletar(tarea) {
    if (this.eventoId) {
      console.log(`📅 Actualizando evento ${this.eventoId} en calendario ${this.calendarioId}: Completado`);
      // Aquí iría la lógica real de actualización del calendario
    }
  }

  decorarInformacion(informacion) {
    if (informacion.fechaLimite && !this.eventoId) {
      this.eventoId = `evento-${informacion.id}-${Date.now()}`;
      console.log(`📅 Creando evento ${this.eventoId} en calendario ${this.calendarioId} para ${informacion.fechaLimite}`);
      // Aquí iría la lógica real de creación del evento
    }

    return {
      ...informacion,
      integracionCalendario: true,
      calendarioId: this.calendarioId,
      eventoId: this.eventoId
    };
  }
}

class RecordatorioDecorador extends TareaDecorador {
  constructor(intervaloRecordatorio = 24) {
    super();
    this.intervaloRecordatorio = intervaloRecordatorio; // en horas
    this.ultimoRecordatorio = null;
  }

  onCompletar(tarea) {
    console.log(`🔔 Deteniendo recordatorios para tarea: ${tarea.titulo}`);
    this.detenerRecordatorios();
  }

  iniciarRecordatorios() {
    console.log(`🔔 Configurando recordatorios cada ${this.intervaloRecordatorio} horas para: ${this.tarea.titulo}`);
    
    // Simular recordatorios periódicos
    this.intervaloRecordatorioId = setInterval(() => {
      if (this.tarea && !this.tarea.completada) {
        console.log(`🔔 Recordatorio: "${this.tarea.titulo}" está pendiente!`);
        this.ultimoRecordatorio = new Date();
      }
    }, this.intervaloRecordatorio * 60 * 60 * 1000);
  }

  detenerRecordatorios() {
    if (this.intervaloRecordatorioId) {
      clearInterval(this.intervaloRecordatorioId);
      this.intervaloRecordatorioId = null;
    }
  }

  decorarInformacion(informacion) {
    if (!this.intervaloRecordatorioId && !informacion.completada) {
      this.iniciarRecordatorios();
    }

    return {
      ...informacion,
      recordatoriosActivos: !!this.intervaloRecordatorioId,
      intervaloRecordatorio: this.intervaloRecordatorio,
      ultimoRecordatorio: this.ultimoRecordatorio
    };
  }
}

// 7. Observadores (Observer Pattern)
class ObservadorConsola {
  notificar(evento, datos) {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] ${evento}:`, datos.titulo || datos.id || datos);
  }
}

class ObservadorEstadisticas {
  constructor() {
    this.eventos = [];
  }

  notificar(evento, datos) {
    this.eventos.push({ evento, datos, timestamp: new Date() });
  }

  obtenerEstadisticas() {
    return {
      totalEventos: this.eventos.length,
      eventosPorTipo: this.eventos.reduce((acc, e) => {
        acc[e.evento] = (acc[e.evento] || 0) + 1;
        return acc;
      }, {})
    };
  }
}

// 8. Demostración completa del sistema extendido
console.log('🚀 DEMOSTRACIÓN: SISTEMA COMPLETO DE GESTIÓN DE TAREAS EXTENDIDO\n');

// Crear instancia singleton
const gestor = new GestorTareas();

// Configurar observadores
const observadorConsola = new ObservadorConsola();
const observadorEstadisticas = new ObservadorEstadisticas();

gestor.suscribir(observadorConsola);
gestor.suscribir(observadorEstadisticas);

// Crear diferentes tipos de tareas
console.log('📝 Creando tareas de diferentes tipos...');

const tareaBasica = gestor.crearTarea('basica', {
  titulo: 'Aprender JavaScript',
  descripcion: 'Completar el curso de fundamentos',
  prioridad: 'alta'
});

const tareaConFecha = gestor.crearTarea('con-fecha-limite', {
  titulo: 'Entregar proyecto',
  descripcion: 'Proyecto final del módulo',
  prioridad: 'alta',
  fechaLimite: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 días
});

const tareaRecurrente = gestor.crearTarea('recurrente', {
  titulo: 'Hacer ejercicio',
  descripcion: '30 minutos de ejercicio diario',
  prioridad: 'media',
  intervalo: 'diario',
  ocurrencias: 7
});

const tareaConSubtareas = gestor.crearTarea('con-subtareas', {
  titulo: 'Preparar presentación',
  descripcion: 'Presentación para el cliente',
  prioridad: 'alta'
});

// Agregar subtareas
tareaConSubtareas.agregarSubtarea('Investigar cliente', 'Revisar información del cliente');
tareaConSubtareas.agregarSubtarea('Crear slides', 'Diseñar presentación');
tareaConSubtareas.agregarSubtarea('Practicar presentación', 'Ensayar ante el equipo');

// DEMOSTRACIÓN COMMAND PATTERN (UNDO/REDO)
console.log('\n🔄 DEMOSTRACIÓN COMMAND PATTERN (UNDO/REDO)');
console.log('Historial inicial:', gestor.obtenerHistorial());

// Completar algunas tareas
gestor.actualizarTarea(tareaBasica.id, { completada: true });
console.log('Después de completar tarea:', gestor.obtenerHistorial());

// Deshacer operación
gestor.deshacer();
console.log('Después de deshacer:', gestor.obtenerHistorial());

// Rehacer operación
gestor.rehacer();
console.log('Después de rehacer:', gestor.obtenerHistorial());

// DEMOSTRACIÓN STRATEGY PATTERN (FILTRADO)
console.log('\n🎯 DEMOSTRACIÓN STRATEGY PATTERN (FILTRADO)');

// Usar estrategia básica
console.log('Filtrado básico (tareas completadas):');
const filtroBasico = gestor.obtenerTareas({ completada: true });
console.log(filtroBasico.map(t => t.titulo));

// Cambiar a estrategia avanzada
gestor.setEstrategiaFiltrado(new EstrategiaFiltradoAvanzado());
console.log('\nFiltrado avanzado (buscar "presentación"):');
const filtroAvanzado = gestor.obtenerTareas({ busqueda: 'presentación' });
console.log(filtroAvanzado.map(t => t.titulo));

// Cambiar a estrategia inteligente
gestor.setEstrategiaFiltrado(new EstrategiaFiltradoInteligente());
console.log('\nFiltrado inteligente (vencimiento próximo):');
const filtroInteligente = gestor.obtenerTareas({ vencimientoProximo: true });
console.log(filtroInteligente.map(t => t.titulo));

// DEMOSTRACIÓN DECORATOR PATTERN (FUNCIONALIDADES ADICIONALES)
console.log('\n✨ DEMOSTRACIÓN DECORATOR PATTERN');

// Aplicar decoradores a tareas
tareaConFecha.agregarDecorador(new NotificacionEmailDecorador('usuario@ejemplo.com'));
tareaConFecha.agregarDecorador(new IntegracionCalendarioDecorador('calendario-personal'));
tareaRecurrente.agregarDecorador(new RecordatorioDecorador(12));

console.log('\nInformación de tarea con decoradores:');
console.log(tareaConFecha.obtenerInformacion());

// Completar tarea con decoradores
console.log('\nCompletando tarea con fecha límite (debería enviar email y actualizar calendario):');
tareaConFecha.completar();

// DEMOSTRACIÓN FINAL
console.log('\n📊 ESTADÍSTICAS FINALES:');
console.log(gestor.obtenerEstadisticas());

console.log('\n📈 ESTADÍSTICAS DE EVENTOS:');
console.log(observadorEstadisticas.obtenerEstadisticas());

console.log('\n🎯 Sistema de gestión de tareas extendido completado exitosamente!');