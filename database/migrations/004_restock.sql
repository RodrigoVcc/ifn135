DROP TABLE IF EXISTS restock;

CREATE TABLE restock (
  restock_id      SERIAL PRIMARY KEY,
  material_id     INTEGER NOT NULL REFERENCES materiales(material_id),
  cantidad_solicitada INTEGER NOT NULL CHECK (cantidad_solicitada > 0),
  estado          VARCHAR(20) NOT NULL DEFAULT 'pendiente'
                  CHECK (estado IN ('pendiente', 'aprobado', 'rechazado')),
  creado_por      INTEGER NOT NULL REFERENCES empleados(empleado_id),
  fecha_creacion  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  aprobado_por    INTEGER REFERENCES empleados(empleado_id),
  fecha_aprobacion TIMESTAMP
);
