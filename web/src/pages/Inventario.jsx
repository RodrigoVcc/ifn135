import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';

const ITEMS_PER_PAGE = 5;

const INITIAL = { nombre: '', stock_actual: '', precio_costo: '', stock_minimo: '', unidad_id: '', categoria_id: '' };

export default function Inventario() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const canEdit = usuario?.rol === 'Administrador';
  const canEditProducts = usuario?.rol === 'Administrador' || usuario?.rol === 'Operario';
  const [items, setItems] = useState([]);
  const [itemsPage, setItemsPage] = useState(1);
  const [itemsTotalPages, setItemsTotalPages] = useState(1);
  const [form, setForm] = useState(INITIAL);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [loading, setLoading] = useState(false);
  const [mostrarForm, setMostrar] = useState(false);
  const [editando, setEditando] = useState(null);
  const [confirmando, setConfirmando] = useState(null);
  const [alertaStock, setAlertaStock] = useState(null);
  const [productos, setProductos] = useState([]);
  const [productosPage, setProductosPage] = useState(1);
  const [productosTotalPages, setProductosTotalPages] = useState(1);
  const [categorias, setCategorias] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [mostrarProducto, setMostrarProducto] = useState(false);
  const [confirmandoProd, setConfirmandoProd] = useState(null);
  const [errorProd, setErrorProd] = useState('');
  const [exitoProd, setExitoProd] = useState('');
  const [productoForm, setProductoForm] = useState({ nombre: '', precio_costo: '' });

  useEffect(() => { cargarDatos(); }, [itemsPage, productosPage]);

  async function cargarDatos() {
    try {
      const [itemsData, categoriasData, unidadesData, productosData] = await Promise.all([
        api.get(`/inventario?page=${itemsPage}`),
        api.get('/inventario/categorias'),
        api.get('/inventario/unidades'),
        api.get(`/inventario/productos?page=${productosPage}`),
      ]);
      const itemsRows = itemsData.rows ?? itemsData;
      setItems(itemsRows);
      if (itemsData.total) setItemsTotalPages(itemsData.totalPages ?? 1);
      setCategorias(categoriasData);
      setUnidades(unidadesData);
      const productosRows = productosData.rows ?? productosData;
      setProductos(productosRows);
      if (productosData.total) setProductosTotalPages(productosData.totalPages ?? 1);
      const bajos = itemsRows.filter(i => Number(i.stock_actual) <= Number(i.stock_minimo));
      if (bajos.length > 0) {
        setAlertaStock(bajos);
      }
    } catch (err) {
      console.error(err);
    }
  }

  function abrirEditar(item) {
    setEditando(item.material_id);
    setForm({
      nombre: item.nombre,
      stock_actual: item.stock_actual,
      precio_costo: item.precio_costo,
      stock_minimo: item.stock_minimo,
      unidad_id: unidades.find(u => u.unidad_medida === item.unidad)?.unidad_id ?? '',
      categoria_id: categorias.find(c => c.categoria === item.categoria)?.categoria_id ?? '',
    });
    setMostrar(true);
    setError('');
    setExito('');
  }

  function cancelar() {
    setMostrar(false);
    setEditando(null);
    setForm(INITIAL);
    setError('');
    setExito('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setExito('');
    setLoading(true);
    try {
      if (editando) {
        await api.put(`/inventario/${editando}`, form);
        setExito('Item actualizado exitosamente.');
      } else {
        await api.post('/inventario', form);
        setExito('Item creado exitosamente.');
      }
      cancelar();
      await cargarDatos();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function eliminar() {
    setError(''); setExito('');
    try {
      await api.delete(`/inventario/${confirmando.id}`);
      setExito('Item eliminado exitosamente.');
      setConfirmando(null);
      await cargarDatos();
    } catch (err) {
      setError(err.message);
      setConfirmando(null);
    }
  }

  function abrirEditarProducto(producto) {
    setEditando(producto.producto_id);
    setProductoForm({
      nombre: producto.nombre,
      precio_costo: producto.precio_costo,
    });
    setMostrarProducto(true);
    setErrorProd('');
    setExitoProd('');
  }

  async function handleSubmitProducto(e) {
    e.preventDefault();
    setErrorProd(''); setExitoProd('');
    setLoading(true);
    try {
      if (editando) {
        await api.put(`/inventario/productos/${editando}`, productoForm);
        setExitoProd('Producto actualizado exitosamente.');
      } else {
        await api.post('/inventario/productos', productoForm);
        setExitoProd('Producto creado exitosamente.');
      }
      cancelarProd();
      await cargarDatos();
    } catch (err) {
      setErrorProd(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function eliminarProducto() {
    setErrorProd(''); setExitoProd('');
    try {
      await api.delete(`/inventario/productos/${confirmandoProd.id}`);
      setExitoProd('Producto eliminado exitosamente.');
      setConfirmandoProd(null);
      await cargarDatos();
    } catch (err) {
      setErrorProd(err.message);
      setConfirmando(null);
    }
  }

  function cancelarProd() {
    setMostrarProducto(false);
    setEditando(null);
    setProductoForm({ nombre: '', precio_costo: '' });
    setErrorProd('');
    setExitoProd('');
  }

  return (
    <Layout>
      <div className="page">

        {alertaStock && (
          <div className="modal-overlay">
            <div className="modal alerta-modal">
              <h3>Inventario bajo</h3>
              <p>Los siguientes articulos estan llegando al limite del inventario:</p>
              <ul className="alerta-lista">
                {alertaStock.map(i => (
                  <li key={i.material_id}>
                    <strong>{i.nombre}</strong> — Stock: {i.stock_actual} / Minimo: {i.stock_minimo}
                  </li>
                ))}
              </ul>
              <p className="alerta-mensaje">Estas llegando al limite del inventario solicita el Re-Stock</p>
              <div className="modal-actions">
                <button className="btn-cancelar-modal" onClick={() => setAlertaStock(null)}>Cerrar</button>
                <button className="btn-primary" onClick={() => { setAlertaStock(null); navigate('/restock'); }}>
                  Ir a Re-Stock
                </button>
              </div>
            </div>
          </div>
        )}

        {confirmando && (
          <div className="modal-overlay">
            <div className="modal">
              <h3>Eliminar item</h3>
              <p>¿Estas seguro de que deseas eliminar <strong>{confirmando.nombre}</strong>? Esta accion no se puede deshacer.</p>
              <div className="modal-actions">
                <button className="btn-cancelar-modal" onClick={() => setConfirmando(null)}>Cancelar</button>
                <button className="btn-confirmar-eliminar" onClick={eliminar}>Eliminar</button>
              </div>
            </div>
          </div>
        )}

        <div className="page-header">
          <div>
            <h1>Inventario</h1>
            <p>Gestion de materiales</p>
          </div>
          {canEdit && (
            <button className="btn-primary" onClick={() => {
              if (mostrarForm) { cancelar(); } else { setMostrar(true); setError(''); setExito(''); }
            }}>
              {mostrarForm ? 'Cancelar' : 'Nuevo item'}
            </button>
          )}
        </div>

        {exito && <div className="alert success">{exito}</div>}
        {error && <div className="alert error">{error}</div>}

        {mostrarForm && (
          <div className="card form-card">
            <h2>{editando ? 'Editar item' : 'Nuevo item'}</h2>
            <form onSubmit={handleSubmit} noValidate>
              <div className="form-grid">
                <div className="field">
                  <label>Nombre</label>
                  <input type="text" value={form.nombre} required
                    placeholder="Camisas, Hilos, Tinta..."
                    onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
                </div>
                <div className="field">
                  <label>Cantidad actual</label>
                  <input type="number" step="1" value={form.stock_actual} required
                    placeholder="0"
                    onChange={e => setForm(f => ({ ...f, stock_actual: e.target.value }))} />
                </div>
                <div className="field">
                  <label>Minimo</label>
                  <input type="number" step="1" value={form.stock_minimo} required
                    placeholder="0"
                    onChange={e => setForm(f => ({ ...f, stock_minimo: e.target.value }))} />
                </div>
                <div className="field">
                  <label>Costo</label>
                  <input type="number" step="1" value={form.precio_costo} required
                    placeholder="0"
                    onChange={e => setForm(f => ({ ...f, precio_costo: e.target.value }))} />
                </div>
                <div className="field">
                  <label>Categoria</label>
                  <select value={form.categoria_id} required
                    onChange={e => setForm(f => ({ ...f, categoria_id: e.target.value }))}>
                    <option value="">Seleccionar categoria...</option>
                    {categorias.map(c => (
                      <option key={c.categoria_id} value={c.categoria_id}>{c.categoria}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Unidad de medida</label>
                  <select value={form.unidad_id} required
                    onChange={e => setForm(f => ({ ...f, unidad_id: e.target.value }))}>
                    <option value="">Seleccionar unidad de medida...</option>
                    {unidades.map(u => (
                      <option key={u.unidad_id} value={u.unidad_id}>{u.unidad_medida}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear item'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="card">
          <div className="table-header">
            <span>{items.length} item{items.length !== 1 ? 's' : ''} en inventario</span>
          </div>
          {items.length === 0 ? (
            <div className="empty">No hay items registrados.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nombre</th>
                  <th>Cantidad actual</th>
                  <th>Minimo</th>
                  <th>Costo</th>
                  <th>Categoria</th>
                  <th>Unidad de Medida</th>
                  <th>Estado</th>
                  {canEdit && <th className="col-acciones">Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => {
                  const item = items[i];
                  if (item) {
                    const bajoStock = Number(item.stock_actual) <= Number(item.stock_minimo);
                    return (
                      <tr key={item.material_id}>
                        <td className="id-cell">{item.material_id}</td>
                        <td>{item.nombre}</td>
                        <td>{Number(item.stock_actual)}</td>
                        <td>{Number(item.stock_minimo)}</td>
                        <td>${item.precio_costo}</td>
                        <td>{item.categoria}</td>
                        <td>{item.unidad}</td>
                        <td>
                          <span className={`badge ${bajoStock ? 'badge-danger' : 'badge-ok'}`}>
                            {bajoStock ? 'Stock bajo' : 'En stock'}
                          </span>
                        </td>
                        {canEdit && (
                          <td className="acciones">
                            <>
                              <button className="btn-editar" onClick={() => abrirEditar(item)}>Editar</button>
                              <button className="btn-eliminar" onClick={() => setConfirmando({ id: item.material_id, nombre: item.nombre })}>Eliminar</button>
                            </>
                          </td>
                        )}
                      </tr>
                    );
                  }
                  return (
                    <tr key={`empty-item-${i}`}>
                      <td className="id-cell">—</td>
                      <td>—</td>
                      <td>—</td>
                      <td>—</td>
                      <td>—</td>
                      <td>—</td>
                      <td>—</td>
                      <td><span className="badge">—</span></td>
                      {canEdit && (<td className="acciones">&nbsp;</td>)}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: '.5rem 1rem' }}>
            <button className="btn-primary" onClick={() => setItemsPage(p => Math.max(1, p - 1))} disabled={itemsPage <= 1}>Anterior</button>
            <span style={{ alignSelf: 'center' }}>{itemsPage} / {itemsTotalPages}</span>
            <button className="btn-primary" onClick={() => setItemsPage(p => Math.min(itemsTotalPages, p + 1))} disabled={itemsPage >= itemsTotalPages}>Siguiente</button>
          </div>
        </div>

        {confirmandoProd && (
          <div className="modal-overlay">
            <div className="modal">
              <h3>Eliminar producto</h3>
              <p>¿Estas seguro de que deseas eliminar <strong>{confirmandoProd.nombre}</strong>? Esta accion no se puede deshacer.</p>
              <div className="modal-actions">
                <button className="btn-cancelar-modal" onClick={() => setConfirmandoProd(null)}>Cancelar</button>
                <button className="btn-confirmar-eliminar" onClick={eliminarProducto}>Eliminar</button>
              </div>
            </div>
          </div>
        )}

        <div className="page-header">
          <div>
            <h1>Productos</h1>
            <p>Gestion de productos</p>
          </div>
          {canEditProducts && (
            <button className="btn-primary" onClick={() => {
              if (mostrarProducto) { cancelarProd(); } else { setMostrarProducto(true); setError(''); setExito(''); }
            }}>
              {mostrarProducto ? 'Cancelar' : 'Nuevo Producto'}
            </button>
          )}
        </div>

        {exitoProd && <div className="alert success">{exitoProd}</div>}
        {error && <div className="alert error">{error}</div>}

        {mostrarProducto && (
          <div className="card form-card">
            <h2>{editando ? 'Editar producto' : 'Nuevo producto'}</h2>
            <form onSubmit={handleSubmitProducto} noValidate>
              <div className="form-grid">
                <div className="field">
                  <label>Nombre</label>
                  <input type="text" value={productoForm.nombre} required
                    placeholder="Camisas Promocional, Tazas..."
                    onChange={e => setProductoForm(f => ({ ...f, nombre: e.target.value }))} />
                </div>
                <div className="field">
                  <label>Costo</label>
                  <input type="number" step="1" value={productoForm.precio_costo} required
                    placeholder="0"
                    onChange={e => setProductoForm(f => ({ ...f, precio_costo: e.target.value }))} />
                </div>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear producto'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="card">
          <div className="table-header">
            <span>{productos.length} producto{productos.length !== 1 ? 's' : ''} en catalogo</span>
          </div>
          {productos.length === 0 ? (
            <div className="empty">No hay items registrados.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nombre</th>
                  <th>Costo</th>
                  {canEditProducts && <th className="col-acciones">Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => {
                  const item = productos[i];
                  if (item) {
                    return (
                      <tr key={item.producto_id}>
                        <td className="id-cell">{item.producto_id}</td>
                        <td>{item.nombre}</td>
                        <td>${item.precio_costo}</td>
                        {canEditProducts && (
                          <td className="acciones">
                            <>
                              <button className="btn-editar" onClick={() => abrirEditarProducto(item)}>Editar</button>
                              {usuario?.rol === 'Administrador' && (
                                <button className="btn-eliminar" onClick={() => setConfirmandoProd({ id: item.producto_id, nombre: item.nombre })}>Eliminar</button>
                              )}
                            </>
                          </td>
                        )}
                      </tr>
                    );
                  }
                  return (
                    <tr key={`empty-prod-${i}`}>
                      <td className="id-cell">—</td>
                      <td>—</td>
                      <td>—</td>
                      {canEditProducts && (<td className="acciones">&nbsp;</td>)}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: '.5rem 1rem' }}>
            <button className="btn-primary" onClick={() => setProductosPage(p => Math.max(1, p - 1))} disabled={productosPage <= 1}>Anterior</button>
            <span style={{ alignSelf: 'center' }}>{productosPage} / {productosTotalPages}</span>
            <button className="btn-primary" onClick={() => setProductosPage(p => Math.min(productosTotalPages, p + 1))} disabled={productosPage >= productosTotalPages}>Siguiente</button>
          </div>
        </div>

      </div>

      <style>{`
        .page { max-width: 1100px; }

        .page-header {
          display: flex; justify-content: space-between; align-items: flex-start;
          margin-bottom: 1.5rem;
        }

        .page-header h1 {
          font-family: 'Syne', sans-serif;
          font-size: 1.5rem; color: #1e293b; margin-bottom: .2rem;
        }

        .page-header p { font-size: .85rem; color: #94a3b8; }

        .btn-primary {
          padding: .55rem 1.1rem;
          background: #2563eb; color: #fff;
          border: none; border-radius: 7px;
          font-family: 'DM Sans', sans-serif;
          font-size: .85rem; font-weight: 600;
          cursor: pointer; transition: background .15s;
        }

        .btn-primary:hover:not(:disabled) { background: #1d4ed8; }
        .btn-primary:disabled { opacity: .6; cursor: not-allowed; }

        .alert {
          padding: .7rem 1rem; border-radius: 7px;
          font-size: .85rem; margin-bottom: 1rem;
        }

        .alert.success { background: #f0fdf4; border: 1px solid #bbf7d0; color: #15803d; }
        .alert.error   { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; }

        .card {
          background: #fff; border: 1px solid #e2e8f0;
          border-radius: 10px; overflow: hidden;
          margin-bottom: 1.25rem;
        }

        .form-card { padding: 1.5rem; }

        .form-card h2 {
          font-family: 'Syne', sans-serif;
          font-size: .95rem; color: #1e293b; margin-bottom: 1.2rem;
        }

        .form-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;
        }

        .field { display: flex; flex-direction: column; gap: .35rem; }

        label {
          font-size: .75rem; font-weight: 600;
          color: #475569; text-transform: uppercase; letter-spacing: .05em;
        }

        input, select {
          padding: .62rem .85rem;
          border: 1.5px solid #e2e8f0; border-radius: 7px;
          font-family: 'DM Sans', sans-serif;
          font-size: .9rem; color: #1e293b; background: #fff;
          outline: none; transition: border-color .2s, box-shadow .2s;
        }

        input::placeholder { color: #cbd5e1; }
        input:focus, select:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37,99,235,.1);
        }

        .form-actions { margin-top: 1.2rem; display: flex; justify-content: flex-end; }

        .table-header {
          padding: .85rem 1.25rem;
          border-bottom: 1px solid #f1f5f9;
          font-size: .82rem; color: #94a3b8; font-weight: 500;
        }

        table { width: 100%; border-collapse: collapse; }

        th {
          padding: .7rem 1.25rem; text-align: left;
          font-size: .75rem; font-weight: 600; color: #64748b;
          text-transform: uppercase; letter-spacing: .05em;
          background: #f8fafc; border-bottom: 1px solid #e2e8f0;
        }

        th.col-acciones { text-align: center; }

        td {
          padding: .8rem 1.25rem;
          font-size: .88rem; color: #334155;
          border-bottom: 1px solid #f1f5f9;
        }

        tr:last-child td { border-bottom: none; }
        tr:hover td { background: #f8fafc; }

        .id-cell { color: #94a3b8; font-size: .8rem; }

        .badge {
          display: inline-block; padding: .25rem .7rem;
          border-radius: 4px; font-size: .75rem; font-weight: 600;
        }

        .badge-ok {
          background: #dcfce7; color: #166534;
        }

        .badge-danger {
          background: #fee2e2; color: #991b1b;
        }

        .acciones { display: flex; gap: .5rem; justify-content: center; }

        .btn-editar, .btn-eliminar {
          padding: .3rem .8rem;
          background: transparent;
          border-radius: 6px;
          font-family: 'DM Sans', sans-serif;
          font-size: .8rem;
          cursor: pointer; transition: background .15s, border-color .15s;
        }

        .btn-editar { border: 1px solid #e2e8f0; color: #475569; }
        .btn-editar:hover { background: #f1f5f9; border-color: #cbd5e1; }

        .btn-eliminar { border: 1px solid #ffc4c4; color: #dc2626; }
        .btn-eliminar:hover { background: #fef2f2; }

        .empty {
          padding: 2.5rem; text-align: center;
          color: #94a3b8; font-size: .88rem;
        }

        .modal-overlay {
          position: fixed; inset: 0;
          background: rgba(15,17,27,.45);
          display: flex; align-items: center; justify-content: center;
          z-index: 100;
        }

        .modal {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 1.75rem;
          width: 100%; max-width: 380px;
          box-shadow: 0 8px 32px rgba(0,0,0,.12);
        }

        .modal h3 {
          font-family: 'Syne', sans-serif;
          font-size: 1rem; color: #1e293b; margin-bottom: .75rem;
        }

        .modal p {
          font-size: .88rem; color: #64748b;
          line-height: 1.6; margin-bottom: 1.5rem;
        }

        .modal p strong { color: #1e293b; }

        .modal-actions { display: flex; justify-content: flex-end; gap: .65rem; }

        .btn-cancelar-modal {
          padding: .5rem 1rem;
          background: transparent;
          border: 1px solid #e2e8f0;
          border-radius: 7px; color: #475569;
          font-family: 'DM Sans', sans-serif; font-size: .85rem;
          cursor: pointer; transition: background .15s;
        }

        .btn-cancelar-modal:hover { background: #f1f5f9; }

        .btn-confirmar-eliminar {
          padding: .5rem 1rem;
          background: #dc2626; color: #fff;
          border: none; border-radius: 7px;
          font-family: 'DM Sans', sans-serif; font-size: .85rem; font-weight: 600;
          cursor: pointer; transition: background .15s;
        }

        .btn-confirmar-eliminar:hover { background: #b91c1c; }

        .alerta-modal { max-width: 440px; }

        .alerta-modal h3 { color: #dc2626; }

        .alerta-lista {
          margin: .75rem 0; padding-left: 1.25rem;
          font-size: .85rem; color: #475569; line-height: 1.8;
        }

        .alerta-mensaje {
          background: #fef2f2; border: 1px solid #fecaca;
          border-radius: 6px; padding: .6rem .85rem;
          font-size: .82rem; color: #dc2626; font-weight: 600;
          margin-bottom: 1.25rem;
        }

        @media (max-width: 600px) {
          .form-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </Layout>
  );
}
