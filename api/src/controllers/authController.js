import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/database.js';

export async function login(req, res) {
  const { nombre, password } = req.body;

  if (!nombre || !password) {
    return res.status(400).json({ mensaje: 'Nombre y contraseña son requeridos' });
  }

  try {
    const { rows } = await pool.query(
      `SELECT e.empleado_id, e.nombre, e.apellido, e.password, r.cargo AS rol
       FROM empleados e
       JOIN roles r ON r.rol_id = e.rol_id
       WHERE e.nombre = $1`,
      [nombre]
    );

    const empleado = rows[0];

    if (!empleado) {
      return res.status(401).json({ mensaje: 'Credenciales incorrectas' });
    }

    const passwordValida = await bcrypt.compare(password, empleado.password);

    if (!passwordValida) {
      return res.status(401).json({ mensaje: 'Credenciales incorrectas' });
    }

    const token = jwt.sign(
      {
        empleado_id: empleado.empleado_id,
        nombre: empleado.nombre,
        apellido: empleado.apellido,
        rol: empleado.rol,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN ?? '8h' }
    );

    return res.json({
      token,
      usuario: {
        empleado_id: empleado.empleado_id,
        nombre: empleado.nombre,
        apellido: empleado.apellido,
        rol: empleado.rol,
      },
    });
  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
}

export function perfil(req, res) {
  return res.json({ usuario: req.usuario });
}
