import { useState, useEffect } from 'react';
import Layout from '../components/Layout.jsx';
import { api } from '../lib/api.js';

const ITEMS_PER_PAGE = 5;

const INITIAL = { nombre: '', apellido: '', password: '', rol_id: '' };

export default function Empleados() {
  const [empleados, setEmpleados] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [roles, setRoles] = useState([]);
  const [form, setForm] = useState(INITIAL);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [loading, setLoading] = useState(false);
  const [mostrarForm, setMostrar] = useState(false);
  const [editando, setEditando] = useState(null);
  const [confirmando, setConfirmando] = useState(null);
  const [mostrarPassword, setMostrarPassword] = useState(false);

  useEffect(() => { cargarDatos(); }, [page]);

  async function cargarDatos() {
    try {
      const [emp, rol] = await Promise.all([
        api.get(`/empleados?page=${page}`),
        api.get('/empleados/roles'),
      ]);
      const empRows = emp.rows ?? emp;
      setEmpleados(empRows);
      if (emp.total) { setTotalPages(emp.totalPages ?? 1); }
      setRoles(rol);
    } catch (err) {
      console.error(err);
    }
  }

  function abrirEditar(emp) {
    setEditando(emp.empleado_id);
    setForm({
      nombre: emp.nombre,
      apellido: emp.apellido,
      password: '',
      rol_id: roles.find(r => r.cargo === emp.rol)?.rol_id ?? '',
    });
    setMostrar(true);
    setMostrarPassword(false);
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
        await api.put(`/empleados/${editando}`, { ...form, rol_id: Number(form.rol_id) });
        setExito('Empleado actualizado exitosamente.');
      } else {
        await api.post('/empleados', { ...form, rol_id: Number(form.rol_id) });
        setExito('Empleado creado exitosamente.');
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
      await api.delete(`/empleados/${confirmando.id}`);
      setExito('Empleado eliminado exitosamente.');
      setConfirmando(null);
      await cargarDatos();
    } catch (err) {
      setError(err.message);
      setConfirmando(null);
    }
  }

  return (
    <Layout>
      <div className="page">

        {confirmando && (
          <div className="modal-overlay">
            <div className="modal">
              <h3>Eliminar empleado</h3>
              <p>¿Estas seguro de que deseas eliminar a <strong>{confirmando.nombre}</strong>? Esta accion no se puede deshacer.</p>
              <div className="modal-actions">
                <button className="btn-cancelar-modal" onClick={() => setConfirmando(null)}>Cancelar</button>
                <button className="btn-confirmar-eliminar" onClick={eliminar}>Eliminar</button>
              </div>
            </div>
          </div>
        )}

        <div className="page-header">
          <div>
            <h1>Empleados</h1>
            <p>Gestion de usuarios del sistema</p>
          </div>
          <button className="btn-primary" onClick={() => {
            if (mostrarForm) { cancelar(); } else { setMostrar(true); setError(''); setExito(''); }
          }}>
            {mostrarForm ? 'Cancelar' : 'Nuevo empleado'}
          </button>
        </div>

        {exito && <div className="alert success">{exito}</div>}
        {error && <div className="alert error">{error}</div>}

        {mostrarForm && (
          <div className="card form-card">
            <h2>{editando ? 'Editar empleado' : 'Nuevo empleado'}</h2>
            <form onSubmit={handleSubmit} noValidate>
              <div className="form-grid">
                <div className="field">
                  <label>Nombre</label>
                  <input type="text" value={form.nombre} required
                    placeholder="Juan"
                    onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
                </div>
                <div className="field">
                  <label>Apellido</label>
                  <input type="text" value={form.apellido} required
                    placeholder="Perez"
                    onChange={e => setForm(f => ({ ...f, apellido: e.target.value }))} />
                </div>
                <div className="field">
                  <label>{editando ? 'Nueva contraseña (opcional)' : 'Contraseña'}</label>
                  <input type={mostrarPassword ? 'text' : 'password'} value={form.password}
                    required={!editando}
                    placeholder={editando ? 'Dejar vacio para no cambiar' : 'Minimo 6 caracteres'}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                    <input type="checkbox" checked={mostrarPassword} onChange={e => setMostrarPassword(e.target.checked)} />
                    <span>Mostrar contraseña</span>
                  </label>
                </div>
                <div className="field">
                  <label>Rol</label>
                  <select value={form.rol_id} required
                    onChange={e => setForm(f => ({ ...f, rol_id: e.target.value }))}>
                    <option value="">Seleccionar rol...</option>
                    {roles.map(r => (
                      <option key={r.rol_id} value={r.rol_id}>{r.cargo}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear empleado'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="card">
            <div className="table-header">
              <span>{empleados.length} empleado{empleados.length !== 1 ? 's' : ''} registrado{empleados.length !== 1 ? 's' : ''}</span>
            </div>
          {empleados.length === 0 ? (
            <div className="empty">No hay empleados registrados.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nombre</th>
                  <th>Apellido</th>
                  <th>Rol</th>
                  <th className="col-acciones">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => {
                  const emp = empleados[i];
                  if (emp) {
                    return (
                      <tr key={emp.empleado_id}>
                        <td className="id-cell">{emp.empleado_id}</td>
                        <td>{emp.nombre}</td>
                        <td>{emp.apellido}</td>
                        <td><span className="badge">{emp.rol}</span></td>
                        <td className="acciones">
                          <button className="btn-editar" onClick={() => abrirEditar(emp)}>Editar</button>
                          <button className="btn-eliminar" onClick={() => setConfirmando({ id: emp.empleado_id, nombre: `${emp.nombre} ${emp.apellido}` })}>Eliminar</button>
                        </td>
                      </tr>
                    );
                  }
                  return (
                    <tr key={`empty-${i}`} className="entrega-vacia">
                      <td className="id-cell">—</td>
                      <td>—</td>
                      <td>—</td>
                      <td><span className="badge">—</span></td>
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

        .acciones { display: flex; gap: .5rem; justify-content: center; align-items: center; }

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

        @media (max-width: 600px) {
          .form-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </Layout>
  );
}