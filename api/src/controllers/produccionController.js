import pool from '../config/database.js';

export async function listarMaterialUsado(req, res) {
  try {
    const page = Number(req.query.page) || null;
    const limit = 10;
    if (!page) {
      const { rows } = await pool.query(
        `SELECT pm.producto_id, prd.nombre AS producto, pm.material_id, m.nombre AS material, pm.cantidad_por_unidad, pm.pedido_id
         FROM productos_materiales pm
         JOIN productos prd ON prd.producto_id = pm.producto_id
         JOIN materiales m ON m.material_id = pm.material_id
         JOIN pedidos p ON p.pedido_id = pm.pedido_id
         ORDER BY pm.pedido_id`
      );
      return res.json(rows);
    }
    const offset = (page - 1) * limit;
    const { rows } = await pool.query(
      `SELECT pm.producto_id, prd.nombre AS producto, pm.material_id, m.nombre AS material, pm.cantidad_por_unidad, pm.pedido_id
       FROM productos_materiales pm
       JOIN productos prd ON prd.producto_id = pm.producto_id
       JOIN materiales m ON m.material_id = pm.material_id
       JOIN pedidos p ON p.pedido_id = pm.pedido_id
       ORDER BY pm.pedido_id
       LIMIT $1 OFFSET $2`, [limit, offset]
    );
    const countRes = await pool.query('SELECT COUNT(*)::int AS total FROM productos_materiales');
    const total = countRes.rows[0].total;
    const totalPages = Math.ceil(total / limit);
    return res.json({ rows, total, page, totalPages });
  } catch (error) {
    console.error('Error al listar Material usado:', error);
    return res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
}


export async function crearMaterialUsado(req, res) {
  const { producto_id, material_id, cantidad_por_unidad, pedido_id } = req.body;

  if (!producto_id || !material_id || !cantidad_por_unidad || !pedido_id ) {
    return res.status(400).json({ mensaje: 'Todos los campos son requeridos' });
  }
  const consulta = await pool.connect();
  try {
    await consulta.query('BEGIN');
    const { rows: productos } = await consulta.query(
      'SELECT producto_id FROM productos WHERE producto_id = $1', [producto_id]
    );
    if (productos.length === 0) {
      return res.status(400).json({ mensaje: 'El producto seleccionado no existe' });
    }

    const { rows: materiales } = await consulta.query(
      'SELECT material_id FROM materiales WHERE material_id = $1', [material_id]
    );
    if (materiales.length === 0) {
      return res.status(400).json({ mensaje: 'El materiales seleccionado no existe' });
    }

    const { rows: pedidos } = await consulta.query(
      'SELECT pedido_id FROM pedidos WHERE pedido_id = $1', [pedido_id]
    );
    if (pedidos.length === 0) {
      return res.status(400).json({ mensaje: 'El pedido seleccionado no existe' });
    }
   
    const { rows } = await consulta.query(
      `INSERT INTO productos_materiales (producto_id, material_id, cantidad_por_unidad, pedido_id)
       VALUES ($1, $2, $3, $4)
       RETURNING producto_id, material_id, cantidad_por_unidad, pedido_id`,
      [producto_id, material_id, cantidad_por_unidad, pedido_id]
      
    );

    //Actualizar Materiales
    await consulta.query(
      `UPDATE materiales 
     SET stock_actual = stock_actual - $1
     WHERE material_id = $2`,
    [cantidad_por_unidad, material_id]
    );
    await consulta.query('COMMIT');
    return res.status(201).json({
      mensaje: 'Listado creado exitosamente',
      empleado: rows[0],
    });
  } catch (error) {
    console.error('Error al crear Listado:', error);
    return res.status(500).json({ mensaje: 'Error interno del servidor/guardar' });
  }
}

export async function  listarMateriales(req, res) {
  try {
    const { rows } = await pool.query('SELECT material_id, nombre FROM materiales ORDER BY material_id');
    return res.json(rows);
  } catch (error) {
    console.error('Error al listar materiales:', error);
    return res.status(500).json({ mensaje: 'Error interno del servidor/material' });
  }
}
export async function  listarProdcutos(req, res) {
  try {
    const { rows } = await pool.query('SELECT producto_id, nombre FROM productos ORDER BY producto_id');
    return res.json(rows);
  } catch (error) {
    console.error('Error al listar productos:', error);
    return res.status(500).json({ mensaje: 'Error interno del servidor/producto' });
  }
}
export async function  listarPedido(req, res) {
  try {
    const { rows } = await pool.query('SELECT pedido_id FROM pedidos ORDER BY pedido_id');
    return res.json(rows);
  } catch (error) {
    console.error('Error al listar pedidos:', error);
    return res.status(500).json({ mensaje: 'Error interno del servidor/pedido' });
  }
}
