console.log("=== SISTEMA DE GESTIÓN DE BIBLIOTECA ===\n");

// Base de datos de libros extendida
const libros = [
  { id: 1, titulo: "JavaScript: The Good Parts", autor: "Douglas Crockford", genero: "Programación", disponible: true, popularidad: 8, fechaPublicacion: new Date(2008, 0, 1) },
  { id: 2, titulo: "Clean Code", autor: "Robert C. Martin", genero: "Programación", disponible: false, popularidad: 9, fechaPublicacion: new Date(2008, 7, 1) },
  { id: 3, titulo: "The Pragmatic Programmer", autor: "Andrew Hunt", genero: "Programación", disponible: true, popularidad: 7, fechaPublicacion: new Date(1999, 9, 1) },
  { id: 4, titulo: "1984", autor: "George Orwell", genero: "Ficción", disponible: true, popularidad: 10, fechaPublicacion: new Date(1949, 5, 8) },
  { id: 5, titulo: "To Kill a Mockingbird", autor: "Harper Lee", genero: "Ficción", disponible: false, popularidad: 9, fechaPublicacion: new Date(1960, 6, 11) }
];

// Sistema de gestión extendido
const biblioteca = {
  // Búsqueda avanzada por múltiples criterios
  buscarAvanzada(criterios = {}) {
    const { titulo, autor, genero, disponible, popularidadMinima, añoPublicacion } = criterios;
    
    return libros.filter(libro => {
      const coincideTitulo = !titulo || libro.titulo.toLowerCase().includes(titulo.toLowerCase());
      const coincideAutor = !autor || libro.autor.toLowerCase().includes(autor.toLowerCase());
      const coincideGenero = !genero || libro.genero === genero;
      const coincideDisponible = disponible === undefined || libro.disponible === disponible;
      const coincidePopularidad = !popularidadMinima || libro.popularidad >= popularidadMinima;
      const coincideAño = !añoPublicacion || libro.fechaPublicacion.getFullYear() === añoPublicacion;
      
      return coincideTitulo && coincideAutor && coincideGenero && coincideDisponible && 
             coincidePopularidad && coincideAño;
    });
  },

  // Gestión de usuarios
  obtenerUsuariosActivos() {
    return usuarios.filter(({ activo }) => activo);
  },

  buscarUsuario(criterio) {
    const termino = criterio.toLowerCase();
    return usuarios.find(usuario => 
      usuario.nombre.toLowerCase().includes(termino) ||
      usuario.email.toLowerCase().includes(termino)
    );
  },

  // Sistema de préstamos extendido
  prestarLibro(usuarioId, libroId) {
    const usuario = usuarios.find(u => u.id === usuarioId);
    const libro = libros.find(l => l.id === libroId);
    
    if (!usuario || !usuario.activo) {
      return { exito: false, mensaje: "Usuario no válido o inactivo" };
    }
    
    if (!libro) return { exito: false, mensaje: "Libro no encontrado" };
    if (!libro.disponible) return { exito: false, mensaje: "Libro no disponible" };

    const { id, titulo, autor } = libro;
    libro.disponible = false;
    
    const nuevoPrestamo = {
      id: Math.max(...prestamos.map(p => p.id)) + 1,
      usuarioId,
      libroId,
      fechaPrestamo: new Date(),
      fechaDevolucion: null,
      diasRetraso: 0
    };
    
    prestamos.push(nuevoPrestamo);
    return { 
      exito: true, 
      mensaje: `Libro "${titulo}" prestado a ${usuario.nombre}`,
      prestamo: nuevoPrestamo 
    };
  },

  devolverLibro(libroId, usuarioId) {
    const prestamo = prestamos.find(p => 
      p.libroId === libroId && p.usuarioId === usuarioId && !p.fechaDevolucion
    );
    
    if (!prestamo) return { exito: false, mensaje: "Préstamo no encontrado" };

    const libro = libros.find(l => l.id === libroId);
    const usuario = usuarios.find(u => u.id === usuarioId);
    
    prestamo.fechaDevolucion = new Date();
    libro.disponible = true;
    
    // Calcular multa si hay retraso
    const diasPrestamo = Math.ceil((prestamo.fechaDevolucion - prestamo.fechaPrestamo) / (1000 * 60 * 60 * 24));
    const diasRetraso = Math.max(0, diasPrestamo - 30); 
    prestamo.diasRetraso = diasRetraso;
    
    const multa = this.calcularMulta(diasRetraso);
    
    return { 
      exito: true, 
      mensaje: `Libro "${libro.titulo}" devuelto por ${usuario.nombre}`,
      multa,
      diasRetraso
    };
  },

  // Cálculo de multas
  calcularMulta(diasRetraso) {
    const tarifaPorDia = 2; // $2 por día de retraso
    return diasRetraso * tarifaPorDia;
  },

  obtenerMultasPendientes() {
    return prestamos
      .filter(({ fechaDevolucion, diasRetraso }) => !fechaDevolucion && diasRetraso > 0)
      .map(prestamo => {
        const { usuarioId, libroId, diasRetraso } = prestamo;
        const usuario = usuarios.find(u => u.id === usuarioId);
        const libro = libros.find(l => l.id === libroId);
        const multa = this.calcularMulta(diasRetraso);
        
        return { usuario: usuario.nombre, libro: libro.titulo, diasRetraso, multa };
      });
  },

  // Historial de préstamos por usuario
  obtenerHistorialUsuario(usuarioId) {
    return prestamos
      .filter(({ usuarioId: id }) => id === usuarioId)
      .map(prestamo => {
        const { libroId, fechaPrestamo, fechaDevolucion, diasRetraso } = prestamo;
        const libro = libros.find(l => l.id === libroId);
        const multa = this.calcularMulta(diasRetraso);
        
        return {
          libro: libro.titulo,
          fechaPrestamo: fechaPrestamo.toLocaleDateString(),
          fechaDevolucion: fechaDevolucion ? fechaDevolucion.toLocaleDateString() : 'Pendiente',
          estado: fechaDevolucion ? 'Devuelto' : 'Prestado',
          multa: multa > 0 ? `$${multa}` : 'Sin multa'
        };
      });
  },

  // Reportes de popularidad
  generarReportePopularidad() {
    const reporte = libros
      .map(({ titulo, autor, genero, popularidad, id }) => {
        const vecesPrestado = prestamos.filter(p => p.libroId === id).length;
        return { titulo, autor, genero, popularidad, vecesPrestado };
      })
      .sort((a, b) => b.vecesPrestado - a.vecesPrestado || b.popularidad - a.popularidad);

    return {
      masPrestados: reporte.slice(0, 3),
      menosPrestados: reporte.slice(-3).reverse(),
      porGenero: this._estadisticasPorGenero(reporte)
    };
  },

  _estadisticasPorGenero(librosConPrestamos) {
    return librosConPrestamos.reduce((acc, { genero, vecesPrestado }) => {
      if (!acc[genero]) {
        acc[genero] = { totalPrestamos: 0, cantidadLibros: 0 };
      }
      acc[genero].totalPrestamos += vecesPrestado;
      acc[genero].cantidadLibros += 1;
      return acc;
    }, {});
  },

  // Estadísticas extendidas
  obtenerEstadisticasCompletas() {
    const stats = this.obtenerEstadisticas();
    const multasPendientes = this.obtenerMultasPendientes();
    const reportePopularidad = this.generarReportePopularidad();
    
    return {
      ...stats,
      totalUsuarios: usuarios.length,
      usuariosActivos: this.obtenerUsuariosActivos().length,
      totalPrestamos: prestamos.length,
      prestamosActivos: prestamos.filter(p => !p.fechaDevolucion).length,
      totalMultasPendientes: multasPendientes.reduce((sum, { multa }) => sum + multa, 0),
      reportePopularidad
    };
  },

  // Obtener libros disponibles
  obtenerDisponibles() {
    return libros.filter(libro => libro.disponible);
  },

  // Buscar libros por título o autor
  buscar(criterio) {
    const termino = criterio.toLowerCase();
    return libros.filter(libro =>
      libro.titulo.toLowerCase().includes(termino) ||
      libro.autor.toLowerCase().includes(termino)
    );
  },

  // Prestar libro
  prestar(id) {
    const libro = libros.find(l => l.id === id);
    if (!libro) return { exito: false, mensaje: "Libro no encontrado" };
    if (!libro.disponible) return { exito: false, mensaje: "Libro no disponible" };

    libro.disponible = false;
    return { exito: true, mensaje: `Libro "${libro.titulo}" prestado exitosamente` };
  },

  // Devolver libro
  devolver(id) {
    const libro = libros.find(l => l.id === id);
    if (!libro) return { exito: false, mensaje: "Libro no encontrado" };
    if (libro.disponible) return { exito: false, mensaje: "Este libro ya está disponible" };

    libro.disponible = true;
    return { exito: true, mensaje: `Libro "${libro.titulo}" devuelto exitosamente` };
  },

  // Estadísticas
  obtenerEstadisticas() {
    const total = libros.length;
    const disponibles = libros.filter(l => l.disponible).length;
    const prestados = total - disponibles;

    // Agrupar por género usando reduce
    const porGenero = libros.reduce((acc, libro) => {
      acc[libro.genero] = (acc[libro.genero] || 0) + 1;
      return acc;
    }, {});

    return { total, disponibles, prestados, porGenero };
  }
};

// Demostraciones prácticas
console.log("📚 LIBROS DISPONIBLES:");
biblioteca.obtenerDisponibles().forEach(({ titulo, autor }) => {
  console.log(`- "${titulo}" por ${autor}`);
});

console.log("\n🔍 BÚSQUEDA 'JavaScript':");
biblioteca.buscar("JavaScript").forEach(({ titulo, autor }) => {
  console.log(`- "${titulo}" por ${autor}`);
});

console.log("\n📊 ESTADÍSTICAS:");
const stats = biblioteca.obtenerEstadisticas();
console.log(`Total de libros: ${stats.total}`);
console.log(`Disponibles: ${stats.disponibles}`);
console.log(`Prestados: ${stats.prestados}`);
console.log("Por género:", stats.porGenero);

console.log("\n📖 OPERACIONES DE PRÉSTAMO:");
console.log(biblioteca.prestar(1).mensaje);
console.log(biblioteca.prestar(1).mensaje); // Intento fallido
console.log(biblioteca.devolver(1).mensaje);

console.log("\n=== DEMOSTRACIÓN DE DESTRUCTURING ===\n");

// Función que usa destructuring extensivamente
function procesarPrestamo({ id, titulo, autor, disponible }) {
  if (!disponible) {
    return `❌ "${titulo}" no está disponible`;
  }

  const resultado = biblioteca.prestar(id);
  return resultado.exito ? `✅ ${resultado.mensaje}` : `❌ ${resultado.mensaje}`;
}

// Procesar múltiples libros con destructuring
const librosParaProcesar = [
  { id: 1, titulo: "JavaScript: The Good Parts", autor: "Douglas Crockford", disponible: true },
  { id: 4, titulo: "1984", autor: "George Orwell", disponible: true }
];

librosParaProcesar.forEach(libro => {
  console.log(procesarPrestamo(libro));
});

// Destructuring en bucles
console.log("\n📋 LISTADO DE LIBROS CON DESTRUCTURING:");
for (const { titulo, autor, genero, disponible } of libros) {
  const estado = disponible ? "✅ Disponible" : "❌ Prestado";
  console.log(`${titulo} - ${autor} (${genero}) ${estado}`);
}

// Estadísticas avanzadas usando métodos modernos
console.log("\n🎯 ANÁLISIS AVANZADO:");
const librosPorGenero = libros.reduce((acc, { genero, disponible }) => {
  if (!acc[genero]) acc[genero] = { total: 0, disponibles: 0 };
  acc[genero].total++;
  if (disponible) acc[genero].disponibles++;
  return acc;
}, {});

Object.entries(librosPorGenero).forEach(([genero, stats]) => {
  console.log(`${genero}: ${stats.disponibles}/${stats.total} disponibles`);
});

// ================================================================================================
// = Ejercicio extender biblioteca
// ================================================================================================

// Sistema de usuarios
const usuarios = [
  { id: 1, nombre: "Ana García", email: "ana@email.com", activo: true },
  { id: 2, nombre: "Carlos López", email: "carlos@email.com", activo: true },
  { id: 3, nombre: "María Rodríguez", email: "maria@email.com", activo: false }
];

// Historial de préstamos
let prestamos = [
  { id: 1, usuarioId: 1, libroId: 2, fechaPrestamo: new Date(2024, 0, 15), fechaDevolucion: null, diasRetraso: 5 },
  { id: 2, usuarioId: 2, libroId: 5, fechaPrestamo: new Date(2024, 0, 10), fechaDevolucion: null, diasRetraso: 10 },
  { id: 3, usuarioId: 1, libroId: 1, fechaPrestamo: new Date(2023, 11, 1), fechaDevolucion: new Date(2023, 11, 15), diasRetraso: 0 }
];



// Demostración de las nuevas funcionalidades
console.log("=== SISTEMA DE GESTIÓN DE BIBLIOTECA EXTENDIDO ===\n");

console.log(" BÚSQUEDA AVANZADA (Programación disponible):");
const resultadosBusqueda = biblioteca.buscarAvanzada({ 
  genero: "Programación", 
  disponible: true,
  popularidadMinima: 7 
});
resultadosBusqueda.forEach(({ titulo, autor, popularidad }) => {
  console.log(`- "${titulo}" por ${autor} (Popularidad: ${popularidad})`);
});

console.log("\n USUARIOS ACTIVOS:");
biblioteca.obtenerUsuariosActivos().forEach(({ nombre, email }) => {
  console.log(`- ${nombre} (${email})`);
});

console.log("\n OPERACIONES DE PRÉSTAMO EXTENDIDAS:");
console.log(biblioteca.prestarLibro(1, 3).mensaje);
console.log(biblioteca.prestarLibro(2, 4).mensaje);

console.log("\n MULTAS PENDIENTES:");
const multas = biblioteca.obtenerMultasPendientes();
if (multas.length > 0) {
  multas.forEach(({ usuario, libro, diasRetraso, multa }) => {
    console.log(`- ${usuario}: "${libro}" - ${diasRetraso} días de retraso - Multa: $${multa}`);
  });
} else {
  console.log("No hay multas pendientes");
}

console.log("\n HISTORIAL DE USUARIO (Ana García):");
const historialAna = biblioteca.obtenerHistorialUsuario(1);
historialAna.forEach(({ libro, fechaPrestamo, fechaDevolucion, estado, multa }) => {
  console.log(`- "${libro}" | Préstamo: ${fechaPrestamo} | Devolución: ${fechaDevolucion} | ${estado} | ${multa}`);
});

console.log("\n REPORTE DE POPULARIDAD:");
const reporte = biblioteca.generarReportePopularidad();
console.log("Libros más prestados:");
reporte.masPrestados.forEach(({ titulo, vecesPrestado }, index) => {
  console.log(`${index + 1}. "${titulo}" - ${vecesPrestado} préstamos`);
});

console.log("\n ESTADÍSTICAS COMPLETAS:");
const statsCompletas = biblioteca.obtenerEstadisticasCompletas();
console.log(`Total usuarios: ${statsCompletas.totalUsuarios}`);
console.log(`Usuarios activos: ${statsCompletas.usuariosActivos}`);
console.log(`Total préstamos: ${statsCompletas.totalPrestamos}`);
console.log(`Préstamos activos: ${statsCompletas.prestamosActivos}`);
console.log(`Multas pendientes: $${statsCompletas.totalMultasPendientes}`);

// Ejemplo de destructuring avanzado en funciones
console.log("\n=== DESTRUCTURING AVANZADO ===\n");

// Función con destructuring anidado
function procesarDevolucion({ usuarioId, libroId }) {
  const usuario = usuarios.find(({ id }) => id === usuarioId);
  const libro = libros.find(({ id }) => id === libroId);
  
  if (!usuario || !libro) {
    return { exito: false, error: "Datos inválidos" };
  }
  
  const { nombre } = usuario;
  const { titulo, autor } = libro;
  
  const resultado = biblioteca.devolverLibro(libroId, usuarioId);
  const { multa, diasRetraso } = resultado;
  
  return {
    exito: true,
    resumen: `${nombre} devolvió "${titulo}"`,
    detalles: { multa, diasRetraso, libro: { titulo, autor } }
  };
}

const [usuarioPrincipal, ...otrosUsuarios] = biblioteca.obtenerUsuariosActivos();
console.log("Usuario principal:", usuarioPrincipal?.nombre);
console.log("Otros usuarios:", otrosUsuarios.map(({ nombre }) => nombre).join(", "));

const generarResumenLibro = ({ titulo, autor, genero, popularidad }) => 
  `${titulo} (${autor}) - ${genero} ★${popularidad}/10`;

console.log("\n RESUMEN DE LIBROS:");
libros.forEach(libro => {
  console.log(generarResumenLibro(libro));
});