-- Buscar libros por autor
-- Usar $1 como parámetro en PostgreSQL
SELECT libro_id, titulo, autor, isbn, ejemplares_disponibles
FROM libros
WHERE autor LIKE '%' || $1 || '%';

-- Buscar libros por título
SELECT libro_id, titulo, autor, isbn, ejemplares_disponibles
FROM libros
WHERE titulo LIKE '%' || $1 || '%';

-- Buscar por autor o título (combinado)
SELECT libro_id, titulo, autor, isbn, ejemplares_disponibles
FROM libros
WHERE autor LIKE '%' || $1 || '%' OR titulo LIKE '%' || $1 || '%';

-- Ver préstamos activos de un usuario
SELECT 
    p.prestamo_id,
    l.titulo,
    l.autor,
    p.fecha_prestamo,
    p.fecha_devolucion_prevista
FROM prestamos p
JOIN libros l ON p.libro_id = l.libro_id
WHERE p.usuario_id = $1
  AND p.fecha_devolucion_real IS NULL;

-- Calcular multas por retraso
SELECT 
    p.prestamo_id,
    u.nombre AS usuario,
    l.titulo,
    p.fecha_devolucion_prevista,
    p.fecha_devolucion_real,
    CASE
        WHEN p.fecha_devolucion_real IS NULL THEN
            GREATEXTRACT(EPOCH FROM (CURRENT_DATE - p.fecha_devolucion_prevista)) / 86400
        ELSE
            EXTRACT(EPOCH FROM (p.fecha_devolucion_real - p.fecha_devolucion_prevista)) / 86400
    END AS dias_retraso,
    CASE
        WHEN p.fecha_devolucion_real IS NULL AND CURRENT_DATE > p.fecha_devolucion_prevista THEN
            EXTRACT(EPOCH FROM (CURRENT_DATE - p.fecha_devolucion_prevista)) / 86400 * 0.50
        WHEN p.fecha_devolucion_real IS NOT NULL AND p.fecha_devolucion_real > p.fecha_devolucion_prevista THEN
            EXTRACT(EPOCH FROM (p.fecha_devolucion_real - p.fecha_devolucion_prevista)) / 86400 * 0.50
        ELSE 0
    END AS multa
FROM prestamos p
JOIN usuarios u ON p.usuario_id = u.usuario_id
JOIN libros l ON p.libro_id = l.libro_id
WHERE (p.fecha_devolucion_real IS NULL AND CURRENT_DATE > p.fecha_devolucion_prevista)
   OR (p.fecha_devolucion_real IS NOT NULL AND p.fecha_devolucion_real > p.fecha_devolucion_prevista);