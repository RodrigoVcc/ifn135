INSERT INTO roles (cargo) VALUES
  ('Administrador'),
  ('Recepcionista'),
  ('Operario'),
  ('Instalador')
ON CONFLICT (cargo) DO NOTHING;

INSERT INTO permisos (permiso) VALUES
  ('ver_pedidos'),
  ('crear_pedidos'),
  ('editar_pedidos'),
  ('ver_inventario'),
  ('editar_inventario'),
  ('ver_produccion'),
  ('gestionar_produccion'),
  ('gestionar_empleados'),
  ('ver_reportes')
ON CONFLICT (permiso) DO NOTHING;

INSERT INTO roles_permiso (rol_id, permiso_id)
SELECT r.rol_id, p.permiso_id
FROM roles r, permisos p
WHERE r.cargo = 'Administrador'
ON CONFLICT DO NOTHING;

INSERT INTO roles_permiso (rol_id, permiso_id)
SELECT r.rol_id, p.permiso_id
FROM roles r, permisos p
WHERE r.cargo = 'Recepcionista'
  AND p.permiso IN ('ver_pedidos', 'crear_pedidos', 'editar_pedidos', 'ver_inventario')
ON CONFLICT DO NOTHING;

INSERT INTO roles_permiso (rol_id, permiso_id)
SELECT r.rol_id, p.permiso_id
FROM roles r, permisos p
WHERE r.cargo = 'Operario'
  AND p.permiso IN ('ver_pedidos', 'ver_inventario', 'ver_produccion', 'gestionar_produccion')
ON CONFLICT DO NOTHING;

INSERT INTO roles_permiso (rol_id, permiso_id)
SELECT r.rol_id, p.permiso_id
FROM roles r, permisos p
WHERE r.cargo = 'Instalador'
  AND p.permiso IN ('ver_pedidos')
ON CONFLICT DO NOTHING;

INSERT INTO empleados (nombre, apellido, password, rol_id)
SELECT 'Admin', 'Sistema',
       '$2b$10$dv8WDwxKZydAEtLae2nqyeyumKx6V1lfQL2djlxGsfcQ4thFWV7Cq',
       r.rol_id
FROM roles r
WHERE r.cargo = 'Administrador'
ON CONFLICT DO NOTHING;