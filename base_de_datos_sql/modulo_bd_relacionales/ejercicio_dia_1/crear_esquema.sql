-- crear_esquema.sql
-- Ejecutar con: psql -U postgres -d ttops_sql_practice -f crear_esquema.sql

-- Dominios
CREATE DOMAIN email_type AS TEXT CHECK (VALUE ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z]{2,}$');
CREATE DOMAIN phone_type AS TEXT CHECK (VALUE ~ '^\+?[0-9\s\-\(\)]{7,20}$');
CREATE DOMAIN rating_type AS SMALLINT CHECK (VALUE BETWEEN 1 AND 5);

-- Tablas
CREATE TABLE usuarios (
    id_usuario BIGSERIAL PRIMARY KEY,
    email email_type NOT NULL UNIQUE,
    contrasena_hash TEXT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellidos VARCHAR(150),
    telefono phone_type,
    fecha_registro TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_ultimo_login TIMESTAMPTZ,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    es_administrador BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_usuarios_email ON usuarios USING hash (email);
CREATE INDEX idx_usuarios_activo ON usuarios (activo);

CREATE TABLE categorias (
    id_categoria BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    id_categoria_padre BIGINT REFERENCES categorias(id_categoria) ON DELETE SET NULL,
    activa BOOLEAN NOT NULL DEFAULT TRUE,
    ruta TEXT,
    UNIQUE (id_categoria_padre, nombre)
);

CREATE INDEX idx_categorias_padre ON categorias (id_categoria_padre);

CREATE TABLE productos (
    id_producto BIGSERIAL PRIMARY KEY,
    sku VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    precio NUMERIC(10,2) NOT NULL CHECK (precio >= 0),
    precio_oferta NUMERIC(10,2) CHECK (precio_oferta >= 0 AND precio_oferta <= precio),
    costo NUMERIC(10,2) CHECK (costo >= 0),
    id_categoria BIGINT NOT NULL REFERENCES categorias(id_categoria) ON DELETE RESTRICT,
    stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
    stock_minimo INT NOT NULL DEFAULT 5 CHECK (stock_minimo >= 0),
    peso_kg NUMERIC(6,3),
    dimensiones JSONB,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION update_fecha_actualizacion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_fecha_actualizacion_producto
    BEFORE UPDATE ON productos
    FOR EACH ROW EXECUTE FUNCTION update_fecha_actualizacion();

CREATE INDEX idx_productos_categoria_activo ON productos (id_categoria, activo);
CREATE INDEX idx_productos_sku ON productos (sku);
CREATE INDEX idx_productos_precio ON productos (precio) WHERE activo;

CREATE TABLE imagenes_productos (
    id_imagen BIGSERIAL PRIMARY KEY,
    id_producto BIGINT NOT NULL REFERENCES productos(id_producto) ON DELETE CASCADE,
    url_imagen TEXT NOT NULL CHECK (url_imagen ~ '^https?://'),
    orden SMALLINT NOT NULL DEFAULT 1,
    es_principal BOOLEAN NOT NULL DEFAULT FALSE,
    UNIQUE (id_producto, url_imagen),
    CONSTRAINT chk_unica_principal
        EXCLUDE (id_producto WITH =) WHERE (es_principal)
        USING INDEX TABLESPACE pg_default
);

CREATE TABLE direcciones_envio (
    id_direccion BIGSERIAL PRIMARY KEY,
    id_usuario BIGINT NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    alias VARCHAR(50) NOT NULL,
    direccion TEXT NOT NULL,
    ciudad VARCHAR(100) NOT NULL,
    codigo_postal VARCHAR(20) NOT NULL,
    provincia VARCHAR(100),
    pais VARCHAR(100) NOT NULL,
    telefono_contacto phone_type,
    es_principal BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_registro TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_direcciones_usuario ON direcciones_envio (id_usuario);

CREATE TABLE metodos_pago (
    id_metodo_pago BIGSERIAL PRIMARY KEY,
    id_usuario BIGINT NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    proveedor VARCHAR(20) NOT NULL CHECK (proveedor IN ('stripe', 'paypal', 'cripto', 'transferencia')),
    token_externo TEXT,
    tipo VARCHAR(20) NOT NULL,
    ultimos_digitos CHAR(4),
    expiracion_mes SMALLINT CHECK (expiracion_mes BETWEEN 1 AND 12),
    expiracion_anio SMALLINT CHECK (expiracion_anio >= EXTRACT(YEAR FROM NOW())),
    es_principal BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_registro TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    activo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_metodos_pago_usuario ON metodos_pago (id_usuario);

CREATE TABLE pedidos (
    id_pedido BIGSERIAL PRIMARY KEY,
    numero_pedido VARCHAR(50) NOT NULL UNIQUE,
    id_usuario BIGINT NOT NULL REFERENCES usuarios(id_usuario),
    id_direccion_envio BIGINT NOT NULL REFERENCES direcciones_envio(id_direccion),
    id_metodo_pago BIGINT NOT NULL REFERENCES metodos_pago(id_metodo_pago),
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente'
        CHECK (estado IN ('pendiente', 'procesando', 'pagado', 'enviado', 'entregado', 'cancelado', 'devuelto')),
    subtotal NUMERIC(10,2) NOT NULL CHECK (subtotal >= 0),
    impuestos NUMERIC(10,2) NOT NULL CHECK (impuestos >= 0),
    envio NUMERIC(10,2) NOT NULL CHECK (envio >= 0),
    total NUMERIC(10,2) NOT NULL CHECK (total = subtotal + impuestos + envio AND total >= 0),
    notas TEXT,
    fecha_pedido TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_pago TIMESTAMPTZ,
    fecha_envio TIMESTAMPTZ,
    fecha_entrega TIMESTAMPTZ,
    CONSTRAINT chk_fecha_pago CHECK (
        (estado NOT IN ('pagado', 'enviado', 'entregado') AND fecha_pago IS NULL) OR
        (estado IN ('pagado', 'enviado', 'entregado') AND fecha_pago IS NOT NULL)
    )
);

CREATE INDEX idx_pedidos_usuario_fecha ON pedidos (id_usuario, fecha_pedido DESC);
CREATE INDEX idx_pedidos_estado_fecha ON pedidos (estado, fecha_pedido);
CREATE INDEX idx_pedidos_numero ON pedidos USING hash (numero_pedido);

CREATE TABLE detalles_pedidos (
    id_detalle_pedido BIGSERIAL PRIMARY KEY,
    id_pedido BIGINT NOT NULL REFERENCES pedidos(id_pedido) ON DELETE CASCADE,
    id_producto BIGINT NOT NULL REFERENCES productos(id_producto),
    cantidad INT NOT NULL CHECK (cantidad > 0),
    precio_unitario NUMERIC(10,2) NOT NULL CHECK (precio_unitario >= 0),
    subtotal NUMERIC(10,2) GENERATED ALWAYS AS (cantidad * precio_unitario) STORED
);

CREATE INDEX idx_detalles_pedido ON detalles_pedidos (id_pedido);
CREATE INDEX idx_detalles_producto ON detalles_pedidos (id_producto);

CREATE TABLE resenas (
    id_resena BIGSERIAL PRIMARY KEY,
    id_producto BIGINT NOT NULL REFERENCES productos(id_producto),
    id_usuario BIGINT NOT NULL REFERENCES usuarios(id_usuario),
    id_pedido BIGINT NOT NULL REFERENCES pedidos(id_pedido),
    calificacion rating_type NOT NULL,
    titulo VARCHAR(150),
    comentario TEXT,
    fecha_resena TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    aprobada BOOLEAN NOT NULL DEFAULT FALSE,
    UNIQUE (id_producto, id_pedido)
);

CREATE INDEX idx_resenas_producto ON resenas (id_producto) WHERE aprobada;
CREATE INDEX idx_resenas_usuario ON resenas (id_usuario);

CREATE TABLE inventario_movimientos (
    id_movimiento BIGSERIAL PRIMARY KEY,
    id_producto BIGINT NOT NULL REFERENCES productos(id_producto),
    tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('entrada', 'salida', 'ajuste')),
    cantidad INT NOT NULL,
    motivo VARCHAR(200),
    referencia VARCHAR(100),
    id_usuario_responsable BIGINT REFERENCES usuarios(id_usuario),
    fecha_movimiento TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_inventario_producto_fecha ON inventario_movimientos (id_producto, fecha_movimiento DESC);
