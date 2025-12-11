const path = require('path');
const ManejadorArchivos = require('../core/ManejadorArchivos');
const StreamUtils = require('../utils/StreamUtils');
const Logger = require('../utils/Logger');

class FileProcessor {
  constructor(directorioProcesados, logger = null) {
    this.directorioProcesados = directorioProcesados;
    this.logger = logger || new Logger('FileProcessor');
  }

  async procesarArchivoTexto(rutaArchivo) {
    try {
      const contenido = await ManejadorArchivos.leerArchivo(rutaArchivo);
      
      const estadisticas = this.analizarContenido(contenido, rutaArchivo);
      await this.guardarEstadisticas(estadisticas);

      this.logger.info(`Archivo procesado: ${path.basename(rutaArchivo)}`);
      return estadisticas;
    } catch (error) {
      this.logger.error(`Error procesando archivo ${rutaArchivo}`, error);
      throw error;
    }
  }

  async procesarArchivoJSON(rutaArchivo) {
    try {
      const contenido = await ManejadorArchivos.leerArchivo(rutaArchivo);
      const json = JSON.parse(contenido);

      const estadisticas = {
        archivo: path.basename(rutaArchivo),
        ruta: rutaArchivo,
        tipo: 'JSON',
        propiedades: this.contarPropiedadesJSON(json),
        profundidad: this.calcularProfundidadJSON(json),
        tamaño: contenido.length,
        fechaProcesamiento: new Date().toISOString()
      };

      await this.guardarEstadisticas(estadisticas);
      return estadisticas;
    } catch (error) {
      this.logger.error(`Error procesando JSON ${rutaArchivo}`, error);
      throw error;
    }
  }

  async convertirAMayusculas(rutaEntrada, rutaSalida) {
    try {
      const transformStream = StreamUtils.transformarAMayusculas();
      await StreamUtils.copiarConStreams(rutaEntrada, rutaSalida, transformStream);
      
      this.logger.success(`Convertido a mayúsculas: ${rutaSalida}`);
      return rutaSalida;
    } catch (error) {
      this.logger.error(`Error convirtiendo archivo ${rutaEntrada}`, error);
      throw error;
    }
  }

  async convertirAMinusculas(rutaEntrada, rutaSalida) {
    try {
      const transformStream = StreamUtils.transformarAMinusculas();
      await StreamUtils.copiarConStreams(rutaEntrada, rutaSalida, transformStream);
      
      this.logger.success(`Convertido a minúsculas: ${rutaSalida}`);
      return rutaSalida;
    } catch (error) {
      this.logger.error(`Error convirtiendo archivo ${rutaEntrada}`, error);
      throw error;
    }
  }

  async buscarYReemplazar(rutaEntrada, rutaSalida, buscar, reemplazar) {
    try {
      const transformStream = StreamUtils.transformarReemplazo(buscar, reemplazar);
      await StreamUtils.copiarConStreams(rutaEntrada, rutaSalida, transformStream);
      
      this.logger.success(`Reemplazo completado: ${buscar} → ${reemplazar}`);
      return rutaSalida;
    } catch (error) {
      this.logger.error(`Error en reemplazo ${rutaEntrada}`, error);
      throw error;
    }
  }

  analizarContenido(contenido, rutaArchivo) {
    const lineas = contenido.split('\n');
    const palabras = contenido.split(/\s+/).filter(p => p.length > 0);
    const oraciones = contenido.split(/[.!?]+/).filter(o => o.trim().length > 0);
    
    const palabrasUnicas = [...new Set(palabras.map(p => p.toLowerCase()))];
    const palabrasLargas = palabras.filter(p => p.length > 10);
    const densidadPalabras = palabras.length / Math.max(lineas.length, 1);

    return {
      archivo: path.basename(rutaArchivo),
      ruta: rutaArchivo,
      tipo: 'texto',
      estadisticas: {
        lineas: lineas.length,
        palabras: palabras.length,
        caracteres: contenido.length,
        oraciones: oraciones.length,
        palabrasUnicas: palabrasUnicas.length,
        palabrasLargas: palabrasLargas.length,
        densidadPalabras: Math.round(densidadPalabras * 100) / 100,
        longitudPromedioPalabra: palabras.length > 0 
          ? Math.round(palabras.reduce((sum, p) => sum + p.length, 0) / palabras.length * 100) / 100
          : 0
      },
      palabrasMasComunes: this.obtenerPalabrasMasComunes(palabras, 10),
      fechaProcesamiento: new Date().toISOString()
    };
  }

  obtenerPalabrasMasComunes(palabras, cantidad = 10) {
    const frecuencia = {};
    palabras.forEach(palabra => {
      const palabraLower = palabra.toLowerCase();
      frecuencia[palabraLower] = (frecuencia[palabraLower] || 0) + 1;
    });

    return Object.entries(frecuencia)
      .sort(([,a], [,b]) => b - a)
      .slice(0, cantidad)
      .map(([palabra, freq]) => ({ palabra, frecuencia: freq }));
  }

  contarPropiedadesJSON(obj) {
    let count = 0;
    
    function contar(obj) {
      if (typeof obj !== 'object' || obj === null) return;
      
      count += Object.keys(obj).length;
      Object.values(obj).forEach(valor => contar(valor));
    }
    
    contar(obj);
    return count;
  }

  calcularProfundidadJSON(obj) {
    function profundidad(obj, current = 0) {
      if (typeof obj !== 'object' || obj === null) return current;
      
      let max = current;
      Object.values(obj).forEach(valor => {
        max = Math.max(max, profundidad(valor, current + 1));
      });
      
      return max;
    }
    
    return profundidad(obj);
  }

  async guardarEstadisticas(estadisticas) {
    const nombreBase = path.basename(estadisticas.archivo, path.extname(estadisticas.archivo));
    const rutaEstadisticas = path.join(
      this.directorioProcesados,
      `${nombreBase}.estadisticas.json`
    );

    await ManejadorArchivos.escribirArchivo(
      rutaEstadisticas,
      JSON.stringify(estadisticas, null, 2)
    );
  }

  async generarReporteConsolidado(estadisticasArray) {
    const reporte = {
      fechaGeneracion: new Date().toISOString(),
      totalArchivos: estadisticasArray.length,
      resumen: {
        totalLineas: estadisticasArray.reduce((sum, e) => sum + (e.estadisticas?.lineas || 0), 0),
        totalPalabras: estadisticasArray.reduce((sum, e) => sum + (e.estadisticas?.palabras || 0), 0),
        totalCaracteres: estadisticasArray.reduce((sum, e) => sum + (e.estadisticas?.caracteres || 0), 0),
        archivosPorTipo: this.agruparPorTipo(estadisticasArray)
      },
      archivos: estadisticasArray.map(e => ({
        archivo: e.archivo,
        tipo: e.tipo,
        estadisticas: e.estadisticas || {}
      }))
    };

    const rutaReporte = path.join(
      this.directorioProcesados,
      `reporte-consolidado_${new Date().toISOString().replace(/[:.]/g, '-')}.json`
    );

    await ManejadorArchivos.escribirArchivo(rutaReporte, JSON.stringify(reporte, null, 2));
    
    this.logger.success(`Reporte consolidado generado: ${rutaReporte}`);
    return reporte;
  }

  agruparPorTipo(estadisticasArray) {
    const agrupado = {};
    estadisticasArray.forEach(e => {
      agrupado[e.tipo] = (agrupado[e.tipo] || 0) + 1;
    });
    return agrupado;
  }
}

module.exports = FileProcessor;