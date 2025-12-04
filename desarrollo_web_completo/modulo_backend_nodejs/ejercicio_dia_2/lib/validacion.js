class ValidacionTareas {
  static validarCreacion(titulo, descripcion, prioridad) {
    const errores = [];

    if (!titulo || titulo.trim() === '') {
      errores.push('El título es obligatorio');
    } else if (titulo.length > 100) {
      errores.push('El título no puede exceder los 100 caracteres');
    }

    if (descripcion && descripcion.length > 500) {
      errores.push('La descripción no puede exceder los 500 caracteres');
    }

    const prioridadesValidas = ['baja', 'media', 'alta', 'urgente'];
    if (!prioridadesValidas.includes(prioridad)) {
      errores.push(`Prioridad inválida. Debe ser una de: ${prioridadesValidas.join(', ')}`);
    }

    if (errores.length > 0) {
      throw new Error(`Errores de validación: ${errores.join('; ')}`);
    }

    return true;
  }

  static validarActualizacion(datos) {
    const errores = [];

    if (datos.titulo !== undefined) {
      if (datos.titulo.trim() === '') {
        errores.push('El título no puede estar vacío');
      } else if (datos.titulo.length > 100) {
        errores.push('El título no puede exceder los 100 caracteres');
      }
    }

    if (datos.descripcion !== undefined && datos.descripcion.length > 500) {
      errores.push('La descripción no puede exceder los 500 caracteres');
    }

    if (datos.prioridad !== undefined) {
      const prioridadesValidas = ['baja', 'media', 'alta', 'urgente'];
      if (!prioridadesValidas.includes(datos.prioridad)) {
        errores.push(`Prioridad inválida. Debe ser una de: ${prioridadesValidas.join(', ')}`);
      }
    }

    if (errores.length > 0) {
      throw new Error(`Errores de validación: ${errores.join('; ')}`);
    }

    return true;
  }

  static sanitizarTexto(texto) {
    if (!texto) return texto;
    return texto
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .trim();
  }
}

module.exports = ValidacionTareas;