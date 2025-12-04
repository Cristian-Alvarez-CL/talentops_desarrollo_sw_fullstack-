const Tarea = require('../models/tarea');
const Almacenamiento = require('../lib/almacenamiento');
const ValidacionTareas = require('../lib/validacion');
const Logger = require('../lib/logger');
const ExportadorTareas = require('../lib/exportador');

class GestorTareas {
  constructor() {
    this.almacenamiento = new Almacenamiento('tareas.json');
    this.logger = new Logger();
    this.exportador = new ExportadorTareas();
    this.tareas = new Map();
  }

  async inicializar() {
    await this.logger.inicializar();
    await this.logger.info('Inicializando gestor de tareas');
    
    const datos = await this.almacenamiento.cargar();
    if (datos.tareas) {
      datos.tareas.forEach(tareaData => {
        const tarea = new Tarea(
          tareaData.id,
          tareaData.titulo,
          tareaData.descripcion,
          tareaData.prioridad
        );
        if (tareaData.completada) {
          tarea.completar();
        }
        this.tareas.set(tarea.id, tarea);
      });
    }
    
    await this.logger.info('Tareas cargadas', { cantidad: this.tareas.size });
    console.log(`📋 Cargadas ${this.tareas.size} tareas`);
  }

  async guardar() {
    const tareasArray = Array.from(this.tareas.values()).map(tarea => tarea.obtenerInformacion());
    this.almacenamiento.actualizarDatos({ tareas: tareasArray });
    await this.almacenamiento.guardar();
    await this.logger.debug('Tareas guardadas', { cantidad: tareasArray.length });
  }

  crearTarea(titulo, descripcion = '', prioridad = 'media') {
    try {
      titulo = ValidacionTareas.sanitizarTexto(titulo);
      descripcion = ValidacionTareas.sanitizarTexto(descripcion);
      
      ValidacionTareas.validarCreacion(titulo, descripcion, prioridad);
      
      const id = Date.now().toString();
      const tarea = new Tarea(id, titulo, descripcion, prioridad);
      this.tareas.set(id, tarea);
      
      this.logger.info('Tarea creada', { 
        id, 
        titulo: titulo.substring(0, 30) + (titulo.length > 30 ? '...' : ''),
        prioridad 
      });
      
      console.log(`✅ Tarea creada: "${titulo}"`);
      return tarea;
    } catch (error) {
      this.logger.error('Error al crear tarea', { error: error.message, titulo, prioridad });
      throw error;
    }
  }

  obtenerTarea(id) {
    return this.tareas.get(id);
  }

  obtenerTodasTareas(filtro = {}) {
    let tareas = Array.from(this.tareas.values());

    if (filtro.completada !== undefined) {
      tareas = tareas.filter(t => t.completada === filtro.completada);
    }

    if (filtro.prioridad) {
      tareas = tareas.filter(t => t.prioridad === filtro.prioridad);
    }

    if (filtro.buscar) {
      const termino = filtro.buscar.toLowerCase();
      tareas = tareas.filter(t => 
        t.titulo.toLowerCase().includes(termino) || 
        t.descripcion.toLowerCase().includes(termino)
      );
    }

    return tareas;
  }

  async completarTarea(id) {
    try {
      const tarea = this.tareas.get(id);
      if (!tarea) {
        throw new Error(`Tarea con ID ${id} no encontrada`);
      }

      tarea.completar();
      await this.guardar();
      
      await this.logger.info('Tarea completada', { 
        id, 
        titulo: tarea.titulo,
        duracion: tarea.fechaCompletada - tarea.fechaCreacion 
      });
      
      console.log(` Tarea completada: "${tarea.titulo}"`);
      return tarea;
    } catch (error) {
      await this.logger.error('Error al completar tarea', { id, error: error.message });
      throw error;
    }
  }

  async actualizarTarea(id, datos) {
    try {
      const tarea = this.tareas.get(id);
      if (!tarea) {
        throw new Error(`Tarea con ID ${id} no encontrada`);
      }

      if (datos.titulo) datos.titulo = ValidacionTareas.sanitizarTexto(datos.titulo);
      if (datos.descripcion !== undefined) datos.descripcion = ValidacionTareas.sanitizarTexto(datos.descripcion);
      
      ValidacionTareas.validarActualizacion(datos);

      tarea.actualizar(datos);
      await this.guardar();
      
      await this.logger.info('Tarea actualizada', { id, datos });
      console.log(`Tarea actualizada: "${tarea.titulo}"`);
      return tarea;
    } catch (error) {
      await this.logger.error('Error al actualizar tarea', { id, datos, error: error.message });
      throw error;
    }
  }

  async eliminarTarea(id) {
    try {
      const tarea = this.tareas.get(id);
      if (!tarea) {
        throw new Error(`Tarea con ID ${id} no encontrada`);
      }

      this.tareas.delete(id);
      await this.guardar();
      
      await this.logger.info('Tarea eliminada', { id, titulo: tarea.titulo });
      console.log(`Tarea eliminada: "${tarea.titulo}"`);
      return tarea;
    } catch (error) {
      await this.logger.error('Error al eliminar tarea', { id, error: error.message });
      throw error;
    }
  }

  obtenerEstadisticas() {
    const tareas = Array.from(this.tareas.values());
    const total = tareas.length;
    const completadas = tareas.filter(t => t.completada).length;
    const pendientes = total - completadas;

    const porPrioridad = tareas.reduce((acc, tarea) => {
      acc[tarea.prioridad] = (acc[tarea.prioridad] || 0) + 1;
      return acc;
    }, {});

    const estadisticas = {
      total,
      completadas,
      pendientes,
      porcentajeCompletadas: total > 0 ? Math.round((completadas / total) * 100) : 0,
      porPrioridad
    };

    this.logger.debug('Estadísticas obtenidas', estadisticas);
    return estadisticas;
  }

  async exportarTareas(formato = 'json', filtro = {}) {
    try {
      const tareas = this.obtenerTodasTareas(filtro);
      
      await this.logger.info('Exportando tareas', { 
        formato, 
        cantidad: tareas.length,
        filtro 
      });
      
      const resultado = await this.exportador.exportar(tareas, formato);
      
      if (resultado.exito) {
        await this.logger.info('Exportación exitosa', resultado);
      } else {
        await this.logger.error('Error en exportación', resultado);
      }
      
      return resultado;
    } catch (error) {
      await this.logger.error('Error al exportar tareas', { formato, error: error.message });
      throw error;
    }
  }

  async obtenerReporte() {
    const estadisticas = this.obtenerEstadisticas();
    const tareasRecientes = this.obtenerTodasTareas()
      .sort((a, b) => b.fechaCreacion - a.fechaCreacion)
      .slice(0, 5)
      .map(t => ({
        titulo: t.titulo,
        prioridad: t.prioridad,
        completada: t.completada,
        fechaCreacion: t.fechaCreacion.toISOString().split('T')[0]
      }));

    const reporte = {
      generado: new Date().toISOString(),
      estadisticas,
      tareasRecientes,
      resumen: `Total: ${estadisticas.total} | Completadas: ${estadisticas.completadas} (${estadisticas.porcentajeCompletadas}%)`
    };

    await this.logger.info('Reporte generado', { 
      totalTareas: estadisticas.total,
      completadas: estadisticas.completadas 
    });
    
    return reporte;
  }
}

module.exports = GestorTareas;