//Creo que hay que eliminar este archivo
import pool from '../config/database.js';

export async function listarMateriales(req, res) {
  try {
    const { rows } = await pool.query(
      'SELECT material_id, nombre, stock_actual, unidad_id FROM materialesss ORDER BY nombre'
    );
    return res.json(rows);
  } catch (error) {
    console.error('Error al listar materiales:', error);
    return res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
}
