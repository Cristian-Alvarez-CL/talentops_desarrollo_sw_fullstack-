-- ==========================================================
-- 2. CONSULTA OPTIMIZADA (Subconsulta Eficiente)
-- ==========================================================
-- Buscar usuarios que NO tienen publicaciones usando NOT EXISTS
-- (Es más rápido que NOT IN en tablas con miles de registros)

SELECT u.username, u.email
FROM usuarios u
WHERE NOT EXISTS (
    SELECT 1 
    FROM publicaciones p 
    WHERE p.usuario_id = u.usuario_id
);


-- ==========================================================
-- 3. REPORTE DE ENGAGEMENT (Funciones de Ventana)
-- ==========================================================
-- Este reporte analiza el rendimiento sin colapsar las filas

SELECT 
    p.publicacion_id,
    u.username as autor,
    COUNT(r.reaccion_id) OVER(PARTITION BY p.publicacion_id) as total_likes,
    ROW_NUMBER() OVER(
        PARTITION BY u.usuario_id 
        ORDER BY p.fecha_publicacion DESC
    ) as nro_post_del_usuario
FROM publicaciones p
JOIN usuarios u ON p.usuario_id = u.usuario_id
LEFT JOIN reacciones r ON p.publicacion_id = r.publicacion_id;