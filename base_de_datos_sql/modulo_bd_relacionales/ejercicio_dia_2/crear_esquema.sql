-- Tabla de libros
CREATE TABLE libros (
    libro_id SERIAL PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    autor VARCHAR(255) NOT NULL,
    isbn VARCHAR(20),
    ejemplares_totales INTEGER NOT NULL CHECK (ejemplares_totales >= 0),
    ejemplares_disponibles INTEGER NOT NULL CHECK (ejemplares_disponibles >= 0)
);

-- Tabla de usuarios
CREATE TABLE usuarios (
    usuario_id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    telefono VARCHAR(20)
);

-- Tabla de préstamos
CREATE TABLE prestamos (
    prestamo_id SERIAL PRIMARY KEY,
    libro_id INTEGER NOT NULL,
    usuario_id INTEGER NOT NULL,
    fecha_prestamo DATE NOT NULL,
    fecha_devolucion_prevista DATE NOT NULL,
    fecha_devolucion_real DATE,
    FOREIGN KEY (libro_id) REFERENCES libros(libro_id) ON DELETE RESTRICT,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(usuario_id) ON DELETE RESTRICT
);

-- Libros
INSERT INTO libros (titulo, autor, isbn, ejemplares_totales, ejemplares_disponibles) VALUES
('Cien años de soledad', 'Gabriel García Márquez', '978-0307474728', 3, 1),
('La ciudad y los perros', 'Mario Vargas Llosa', '978-8466333865', 2, 2),
('Rayuela', 'Julio Cortázar', '978-9500701273', 2, 0),
('El amor en los tiempos del cólera', 'Gabriel García Márquez', '978-0307474711', 1, 1),
('Ficciones', 'Jorge Luis Borges', '978-0307474735', 2, 2);

-- Usuarios
INSERT INTO usuarios (nombre, email, telefono) VALUES
('Ana López', 'ana.lopez@email.com', '555-1234'),
('Carlos Méndez', 'carlos.mendez@email.com', '555-5678'),
('Laura Gómez', 'laura.gomez@email.com', '555-9012'),
('Diego Ruiz', 'diego.ruiz@email.com', '555-3456');

-- Préstamos
INSERT INTO prestamos (libro_id, usuario_id, fecha_prestamo, fecha_devolucion_prevista, fecha_devolucion_real) VALUES
(1, 1, '2025-12-01', '2025-12-15', NULL),
(3, 2, '2025-11-10', '2025-11-24', NULL),
(1, 3, '2025-11-05', '2025-11-19', '2025-11-25'),
(2, 4, '2025-12-05', '2025-12-19', '2025-12-18'),
(3, 1, '2025-11-28', '2025-12-12', NULL),
(4, 2, '2025-12-18', '2026-01-01', NULL);