const { Transform } = require('stream');
const fsSync = require('fs');

class StreamUtils {
  static crearTransformStream(transformFunction) {
    return new Transform({
      transform(chunk, encoding, callback) {
        try {
          const resultado = transformFunction(chunk.toString(), encoding);
          this.push(resultado);
          callback();
        } catch (error) {
          callback(error);
        }
      }
    });
  }

  static transformarAMayusculas() {
    return this.crearTransformStream((chunk) => chunk.toUpperCase());
  }

  static transformarAMinusculas() {
    return this.crearTransformStream((chunk) => chunk.toLowerCase());
  }

  static transformarReemplazo(buscar, reemplazar) {
    return this.crearTransformStream((chunk) => 
      chunk.replace(new RegExp(buscar, 'g'), reemplazar)
    );
  }

  static copiarConStreams(rutaOrigen, rutaDestino, transformStream = null) {
    return new Promise((resolve, reject) => {
      const readable = fsSync.createReadStream(rutaOrigen, { encoding: 'utf8' });
      const writable = fsSync.createWriteStream(rutaDestino);

      if (transformStream) {
        readable.pipe(transformStream).pipe(writable);
      } else {
        readable.pipe(writable);
      }

      writable.on('finish', () => resolve(rutaDestino));
      writable.on('error', reject);
      readable.on('error', reject);
    });
  }

  static procesarLineaPorLinea(transformacionPorLinea) {
    return new Transform({
      transform(chunk, encoding, callback) {
        const lineas = chunk.toString().split('\n');
        const procesadas = lineas.map(transformacionPorLinea);
        this.push(procesadas.join('\n'));
        callback();
      }
    });
  }
}

module.exports = StreamUtils;