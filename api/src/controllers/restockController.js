import pool from '../config/database.js';

export async function listarRestock(req, res) {
  try {
    const page = Number(req.query.page) || null;
    const limit = 10;
    if (!page) {
      const { rows } = await pool.query(
        `SELECT r.restock_id, r.material_id, m.nombre AS material_nombre,
                r.cantidad_solicitada, r.estado,
                r.creado_por, c.nombre AS creador_nombre,
                r.fecha_creacion,
                r.aprobado_por, a.nombre AS aprobador_nombre,
                r.fecha_aprobacion
         FROM restock r
         JOIN materiales m ON m.material_id = r.material_id
         JOIN empleados c ON c.empleado_id = r.creado_por
         LEFT JOIN empleados a ON a.empleado_id = r.aprobado_por
         ORDER BY r.fecha_creacion DESC`
      );
      return res.json(rows);
    }
    const offset = (page - 1) * limit;
    const { rows } = await pool.query(
      `SELECT r.restock_id, r.material_id, m.nombre AS material_nombre,
              r.cantidad_solicitada, r.estado,
              r.creado_por, c.nombre AS creador_nombre,
              r.fecha_creacion,
              r.aprobado_por, a.nombre AS aprobador_nombre,
              r.fecha_aprobacion
       FROM restock r
       JOIN materiales m ON m.material_id = r.material_id
       JOIN empleados c ON c.empleado_id = r.creado_por
       LEFT JOIN empleados a ON a.empleado_id = r.aprobado_por
       ORDER BY r.fecha_creacion DESC
       LIMIT $1 OFFSET $2`, [limit, offset]
    );
    const countRes = await pool.query('SELECT COUNT(*)::int AS total FROM restock');
    const total = countRes.rows[0].total;
    const totalPages = Math.ceil(total / limit);
    return res.json({ rows, total, page, totalPages });
  } catch (error) {
    console.error('Error al listar restock:', error);
    return res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
}

export async function crearRestock(req, res) {
  const { material_id, cantidad_solicitada } = req.body;

  if (!material_id || !cantidad_solicitada) {
    return res.status(400).json({ mensaje: 'Todos los campos son requeridos' });
  }

  if (!Number.isInteger(Number(cantidad_solicitada)) || Number(cantidad_solicitada) <= 0) {
    return res.status(400).json({ mensaje: 'La cantidad debe ser un numero entero positivo' });
  }

  try {
    const { rows: material } = await pool.query(
      'SELECT material_id FROM materiales WHERE material_id = $1', [material_id]
    );
    if (material.length === 0) {
      return res.status(400).json({ mensaje: 'El material seleccionado no existe' });
    }

    const { rows } = await pool.query(
      `INSERT INTO restock (material_id, cantidad_solicitada, creado_por)
       VALUES ($1, $2, $3)
       RETURNING restock_id, material_id, cantidad_solicitada, estado, fecha_creacion`,
      [material_id, cantidad_solicitada, req.usuario.empleado_id]
    );

    return res.status(201).json({
      mensaje: 'Solicitud de restock creada exitosamente',
      restock: rows[0],
    });
  } catch (error) {
    console.error('Error al crear restock:', error);
    return res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
}

export async function aprobarRestock(req, res) {
  const { id } = req.params;

  try {
    const { rows } = await pool.query(
      'SELECT restock_id, estado FROM restock WHERE restock_id = $1', [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ mensaje: 'Solicitud no encontrada' });
    }
    if (rows[0].estado !== 'pendiente') {
      return res.status(400).json({ mensaje: 'La solicitud ya fue procesada' });
    }

    await pool.query(
      `UPDATE restock SET estado = 'aprobado', aprobado_por = $1, fecha_aprobacion = NOW()
       WHERE restock_id = $2`,
      [req.usuario.empleado_id, id]
    );

    return res.json({ mensaje: 'Solicitud aprobada exitosamente' });
  } catch (error) {
    console.error('Error al aprobar restock:', error);
    return res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
}

export async function rechazarRestock(req, res) {
  const { id } = req.params;

  try {
    const { rows } = await pool.query(
      'SELECT restock_id, estado FROM restock WHERE restock_id = $1', [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ mensaje: 'Solicitud no encontrada' });
    }
    if (rows[0].estado !== 'pendiente') {
      return res.status(400).json({ mensaje: 'La solicitud ya fue procesada' });
    }

    await pool.query(
      `UPDATE restock SET estado = 'rechazado', aprobado_por = $1, fecha_aprobacion = NOW()
       WHERE restock_id = $2`,
      [req.usuario.empleado_id, id]
    );

    return res.json({ mensaje: 'Solicitud rechazada' });
  } catch (error) {
    console.error('Error al rechazar restock:', error);
    return res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
}
