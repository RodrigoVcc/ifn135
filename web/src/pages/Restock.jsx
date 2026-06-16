import { useState, useEffect } from 'react';
import Layout from '../components/Layout.jsx';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';

const ITEMS_PER_PAGE = 5;

const INITIAL = { material_id: '', cantidad_solicitada: '' };

export default function Restock() {
  const { usuario } = useAuth();
  const [solicitudes, setSolicitudes] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(INITIAL);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [loading, setLoading] = useState(false);
  const [mostrarForm, setMostrar] = useState(false);

  useEffect(() => { cargarDatos(); }, [page]);

  async function cargarDatos() {
    try {
      const [sols, inv] = await Promise.all([
        api.get(`/restock?page=${page}`),
        api.get('/inventario'),
      ]);
      const solsRows = sols.rows ?? sols;
      setSolicitudes(solsRows);
      if (sols.total) setTotalPages(sols.totalPages ?? 1);
      setItems(inv);
    } catch (err) {
      console.error(err);
      setError('Error al cargar datos');
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setExito('');
    setLoading(true);
    try {
      await api.post('/restock', {
        material_id: Number(form.material_id),
        cantidad_solicitada: Number(form.cantidad_solicitada),
      });
      setExito('Solicitud de restock creada');
      setForm(INITIAL);
      setMostrar(false);
      await cargarDatos();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function aprobar(id) {
    try {
      await api.put(`/restock/${id}/aprobar`);
      setExito('Solicitud aprobada');
      await cargarDatos();
    } catch (err) {
      setError(err.message);
    }
  }

  async function rechazar(id) {
    try {
      await api.put(`/restock/${id}/rechazar`);
      setExito('Solicitud rechazada');
      await cargarDatos();
    } catch (err) {
      setError(err.message);
    }
  }

  const estadoAlias = {
    pendiente: 'Pendiente',
    aprobado: 'Aprobado',
    rechazado: 'Rechazado',
  };

  const estadoBadge = {
    pendiente: 'badge-pendiente',
    aprobado: 'badge-aprobado',
    rechazado: 'badge-rechazado',
  };

  return (
    <Layout>
      <div className="page">
        <div className="page-header">
          <div>
            <h1>Re-Stock</h1>
            <p>Solicitudes de reabastecimiento de inventario</p>
          </div>
          {usuario?.rol === 'Recepcionista' && (
            <button className="btn-primary" onClick={() => {
              setMostrar(m => !m); setError(''); setExito('');
            }}>
              {mostrarForm ? 'Cancelar' : 'Nueva solicitud'}
            </button>
          )}
        </div>

        {exito && <div className="alert success">{exito}</div>}
        {error && <div className="alert error">{error}</div>}

        {mostrarForm && (
          <div className="card form-card">
            <h2>Nueva solicitud de Re-Stock</h2>
            <form onSubmit={handleSubmit} noValidate>
              <div className="form-grid">
                <div className="field">
                  <label>Item</label>
                  <select value={form.material_id} required
                    onChange={e => setForm(f => ({ ...f, material_id: e.target.value }))}>
                    <option value="">Seleccionar material...</option>
                    {items.map(i => (
                      <option key={i.material_id} value={i.material_id}>
                        {i.nombre} (Stock: {i.stock_actual} | Min: {i.stock_minimo})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Cantidad solicitada</label>
                  <input type="number" step="1" min="1" value={form.cantidad_solicitada} required
                    placeholder="0"
                    onChange={e => setForm(f => ({ ...f, cantidad_solicitada: e.target.value }))} />
                </div>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Enviando...' : 'Enviar solicitud'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="card">
          <div className="table-header">
            <span>{solicitudes.length} solicitud{solicitudes.length !== 1 ? 'es' : ''}</span>
          </div>
          {solicitudes.length === 0 ? (
            <div className="empty">No hay solicitudes de restock.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Item</th>
                  <th>Cantidad</th>
                  <th>Estado</th>
                  <th>Solicitante</th>
                  <th>Fecha</th>
                  <th className="col-acciones">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => {
                  const s = solicitudes[i];
                  if (s) {
                    return (
                      <tr key={s.restock_id}>
                        <td className="id-cell">{s.restock_id}</td>
                        <td>{s.material_nombre}</td>
                        <td>{s.cantidad_solicitada}</td>
                        <td><span className={`badge ${estadoBadge[s.estado]}`}>{estadoAlias[s.estado]}</span></td>
                        <td>{s.creador_nombre}</td>
                        <td>{new Date(s.fecha_creacion).toLocaleDateString()}</td>
                        <td className="acciones">
                          {s.estado === 'pendiente' && usuario?.rol === 'Administrador' && (
                            <>
                              <button className="btn-aprobar" onClick={() => aprobar(s.restock_id)}>Aprobar</button>
                              <button className="btn-rechazar" onClick={() => rechazar(s.restock_id)}>Rechazar</button>
                            </>
                          )}
                          {s.estado !== 'pendiente' && (
                            <span style={{ fontSize: '.8rem', color: '#94a3b8' }}>
                              {s.aprobador_nombre ? `Por: ${s.aprobador_nombre}` : '-'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  }
                  return (
                    <tr key={`empty-rest-${i}`}>
                      <td className="id-cell">—</td>
                      <td>—</td>
                      <td>—</td>
                      <td><span className="badge">—</span></td>
                      <td>—</td>
                      <td>—</td>
                      <td className="acciones">&nbsp;</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: '.5rem 1rem' }}>
            <button className="btn-primary" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>Anterior</button>
            <span style={{ alignSelf: 'center' }}>{page} / {totalPages}</span>
            <button className="btn-primary" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Siguiente</button>
          </div>
        </div>
      </div>

      <style>{`
        .page { max-width: 860px; }

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

        .badge-pendiente { background: #fef3c7; color: #92400e; }
        .badge-aprobado { background: #dcfce7; color: #166534; }
        .badge-rechazado { background: #fee2e2; color: #991b1b; }

        .acciones { display: flex; gap: .5rem; justify-content: center; }

        .btn-aprobar {
          padding: .3rem .8rem; border: 1px solid #bbf7d0; color: #166534;
          background: transparent; border-radius: 6px;
          font-family: 'DM Sans', sans-serif; font-size: .8rem;
          cursor: pointer; transition: background .15s;
        }

        .btn-aprobar:hover { background: #f0fdf4; }

        .btn-rechazar {
          padding: .3rem .8rem; border: 1px solid #fecaca; color: #dc2626;
          background: transparent; border-radius: 6px;
          font-family: 'DM Sans', sans-serif; font-size: .8rem;
          cursor: pointer; transition: background .15s;
        }

        .btn-rechazar:hover { background: #fef2f2; }

        .empty {
          padding: 2.5rem; text-align: center;
          color: #94a3b8; font-size: .88rem;
        }

        @media (max-width: 600px) {
          .form-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </Layout>
  );
}