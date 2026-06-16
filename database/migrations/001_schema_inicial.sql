CREATE TABLE IF NOT EXISTS roles (
  rol_id    SERIAL PRIMARY KEY,
  cargo     VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS permisos (
  permiso_id  SERIAL PRIMARY KEY,
  permiso     VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS roles_permiso (
  rol_id      INTEGER NOT NULL REFERENCES roles(rol_id) ON DELETE CASCADE,
  permiso_id  INTEGER NOT NULL REFERENCES permisos(permiso_id) ON DELETE CASCADE,
  PRIMARY KEY (rol_id, permiso_id)
);

CREATE TABLE IF NOT EXISTS empleados (
  empleado_id SERIAL PRIMARY KEY,
  nombre      VARCHAR(100) NOT NULL,
  apellido    VARCHAR(100) NOT NULL,
  password    VARCHAR(255) NOT NULL,
  rol_id      INTEGER NOT NULL REFERENCES roles(rol_id)
);

CREATE TABLE IF NOT EXISTS categorias (
  categoria_id  SERIAL PRIMARY KEY,
  categoria     VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS unidades (
  unidad_id     SERIAL PRIMARY KEY,
  unidad_medida VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS materiales (
  material_id   SERIAL PRIMARY KEY,
  nombre        VARCHAR(150) NOT NULL,
  stock_actual  NUMERIC(10,2) NOT NULL DEFAULT 0,
  precio_costo  NUMERIC(10,2) NOT NULL DEFAULT 0,
  stock_minimo  NUMERIC(10,2) NOT NULL DEFAULT 0,
  unidad_id     INTEGER REFERENCES unidades(unidad_id),
  categoria_id  INTEGER REFERENCES categorias(categoria_id)
);

CREATE TABLE IF NOT EXISTS productos (
  producto_id   SERIAL PRIMARY KEY,
  nombre        VARCHAR(150) NOT NULL,
  precio_costo  NUMERIC(10,2) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS productos_materiales (
  producto_id         INTEGER NOT NULL REFERENCES productos(producto_id) ON DELETE CASCADE,
  material_id         INTEGER NOT NULL REFERENCES materiales(material_id) ON DELETE CASCADE,
  cantidad_por_unidad NUMERIC(10,4) NOT NULL DEFAULT 1,
  PRIMARY KEY (producto_id, material_id)
);

CREATE TABLE IF NOT EXISTS pedidos (
  pedido_id     SERIAL PRIMARY KEY,
  fecha_pedido  DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_entrega DATE,
  estado        VARCHAR(30) NOT NULL DEFAULT 'pendiente'
    CHECK (estado IN ('pendiente', 'en_produccion', 'listo', 'entregado', 'cancelado'))
);

CREATE TABLE IF NOT EXISTS detalle_pedidos (
  detalle_pedido_id SERIAL PRIMARY KEY,
  pedido_id         INTEGER NOT NULL REFERENCES pedidos(pedido_id) ON DELETE CASCADE,
  producto_id       INTEGER NOT NULL REFERENCES productos(producto_id),
  cantidad          NUMERIC(10,2) NOT NULL DEFAULT 1,
  precio_unitario   NUMERIC(10,2) NOT NULL DEFAULT 0
);
