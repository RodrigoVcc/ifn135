import bcrypt from 'bcryptjs';
import pool from '../config/database.js';

export async function listarEmpleados(req, res) {
  try {
    const page = Number(req.query.page) || null;
    const limit = 10;
    if (!page) {
      const { rows } = await pool.query(
        `SELECT e.empleado_id, e.nombre, e.apellido, r.cargo AS rol
         FROM empleados e
         JOIN roles r ON r.rol_id = e.rol_id
         ORDER BY e.empleado_id`
      );
      return res.json(rows);
    }
    const offset = (page - 1) * limit;
    const { rows } = await pool.query(
      `SELECT e.empleado_id, e.nombre, e.apellido, r.cargo AS rol
       FROM empleados e
       JOIN roles r ON r.rol_id = e.rol_id
       ORDER BY e.empleado_id
       LIMIT $1 OFFSET $2`, [limit, offset]
    );
    const countRes = await pool.query('SELECT COUNT(*)::int AS total FROM empleados');
    const total = countRes.rows[0].total;
    const totalPages = Math.ceil(total / limit);
    return res.json({ rows, total, page, totalPages });
  } catch (error) {
    console.error('Error al listar empleados:', error);
    return res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
}

export async function listarRoles(req, res) {
  try {
    const { rows } = await pool.query('SELECT rol_id, cargo FROM roles ORDER BY rol_id');
    return res.json(rows);
  } catch (error) {
    console.error('Error al listar roles:', error);
    return res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
}

export async function crearEmpleado(req, res) {
  const { nombre, apellido, password, rol_id } = req.body;

  if (!nombre || !apellido || !password || !rol_id) {
    return res.status(400).json({ mensaje: 'Todos los campos son requeridos' });
  }

  try {
    const { rows: roles } = await pool.query(
      'SELECT rol_id FROM roles WHERE rol_id = $1', [rol_id]
    );
    if (roles.length === 0) {
      return res.status(400).json({ mensaje: 'El rol seleccionado no existe' });
    }

    const { rows: existente } = await pool.query(
      'SELECT empleado_id FROM empleados WHERE nombre = $1', [nombre]
    );
    if (existente.length > 0) {
      return res.status(409).json({ mensaje: 'Ese nombre de usuario ya está en uso' });
    }

    const hash = await bcrypt.hash(password, 10);

    const { rows } = await pool.query(
      `INSERT INTO empleados (nombre, apellido, password, rol_id)
       VALUES ($1, $2, $3, $4)
       RETURNING empleado_id, nombre, apellido, rol_id`,
      [nombre, apellido, hash, rol_id]
    );

    return res.status(201).json({
      mensaje: 'Empleado creado exitosamente',
      empleado: rows[0],
    });
  } catch (error) {
    console.error('Error al crear empleado:', error);
    return res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
}

export async function editarEmpleado(req, res) {
  const { id } = req.params;
  const { nombre, apellido, password, rol_id } = req.body;

  if (!nombre || !apellido || !rol_id) {
    return res.status(400).json({ mensaje: 'Nombre, apellido y rol son requeridos' });
  }

  try {
    const { rows: existente } = await pool.query(
      'SELECT empleado_id FROM empleados WHERE empleado_id = $1', [id]
    );
    if (existente.length === 0) {
      return res.status(404).json({ mensaje: 'Empleado no encontrado' });
    }

    const { rows: nombreDuplicado } = await pool.query(
      'SELECT empleado_id FROM empleados WHERE nombre = $1 AND empleado_id != $2', [nombre, id]
    );
    if (nombreDuplicado.length > 0) {
      return res.status(409).json({ mensaje: 'Ese nombre de usuario ya está en uso' });
    }

    if (password) {
      const hash = await bcrypt.hash(password, 10);
      await pool.query(
        `UPDATE empleados SET nombre = $1, apellido = $2, password = $3, rol_id = $4
         WHERE empleado_id = $5`,
        [nombre, apellido, hash, rol_id, id]
      );
    } else {
      await pool.query(
        `UPDATE empleados SET nombre = $1, apellido = $2, rol_id = $3
         WHERE empleado_id = $4`,
        [nombre, apellido, rol_id, id]
      );
    }

    return res.json({ mensaje: 'Empleado actualizado exitosamente' });
  } catch (error) {
    console.error('Error al editar empleado:', error);
    return res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
}

export async function eliminarEmpleado(req, res) {
  const { id } = req.params;

  try {
    const { rows } = await pool.query(
      'SELECT empleado_id FROM empleados WHERE empleado_id = $1', [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ mensaje: 'Empleado no encontrado' });
    }

    await pool.query('DELETE FROM empleados WHERE empleado_id = $1', [id]);

    return res.json({ mensaje: 'Empleado eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar empleado:', error);
    return res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
}