import pool from '../config/database.js';

//Ver pedidos (READ)
export async function listarPedidos(req, res) {
  try {
    const page = Number(req.query.page) || null;
    const limit = 10;
    if (!page) {
      const pedidos = await pool.query(
        `SELECT p.pedido_id, p.fecha_pedido, p.fecha_entrega, p.estado
         FROM pedidos p
         ORDER BY p.pedido_id DESC`
      );
      const detalles = await pool.query(`
        SELECT
          dp.detalle_pedido_id,
          dp.pedido_id,
          prd.nombre AS producto,
          dp.cantidad,
          dp.precio_unitario,
          dp.subtotal
        FROM detalle_pedidos dp
        JOIN productos prd ON prd.producto_id = dp.producto_id
        JOIN pedidos p ON p.pedido_id = dp.pedido_id`
      );
      const pedidosConDetalles = pedidos.rows.map(pedido => ({
        ...pedido,
        detalles: detalles.rows.filter(
          d => d.pedido_id === pedido.pedido_id
        )
      }));
      return res.json(pedidosConDetalles);
    }
    const offset = (page - 1) * limit;
    const pedidosRes = await pool.query(
      `SELECT p.pedido_id, p.fecha_pedido, p.fecha_entrega, p.estado
       FROM pedidos p
       ORDER BY p.pedido_id DESC
       LIMIT $1 OFFSET $2`, [limit, offset]
    );
    const pedidoIds = pedidosRes.rows.map(r => r.pedido_id);
    const detallesRes = await pool.query(
      `SELECT dp.detalle_pedido_id, dp.pedido_id, prd.nombre AS producto, dp.cantidad, dp.precio_unitario, dp.subtotal
       FROM detalle_pedidos dp
       JOIN productos prd ON prd.producto_id = dp.producto_id
       WHERE dp.pedido_id = ANY($1::int[])`, [pedidoIds]
    );
    const pedidosConDetalles = pedidosRes.rows.map(pedido => ({
      ...pedido,
      detalles: detallesRes.rows.filter(d => d.pedido_id === pedido.pedido_id)
    }));
    const countRes = await pool.query('SELECT COUNT(*)::int AS total FROM pedidos');
    const total = countRes.rows[0].total;
    const totalPages = Math.ceil(total / limit);
    return res.json({ rows: pedidosConDetalles, total, page, totalPages });
  } catch (error) {
    console.error('Error al listar pedidos:', error);
    console.log('Error a la hora de cargar pedidos',error);
    return res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
}




export async function crearPedido(req, res) {
  const { fecha_pedido, fecha_entrega, estado } = req.body;

  

 if (!fecha_pedido || !fecha_entrega || !estado) {
    return res.status(400).json({ mensaje: 'Todos los campos son requeridos' });
  }

  try {
        
    const { rows } = await pool.query(
      `INSERT INTO pedidos (fecha_pedido, fecha_entrega, estado)
       VALUES ($1, $2, $3)
       RETURNING fecha_pedido, fecha_entrega, estado`,
      [fecha_pedido, fecha_entrega, estado]
    );

    return res.status(201).json({
      mensaje: 'Pedido creado exitosamente',
      empleado: rows[0],
    });
  } catch (error) {
    console.error('Error al crear pedido:', error);
    return res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
}

export async function editarPedido(req, res) {
  const { id } = req.params;
  const { fecha_pedido, fecha_entrega, estado } = req.body;

  if (!fecha_pedido || !fecha_entrega || !estado) {
    return res.status(400).json({ mensaje: 'fecha de entrega, fecha del pedido son requeridos' });
  }

  try {
    const { rows: existente } = await pool.query(
      'SELECT pedido_id FROM pedidos WHERE pedido_id = $1', [id]
    );
    if (existente.length === 0) {
      return res.status(404).json({ mensaje: 'Empleado no encontrado' });
    }

    await pool.query(
        `UPDATE pedidos SET fecha_pedido = $1, fecha_entrega = $2, estado = $3
         WHERE pedido_id = $4`,
        [fecha_pedido, fecha_entrega, estado, id]
      );


    
    return res.json({ mensaje: 'Empleado actualizado exitosamente' });
  } catch (error) {
    console.error('Error al editar empleado:', error);
    return res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
}

export async function eliminarPedido(req, res) {
  const { id } = req.params;

  try {
    const { rows } = await pool.query(
      'SELECT pedido_id FROM pedidos WHERE pedido_id = $1', [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ mensaje: 'Pedido no encontrado' });
    }

    await pool.query('DELETE FROM pedidos WHERE pedido_id = $1', [id]);

    return res.json({ mensaje: 'Pedido eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar pedido:', error);
    return res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
}


export async function crearDetallesPedido(req, res) {
  const { pedido_id, producto_id, cantidad, precio_unitario, subtotal } = req.body;

  

  if (!pedido_id || !producto_id || !cantidad || !precio_unitario || !subtotal) {
    return res.status(400).json({ mensaje: 'Todos los campos son requeridos' });
  }

  try {

    const { rows: productos } = await pool.query(
      'SELECT producto_id FROM productos WHERE producto_id = $1', [producto_id]
    );
    if (productos.length === 0) {
      return res.status(400).json({ mensaje: 'El producto seleccionado no existe' });
    }
        
    const { rows } = await pool.query(
      `INSERT INTO detalle_pedidos (pedido_id, producto_id, cantidad, precio_unitario, subtotal)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING pedido_id, producto_id, cantidad, precio_unitario, subtotal`,
      [pedido_id, producto_id, cantidad, precio_unitario, subtotal]
    );

    return res.status(201).json({
      mensaje: 'Detalles del Pedido creado exitosamente',
      empleado: rows[0],
    });
  } catch (error) {
    console.error('Error al crear detalles del pedido:', error);
    return res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
}

export async function editarDetallesPedido(req, res) {
  const { id, pedido_id } = req.params;
  const {  producto_id, cantidad, precio_unitario, subtotal } = req.body;

  if (!producto_id || !cantidad || !precio_unitario || !subtotal) {
    return res.status(400).json({ mensaje: 'Todos los campos son requeridos' });
  }

  try {
    const { rows: existente } = await pool.query(
      'SELECT detalle_pedido_id FROM detalle_pedidos WHERE detalle_pedido_id = $1 AND pedido_id = $2', [id, pedido_id]
    );
    if (existente.length === 0) {
      return res.status(404).json({ mensaje: 'Empleado no encontrado' });
    }

    await pool.query(
        `UPDATE detalle_pedidos SET producto_id = $1, cantidad = $2, precio_unitario = $3, subtotal= $4
         WHERE detalle_pedido_id = $5 AND pedido_id = $6`,
        [ producto_id, cantidad, precio_unitario, subtotal, id, pedido_id]
      );


    
    return res.json({ mensaje: 'Detalles actualizado exitosamente' });
  } catch (error) {
    console.error('Error al editar detalles:', error);
    return res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
}

export async function eliminarDetallesPedido(req, res) {
  const { id } = req.params;

  try {
    const { rows } = await pool.query(
      'SELECT detalle_pedido_id FROM detalle_pedidos WHERE detalle_pedido_id = $1', [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ mensaje: 'Detalle del Pedido no encontrado' });
    }

    await pool.query('DELETE FROM detalle_pedidos WHERE detalle_pedido_id = $1', [id]);

    return res.json({ mensaje: 'Pedido eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar detalle del pedido:', error);
    return res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
}

export async function listarProdcutos(req, res) {
  try {
    const { rows } = await pool.query('SELECT producto_id, nombre FROM productos ORDER BY producto_id');
    return res.json(rows);
  } catch (error) {
    console.error('Error al listar productos:', error);
    return res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
}