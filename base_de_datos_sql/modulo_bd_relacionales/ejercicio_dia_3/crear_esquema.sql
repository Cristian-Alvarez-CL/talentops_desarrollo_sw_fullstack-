ROLLBACK;

-- 1. Limpiar esquema para evitar conflictos
DROP TABLE IF EXISTS reacciones CASCADE;
DROP TABLE IF EXISTS comentarios CASCADE;
DROP TABLE IF EXISTS publicaciones CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;

-- 2. Crear tablas
CREATE TABLE usuarios (
    usuario_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE publicaciones (
    publicacion_id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(usuario_id) ON DELETE CASCADE,
    contenido TEXT NOT NULL,
    fecha_publicacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE comentarios (
    comentario_id SERIAL PRIMARY KEY,
    publicacion_id INTEGER REFERENCES publicaciones(publicacion_id) ON DELETE CASCADE,
    usuario_id INTEGER REFERENCES usuarios(usuario_id) ON DELETE CASCADE,
    contenido TEXT NOT NULL,
    fecha_comentario TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE reacciones (
    reaccion_id SERIAL PRIMARY KEY,
    publicacion_id INTEGER REFERENCES publicaciones(publicacion_id) ON DELETE CASCADE,
    usuario_id INTEGER REFERENCES usuarios(usuario_id) ON DELETE CASCADE,
    tipo_reaccion VARCHAR(20),
    fecha_reaccion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Índices para optimización
CREATE INDEX idx_publicaciones_usuario ON publicaciones(usuario_id);
CREATE INDEX idx_comentarios_publicacion ON comentarios(publicacion_id);
CREATE INDEX idx_reacciones_publicacion ON reacciones(publicacion_id);

-- 4. DATOS DE PRUEBA (Vital para que no falle el FK error)
INSERT INTO usuarios (usuario_id, username, email) VALUES 
(1, 'juan_admin', 'juan@redsocial.com'),
(2, 'maria_user', 'maria@redsocial.com'),
(3, 'pedro_ghost', 'pedro@redsocial.com');

-- Ajustar el contador de la secuencia (importante tras insertar IDs manuales)
SELECT setval('usuarios_usuario_id_seq', (SELECT MAX(usuario_id) FROM usuarios));


-- ==========================================================
-- 1. TRANSACCIÓN: Publicación + Comentario
-- ==========================================================
BEGIN;

-- Insertar publicación para el usuario 1 (que ya creamos arriba)
INSERT INTO publicaciones (usuario_id, contenido) 
VALUES (1, '¡Bienvenidos a mi nueva red social optimizada!')
RETURNING publicacion_id;

-- Insertar comentario automático usando el ID de la publicación anterior
INSERT INTO comentarios (publicacion_id, usuario_id, contenido)
VALUES (currval('publicaciones_publicacion_id_seq'), 1, 'Gracias por unirte.');

COMMIT;