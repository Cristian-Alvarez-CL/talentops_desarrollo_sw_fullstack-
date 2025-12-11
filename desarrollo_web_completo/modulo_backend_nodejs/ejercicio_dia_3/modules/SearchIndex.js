const path = require('path');
const ManejadorArchivos = require('../core/ManejadorArchivos');
const Logger = require('../utils/Logger');

class SearchIndex {
  constructor(directorioIndices = './indices', logger = null) {
    this.directorioIndices = directorioIndices;
    this.logger = logger || new Logger('SearchIndex');
    this.indice = new Map();
    this.documentos = new Map();
  }

  async indexarArchivo(rutaArchivo, metadatos = {}) {
    try {
      const nombreArchivo = path.basename(rutaArchivo);
      const contenido = await ManejadorArchivos.leerArchivo(rutaArchivo);
      
      const tokens = this.tokenizarContenido(contenido);
      const frecuencia = this.calcularFrecuencia(tokens);
      
      const documento = {
        id: nombreArchivo,
        ruta: rutaArchivo,
        contenido,
        tokens: tokens.length,
        frecuencia,
        metadatos: {
          ...metadatos,
          fechaIndexacion: new Date().toISOString()
        }
      };

      // Actualizar índice inverso
      for (const [token, freq] of Object.entries(frecuencia)) {
        if (!this.indice.has(token)) {
          this.indice.set(token, []);
        }
        
        this.indice.get(token).push({
          documentoId: nombreArchivo,
          frecuencia: freq,
          relevancia: this.calcularTF(freq, tokens.length)
        });
      }

      this.documentos.set(nombreArchivo, documento);
      
      await this.guardarIndiceDocumento(documento);
      
      this.logger.info(`Archivo indexado: ${nombreArchivo} (${tokens.length} tokens)`);
      return documento;
    } catch (error) {
      this.logger.error(`Error indexando ${rutaArchivo}`, error);
      throw error;
    }
  }

  async indexarDirectorio(rutaDirectorio, extensiones = ['.txt', '.md', '.json']) {
    try {
      const archivos = await fs.readdir(rutaDirectorio);
      const archivosIndexar = archivos.filter(archivo => 
        extensiones.some(ext => archivo.endsWith(ext))
      );

      this.logger.info(`Indexando ${archivosIndexar.length} archivos...`);

      const resultados = [];
      for (const archivo of archivosIndexar) {
        try {
          const rutaCompleta = path.join(rutaDirectorio, archivo);
          const stats = await ManejadorArchivos.obtenerEstadisticas(rutaCompleta);
          
          const metadatos = {
            tamaño: stats.tamaño,
            modificado: stats.modificado,
            tipo: path.extname(archivo)
          };

          const resultado = await this.indexarArchivo(rutaCompleta, metadatos);
          resultados.push(resultado);
        } catch (error) {
          this.logger.error(`Error indexando ${archivo}`, error);
        }
      }

      await this.guardarIndiceGlobal();
      this.logger.success(`Indexación completada: ${resultados.length} archivos`);
      
      return resultados;
    } catch (error) {
      this.logger.error('Error indexando directorio', error);
      throw error;
    }
  }

  buscar(palabra, opciones = {}) {
    const palabraLower = palabra.toLowerCase();
    const resultados = this.indice.get(palabraLower) || [];

    // Ordenar por relevancia
    resultados.sort((a, b) => b.relevancia - a.relevancia);

    // Aplicar límite si se especifica
    if (opciones.limite && opciones.limite > 0) {
      resultados.splice(opciones.limite);
    }

    // Enriquecer con información del documento
    return resultados.map(resultado => ({
      ...resultado,
      documento: this.documentos.get(resultado.documentoId)
    }));
  }

  buscarFrase(frase, opciones = {}) {
    const palabras = this.tokenizarContenido(frase);
    const resultadosPorPalabra = palabras.map(palabra => 
      this.indice.get(palabra) || []
    );

    // Agrupar resultados por documento
    const documentosRelevancia = new Map();

    resultadosPorPalabra.forEach((resultados, idx) => {
      resultados.forEach(resultado => {
        if (!documentosRelevancia.has(resultado.documentoId)) {
          documentosRelevancia.set(resultado.documentoId, {
            documentoId: resultado.documentoId,
            palabrasEncontradas: [],
            relevanciaTotal: 0
          });
        }

        const doc = documentosRelevancia.get(resultado.documentoId);
        doc.palabrasEncontradas.push(palabras[idx]);
        doc.relevanciaTotal += resultado.relevancia;
      });
    });

    // Ordenar por relevancia total
    const resultados = Array.from(documentosRelevancia.values())
      .sort((a, b) => b.relevanciaTotal - a.relevanciaTotal)
      .map(r => ({
        ...r,
        documento: this.documentos.get(r.documentoId)
      }));

    // Aplicar límite
    if (opciones.limite && opciones.limite > 0) {
      resultados.splice(opciones.limite);
    }

    return resultados;
  }

  obtenerEstadisticas() {
    const totalDocumentos = this.documentos.size;
    const totalTokens = Array.from(this.documentos.values())
      .reduce((sum, doc) => sum + doc.tokens, 0);
    const totalPalabrasUnicas = this.indice.size;

    return {
      totalDocumentos,
      totalTokens,
      totalPalabrasUnicas,
      palabrasMasFrecuentes: this.obtenerPalabrasMasFrecuentes(10)
    };
  }

  obtenerPalabrasMasFrecuentes(cantidad = 10) {
    const palabras = Array.from(this.indice.entries())
      .map(([palabra, documentos]) => ({
        palabra,
        frecuenciaTotal: documentos.reduce((sum, doc) => sum + doc.frecuencia, 0),
        documentos: documentos.length
      }))
      .sort((a, b) => b.frecuenciaTotal - a.frecuenciaTotal)
      .slice(0, cantidad);

    return palabras;
  }

  tokenizarContenido(contenido) {
    return contenido.toLowerCase()
      .replace(/[^\w\sáéíóúüñ]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 2 && !this.esStopWord(token))
      .map(token => this.stem(token));
  }

  calcularFrecuencia(tokens) {
    const frecuencia = {};
    tokens.forEach(token => {
      frecuencia[token] = (frecuencia[token] || 0) + 1;
    });
    return frecuencia;
  }

  calcularTF(frecuencia, totalTokens) {
    return frecuencia / totalTokens;
  }

  esStopWord(palabra) {
    const stopWords = new Set([
      'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas',
      'de', 'del', 'al', 'y', 'o', 'pero', 'porque', 'como',
      'que', 'en', 'a', 'para', 'con', 'sin', 'sobre', 'entre'
    ]);
    return stopWords.has(palabra);
  }

  stem(palabra) {
    // Stemmer básico en español (simplificado)
    const sustituciones = [
      [/ciones$/, 'ción'],
      [/amientos$/, 'amiento'],
      [/imientos$/, 'imiento'],
      [/idades$/, 'idad'],
      [/amientos$/, 'amiento'],
      [/mente$/, ''],
      [/ando$/, 'ar'],
      [/iendo$/, 'er'],
      [/iendo$/, 'ir'],
      [/ados$/, 'ar'],
      [/idos$/, 'er'],
      [/idos$/, 'ir'],
      [/as$/, 'a'],
      [/es$/, 'e'],
      [/os$/, 'o']
    ];

    let resultado = palabra;
    for (const [regex, reemplazo] of sustituciones) {
      if (regex.test(resultado)) {
        resultado = resultado.replace(regex, reemplazo);
        break;
      }
    }

    return resultado;
  }

  async guardarIndiceDocumento(documento) {
    const rutaIndice = path.join(
      this.directorioIndices,
      `${documento.id}.indice.json`
    );
    
    await ManejadorArchivos.escribirArchivo(
      rutaIndice,
      JSON.stringify(documento, null, 2)
    );
  }

  async guardarIndiceGlobal() {
    const indiceGlobal = {
      fechaGeneracion: new Date().toISOString(),
      estadisticas: this.obtenerEstadisticas(),
      palabras: Array.from(this.indice.keys()),
      totalDocumentos: this.documentos.size
    };

    const rutaIndiceGlobal = path.join(this.directorioIndices, 'indice-global.json');
    await ManejadorArchivos.escribirArchivo(
      rutaIndiceGlobal,
      JSON.stringify(indiceGlobal, null, 2)
    );
  }

  async cargarIndice() {
    try {
      const rutaIndiceGlobal = path.join(this.directorioIndices, 'indice-global.json');
      if (await ManejadorArchivos.existeArchivo(rutaIndiceGlobal)) {
        const archivos = await fs.readdir(this.directorioIndices);
        const archivosIndice = archivos.filter(f => f.endsWith('.indice.json'));

        for (const archivoIndice of archivosIndice) {
          const rutaCompleta = path.join(this.directorioIndices, archivoIndice);
          const contenido = await ManejadorArchivos.leerArchivo(rutaCompleta);
          const documento = JSON.parse(contenido);

          this.documentos.set(documento.id, documento);

          // Reconstruir índice inverso
          for (const [token, freq] of Object.entries(documento.frecuencia)) {
            if (!this.indice.has(token)) {
              this.indice.set(token, []);
            }
            
            this.indice.get(token).push({
              documentoId: documento.id,
              frecuencia: freq,
              relevancia: this.calcularTF(freq, documento.tokens)
            });
          }
        }

        this.logger.info(`Índice cargado: ${this.documentos.size} documentos`);
        return true;
      }
    } catch (error) {
      this.logger.error('Error cargando índice', error);
    }
    return false;
  }
}

module.exports = SearchIndex;