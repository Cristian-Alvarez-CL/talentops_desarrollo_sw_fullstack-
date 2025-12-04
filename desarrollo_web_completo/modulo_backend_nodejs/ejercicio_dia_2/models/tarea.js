class Tarea {
  constructor(id, titulo, descripcion = '', prioridad = 'media') {
    this.id = id;
    this.titulo = titulo;
    this.descripcion = descripcion;
    this.prioridad = prioridad;
    this.completada = false;
    this.fechaCreacion = new Date();
    this.fechaCompletada = null;
  }

  completar() {
    if (this.completada) {
      throw new Error('La tarea ya está completada');
    }
    this.completada = true;
    this.fechaCompletada = new Date();
    return this;
  }

  actualizar(datos) {
    if (datos.titulo) this.titulo = datos.titulo;
    if (datos.descripcion !== undefined) this.descripcion = datos.descripcion;
    if (datos.prioridad) this.prioridad = datos.prioridad;
    return this;
  }

  obtenerInformacion() {
    return {
      id: this.id,
      titulo: this.titulo,
      descripcion: this.descripcion,
      prioridad: this.prioridad,
      completada: this.completada,
      fechaCreacion: this.fechaCreacion,
      fechaCompletada: this.fechaCompletada
    };
  }
}

module.exports = Tarea;