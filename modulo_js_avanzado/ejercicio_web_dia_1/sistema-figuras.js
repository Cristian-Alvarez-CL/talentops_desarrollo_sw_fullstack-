// VERSIÓN EXTENDIDA

// PATRÓN 1: Factory Method para creación de figuras
class FiguraFactory {
  static crearFigura(tipo, ...params) {
    switch(tipo.toLowerCase()) {
      case 'circulo':
        return new Circulo(...params);
      case 'rectangulo':
        return new Rectangulo(...params);
      case 'triangulo':
        return new Triangulo(...params);
      case 'pentagono':
        return new Pentagono(...params);
      case 'hexagono':
        return new Hexagono(...params);
      case 'cubo':
        return new Cubo(...params);
      case 'esfera':
        return new Esfera(...params);
      default:
        throw new Error(`Tipo de figura '${tipo}' no reconocido`);
    }
  }
}

// PATRÓN 2: Strategy para algoritmos de dibujo
class DibujoStrategy {
  dibujar(figura) { throw new Error('Método dibujar debe ser implementado'); }
}

class DibujoASCIIStrategy extends DibujoStrategy {
  dibujar(figura) {
    return figura.dibujarASCII();
  }
}

class DibujoTextoStrategy extends DibujoStrategy {
  dibujar(figura) {
    return figura.describir();
  }
}

class FiguraDibujable {
  dibujarASCII() {
    throw new Error('Método dibujarASCII debe ser implementado');
  }
}


class FiguraGeometrica extends FiguraDibujable {
  constructor(nombre, parametros = {}) {
    super();
    this.nombre = nombre;
    this.#id = Math.random().toString(36).substr(2, 9);
    this.validarParametros(parametros);
    this.dibujoStrategy = new DibujoASCIIStrategy();
  }

  // Propiedad privada
  #id;


  validarParametros(parametros) {
    for (const [key, value] of Object.entries(parametros)) {
      if (typeof value !== 'number' || value <= 0) {
        throw new Error(`Parámetro '${key}' debe ser un número positivo`);
      }
    }
  }

  // Método abstracto (debe ser implementado por subclases)
  calcularArea() {
    throw new Error('Método calcularArea debe ser implementado por la subclase');
  }

  calcularPerimetro() {
    throw new Error('Método calcularPerimetro debe ser implementado por la subclase');
  }

  describir() {
    return `${this.nombre} (ID: ${this.#id.substring(0, 4)}...) - Área: ${this.calcularArea().toFixed(2)}, Perímetro: ${this.calcularPerimetro().toFixed(2)}`;
  }

  // Getter para ID
  get id() {
    return this.#id;
  }

  // Método para comparar similitud con otra figura
  esSimilar(figura) {
    if (!(figura instanceof FiguraGeometrica)) return false;
    if (this.constructor !== figura.constructor) return false;
    
    const props1 = this.obtenerPropiedadesComparables();
    const props2 = figura.obtenerPropiedadesComparables();
    
    // Comparar proporciones en lugar de valores absolutos
    const ratio = props1[0] / props2[0];
    const tolerancia = 0.1;
    
    return props1.every((prop, i) => {
      const propRatio = prop / props2[i];
      return Math.abs(propRatio - ratio) < tolerancia;
    });
  }

  // Método para obtener propiedades comparables
  obtenerPropiedadesComparables() {
    return Object.values(this).filter(val => typeof val === 'number');
  }

  // Método para dibujar usando Strategy
  dibujar() {
    return this.dibujoStrategy.dibujar(this);
  }

  // Cambiar estrategia de dibujo
  setDibujoStrategy(strategy) {
    if (!(strategy instanceof DibujoStrategy)) {
      throw new Error('Estrategia debe ser instancia de DibujoStrategy');
    }
    this.dibujoStrategy = strategy;
  }

  // Método estático
  static crearDesdeJSON(jsonString) {
    const data = JSON.parse(jsonString);
    return FiguraFactory.crearFigura(data.tipo, ...Object.values(data.parametros || {}));
  }
}

// ========== FIGURAS 2D ==========

// Clase Círculo
class Circulo extends FiguraGeometrica {
  constructor(radio) {
    super('Círculo', { radio });
    this.radio = radio;
  }

  calcularArea() {
    return Math.PI * this.radio * this.radio;
  }

  calcularPerimetro() {
    return 2 * Math.PI * this.radio;
  }

  calcularDiametro() {
    return this.radio * 2;
  }

  dibujarASCII() {
    const radio = Math.min(Math.floor(this.radio), 10);
    let dibujo = '';
    
    for (let y = -radio; y <= radio; y++) {
      for (let x = -radio; x <= radio; x++) {
        const distancia = Math.sqrt(x*x + y*y);
        dibujo += (distancia < radio - 0.5) ? '██' : '  ';
      }
      dibujo += '\n';
    }
    return dibujo;
  }
}

// Clase Rectángulo
class Rectangulo extends FiguraGeometrica {
  constructor(ancho, alto) {
    super('Rectángulo', { ancho, alto });
    this.ancho = ancho;
    this.altura = alto;
  }

  calcularArea() {
    return this.ancho * this.altura;
  }

  calcularPerimetro() {
    return 2 * (this.ancho + this.altura);
  }

  // Método específico
  esCuadrado() {
    return Math.abs(this.ancho - this.altura) < 0.0001;
  }

  dibujarASCII() {
    const ancho = Math.min(Math.floor(this.ancho), 20);
    const alto = Math.min(Math.floor(this.altura), 10);
    let dibujo = '';
    
    for (let y = 0; y < alto; y++) {
      for (let x = 0; x < ancho; x++) {
        if (y === 0 || y === alto - 1 || x === 0 || x === ancho - 1) {
          dibujo += '██';
        } else {
          dibujo += '  ';
        }
      }
      dibujo += '\n';
    }
    return dibujo;
  }
}

// Clase Triángulo
class Triangulo extends FiguraGeometrica {
  constructor(base, altura) {
    super('Triángulo', { base, altura });
    this.base = base;
    this.altura = altura;
  }

  calcularArea() {
    return (this.base * this.altura) / 2;
  }

  calcularPerimetro() {
    // Para triángulo rectángulo
    return this.base + this.altura + this.calcularHipotenusa();
  }

  // Método específico
  calcularHipotenusa() {
    return Math.sqrt(this.base * this.base + this.altura * this.altura);
  }

  dibujarASCII() {
    const altura = Math.min(Math.floor(this.altura), 10);
    let dibujo = '';
    
    for (let i = 0; i < altura; i++) {
      const espacios = altura - i - 1;
      const caracteres = 2 * i + 1;
      dibujo += ' '.repeat(espacios) + '▲'.repeat(caracteres) + '\n';
    }
    return dibujo;
  }
}

// Clase Pentágono
class Pentagono extends FiguraGeometrica {
  constructor(lado) {
    super('Pentágono', { lado });
    this.lado = lado;
  }

  calcularArea() {
    const constante = 0.25 * Math.sqrt(5 * (5 + 2 * Math.sqrt(5)));
    return constante * this.lado * this.lado;
  }

  calcularPerimetro() {
    return 5 * this.lado;
  }

  // Método específico para pentágono
  calcularApotema() {
    return this.lado / (2 * Math.tan(Math.PI / 5));
  }

  dibujarASCII() {
    const radio = Math.min(Math.floor(this.lado), 5);
    let dibujo = '';
    
    for (let y = -radio; y <= radio; y++) {
      for (let x = -radio; x <= radio; x++) {
        const angulo = Math.atan2(y, x);
        const distancia = Math.sqrt(x*x + y*y);
        const pentagonoDist = radio * Math.cos(Math.PI/5) / Math.cos(angulo % (2*Math.PI/5) - Math.PI/5);
        
        dibujo += (distancia < pentagonoDist) ? '⬢ ' : '  ';
      }
      dibujo += '\n';
    }
    return dibujo;
  }
}

// Clase Hexágono
class Hexagono extends FiguraGeometrica {
  constructor(lado) {
    super('Hexágono', { lado });
    this.lado = lado;
  }

  calcularArea() {
    // Área = (3√3/2) * lado^2
    return (3 * Math.sqrt(3) / 2) * this.lado * this.lado;
  }

  calcularPerimetro() {
    return 6 * this.lado;
  }

  // Método específico para hexágono
  calcularRadioCircunscrito() {
    return this.lado;
  }

  dibujarASCII() {
    const radio = Math.min(Math.floor(this.lado), 5);
    let dibujo = '';
    
    for (let y = -radio; y <= radio; y++) {
      for (let x = -radio; x <= radio; x++) {
        const distancia = Math.sqrt(x*x + y*y);
        dibujo += (distancia < radio + 0.5) ? '⬡ ' : '  ';
      }
      dibujo += '\n';
    }
    return dibujo;
  }
}

// Interfaz para figuras 3D
class Figura3D extends FiguraGeometrica {
  constructor(nombre, parametros) {
    super(nombre, parametros);
  }

  calcularVolumen() {
    throw new Error('Método calcularVolumen debe ser implementado');
  }

  calcularAreaSuperficial() {
    throw new Error('Método calcularAreaSuperficial debe ser implementado');
  }

  describir() {
    return `${super.describir()}, Volumen: ${this.calcularVolumen().toFixed(2)}`;
  }
}

// Clase Cubo
class Cubo extends Figura3D {
  constructor(lado) {
    super('Cubo', { lado });
    this.lado = lado;
  }

  calcularArea() {
    return 6 * this.lado * this.lado;
  }

  calcularPerimetro() {
    return 12 * this.lado;
  }

  calcularVolumen() {
    return Math.pow(this.lado, 3);
  }

  calcularAreaSuperficial() {
    return this.calcularArea();
  }

  dibujarASCII() {
    const lado = Math.min(Math.floor(this.lado), 4);
    let dibujo = '';
    
    // Vista frontal
    for (let y = 0; y < lado; y++) {
      dibujo += '██'.repeat(lado) + '  ' + '██'.repeat(lado) + '\n';
    }
    
    dibujo += '\n';
    
    // Vista lateral
    for (let y = 0; y < lado; y++) {
      dibujo += '  '.repeat(lado) + '██'.repeat(lado) + '\n';
    }
    
    return dibujo;
  }
}

// Clase Esfera
class Esfera extends Figura3D {
  constructor(radio) {
    super('Esfera', { radio });
    this.radio = radio;
  }

  calcularArea() {
    return 4 * Math.PI * this.radio * this.radio;
  }

  calcularPerimetro() {
    // Circunferencia máxima
    return 2 * Math.PI * this.radio;
  }

  calcularVolumen() {
    return (4/3) * Math.PI * Math.pow(this.radio, 3);
  }

  calcularAreaSuperficial() {
    return this.calcularArea();
  }

  dibujarASCII() {
    const radio = Math.min(Math.floor(this.radio), 5);
    let dibujo = '';
    
    for (let y = -radio; y <= radio; y++) {
      for (let x = -radio; x <= radio; x++) {
        const distancia = Math.sqrt(x*x + y*y);
        dibujo += (distancia < radio - 0.5) ? '● ' : '  ';
      }
      dibujo += '\n';
    }
    return dibujo;
  }
}

// PATRÓN 3: Observer para notificaciones de cambios
class FiguraObserver {
  update(figura, cambio) {
    console.log(`🔔 ${figura.nombre}: ${cambio}`);
  }
}

// Clase para gestionar colección de figuras
class ColeccionFiguras {
  constructor() {
    this.figuras = [];
    this.observers = [];
  }

  agregar(figura) {
    if (figura instanceof FiguraGeometrica) {
      this.figuras.push(figura);
      this.notificarObservers(figura, 'Figura agregada a la colección');
      return true;
    }
    return false;
  }

  // Añadir observer
  agregarObserver(observer) {
    if (observer instanceof FiguraObserver) {
      this.observers.push(observer);
    }
  }

  // Notificar a observers
  notificarObservers(figura, mensaje) {
    this.observers.forEach(observer => observer.update(figura, mensaje));
  }

  // Método que demuestra polimorfismo
  listarFiguras() {
    console.log('\n=== COLECCIÓN DE FIGURAS ===');
    this.figuras.forEach((figura, index) => {
      console.log(`${index + 1}. ${figura.describir()}`);
    });
  }

  // Métodos que usan polimorfismo
  calcularAreaTotal() {
    return this.figuras.reduce((total, figura) => total + figura.calcularArea(), 0);
  }

  calcularPerimetroTotal() {
    return this.figuras.reduce((total, figura) => total + figura.calcularPerimetro(), 0);
  }

  calcularVolumenTotal() {
    return this.figuras.reduce((total, figura) => {
      return total + (figura.calcularVolumen ? figura.calcularVolumen() : 0);
    }, 0);
  }

  // Método que filtra por tipo (usando polimorfismo)
  filtrarPorTipo(tipo) {
    return this.figuras.filter(figura => figura.nombre === tipo);
  }

  // Método para encontrar figuras similares
  encontrarSimilares(figuraReferencia) {
    return this.figuras.filter(figura => 
      figura !== figuraReferencia && figura.esSimilar(figuraReferencia)
    );
  }

  // Método para dibujar todas las figuras
  dibujarTodas() {
    console.log('\n DIBUJANDO TODAS LAS FIGURAS:');
    this.figuras.forEach((figura, index) => {
      console.log(`\n${index + 1}. ${figura.nombre}:`);
      console.log(figura.dibujar());
    });
  }

  // Método estático
  static compararAreas(figura1, figura2) {
    const area1 = figura1.calcularArea();
    const area2 = figura2.calcularArea();

    if (Math.abs(area1 - area2) < 0.0001) {
      return `Ambas figuras tienen la misma área (${area1.toFixed(2)})`;
    } else if (area1 > area2) {
      return `${figura1.nombre} (${area1.toFixed(2)}) es más grande que ${figura2.nombre} (${area2.toFixed(2)})`;
    } else {
      return `${figura2.nombre} (${area2.toFixed(2)}) es más grande que ${figura1.nombre} (${area1.toFixed(2)})`;
    }
  }
}

// ========== DEMOSTRACIÓN ==========

console.log('SISTEMA DE FIGURAS GEOMÉTRICAS EXTENDIDO CON POO\n');

// Crear Observer
const observer = new FiguraObserver();

// Crear colección con observer
const coleccion = new ColeccionFiguras();
coleccion.agregarObserver(observer);

// Usar Factory Method para crear figuras
try {
  const circulo = FiguraFactory.crearFigura('circulo', 5);
  const rectangulo = FiguraFactory.crearFigura('rectangulo', 10, 8);
  const cuadrado = FiguraFactory.crearFigura('rectangulo', 6, 6);
  const triangulo = FiguraFactory.crearFigura('triangulo', 8, 6);
  const pentagono = FiguraFactory.crearFigura('pentagono', 4);
  const hexagono = FiguraFactory.crearFigura('hexagono', 5);
  const cubo = FiguraFactory.crearFigura('cubo', 3);
  const esfera = FiguraFactory.crearFigura('esfera', 4);

  // Agregar figuras (notificará al observer)
  coleccion.agregar(circulo);
  coleccion.agregar(rectangulo);
  coleccion.agregar(cuadrado);
  coleccion.agregar(triangulo);
  coleccion.agregar(pentagono);
  coleccion.agregar(hexagono);
  coleccion.agregar(cubo);
  coleccion.agregar(esfera);

  // Listar todas las figuras
  coleccion.listarFiguras();

  // totales
  console.log(`\n Área total: ${coleccion.calcularAreaTotal().toFixed(2)}`);
  console.log(` Perímetro total: ${coleccion.calcularPerimetroTotal().toFixed(2)}`);
  console.log(` Volumen total (solo 3D): ${coleccion.calcularVolumenTotal().toFixed(2)}`);

  // Comparar áreas
  console.log(`\n  ${ColeccionFiguras.compararAreas(circulo, hexagono)}`);

  // Comparar similitud
  console.log('\n COMPARANDO SIMILITUD ENTRE FIGURAS:');
  const rectanguloSimilar = FiguraFactory.crearFigura('rectangulo', 5, 4);
  coleccion.agregar(rectanguloSimilar);
  
  const similares = coleccion.encontrarSimilares(rectangulo);
  console.log(`Figuras similares a ${rectangulo.nombre}: ${similares.length} encontradas`);
  similares.forEach((fig, i) => console.log(`  ${i+1}. ${fig.describir()}`));

  // Métodos específicos de nuevas figuras
  console.log(`\n FUNCIONES ESPECÍFICAS NUEVAS:`);
  console.log(`Apotema del pentágono: ${pentagono.calcularApotema().toFixed(2)}`);
  console.log(`Radio circunscrito del hexágono: ${hexagono.calcularRadioCircunscrito().toFixed(2)}`);
  console.log(`Volumen del cubo: ${cubo.calcularVolumen().toFixed(2)}`);
  console.log(`Área superficial de la esfera: ${esfera.calcularAreaSuperficial().toFixed(2)}`);

  // Validación de parámetros (demostración de error)
  console.log('\n DEMOSTRACIÓN DE VALIDACIÓN:');
  try {
    const figuraInvalida = FiguraFactory.crearFigura('circulo', -5);
  } catch (error) {
    console.log(`Error capturado: ${error.message}`);
  }

  // Cambiar estrategia de dibujo
  console.log('\n CAMBIANDO ESTRATEGIA DE DIBUJO:');
  const textoStrategy = new DibujoTextoStrategy();
  circulo.setDibujoStrategy(textoStrategy);
  console.log(`Círculo con estrategia de texto: ${circulo.dibujar()}`);

  // Volver a estrategia ASCII y dibujar todas
  circulo.setDibujoStrategy(new DibujoASCIIStrategy());
  coleccion.dibujarTodas();

  // Serialización/Deserialización
  console.log('\n SERIALIZACIÓN/DESERIALIZACIÓN:');
  const figuraData = {
    tipo: 'hexagono',
    parametros: { lado: 7 }
  };
  
  const hexagonoDesdeJSON = FiguraGeometrica.crearDesdeJSON(JSON.stringify(figuraData));
  console.log(`Hexágono desde JSON: ${hexagonoDesdeJSON.describir()}`);

  // Demostrar encapsulamiento
  console.log(`\n🔒 ENCAPSULAMIENTO:`);
  console.log(`ID del círculo (getter): ${circulo.id}`);
  // console.log(circulo.#id); // Error: Propiedad privada

  console.log('\n✅ Sistema POO extendido implementado exitosamente!');

} catch (error) {
  console.error(`❌ Error en el sistema: ${error.message}`);
}