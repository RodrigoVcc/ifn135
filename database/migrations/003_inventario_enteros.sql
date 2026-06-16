ALTER TABLE inventario
ALTER COLUMN cantidad_actual TYPE INTEGER USING cantidad_actual::integer,
ALTER COLUMN minimo TYPE INTEGER USING minimo::integer;
