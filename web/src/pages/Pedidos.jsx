import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';

const INITIAL = { pedido_id: '', fecha_pedido: '', fecha_entrega: '', estado: 'en_produccion' };
const DETALLE_INITIAL = { detalle_pedido_id: '', pedido_id: '', producto_id: '', cantidad: '', precio_unitario: '', subtotal: '' };

export default function Pedidos() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const canCreate = usuario?.rol === 'Administrador' || usuario?.rol === 'Recepcionista';
  const canEdit = usuario?.rol === 'Administrador' || usuario?.rol === 'Recepcionista';
  const canDelete = usuario?.rol === 'Administrador';
  const hasAnyAction = Boolean(canEdit || canDelete);

  const [pedidos, setPedidos] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [form, setForm] = useState(INITIAL);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [loading, setLoading] = useState(false);
  const [mostrarForm, setMostrar] = useState(false);
  const [editando, setEditando] = useState(null);
  const [confirmando, setConfirmando] = useState(null);
  const [detalleForm, setDetalleForm] = useState(DETALLE_INITIAL);
  const [mostrarDetalleForm, setMostrarDetalleForm] = useState(false);
  const [editandoDetalle, setEditandoDetalle] = useState(null);
  const [productos, setProductos] = useState([]);
  const [pedidoExpandido, setPedidoExpandido] = useState(null);

  useEffect(() => { cargarDatos(); }, [page]);

  useEffect(() => {
    if (location && location.state && location.state.openPedidoId) {
      // abrir el pedido indicado por la navegación desde el dashboard
      setPedidoExpandido(location.state.openPedidoId);
      // limpiar el state de navegación para evitar reabrir al volver
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate, pedidos]);

  async function cargarDatos() {
    setLoading(true);
    try {
      const [response, productosresponse] = await Promise.all([api.get(`/pedidos?page=${page}`), api.get('/productos')]);
      const rows = response.rows ?? response;
      setPedidos(rows);
      if (response.total) setTotalPages(response.totalPages ?? 1);
      setProductos(productosresponse);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error al cargar los pedidos');
    } finally {
      setLoading(false);
    }
  }

  const formatearFecha = (fecha) => {
    if (!fecha) return 'No especificada';
    const date = new Date(fecha);
    const dia = date.getDate().toString().padStart(2, '0');
    const mes = (date.getMonth() + 1).toString().padStart(2, '0');
    const anio = date.getFullYear();
    return `${dia}/${mes}/${anio}`;
  };

  const estadoAlias = {
    'en_produccion': 'En Producción',
    'pendiente': 'Pendiente',
    'procesando': 'En Proceso',
    'cancelado': 'Cancelado',
    'listo': 'Listo',
    'entregado': 'Entregado'
  };

  const estadoColores = {
    'en_produccion': '#2563eb',
    'pendiente': '#f59e0b',
    'procesando': '#8b5cf6',
    'cancelado': '#ef4444',
    'listo': '#10b981',
    'entregado': '#059669'
  };

  const getEstadoAlias = (estado) => {
    if (!estado) return 'Desconocido';
    return estadoAlias[estado.toLowerCase()] || estado;
  };

  const getEstadoColor = (estado) => {
    if (!estado) return '#94a3b8';
    return estadoColores[estado.toLowerCase()] || '#94a3b8';
  };

  const calcularTotalPedido = (pedido) => {
    if (!pedido.detalles || pedido.detalles.length === 0) return 0;
    return pedido.detalles.reduce((total, detalle) => total + (Number(detalle.subtotal) || 0), 0);
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setExito('');
    setLoading(true);
    try {
      if (editando) {
        await api.put(`/pedidos/${editando}`, form);
        setExito('Pedido actualizado exitosamente.');
      } else {
        await api.post('/pedidos', { ...form, pedido_id: Number(form.pedido_id) });
        setExito('Pedido creado exitosamente.');
      }
      cancelar();
      await cargarDatos();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const fecha_sistema = new Date().toLocaleDateString('en-CA');

  const formatearFechaISO = (fecha) => {
    if (!fecha) return '';
    const date = new Date(fecha);
    if (isNaN(date.getTime())) return '';

    const anio = date.getFullYear();
    const mes = (date.getMonth() + 1).toString().padStart(2, '0');
    const dia = date.getDate().toString().padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  };

  function abrirEditar(pedido) {
    setEditando(pedido.pedido_id);
    setForm({
      pedido_id: pedido.pedido_id,
      fecha_pedido: formatearFechaISO(pedido.fecha_pedido),
      fecha_entrega: formatearFechaISO(pedido.fecha_entrega),
      estado: pedido.estado
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

  async function eliminar() {
    setError(''); setExito('');
    try {
      await api.delete(`/pedidos/${confirmando.pedido_id}`);
      setExito('Pedido eliminado exitosamente.');
      setConfirmando(null);
      await cargarDatos();
    } catch (err) {
      setError(err.message);
      setConfirmando(null);
    }
  }

  async function handleDetalleSubmit(e) {
    e.preventDefault();
    setError('');
    setExito('');

    try {
      const cantidad = Number(detalleForm.cantidad);
      const precioUnitario = Number(detalleForm.precio_unitario);
      const subtotal = cantidad * precioUnitario;
      const payload = {
        pedido_id: Number(detalleForm.pedido_id),
        producto_id: Number(detalleForm.producto_id),
        cantidad: cantidad,
        precio_unitario: precioUnitario,
        subtotal: subtotal
      };

      if (editandoDetalle) {
        await api.put(
          `/pedidos/${detalleForm.pedido_id}/detalle/${editandoDetalle}`,
          payload
        );
        setExito('Detalle actualizado');
      } else {
        await api.post(
          `/pedidos/${detalleForm.pedido_id}/detalle`,
          payload
        );
        setExito('Detalle agregado');
      }

      setDetalleForm(DETALLE_INITIAL);
      setMostrarDetalleForm(false);
      setEditandoDetalle(null);
      await cargarDatos();
    } catch (err) {
      setError(err.message);
    }
  }

  async function eliminarDetalle(pedido_id, detalle_id) {
    try {
      await api.delete(`/pedidos/${pedido_id}/detalle/${detalle_id}`);
      setExito('Detalle eliminado');
      await cargarDatos();
    } catch (err) {
      setError(err.message);
    }
  }

  function abrirEditarDetalle(detalle) {
    const productoIdFromDetalle = detalle.producto_id ?? null;
    let pid = productoIdFromDetalle;
    if (!pid) {
      const found = productos.find(p => p.nombre === detalle.producto || String(p.producto_id) === String(detalle.producto));
      pid = found ? found.producto_id : '';
    }
    setDetalleForm({
      detalle_pedido_id: detalle.detalle_pedido_id,
      pedido_id: detalle.pedido_id,
      producto_id: pid !== null && pid !== undefined ? String(pid) : '',
      cantidad: detalle.cantidad,
      precio_unitario: detalle.precio_unitario,
      subtotal: detalle.subtotal
    });
    setEditandoDetalle(detalle.detalle_pedido_id);
    setMostrarDetalleForm(true);
  }

  return (
    <Layout>
      <div className="page">
        {confirmando && (
          <div className="modal-overlay">
            <div className="modal">
              <h3>Eliminar pedido</h3>
              <p>¿Estás seguro de que deseas eliminar este pedido? Esta acción no se puede deshacer.</p>
              <div className="modal-actions">
                <button className="btn-cancelar-modal" onClick={() => setConfirmando(null)}>Cancelar</button>
                <button className="btn-confirmar-eliminar" onClick={eliminar}>Eliminar</button>
              </div>
            </div>
          </div>
        )}

        <div className="page-header">
          <div>
            <h1>Pedidos</h1>
            <p>Gestión de Pedidos del sistema</p>
          </div>
          {canCreate && (
            <button className="btn-primary" onClick={() => { setMostrar(m => !m); setError(''); setExito(''); }}>
              {mostrarForm ? 'Cancelar' : 'Nuevo Pedido'}
            </button>
          )}
        </div>

        {exito && <div className="alert success">{exito}</div>}
        {error && <div className="alert error">{error}</div>}

        {mostrarForm && (
          <div className="card form-card">
            <h2>{editando ? 'Editar Pedido' : 'Nuevo Pedido'}</h2>
            <form onSubmit={handleSubmit} noValidate>
              <div className="form-grid">
                <div className="field">
                  <label>Fecha del Pedido</label>
                  <input type="date" value={form.fecha_pedido} required min={fecha_sistema}
                    onChange={e => setForm(f => ({ ...f, fecha_pedido: e.target.value }))} />
                </div>
                <div className="field">
                  <label>Fecha de Entrega</label>
                  <input type="date" value={form.fecha_entrega} required
                    min={fecha_sistema}
                    onChange={e => setForm(f => ({ ...f, fecha_entrega: e.target.value }))} />
                </div>
                <div className="field">
                  <label>Estado</label>
                  <select value={form.estado} required
                    onChange={e => setForm(f => ({ ...f, estado: e.target.value }))}>
                    <option value="">Seleccionar estado...</option>
                    <option value="en_produccion">En Producción</option>
                    <option value="pendiente">Pendiente</option>
                    <option value="procesando">En Proceso</option>
                    <option value="cancelado">Cancelado</option>
                    <option value="listo">Listo</option>
                    <option value="entregado">Entregado</option>
                  </select>
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="btn-cancelar" onClick={cancelar}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Guardando...' : editando ? 'Actualizar' : 'Guardar pedido'}
                </button>
              </div>
            </form>
          </div>
        )}

        {mostrarDetalleForm && (
          <div className="card form-card">
            <h2>{editandoDetalle ? 'Editar Detalle' : 'Nuevo Detalle'}</h2>
            <form onSubmit={handleDetalleSubmit}>
              <div className="form-grid">
                <div className="field">
                  <label>Producto</label>
                  <select value={detalleForm.producto_id} required
                    onChange={e => {                      
                      const productoselect= productos.find(p => p.producto_id === Number(e.target.value));//guarda los valores del producto encontrado
                      setDetalleForm(f => ({ ...f, producto_id: e.target.value, precio_unitario: productoselect ? productoselect.precio_costo: ''}))
                    }}>
                    <option value="">Seleccionar producto...</option>
                    {productos.map(p => (
                      <option key={p.producto_id} value={p.producto_id}>{p.nombre}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Cantidad</label>
                  <input type="number" value={detalleForm.cantidad} min="1"
                    onChange={e => setDetalleForm(f => ({ ...f, cantidad: e.target.value }))} />
                </div>
                <div className="field">
                  <label>Precio Unitario</label>
                  <input type="number" step="0.01" value={detalleForm.precio_unitario} min="0"
                    onChange={e => setDetalleForm(f => ({ ...f, precio_unitario: e.target.value }))} />
                </div>
                {detalleForm.cantidad && detalleForm.precio_unitario && (
                  <div className="field">
                    <label>Subtotal</label>
                    <div className="subtotal-display">
                      ${(Number(detalleForm.cantidad) * Number(detalleForm.precio_unitario)).toFixed(2)}
                    </div>
                  </div>
                )}
              </div>
              <div className="form-actions">
                <button type="button" className="btn-cancelar" onClick={() => {
                  setMostrarDetalleForm(false);
                  setDetalleForm(DETALLE_INITIAL);
                  setEditandoDetalle(null);
                }}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Guardando...' : editandoDetalle ? 'Actualizar' : 'Agregar'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="card">
          <div className="table-header">
            <span>{pedidos.length} pedido{pedidos.length !== 1 ? 's' : ''} registrado{pedidos.length !== 1 ? 's' : ''}</span>
          </div>

          {loading ? (
            <div className="empty">Cargando pedidos...</div>
          ) : pedidos.length === 0 ? (
            <div className="empty">
              <p>No hay pedidos registrados</p>
              <button className="btn-primary" onClick={() => setMostrar(true)}>
                Crear primer pedido
              </button>
            </div>
          ) : (
            <div className="pedidos-lista">
              {pedidos.map(pedido => (
                <div key={pedido.pedido_id} className="pedido-card">
                  <div className="pedido-header" onClick={() => setPedidoExpandido(pedidoExpandido === pedido.pedido_id ? null : pedido.pedido_id)}>
                    <div className="pedido-info-principal">
                      <div className="pedido-numero">
                        <span className="pedido-label">Pedido #</span>
                        <span className="pedido-id">{pedido.pedido_id}</span>
                      </div>
                      <div className="pedido-estado-badge" style={{ backgroundColor: getEstadoColor(pedido.estado) }}>
                        {getEstadoAlias(pedido.estado)}
                      </div>
                    </div>
                    <div className="pedido-fechas">
                      <div className="fecha-item">
                        <span className="fecha-label">Creado:</span>
                        <span>{formatearFecha(pedido.fecha_pedido)}</span>
                      </div>
                      <div className="fecha-item">
                        <span className="fecha-label">Entrega:</span>
                        <span>{formatearFecha(pedido.fecha_entrega)}</span>
                      </div>
                    </div>
                    <div className="pedido-total">
                      <span className="total-label">Total:</span>
                      <span className="total-valor">${calcularTotalPedido(pedido).toFixed(2)}</span>
                    </div>
                    {hasAnyAction && (
                      <div className="pedido-acciones" onClick={(e) => e.stopPropagation()}>
                        {canEdit && (
                          <button className="btn-editar" onClick={() => abrirEditar(pedido)}>
                            Editar
                          </button>
                        )}
                        {canDelete && (
                          <button className="btn-eliminar" onClick={() => setConfirmando({ pedido_id: pedido.pedido_id })}>
                            Eliminar
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {pedidoExpandido === pedido.pedido_id && (
                    <div className="pedido-detalles">
                      <div className="detalles-header">
                        <h3>Detalles del pedido</h3>
                        {canEdit && (
                          <button className="btn-agregar-detalle" onClick={() => {
                            setDetalleForm({ ...DETALLE_INITIAL, pedido_id: pedido.pedido_id });
                            setEditandoDetalle(null);
                            setMostrarDetalleForm(true);
                          }}>
                            + Agregar producto
                          </button>
                        )}
                      </div>

                      {pedido.detalles && pedido.detalles.length > 0 ? (
                        <div className="detalles-lista">
                          <div className="detalle-header-grid">
                            <span>Producto</span>
                            <span>Cantidad</span>
                            <span>Precio Unit.</span>
                            <span>Subtotal</span>
                            {hasAnyAction && <span>Acciones</span>}
                          </div>
                          {pedido.detalles.map(detalle => (
                            <div key={detalle.detalle_pedido_id} className="detalle-item">
                              <span className="detalle-producto">{detalle.producto}</span>
                              <span className="detalle-cantidad">{detalle.cantidad}</span>
                              <span className="detalle-precio">${Number(detalle.precio_unitario).toFixed(2)}</span>
                              <span className="detalle-subtotal">${Number(detalle.subtotal).toFixed(2)}</span>
                              {hasAnyAction && (
                                <div className="detalle-acciones">
                                  {canEdit && (
                                    <button className="btn-detalle-editar" onClick={() => abrirEditarDetalle(detalle)}>
                                      Editar
                                    </button>
                                  )}
                                  {canDelete && (
                                    <button className="btn-detalle-eliminar" onClick={() => eliminarDetalle(pedido.pedido_id, detalle.detalle_pedido_id)}>
                                      Eliminar
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                          <div className="detalle-total">
                            <span>Total del pedido:</span>
                            <span className="total-final">${calcularTotalPedido(pedido).toFixed(2)}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="sin-detalles">
                          <p>Este pedido no tiene productos agregados</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: '.5rem 1rem' }}>
            <button className="btn-primary" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>Anterior</button>
            <span style={{ alignSelf: 'center' }}>{page} / {totalPages}</span>
            <button className="btn-primary" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Siguiente</button>
          </div>
        </div>
      </div>

      <style>{`
        .page { max-width: 100%; }

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

        .btn-cancelar {
          padding: .55rem 1.1rem;
          background: transparent; color: #475569;
          border: 1px solid #e2e8f0; border-radius: 7px;
          font-family: 'DM Sans', sans-serif;
          font-size: .85rem; cursor: pointer;
        }

        .btn-cancelar:hover { background: #f1f5f9; }

        .alert {
          padding: .7rem 1rem; border-radius: 7px;
          font-size: .85rem; margin-bottom: 1rem;
        }

        .alert.success { background: #f0fdf4; border: 1px solid #bbf7d0; color: #15803d; }
        .alert.error { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; }

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

        input:focus, select:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37,99,235,.1);
        }

        .subtotal-display {
          padding: .62rem .85rem;
          background: #f8fafc;
          border: 1.5px solid #e2e8f0;
          border-radius: 7px;
          font-size: 1.1rem;
          font-weight: 600;
          color: #059669;
        }

        .form-actions { 
          margin-top: 1.2rem; 
          display: flex; 
          justify-content: flex-end; 
          gap: .75rem;
        }

        .table-header {
          padding: .85rem 1.25rem;
          border-bottom: 1px solid #f1f5f9;
          font-size: .82rem; color: #94a3b8; font-weight: 500;
        }

        .empty {
          padding: 2.5rem; text-align: center;
          color: #94a3b8; font-size: .88rem;
        }

        .empty p {
          margin-bottom: 1rem;
        }

        .pedidos-lista {
          display: flex;
          flex-direction: column;
          gap: .75rem;
          padding: 1rem;
        }

        .pedido-card {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          overflow: hidden;
          transition: box-shadow .2s;
        }

        .pedido-card:hover {
          box-shadow: 0 2px 8px rgba(0,0,0,.08);
        }

        .pedido-header {
          padding: 1.25rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          background: #fff;
          transition: background .15s;
        }

        .pedido-header:hover {
          background: #f8fafc;
        }

        .pedido-info-principal {
          display: flex;
          align-items: center;
          gap: 1rem;
          min-width: 200px;
        }

        .pedido-numero {
          display: flex;
          align-items: baseline;
          gap: .35rem;
        }

        .pedido-label {
          font-size: .8rem;
          color: #94a3b8;
        }

        .pedido-id {
          font-size: 1.1rem;
          font-weight: 700;
          color: #1e293b;
        }

        .pedido-estado-badge {
          padding: .25rem .75rem;
          border-radius: 6px;
          font-size: .75rem;
          font-weight: 600;
          color: white;
        }

        .pedido-fechas {
          display: flex;
          gap: 3rem;
          flex: 1;
          justify-content: center;
        }

        .fecha-item {
          display: flex;
          flex-direction: column;
          gap: .15rem;
        }

        .fecha-label {
          font-size: .7rem;
          color: #94a3b8;
          text-transform: uppercase;
          font-weight: 600;
        }

        .fecha-item span:last-child {
          font-size: .85rem;
          color: #475569;
        }

        .pedido-total {
          display: flex;
          align-items: center;
          gap: .5rem;
          min-width: 120px;
        }

        .total-label {
          font-size: .8rem;
          color: #94a3b8;
        }

        .total-valor {
          font-size: 1.1rem;
          font-weight: 700;
          color: #059669;
        }

        .pedido-acciones {
          display: flex;
          gap: .5rem;
          align-items: center;
        }

        .btn-editar, .btn-eliminar {
          padding: .4rem .8rem;
          border-radius: 6px;
          font-family: 'DM Sans', sans-serif;
          font-size: .8rem;
          cursor: pointer; transition: all .15s;
          border: 1px solid #e2e8f0;
        }

        .btn-editar { 
          background: #fff; 
          color: #475569;
        }

        .btn-editar:hover { 
          background: #f1f5f9; 
          border-color: #cbd5e1;
        }

        .btn-eliminar { 
          background: #fff; 
          color: #dc2626;
          border-color: #ffc4c4;
        }

        .btn-eliminar:hover { 
          background: #fef2f2;
        }

        .pedido-detalles {
          border-top: 1px solid #e2e8f0;
          background: #f8fafc;
          padding: 1.25rem;
          animation: slideDown 0.2s ease-out;
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .detalles-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.25rem;
          padding-bottom: .75rem;
          border-bottom: 1px solid #e2e8f0;
        }

        .detalles-header h3 {
          font-family: 'Syne', sans-serif;
          font-size: .9rem;
          color: #1e293b;
          margin: 0;
        }

        .btn-agregar-detalle {
          padding: .45rem .9rem;
          background: #2563eb;
          color: #fff;
          border: none;
          border-radius: 6px;
          font-size: .8rem;
          font-family: 'DM Sans', sans-serif;
          font-weight: 500;
          cursor: pointer;
          transition: background .15s;
        }

        .btn-agregar-detalle:hover {
          background: #1d4ed8;
        }

        .detalle-header-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr 140px;
          gap: 1rem;
          padding: .6rem .75rem;
          font-size: .72rem;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          background: #f1f5f9;
          border-radius: 6px;
          margin-bottom: .5rem;
        }

        .detalle-item {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr 140px;
          gap: 1rem;
          padding: .85rem .75rem;
          border-bottom: 1px solid #f1f5f9;
          align-items: center;
          font-size: .85rem;
          color: #334155;
          transition: background .1s;
        }

        .detalle-item:last-child {
          border-bottom: none;
        }

        .detalle-item:hover {
          background: rgba(255,255,255,0.7);
        }

        .detalle-producto {
          font-weight: 500;
        }

        .detalle-subtotal {
          font-weight: 600;
          color: #059669;
        }

        .detalle-acciones {
          display: flex;
          gap: .65rem;
          justify-content: flex-start;
        }

        .btn-detalle-editar, .btn-detalle-eliminar {
          padding: .35rem .75rem;
          border-radius: 5px;
          font-family: 'DM Sans', sans-serif;
          font-size: .78rem;
          cursor: pointer;
          transition: all .15s;
          border: 1px solid;
          background: #fff;
        }

        .btn-detalle-editar {
          color: #475569;
          border-color: #e2e8f0;
        }

        .btn-detalle-editar:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
        }

        .btn-detalle-eliminar {
          color: #dc2626;
          border-color: #fecaca;
        }

        .btn-detalle-eliminar:hover {
          background: #fef2f2;
          border-color: #fca5a5;
        }

        .detalle-total {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 1rem;
          padding: .85rem .75rem;
          margin-top: .75rem;
          border-top: 2px solid #e2e8f0;
          font-weight: 600;
          color: #1e293b;
          background: #fff;
          border-radius: 6px;
        }

        .total-final {
          font-size: 1.15rem;
          color: #059669;
          font-weight: 700;
        }

        .sin-detalles {
          text-align: center;
          padding: 2.5rem 1rem;
          color: #94a3b8;
          font-size: .88rem;
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

        @media (max-width: 768px) {
          .pedido-header {
            flex-direction: column;
            align-items: flex-start;
            gap: .75rem;
          }
          
          .pedido-fechas {
            flex-direction: column;
            gap: .5rem;
          }
          
          .detalle-header-grid,
          .detalle-item {
            grid-template-columns: 1fr 1fr 1fr;
          }
          
          .detalle-acciones {
            flex-direction: column;
            gap: .4rem;
          }
        }

        @media (max-width: 600px) {
          .form-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </Layout>
  );
}