import pool from '../invpool.js';

export async function listarInventario(req, res) {
  try {
    const page = Number(req.query.page) || null;
    const limit = 10;
    if (!page) {
      const { rows } = await pool.query(
        `SELECT material_id, nombre, stock_actual, precio_costo, stock_minimo ,
         u.unidad_medida AS unidad, c.categoria AS categoria
         FROM materiales m
         JOIN unidades u ON u.unidad_id = m.unidad_id
         JOIN categorias c ON c.categoria_id = m.categoria_id
         ORDER BY nombre`
      );
      return res.json(rows);
    }
    const offset = (page - 1) * limit;
    const { rows } = await pool.query(
      `SELECT material_id, nombre, stock_actual, precio_costo, stock_minimo ,
       u.unidad_medida AS unidad, c.categoria AS categoria
       FROM materiales m
       JOIN unidades u ON u.unidad_id = m.unidad_id
       JOIN categorias c ON c.categoria_id = m.categoria_id
       ORDER BY nombre
       LIMIT $1 OFFSET $2`, [limit, offset]
    );
    const countRes = await pool.query('SELECT COUNT(*)::int AS total FROM materiales');
    const total = countRes.rows[0].total;
    const totalPages = Math.ceil(total / limit);
    return res.json({ rows, total, page, totalPages });
  } catch (error) {
    console.error('Error al listar inventario:', error);
    return res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
}

export async function listarCategorias(req, res) {
  try {
    const { rows } = await pool.query('SELECT categoria_id, categoria FROM categorias ORDER BY categoria_id');
    return res.json(rows);
  } catch (error) {
    console.error('Error al listar categoria:', error);
    return res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
}

export async function listarUnidades(req, res) {
  try {
    const { rows } = await pool.query('SELECT unidad_id, unidad_medida FROM unidades ORDER BY unidad_id');
    return res.json(rows);
  } catch (error) {
    console.error('Error al listar unidades:', error);
    return res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
}

export async function crearInventario(req, res) {
  const { nombre, stock_actual, precio_costo, stock_minimo, unidad_id, categoria_id  } = req.body;

  if (!nombre || stock_actual === undefined || !precio_costo|| stock_minimo === undefined || !unidad_id ||!categoria_id) {
    return res.status(400).json({ mensaje: 'Todos los campos son requeridos' });
  }

  if (!Number.isInteger(Number(stock_actual)) || !Number.isInteger(Number(stock_minimo))) {
    return res.status(400).json({ mensaje: 'Cantidad actual y minimo deben ser numeros enteros' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO materiales (nombre, stock_actual, precio_costo, stock_minimo, unidad_id, categoria_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING material_id, nombre, stock_actual, precio_costo, stock_minimo, unidad_id, categoria_id`,
      [nombre, stock_actual, precio_costo, stock_minimo, unidad_id, categoria_id]
    );

    return res.status(201).json({
      mensaje: 'Item creado exitosamente',
      item: rows[0],
    });
  } catch (error) {
    console.error('Error al crear item:', error);
    return res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
}

export async function editarInventario(req, res) {
  const { id } = req.params;
  const { nombre, stock_actual, precio_costo,stock_minimo, unidad_id, categoria_id } = req.body;

  if (!nombre || stock_actual === undefined || !precio_costo|| stock_minimo === undefined || !unidad_id ||!categoria_id) {
    return res.status(400).json({ mensaje: 'Todos los campos son requeridos' });
  }

  if (!Number.isInteger(Number(stock_actual)) || !Number.isInteger(Number(stock_minimo))) {
    return res.status(400).json({ mensaje: 'Cantidad actual y minimo deben ser numeros enteros' });
  }

  try {
    const { rows: existente } = await pool.query(
      'SELECT material_id FROM materiales WHERE material_id = $1', [id]
    );
    if (existente.length === 0) {
      return res.status(404).json({ mensaje: 'Item no encontrado' });
    }

    await pool.query(
      `UPDATE materiales SET nombre = $1, stock_actual = $2, precio_costo = $3,
      stock_minimo = $4, unidad_id = $5, categoria_id = $6
       WHERE material_id = $7`,
      [nombre, stock_actual, precio_costo, stock_minimo, unidad_id, categoria_id, id]
    );

    return res.json({ mensaje: 'Item actualizado exitosamente' });
  } catch (error) {
    console.error('Error al editar item:', error);
    return res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
}

export async function eliminarInventario(req, res) {
  const { id } = req.params;

  try {
    const { rows } = await pool.query(
      'SELECT material_id FROM materiales WHERE material_id = $1', [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ mensaje: 'Item no encontrado' });
    }

    await pool.query('DELETE FROM materiales WHERE material_id = $1', [id]);

    return res.json({ mensaje: 'Item eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar item:', error);
    return res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
}



//INVENTARIO PRODUCTOS

export async function listarInventarioProductos(req, res) {
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

export async function crearProductos(req, res) {
  const { nombre, precio_costo } = req.body;

  if (!nombre || !precio_costo) {
    return res.status(400).json({ mensaje: 'Todos los campos son requeridos' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO productos (nombre, precio_costo)
       VALUES ($1, $2)
       RETURNING producto_id, nombre, precio_costo`,
      [nombre, precio_costo]
    );

    return res.status(201).json({
      mensaje: 'Producto creado exitosamente',
      item: rows[0],
    });
  } catch (error) {
    console.error('Error al crear producto:', error);
    return res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
}

export async function editarProducto(req, res) {
  const { id } = req.params;
  const { nombre, precio_costo } = req.body;

  if (!nombre || !precio_costo) {
    return res.status(400).json({ mensaje: 'Todos los campos son requeridos' });
  }

  try {
    const { rows: existente } = await pool.query(
      'SELECT producto_id FROM productos WHERE producto_id = $1', [id]
    );
    if (existente.length === 0) {
      return res.status(404).json({ mensaje: 'Producto no encontrado' });
    }

    await pool.query(
      `UPDATE productos SET nombre = $1, precio_costo = $2
       WHERE producto_id = $3`,
      [nombre, precio_costo, id]
    );

    return res.json({ mensaje: 'Producto actualizado exitosamente' });
  } catch (error) {
    console.error('Error al editar producto:', error);
    return res.status(500).json({ mensaje: 'Error interno del servidor al actualizar' });
  }
}

export async function eliminarProducto(req, res) {
  const { id } = req.params;

  try {
    const { rows } = await pool.query(
      'SELECT producto_id FROM productos WHERE producto_id = $1', [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ mensaje: 'producto no encontrado' });
    }

    await pool.query('DELETE FROM productos WHERE producto_id = $1', [id]);

    return res.json({ mensaje: 'Producto eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    return res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
}