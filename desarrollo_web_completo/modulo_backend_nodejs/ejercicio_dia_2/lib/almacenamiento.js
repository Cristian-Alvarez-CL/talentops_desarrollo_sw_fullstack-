const fs = require('fs').promises;
const path = require('path');

class Almacenamiento {
  constructor(archivo = 'datos.json') {
    this.archivo = path.join(__dirname, '..', 'data', archivo);
    this.datos = null;
    this.cargado = false;
  }

  async cargar() {
    try {
      const contenido = await fs.readFile(this.archivo, 'utf8');
      this.datos = JSON.parse(contenido);
      this.cargado = true;
      console.log('Datos cargados desde archivo');
    } catch (error) {
      if (error.code === 'ENOENT') {
        // Archivo no existe, inicializar vacío
        this.datos = { tareas: [] };
        this.cargado = true;
        console.log('Archivo de datos no encontrado, inicializando vacío');
      } else {
        throw new Error(`Error al cargar datos: ${error.message}`);
      }
    }
    return this.datos;
  }

  async guardar() {
    if (!this.cargado) {
      throw new Error('Los datos no han sido cargados');
    }

    try {
      // Asegurar que el directorio existe
      await fs.mkdir(path.dirname(this.archivo), { recursive: true });

      const contenido = JSON.stringify(this.datos, null, 2);
      await fs.writeFile(this.archivo, contenido, 'utf8');
      console.log('Datos guardados exitosamente');
    } catch (error) {
      throw new Error(`Error al guardar datos: ${error.message}`);
    }
  }

  obtenerDatos() {
    if (!this.cargado) {
      throw new Error('Los datos no han sido cargados');
    }
    return this.datos;
  }

  actualizarDatos(nuevosDatos) {
    if (!this.cargado) {
      throw new Error('Los datos no han sido cargados');
    }
    this.datos = { ...this.datos, ...nuevosDatos };
  }
}

module.exports = Almacenamiento;