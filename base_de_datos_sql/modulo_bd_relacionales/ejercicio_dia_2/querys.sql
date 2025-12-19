-- Buscar libros por autor (coincidencia parcial)
SELECT libro_id, titulo, autor, isbn, ejemplares_disponibles
FROM libros
WHERE autor LIKE '%:autor%';

-- Buscar libros por título (coincidencia parcial)
SELECT libro_id, titulo, autor, isbn, ejemplares_disponibles
FROM libros
WHERE titulo LIKE '%:titulo%';

-- Buscar por autor o título (combinado)
SELECT libro_id, titulo, autor, isbn, ejemplares_disponibles
FROM libros
WHERE autor LIKE '%:busqueda%' OR titulo LIKE '%:busqueda%';

-- Ver préstamos activos de un usuario
SELECT 
    p.prestamo_id,
    l.titulo,
    l.autor,
    p.fecha_prestamo,
    p.fecha_devolucion_prevista
FROM prestamos p
JOIN libros l ON p.libro_id = l.libro_id
WHERE p.usuario_id = :usuario_id
  AND p.fecha_devolucion_real IS NULL;

-- Encontrar libros disponibles

SELECT libro_id, titulo, autor, isbn, ejemplares_disponibles
FROM libros
WHERE ejemplares_disponibles > 0;

-- Calcular multas por retraso

SELECT 
    p.prestamo_id,
    u.nombre AS usuario,
    l.titulo,
    p.fecha_devolucion_prevista,
    p.fecha_devolucion_real,
    DATEDIFF(COALESCE(p.fecha_devolucion_real, CURDATE()), p.fecha_devolucion_prevista) AS dias_retraso,
    CASE
        WHEN p.fecha_devolucion_real IS NULL AND CURDATE() > p.fecha_devolucion_prevista THEN
            DATEDIFF(CURDATE(), p.fecha_devolucion_prevista) * 0.50
        WHEN p.fecha_devolucion_real IS NOT NULL AND p.fecha_devolucion_real > p.fecha_devolucion_prevista THEN
            DATEDIFF(p.fecha_devolucion_real, p.fecha_devolucion_prevista) * 0.50
        ELSE 0
    END AS multa
FROM prestamos p
JOIN usuarios u ON p.usuario_id = u.usuario_id
JOIN libros l ON p.libro_id = l.libro_id
WHERE (p.fecha_devolucion_real IS NULL AND CURDATE() > p.fecha_devolucion_prevista)
   OR (p.fecha_devolucion_real IS NOT NULL AND p.fecha_devolucion_real > p.fecha_devolucion_prevista);


-- Generar reportes de uso mensual
SELECT 
    YEAR(p.fecha_prestamo) AS anio,
    MONTH(p.fecha_prestamo) AS mes,
    COUNT(*) AS total_prestamos,
    COUNT(DISTINCT p.usuario_id) AS usuarios_unicos,
    COUNT(DISTINCT p.libro_id) AS libros_prestados
FROM prestamos p
WHERE p.fecha_prestamo >= '2025-12-01'
  AND p.fecha_prestamo < '2026-01-01'
GROUP BY YEAR(p.fecha_prestamo), MONTH(p.fecha_prestamo);

-- Reporte mensual detallado (por libro):
SELECT 
    l.titulo,
    l.autor,
    COUNT(*) AS veces_prestado
FROM prestamos p
JOIN libros l ON p.libro_id = l.libro_id
WHERE p.fecha_prestamo >= '2025-12-01'
  AND p.fecha_prestamo < '2026-01-01'
GROUP BY l.libro_id
ORDER BY veces_prestado DESC
LIMIT 10;

