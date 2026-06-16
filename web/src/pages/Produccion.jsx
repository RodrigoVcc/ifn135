import { useState, useEffect } from 'react';
import Layout from '../components/Layout.jsx';
import { api } from '../lib/api.js';

const ITEMS_PER_PAGE = 5;

const INITIAL = {
  producto_id: '',
  material_id: '',
  cantidad_por_unidad: '',
  pedido_id: '',
};

export default function MaterialUsado() {
  const [materialesUsados, setMaterialesUsados] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [productos, setProductos] = useState([]);
  const [materiales, setMateriales] = useState([]);
  const [pedidos, setPedido] = useState([]);

  const [form, setForm] = useState(INITIAL);

  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [loading, setLoading] = useState(false);
  const [mostrarForm, setMostrar] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, [page]);

  async function cargarDatos() {
    try {
      const [listado, producto, material, pedido] = await Promise.all([
        api.get(`/produccion?page=${page}`),
        api.get('/productos'),
        api.get('/inventario'),
        api.get('/pedidos'),
      ]);

      const rows = listado.rows ?? listado;
      setMaterialesUsados(rows);
      if (listado.total) setTotalPages(listado.totalPages ?? 1);
      setProductos(producto);
      setMateriales(material);
      setPedido(pedido);

    } catch (err) {
      console.error(err);
      setError('Error al cargar datos');
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setError('');
    setExito('');
    setLoading(true);

    try {
      await api.post('/produccion', {
        producto_id: Number(form.producto_id),
        material_id: Number(form.material_id),
        cantidad_por_unidad: Number(form.cantidad_por_unidad),
        pedido_id: Number(form.pedido_id),
      });

      setExito('Material agregado exitosamente');
      setForm(INITIAL);
      setMostrar(false);

      await cargarDatos();

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout>
      <div className="page">

        <div className="page-header">
          <div>
            <h1>Material Usado</h1>
            <p>Gestión de materiales utilizados por producto</p>
          </div>

          <button
            className="btn-primary"
            onClick={() => {
              setMostrar(m => !m);
              setError('');
              setExito('');
            }}
          >
            {mostrarForm ? 'Cancelar' : 'Nuevo registro'}
          </button>
        </div>

        {exito && <div className="alert success">{exito}</div>}
        {error && <div className="alert error">{error}</div>}

        {mostrarForm && (
          <div className="card form-card">

            <h2>Nuevo Material</h2>

            <form onSubmit={handleSubmit} noValidate>

              <div className="form-grid">

                <div className="field">
                  <label>Producto</label>
                  <select
                    value={form.producto_id} required
                    onChange={e => setForm(f => ({
                      ...f,
                      producto_id: e.target.value
                    }))}
                  ><option value="">Seleccionar producto...</option>
                    {productos.map(p => (
                      <option
                        key={p.producto_id}
                        value={p.producto_id}>{p.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label>Material</label>

                  <select
                    value={form.material_id}
                    required
                    onChange={e =>
                      setForm(f => ({
                        ...f,
                        material_id: e.target.value
                      }))
                    }><option value="">Seleccionar material...</option>

                    {materiales.map(m => (
                      <option
                        key={m.material_id} value={m.material_id}>{m.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label>Cantidad por unidad</label>

                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={form.cantidad_por_unidad}
                    onChange={e =>
                      setForm(f => ({ ...f, cantidad_por_unidad: e.target.value }))}
                  />
                </div>

              </div>

              <div className="field">
                <label>No de pedido</label>

                <select
                  value={form.pedido_id}
                  required
                  onChange={e =>
                    setForm(f => ({
                      ...f,
                      pedido_id: e.target.value
                    }))
                  }><option value="">Seleccionar pedido...</option>

                  {pedidos.map(m => (
                    <option
                      key={m.pedido_id} value={m.pedido_id}>{m.pedido_id}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Guardando...' : 'Guardar'}
                </button>
              </div>

            </form>
          </div>
        )}

        <div className="card">

          <div className="table-header">
            <span>
              {materialesUsados.length} registro
              {materialesUsados.length !== 1 ? 's' : ''}
            </span>
          </div>

          {materialesUsados.length === 0 ? (
            <div className="empty">
              No hay registros.
            </div>
          ) : (
            <table>

              <thead>
                <tr>
                  <th>No de pedido</th>
                  <th>Producto</th>
                  <th>Material</th>
                  <th>Cantidad por unidad</th>
                </tr>
              </thead>

              <tbody>
                {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => {
                  const item = materialesUsados[i];
                  if (item) {
                    return (
                      <tr key={item.pedido_id + '-' + i}>
                        <td>{item.pedido_id}</td>
                        <td>{item.producto}</td>
                        <td>{item.material}</td>
                        <td>{item.cantidad_por_unidad}</td>
                      </tr>
                    );
                  }
                  return (
                    <tr key={`empty-mat-${i}`}>
                      <td>—</td>
                      <td>—</td>
                      <td>—</td>
                      <td>—</td>
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
          padding: .7rem 1.25rem; text-align: center;
          font-size: .75rem; font-weight: 600; color: #64748b;
          text-transform: uppercase; letter-spacing: .05em;
          background: #f8fafc; border-bottom: 1px solid #e2e8f0;
        }

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
          background: #e2e8f0; color: #475569;
        }

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