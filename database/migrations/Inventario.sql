CREATE TABLE IF NOT EXISTS inventario (
  inventario_id   SERIAL PRIMARY KEY,
  nombre          VARCHAR(150) NOT NULL,
  cantidad_actual NUMERIC(10,2) NOT NULL DEFAULT 0,
  minimo          NUMERIC(10,2) NOT NULL DEFAULT 0
);

INSERT INTO inventario (nombre, cantidad_actual, minimo) VALUES
  ('Camisas', 120, 50),
  ('Hilos', 30, 20),
  ('Tinta', 15, 10)
ON CONFLICT DO NOTHING;
