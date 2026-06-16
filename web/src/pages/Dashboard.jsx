import Layout from '../components/Layout.jsx';
import { useEffect, useState, useMemo } from 'react';
import { api } from '../lib/api.js';
import { useNavigate } from 'react-router-dom';

const ITEMS_PER_PAGE = 3;

function fmtMonto(n) {
  return Number(n || 0).toLocaleString('es-SV', {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  });
}

function formatFechaInput(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const ESTADOS = [
  { key: 'pendiente', label: 'Pendiente', color: '#f59e0b' },
  { key: 'en_produccion', label: 'En producción', color: '#2563eb' },
  { key: 'procesando', label: 'En proceso', color: '#8b5cf6' },
  { key: 'listo', label: 'Listo', color: '#10b981' },
  { key: 'entregado', label: 'Entregado', color: '#059669' },
  { key: 'cancelado', label: 'Cancelado', color: '#ef4444' },
];

function mismoDia(f1, f2) {
  if (!f1 || !f2) return false;
  const d1 = new Date(f1);
  const d2 = new Date(f2);
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();
}

export default function Dashboard() {
  const navigate = useNavigate();

  const [pedidos, setPedidos] = useState([]);
  const [inventario, setInventario] = useState([]);
  const [restock, setRestock] = useState([]);
  const [dismissed, setDismissed] = useState([]);
  const [urgentesPage, setUrgentesPage] = useState(1);

  const ahora = new Date();
  const primerDiaMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);

  const [desde, setDesde] = useState(() => {
    const guardada = sessionStorage.getItem('ventas_desde');
    return guardada || formatFechaInput(primerDiaMes);
  });

  const [hasta, setHasta] = useState(() => {
    const guardada = sessionStorage.getItem('ventas_hasta');
    return guardada || formatFechaInput(ahora);
  });

  useEffect(() => {
    sessionStorage.setItem('ventas_desde', desde);
  }, [desde]);

  useEffect(() => {
    sessionStorage.setItem('ventas_hasta', hasta);
  }, [hasta]);

  useEffect(() => {
    Promise.all([
      api.get('/pedidos'),
      api.get('/inventario'),
      api.get('/restock'),
    ]).then(([p, inv, rs]) => {
      setPedidos(p || []);
      setInventario(inv || []);
      setRestock(rs || []);
    }).catch(() => { });
  }, []);

  const dismissAlert = (id) => setDismissed(prev => [...prev, id]);

  function totalPedido(p) {
    return (p.detalles || []).reduce((s, d) => s + Number(d.subtotal || 0), 0);
  }

  const inicio = desde ? new Date(desde + 'T00:00:00') : null;
  const fin = hasta ? new Date(hasta + 'T23:59:59') : null;

  const ventasPeriodo = pedidos
    .filter(p => {
      if (p.estado !== 'entregado') return false;
      if (!p.fecha_entrega) return false;
      const fecha = new Date(p.fecha_entrega);
      if (inicio && fecha < inicio) return false;
      if (fin && fecha > fin) return false;
      return true;
    })
    .reduce((sum, p) => sum + totalPedido(p), 0);

  const bajoStock = inventario.filter(m => Number(m.stock_actual) <= Number(m.stock_minimo));
  const restockPendientes = restock.filter(r => r.estado === 'pendiente');

  const hoy = new Date();
  const manana = new Date(hoy);
  manana.setDate(manana.getDate() + 1);

  const allPedidosUrgentes = useMemo(() => {
    return pedidos.filter(p => {
      if (['entregado', 'cancelado'].includes(p.estado)) return false;
      if (!p.fecha_entrega) return false;
      return mismoDia(p.fecha_entrega, hoy) || mismoDia(p.fecha_entrega, manana);
    }).sort((a, b) => new Date(a.fecha_entrega) - new Date(b.fecha_entrega));
  }, [pedidos, hoy, manana]);

  const urgentesTotalPages = Math.ceil(allPedidosUrgentes.length / ITEMS_PER_PAGE);

  const pedidosUrgentes = useMemo(() => {
    return allPedidosUrgentes.slice(
      (urgentesPage - 1) * ITEMS_PER_PAGE,
      urgentesPage * ITEMS_PER_PAGE
    );
  }, [allPedidosUrgentes, urgentesPage]);

  const kpiData = useMemo(() => {
    return [
      {
        label: 'Pendientes',
        valor: pedidos.filter(p => p.estado === 'pendiente').length,
        color: '#f59e0b'
      },
      {
        label: 'En producción',
        valor: pedidos.filter(p => p.estado === 'en_produccion').length,
        color: '#2563eb'
      },
      {
        label: 'En proceso',
        valor: pedidos.filter(p => p.estado === 'procesando').length,
        color: '#8b5cf6'
      },
      {
        label: 'Listos',
        valor: pedidos.filter(p => p.estado === 'listo').length,
        color: '#10b981'
      },
    ];
  }, [pedidos]);

  const alertaRestock = restockPendientes.length > 0 ? {
    id: `alerta-restock-${restockPendientes.length}`,
    msg: restockPendientes.length === 1
      ? '1 solicitud de reabastecimiento espera aprobación.'
      : `${restockPendientes.length} solicitudes de reabastecimiento esperan aprobación.`,
    nivel: 'aviso',
    accion: 'Revisar',
    link: '/restock',
  } : null;

  const alertasVisibles = alertaRestock && !dismissed.includes(alertaRestock.id) ? [alertaRestock] : [];

  return (
    <Layout>
      <div className="dash-root">

        <div className="page-header">
          <h1>Inicio</h1>
          <p>Vista general</p>
        </div>

        {alertasVisibles.length > 0 && (
          <section className="alertas-wrap">
            <p className="alertas-titulo">Requiere su atención</p>
            <div className="alertas-lista">
              {alertasVisibles.map(a => (
                <div key={a.id} className={`alerta alerta-${a.nivel}`}>
                  <span className="alerta-msg">{a.msg}</span>
                  <button className="alerta-btn" onClick={() => navigate(a.link)}>
                    {a.accion}
                  </button>
                  <button
                    className="alerta-close"
                    onClick={() => dismissAlert(a.id)}
                    aria-label="Cerrar alerta"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="kpi-row">
          {kpiData.map(kpi => (
            <div key={kpi.label} className="kpi-card">
              <div className="kpi-punto" style={{ background: kpi.color }} />
              <div className="kpi-info">
                <span className="kpi-valor">{kpi.valor}</span>
                <span className="kpi-label">{kpi.label}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="main-grid">
          <div className="left-col">
            <div className="ventas-card">
              <div className="ventas-header">
                <div className="ventas-titulo">Ventas del período</div>
                <div className="ventas-monto">${fmtMonto(ventasPeriodo)}</div>
                <div className="ventas-subtitulo">Pedidos entregados</div>
              </div>
              <div className="ventas-filtros">
                <div className="ventas-campo">
                  <label>Desde</label>
                  <input type="date" value={desde} onChange={e => setDesde(e.target.value)} />
                </div>
                <div className="ventas-campo">
                  <label>Hasta</label>
                  <input type="date" value={hasta} onChange={e => setHasta(e.target.value)} />
                </div>
              </div>
            </div>

            <div className={`modulo-card ${bajoStock.length > 0 ? 'modulo-alerta-roja' : ''}`}>
              <div className="modulo-titulo">Inventario</div>
              {bajoStock.length > 0 ? (
                <div className="modulo-estado modulo-estado-rojo">
                  {bajoStock.length} {bajoStock.length === 1 ? 'material por debajo del mínimo' : 'materiales por debajo del mínimo'}
                </div>
              ) : (
                <div className="modulo-cifra">{inventario.length} materiales</div>
              )}
              <button
                className={`modulo-boton ${bajoStock.length > 0 ? 'modulo-boton-peligro' : ''}`}
                onClick={() => navigate('/inventario')}
              >
                Gestionar inventario
              </button>
            </div>
          </div>

          <div className="right-col">
            <div className="seccion-card">
              <div className="seccion-header">
                <span className="seccion-titulo">Pedidos urgentes</span>
              </div>
              <div className="seccion-body">
                <div className="lista-entregas">
                  {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => {
                    const p = pedidosUrgentes[i];
                    if (p) {
                      const esHoy = mismoDia(p.fecha_entrega, hoy);
                      return (
                        <div
                          key={p.pedido_id}
                          className={`entrega-item ${esHoy ? 'entrega-hoy' : ''}`}
                          style={{ cursor: 'pointer' }}
                          role="button"
                          tabIndex={0}
                          onClick={() => navigate('/pedidos', { state: { openPedidoId: p.pedido_id } })}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate('/pedidos', { state: { openPedidoId: p.pedido_id } }); }}
                        >
                          <div className="entrega-info">
                            <span className="entrega-id">#{p.pedido_id}</span>
                            <span className="entrega-total">${fmtMonto(totalPedido(p))}</span>
                          </div>
                          <div className="entrega-meta">
                            <span className={`badge-urgencia ${esHoy ? 'badge-hoy' : 'badge-manana'}`}>
                              {esHoy ? 'Hoy' : 'Mañana'}
                            </span>
                            <span className={`badge-estado badge-${p.estado}`}>
                              {ESTADOS.find(e => e.key === p.estado)?.label || p.estado}
                            </span>
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div key={`empty-${i}`} className="entrega-item entrega-vacia">
                        <div className="entrega-info">
                          <span className="entrega-id">—</span>
                          <span className="entrega-total">—</span>
                        </div>
                        <div className="entrega-meta">
                          <span className="badge-urgencia badge-vacia">—</span>
                          <span className="badge-estado badge-vacia">—</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="pagination">
                  <button
                    className="btn-primary"
                    onClick={() => setUrgentesPage(p => Math.max(1, p - 1))}
                    disabled={urgentesPage <= 1}
                  >
                    Anterior
                  </button>
                  <span>{urgentesPage} / {urgentesTotalPages}</span>
                  <button
                    className="btn-primary"
                    onClick={() => setUrgentesPage(p => Math.min(urgentesTotalPages, p + 1))}
                    disabled={urgentesPage >= urgentesTotalPages}
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        .dash-root {
          font-family: 'Inter', sans-serif;
          padding: 0 1.5rem 2.5rem;
          color: #1e293b;
          max-width: 1200px;
          margin: 0 auto;
        }

        .page-header {
          margin-bottom: 1.5rem;
        }

        .page-header h1 {
          font-family: 'Syne', sans-serif;
          font-size: 1.5rem;
          color: #1e293b;
          margin-bottom: 0.2rem;
        }

        .page-header p {
          font-size: .85rem;
          color: #94a3b8;
        }

        .alertas-wrap { margin-bottom: 1.5rem; }
        .alertas-titulo { font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.09em; color: #94a3b8; margin: 0 0 0.6rem; }
        .alertas-lista { display: flex; flex-direction: column; gap: 0.5rem; }
        .alerta {
          display: flex; align-items: center; gap: 1rem;
          padding: 0.9rem 1.1rem; border-radius: 10px;
          font-size: 0.85rem; font-weight: 500;
          box-shadow: 0 1px 2px rgba(0,0,0,0.03);
        }
        .alerta-critico { background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; }
        .alerta-aviso { background: #fffbeb; border: 1px solid #fde68a; color: #92400e; }
        .alerta-msg { flex: 1; line-height: 1.5; }
        .alerta-btn {
          background: none; border: 1px solid currentColor; border-radius: 7px;
          padding: 0.35rem 0.9rem; font-family: 'Inter', sans-serif;
          font-size: 0.78rem; font-weight: 600; cursor: pointer; color: inherit;
          white-space: nowrap; transition: all 0.15s; flex-shrink: 0;
        }
        .alerta-btn:hover { background: rgba(0,0,0,0.04); }
        .alerta-close {
          background: none; border: none; cursor: pointer;
          font-size: 1.3rem; line-height: 1; color: inherit;
          opacity: 0.5; padding: 0 0.2rem; transition: opacity 0.15s;
          flex-shrink: 0; font-weight: 400;
        }
        .alerta-close:hover { opacity: 1; }

        .kpi-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
          margin-bottom: 1.5rem;
        }

        .kpi-card {
          background: #fff;
          border: 1px solid #e8ecf1;
          border-radius: 14px;
          padding: 1.2rem 1.5rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02);
          display: flex;
          align-items: center;
          gap: 0.9rem;
        }

        .kpi-punto {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .kpi-info {
          display: flex;
          flex-direction: column;
        }

        .kpi-valor {
          font-family: 'Syne', sans-serif;
          font-size: 1.8rem;
          font-weight: 800;
          color: #0f172a;
          line-height: 1.1;
        }

        .kpi-label {
          font-size: 0.68rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #64748b;
          margin-top: 0.15rem;
        }

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

        .main-grid {
          display: flex;
          gap: 1.5rem;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
        }

        .left-col {
          flex: 1 1 300px;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .right-col {
          flex: 1 1 300px;
          min-width: 0;
        }

        .ventas-card {
          background: #fff;
          border: 1px solid #e8ecf1;
          border-radius: 14px;
          padding: 1.5rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02);
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .ventas-header { }
        .ventas-titulo {
          font-size: 0.68rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.09em;
          color: #94a3b8;
          margin-bottom: 0.5rem;
        }

        .ventas-monto {
          font-family: 'Syne', sans-serif;
          font-size: 2.5rem;
          font-weight: 800;
          color: #0f172a;
          line-height: 1;
          margin-bottom: 0.25rem;
        }

        .ventas-subtitulo { font-size: 0.72rem; color: #94a3b8; }

        .ventas-filtros {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
          align-items: center;
        }

        .ventas-campo {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex: 1 1 auto;
        }

        .ventas-campo label {
          font-size: 0.68rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #64748b;
          white-space: nowrap;
        }

        .ventas-campo input[type="date"] {
          padding: 0.55rem 0.75rem;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-family: 'Inter', sans-serif;
          font-size: 0.82rem;
          color: #1e293b;
          background: #fff;
          outline: none;
          width: 100%;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .ventas-campo input[type="date"]:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
        }

        .seccion-card {
          background: #fff;
          border: 1px solid #e8ecf1;
          border-radius: 14px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02);
          overflow: hidden;
          height: 100%;
        }

        .seccion-header {
          padding: 1rem 1.5rem;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .seccion-titulo {
          font-size: 0.8rem;
          font-weight: 700;
          color: #1e293b;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .seccion-body { padding: 1.5rem; }

        .lista-entregas {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .entrega-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1rem;
          border-radius: 10px;
          border: 1px solid #f1f5f9;
          background: #fafbfc;
        }

        .entrega-item.entrega-hoy {
          border-color: #fecaca;
          background: #fff5f5;
        }

        .entrega-vacia {
          background: #f9fafb;
          border: 1px dashed #e2e8f0;
          color: #94a3b8;
          pointer-events: none;
          user-select: none;
        }

        .entrega-info {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }

        .entrega-id {
          font-weight: 700;
          color: #1e40af;
          font-size: 0.85rem;
        }

        .entrega-vacia .entrega-id,
        .entrega-vacia .entrega-total {
          color: #94a3b8;
        }

        .entrega-total {
          font-weight: 600;
          color: #0f172a;
          font-size: 0.8rem;
        }

        .entrega-meta {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }

        .badge-estado {
          display: inline-block;
          padding: 0.2rem 0.6rem;
          border-radius: 5px;
          font-size: 0.68rem;
          font-weight: 700;
        }

        .badge-pendiente { background: #fef3c7; color: #92400e; }
        .badge-en_produccion { background: #dbeafe; color: #1e40af; }
        .badge-procesando { background: #ede9fe; color: #6d28d9; }
        .badge-listo { background: #d1fae5; color: #065f46; }
        .badge-entregado { background: #d1fae5; color: #065f46; }
        .badge-cancelado { background: #fee2e2; color: #991b1b; }

        .badge-urgencia {
          display: inline-block;
          padding: 0.2rem 0.6rem;
          border-radius: 5px;
          font-size: 0.68rem;
          font-weight: 700;
        }

        .badge-hoy { background: #fee2e2; color: #991b1b; }
        .badge-manana { background: #f1f5f9; color: #475569; }
        .badge-vacia {
          background: #f1f5f9;
          color: #94a3b8;
          font-weight: 500;
        }

        .pagination {
          display: flex;
          justify-content: center;
          gap: 8px;
          padding: .5rem 0;
          align-items: center;
        }

        .modulo-card {
          background: #fff;
          border: 1px solid #e8ecf1;
          border-radius: 14px;
          padding: 1.5rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02);
          display: flex;
          flex-direction: column;
          transition: border-color 0.2s, background 0.2s;
        }

        .modulo-card.modulo-alerta-roja {
          border-color: #ef4444;
          background: #fee2e2;
        }

        .modulo-titulo {
          font-size: 0.68rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.09em;
          color: #64748b;
          margin-bottom: 0.75rem;
        }

        .modulo-cifra {
          font-family: 'Syne', sans-serif;
          font-size: 2rem;
          font-weight: 700;
          color: #0f172a;
          line-height: 1;
          margin-bottom: 0.5rem;
        }

        .modulo-estado {
          font-size: 0.9rem;
          font-weight: 500;
          color: #475569;
          margin-bottom: 1rem;
        }

        .modulo-estado-rojo {
          color: #b91c1c;
          font-weight: 600;
        }

        .modulo-boton {
          margin-top: auto;
          padding: 0.6rem 1.2rem;
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-family: 'Inter', sans-serif;
          font-size: 0.8rem;
          font-weight: 600;
          color: #2563eb;
          cursor: pointer;
          transition: all 0.15s;
          align-self: flex-start;
        }

        .modulo-boton:hover {
          background: #f0f5ff;
          border-color: #2563eb;
        }

        .modulo-boton-peligro {
          background: #991b1b;
          border-color: #7f1d1d;
          color: white;
        }

        .modulo-boton-peligro:hover {
          background: #7f1d1d;
          border-color: #991b1b;
        }

        @media (max-width: 768px) {
          .kpi-row {
            grid-template-columns: repeat(2, 1fr);
          }
          .ventas-filtros {
            flex-direction: column;
            align-items: stretch;
          }
          .ventas-campo {
            flex: none;
            width: 100%;
          }
        }

        @media (max-width: 640px) {
          .main-grid {
            flex-direction: column;
          }
        }

        @media (max-width: 480px) {
          .kpi-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </Layout>
  );
}