import pool from '../config/database.js';

export async function listarProductos(req, res) {
  try {
    const page = Number(req.query.page) || null;
    const limit = 10;
    if (!page) {
      const { rows } = await pool.query('SELECT producto_id, nombre, precio_costo FROM productos ORDER BY nombre');
      return res.json(rows);
    }
    const offset = (page - 1) * limit;
    const { rows } = await pool.query('SELECT producto_id, nombre, precio_costo FROM productos ORDER BY nombre LIMIT $1 OFFSET $2', [limit, offset]);
    const countRes = await pool.query('SELECT COUNT(*)::int AS total FROM productos');
    const total = countRes.rows[0].total;
    const totalPages = Math.ceil(total / limit);
    return res.json({ rows, total, page, totalPages });
  } catch (error) {
    console.error('Error al listar productos:', error);
    return res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
}
