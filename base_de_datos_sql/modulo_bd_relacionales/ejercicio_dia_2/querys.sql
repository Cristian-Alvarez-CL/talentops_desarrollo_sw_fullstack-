-- 1. Buscar libros por autor (ejemplo: 'Julio')
SELECT libro_id, titulo, autor, isbn, ejemplares_disponibles
FROM libros
WHERE autor ILIKE '%Julio%';

-- 2. Buscar libros por título (ejemplo: 'Rayuela')
SELECT libro_id, titulo, autor, isbn, ejemplares_disponibles
FROM libros
WHERE titulo ILIKE '%Rayuela%';

-- 3. Buscar por autor o título
SELECT libro_id, titulo, autor, isbn, ejemplares_disponibles
FROM libros
WHERE autor ILIKE '%Gabriel%' OR titulo ILIKE '%Gabriel%';

-- 4. Ver préstamos activos de un usuario (ejemplo: usuario_id = 1)
SELECT 
    p.prestamo_id,
    l.titulo,
    l.autor,
    p.fecha_prestamo,
    p.fecha_devolucion_prevista
FROM prestamos p
JOIN libros l ON p.libro_id = l.libro_id
WHERE p.usuario_id = 1
  AND p.fecha_devolucion_real IS NULL;

-- 5. Encontrar libros disponibles
SELECT libro_id, titulo, autor, isbn, ejemplares_disponibles
FROM libros
WHERE ejemplares_disponibles > 0;

-- 6. Calcular multas por retraso
SELECT 
    p.prestamo_id,
    u.nombre AS usuario,
    l.titulo,
    p.fecha_devolucion_prevista,
    p.fecha_devolucion_real,
    CASE
        WHEN p.fecha_devolucion_real IS NULL THEN
            CURRENT_DATE - p.fecha_devolucion_prevista
        ELSE
            p.fecha_devolucion_real - p.fecha_devolucion_prevista
    END AS dias_retraso,
    CASE
        WHEN p.fecha_devolucion_real IS NULL AND CURRENT_DATE > p.fecha_devolucion_prevista THEN
            (CURRENT_DATE - p.fecha_devolucion_prevista) * 0.50
        WHEN p.fecha_devolucion_real IS NOT NULL AND p.fecha_devolucion_real > p.fecha_devolucion_prevista THEN
            (p.fecha_devolucion_real - p.fecha_devolucion_prevista) * 0.50
        ELSE 0
    END AS multa
FROM prestamos p
JOIN usuarios u ON p.usuario_id = u.usuario_id
JOIN libros l ON p.libro_id = l.libro_id
WHERE (p.fecha_devolucion_real IS NULL AND CURRENT_DATE > p.fecha_devolucion_prevista)
   OR (p.fecha_devolucion_real IS NOT NULL AND p.fecha_devolucion_real > p.fecha_devolucion_prevista);

-- 7. Generar reportes de uso mensual (diciembre 2025)
SELECT 
    EXTRACT(YEAR FROM p.fecha_prestamo) AS anio,
    EXTRACT(MONTH FROM p.fecha_prestamo) AS mes,
    COUNT(*) AS total_prestamos,
    COUNT(DISTINCT p.usuario_id) AS usuarios_unicos,
    COUNT(DISTINCT p.libro_id) AS libros_prestados
FROM prestamos p
WHERE p.fecha_prestamo >= '2025-12-01'
  AND p.fecha_prestamo < '2026-01-01'
GROUP BY EXTRACT(YEAR FROM p.fecha_prestamo), EXTRACT(MONTH FROM p.fecha_prestamo);

-- 8. Reporte mensual detallado (por libro):
SELECT 
    l.titulo,
    l.autor,
    COUNT(*) AS veces_prestado
FROM prestamos p
JOIN libros l ON p.libro_id = l.libro_id
WHERE p.fecha_prestamo >= '2025-12-01'
  AND p.fecha_prestamo < '2026-01-01'
GROUP BY l.libro_id, l.titulo, l.autor
ORDER BY veces_prestado DESC
LIMIT 10;