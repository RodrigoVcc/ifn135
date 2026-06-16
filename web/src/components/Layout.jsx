import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useState } from 'react';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Inicio', roles: ['Administrador'] },
  { to: '/empleados', label: 'Empleados', roles: ['Administrador'] },
  { to: '/pedidos', label: 'Pedidos', roles: ['Administrador', 'Recepcionista', 'Instalador'] },
  { to: '/inventario', label: 'Inventario', roles: ['Administrador', 'Operario'] },
  { to: '/produccion', label: 'Produccion', roles: ['Administrador', 'Operario'] },
  { to: '/restock', label: 'Re-Stock', roles: ['Administrador', 'Recepcionista'] },
];

export default function Layout({ children }) {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const items = NAV_ITEMS.filter(i => i.roles.includes(usuario?.rol));

  return (
    <div className="layout-root">
      <div className={`mobile-topbar ${open ? 'hidden' : ''}`}>
        <button className="mobile-burger" onClick={() => setOpen(s => !s)} aria-label="menu">
          <img src="/menu.svg" alt="menu" className="mobile-burger-icon" />
        </button>
        <div className="mobile-avatar-wrap">
          <img className="mobile-avatar" src={usuario?.rol === 'Administrador' ? '/favicon.svg' : '/user.svg'} alt="usuario" />
        </div>
      </div>
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-top">
          <div className="brand"></div>
        </div>

        <div className="user-box">
          <div className="avatar">
            <img className="avatar-img" src={usuario?.rol === 'Administrador' ? '/favicon.svg' : '/user.svg'} alt="avatar" />
          </div>
          <div className="user-info">
            <div className="user-name">{usuario?.nombre}</div>
            <div className="user-role">{usuario?.rol}</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {items.map(item => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="btn-logout" title="Cerrar sesión" onClick={() => { logout(); navigate('/login'); }} aria-label="Cerrar sesión">
            <svg className="logout-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M16 13v-2H7V8l-5 4 5 4v-3h9z" />
              <path d="M20 3h-8v2h8v14h-8v2h8a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z" />
            </svg>
          </button>
        </div>
      </aside>

      <div className={`backdrop ${open ? 'visible' : ''}`} onClick={() => setOpen(false)} />

      <main className="main-content">{children}</main>

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; background: #f8fafc; }

        .layout-root { display: flex; min-height: 100vh; }

        .mobile-topbar { display: none; }

        .sidebar {
          width: 240px; background: linear-gradient(180deg,#1e40af,#2563eb);
          color: #fff; padding: 1rem; display: flex; flex-direction: column;
          gap: 1rem; transition: transform .28s cubic-bezier(.2,.8,.2,1), width .2s;
          position: fixed; top: 0; left: 0; height: 100vh; z-index: 30;
        }

        .sidebar.open { transform: translateX(0); }

        .sidebar-top { display:flex; align-items:center; justify-content:space-between; }

        .brand { font-family: 'Syne', sans-serif; font-size: 1.05rem; font-weight: 800; color: #fff; }

        .burger { width:36px; height:36px; background:transparent; border:none; display:none; flex-direction:column; gap:4px; cursor:pointer; }
        .burger span { height:3px; background:rgba(255,255,255,.85); display:block; border-radius:2px; }

        .user-box { display:flex; gap:.75rem; align-items:center; padding:.5rem .25rem; border-radius:8px; background: rgba(255,255,255,0.06); }
        .avatar { width:44px; height:44px; border-radius:8px; background: transparent; display:flex; align-items:center; justify-content:center; overflow:hidden; }
        .avatar-img { width:36px; height:36px; object-fit:contain; }
        .user-name { font-weight:700; color:#fff; }
        .user-role { font-size:.78rem; color: rgba(255,255,255,.85); }

        .sidebar-nav { display:flex; flex-direction:column; gap:.35rem; margin-top:.4rem; }
        .nav-item { padding:.6rem .7rem; border-radius:8px; color: rgba(255,255,255,.9); text-decoration:none; font-weight:600; transition: background .2s, transform .12s; }
        .nav-item:hover { background: rgba(255,255,255,0.08); transform: translateX(4px); }
        .nav-item.active { background: rgba(255,255,255,0.14); box-shadow: 0 4px 14px rgba(2,6,23,0.08); }

        .sidebar-footer { margin-top:auto; padding-bottom: .75rem; }
        .btn-logout { width:48px; height:48px; padding:0; border-radius:50%; background: #fff; color: #1e40af; border:none; cursor:pointer; transition: background .12s, box-shadow .12s, opacity .12s; display:flex; align-items:center; justify-content:center; box-shadow: 0 8px 22px rgba(2,6,23,0.12); }
        .btn-logout .logout-icon { width:22px; height:22px; fill: currentColor; transition: fill .12s; }
        .btn-logout:hover { opacity:0.98; background: rgba(230,242,255,1); }
        .btn-logout:hover .logout-icon { fill: #062e6e; }

        .main-content { flex:1; padding:1.5rem 2rem; margin-left:240px; transition: margin-left .2s; height: 100vh; overflow-y: auto; -webkit-overflow-scrolling: touch; }

        
        table { width: 100%; margin: 0; border-collapse: collapse; }
        table th, table td { text-align: left; }

        th.col-acciones { text-align: center; }
        td.acciones { text-align: center; }

        @media (max-width: 880px) {
          .sidebar { position: fixed; height:100vh; left:0; top:0; transform: translateX(-100%); width:220px; z-index:60; }
          .sidebar.open { transform: translateX(0); }
          .sidebar .burger { display: none; }
          .burger { display:flex; }
          .main-content { margin-left:0; padding:1rem; }

          .mobile-topbar { display:flex; position: fixed; top: 0; left: 0; right: 0; height: 64px; padding: 10px 12px; justify-content: space-between; align-items: center; z-index: 9999; background: linear-gradient(180deg,#1e40af,#2563eb); box-shadow: 0 2px 8px rgba(2,6,23,0.12); }
          .mobile-burger { width:44px; height:44px; background: #ffffff; border: none; display:flex; padding:6px; border-radius:999px; align-items:center; justify-content:center; box-shadow: 0 4px 12px rgba(2,6,23,0.08); }
          .mobile-burger-icon { width:20px; height:20px; display:block; object-fit:contain; }
          .mobile-burger:active .mobile-burger-icon { transform: translateY(1px); opacity: 0.95; }
          .mobile-burger:active, .mobile-burger:focus { outline: none; }
          .mobile-burger:active .mobile-burger-icon, .mobile-burger:focus .mobile-burger-icon { filter: brightness(0.9); }
          .mobile-burger { -webkit-tap-highlight-color: transparent; }
          .mobile-avatar { display: none; }
          .mobile-topbar .mobile-avatar-wrap { display:none; }

              .mobile-topbar.hidden { display: none !important; pointer-events: none; }

              .backdrop { display: none; }
              .backdrop.visible { display: block; position: fixed; inset: 0; background: rgba(2,6,23,0.45); z-index: 50; }

              .sidebar-footer { margin-top:auto; padding: 1rem; }
              .btn-logout { width:44px; height:44px; padding:0; border-radius:50%; background: #fff; color:#1e40af; display:flex; align-items:center; justify-content:center; box-shadow: 0 8px 22px rgba(2,6,23,0.12); transition: background .12s, opacity .12s; }
              .btn-logout .logout-icon { width:20px; height:20px; transition: fill .12s; }
              .btn-logout:hover { opacity:0.98; background: rgba(230,242,255,1); }
              .btn-logout:hover .logout-icon { fill: #062e6e; }

              .main-content { padding-top: 84px; }
        }

        .page { width: 100%; max-width: 1200px; margin: 0 auto; }
        .card { overflow-x: auto; }
        .card table { width: 100%; min-width: 600px; }

        @media (max-width: 880px) {
          .page { padding: 0 .5rem; }
          .card table { min-width: 480px; }
        }
      `}</style>
    </div>
  );
}