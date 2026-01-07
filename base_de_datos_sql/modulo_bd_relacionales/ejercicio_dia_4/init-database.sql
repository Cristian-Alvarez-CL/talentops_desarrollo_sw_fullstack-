-- Inicialización de la base de datos
CREATE DATABASE IF NOT EXISTS ttops_node_db;
USE ttops_node_db;

-- Tabla de usuarios (actualizada)
CREATE TABLE IF NOT EXISTS usuarios (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password VARCHAR(255),
  edad INT,
  rol ENUM('user', 'admin') DEFAULT 'user',
  activo BOOLEAN DEFAULT TRUE,
  avatar VARCHAR(255),
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ultimo_login TIMESTAMP NULL,
  reset_token VARCHAR(255),
  reset_token_expira TIMESTAMP NULL,
  INDEX idx_email (email),
  INDEX idx_activo (activo),
  INDEX idx_rol (rol)
);

-- Tabla de categorías
CREATE TABLE IF NOT EXISTS categorias (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(50) NOT NULL UNIQUE,
  descripcion TEXT,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de productos (actualizada)
CREATE TABLE IF NOT EXISTS productos (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(200) NOT NULL,
  descripcion TEXT,
  precio DECIMAL(10,2) NOT NULL,
  stock INT DEFAULT 0,
  categoria_id INT,
  activo BOOLEAN DEFAULT TRUE,
  imagen VARCHAR(255),
  calificacion_promedio DECIMAL(3,2) DEFAULT 0.00,
  total_calificaciones INT DEFAULT 0,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL,
  INDEX idx_categoria (categoria_id),
  INDEX idx_activo (activo),
  INDEX idx_precio (precio),
  INDEX idx_calificacion (calificacion_promedio)
);

-- Tabla de reseñas
CREATE TABLE IF NOT EXISTS reseñas (
  id INT PRIMARY KEY AUTO_INCREMENT,
  producto_id INT NOT NULL,
  usuario_id INT NOT NULL,
  calificacion INT NOT NULL CHECK (calificacion >= 1 AND calificacion <= 5),
  comentario TEXT,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  UNIQUE KEY unique_resena (producto_id, usuario_id),
  INDEX idx_producto (producto_id),
  INDEX idx_usuario (usuario_id),
  INDEX idx_fecha (fecha_creacion)
);

-- Tabla de pedidos
CREATE TABLE IF NOT EXISTS pedidos (
  id INT PRIMARY KEY AUTO_INCREMENT,
  usuario_id INT NOT NULL,
  fecha_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  total DECIMAL(10,2) DEFAULT 0.00,
  estado ENUM('pendiente', 'procesando', 'enviado', 'completado', 'cancelado') DEFAULT 'pendiente',
  direccion_envio TEXT,
  telefono VARCHAR(20),
  notas TEXT,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  INDEX idx_usuario (usuario_id),
  INDEX idx_fecha (fecha_pedido),
  INDEX idx_estado (estado)
);

-- Tabla de detalle de pedidos
CREATE TABLE IF NOT EXISTS detalle_pedidos (
  id INT PRIMARY KEY AUTO_INCREMENT,
  pedido_id INT NOT NULL,
  producto_id INT NOT NULL,
  cantidad INT NOT NULL,
  precio_unitario DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
  FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
  INDEX idx_pedido (pedido_id),
  INDEX idx_producto (producto_id)
);

-- Tabla de notificaciones
CREATE TABLE IF NOT EXISTS notificaciones (
  id INT PRIMARY KEY AUTO_INCREMENT,
  usuario_id INT NOT NULL,
  tipo VARCHAR(50) NOT NULL,
  titulo VARCHAR(100) NOT NULL,
  mensaje TEXT NOT NULL,
  leido BOOLEAN DEFAULT FALSE,
  metadata JSON,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  INDEX idx_usuario (usuario_id),
  INDEX idx_leido (leido),
  INDEX idx_fecha (fecha_creacion)
);

-- Tabla de caché (opcional)
CREATE TABLE IF NOT EXISTS cache_data (
  clave VARCHAR(255) PRIMARY KEY,
  valor JSON NOT NULL,
  expiracion TIMESTAMP NOT NULL,
  INDEX idx_expiracion (expiracion)
);

-- Insertar usuario admin por defecto (contraseña: Admin123)
INSERT IGNORE INTO usuarios (nombre, email, password, rol) VALUES
('Administrador', 'admin@ttops.com', '$2a$10$YourHashedPasswordHere', 'admin');

-- Datos de ejemplo
INSERT IGNORE INTO categorias (nombre, descripcion) VALUES
('Electrónica', 'Productos electrónicos y gadgets'),
('Ropa', 'Ropa y accesorios'),
('Hogar', 'Artículos para el hogar'),
('Deportes', 'Equipamiento deportivo');

INSERT IGNORE INTO productos (nombre, descripcion, precio, stock, categoria_id) VALUES
('Laptop Gaming', 'Laptop potente para gaming', 1299.99, 5, 1),
('Mouse Óptico', 'Mouse ergonómico inalámbrico', 29.99, 25, 1),
('Teclado Mecánico', 'Teclado RGB con switches cherry', 89.99, 12, 1);