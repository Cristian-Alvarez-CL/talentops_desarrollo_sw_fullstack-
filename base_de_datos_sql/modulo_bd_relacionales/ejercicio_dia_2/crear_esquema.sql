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

INSERT INTO libros (libro_id, titulo, autor, isbn, ejemplares_totales, ejemplares_disponibles) VALUES
(1, 'Cien años de soledad', 'Gabriel García Márquez', '978-0307474728', 3, 1),
(2, 'La ciudad y los perros', 'Mario Vargas Llosa', '978-8466333865', 2, 2),
(3, 'Rayuela', 'Julio Cortázar', '978-9500701273', 2, 0),
(4, 'El amor en los tiempos del cólera', 'Gabriel García Márquez', '978-0307474711', 1, 1),
(5, 'Ficciones', 'Jorge Luis Borges', '978-0307474735', 2, 2);

INSERT INTO usuarios (usuario_id, nombre, email, telefono) VALUES
(101, 'Ana López', 'ana.lopez@email.com', '555-1234'),
(102, 'Carlos Méndez', 'carlos.mendez@email.com', '555-5678'),
(103, 'Laura Gómez', 'laura.gomez@email.com', '555-9012'),
(104, 'Diego Ruiz', 'diego.ruiz@email.com', '555-3456');

INSERT INTO prestamos (prestamo_id, libro_id, usuario_id, fecha_prestamo, fecha_devolucion_prevista, fecha_devolucion_real) VALUES
-- Préstamo activo (no vencido)
(1001, 1, 101, '2025-12-01', '2025-12-15', NULL),

-- Préstamo vencido y aún no devuelto (multa pendiente)
(1002, 3, 102, '2025-11-10', '2025-11-24', NULL),

-- Préstamo devuelto con retraso (multa aplicada)
(1003, 1, 103, '2025-11-05', '2025-11-19', '2025-11-25'),

-- Préstamo devuelto a tiempo
(1004, 2, 104, '2025-12-05', '2025-12-19', '2025-12-18'),

-- Préstamo activo y ya vencido (hoy es 2025-12-20)
(1005, 3, 101, '2025-11-28', '2025-12-12', NULL),

-- Préstamo reciente (activo, no vencido)
(1006, 4, 102, '2025-12-18', '2026-01-01', NULL);

