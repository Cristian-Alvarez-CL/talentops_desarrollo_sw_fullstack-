-- Tabla de libros
CREATE TABLE libros (
    libro_id INT PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    autor VARCHAR(255) NOT NULL,
    isbn VARCHAR(20),
    ejemplares_totales INT NOT NULL,
    ejemplares_disponibles INT NOT NULL
);

-- Tabla de usuarios
CREATE AUTO_INCREMENT = 1;
CREATE TABLE usuarios (
    usuario_id INT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    telefono VARCHAR(20)
);

-- Tabla de préstamos
CREATE TABLE prestamos (
    prestamo_id INT PRIMARY KEY,
    libro_id INT,
    usuario_id INT,
    fecha_prestamo DATE NOT NULL,
    fecha_devolucion_prevista DATE NOT NULL,
    fecha_devolucion_real DATE,
    FOREIGN KEY (libro_id) REFERENCES libros(libro_id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(usuario_id)
);
