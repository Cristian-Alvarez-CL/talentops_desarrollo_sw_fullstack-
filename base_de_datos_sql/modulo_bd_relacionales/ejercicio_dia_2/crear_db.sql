s-- crear_db.sql
-- Ejecutar con: psql -U postgres -d postgres -f crear_db.sql

DROP DATABASE IF EXISTS ttops_sql_practice_biblioteca;

CREATE DATABASE ttops_sql_practice_biblioteca
    WITH 
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'en_US.UTF-8'
    LC_CTYPE = 'en_US.UTF-8'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1;

COMMENT ON DATABASE ttops_sql_practice_biblioteca IS 'Base de datos para práctica de SQL - Biblioteca';
