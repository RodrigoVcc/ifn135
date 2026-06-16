import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const ROLES_REDIRECT = {
  Administrador: '/dashboard',
  Recepcionista: '/pedidos',
  Operario: '/produccion',
  Instalador: '/pedidos',
};

export default function Login() {
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ nombre: '', password: '' });
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoad] = useState(false);


  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoad(true);
    try {
      const usuario = await login(form.nombre, form.password);
      navigate(ROLES_REDIRECT[usuario.rol] ?? '/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoad(false);
    }
  }

  return (
    <div className="root">
      <div className="card">
        <h2>Iniciar sesión</h2>
        <p className="hint">Ingresa tus credenciales para continuar</p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="nombre">Usuario</label>
            <input id="nombre" type="text" autoComplete="username"
              value={form.nombre}
              onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
              placeholder="Nombre de usuario" required />
          </div>

          <div className="field">
            <label htmlFor="password">Contraseña</label>
            <input id="password" type={mostrarPassword ? 'text' : 'password'} autoComplete="current-password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              placeholder="Contraseña" required />
            <div className="checkbox-wrapper">
              <input type="checkbox" id="mostrarPass" checked={mostrarPassword} onChange={e => setMostrarPassword(e.target.checked)} />
              <label htmlFor="mostrarPass">Mostrar contraseña</label>
            </div>
          </div>

          {error && <div className="error">{error}</div>}

          <button type="submit" className="btn" disabled={loading}>
            {loading ? 'Verificando...' : 'Ingresar'}
          </button>
        </form>
      </div>

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; }

        .root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(180deg,#1e40af,#2563eb);
        }

        .card {
          width: 100%;
          max-width: 380px;
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 2.25rem;
          box-shadow: 0 2px 16px rgba(0,0,0,.06);
          color: #1e293b;
        }

        .card h2 {
          font-family: 'Syne', sans-serif;
          font-size: 1.4rem;
          color: #1e293b;
          margin-bottom: .4rem;
        }

        .hint {
          font-size: .83rem;
          color: #94a3b8;
          margin-bottom: 1.75rem;
        }

        .field {
          margin-bottom: 1.1rem;
        }

        label {
          display: block;
          font-size: .75rem;
          font-weight: 600;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: .05em;
          margin-bottom: .4rem;
        }

        input {
          width: 100%;
          padding: .65rem .9rem;
          border: 1.5px solid #e2e8f0;
          border-radius: 7px;
          font-family: 'DM Sans', sans-serif;
          font-size: .92rem;
          color: #1e293b;
          background: #fff;
          outline: none;
          transition: border-color .2s, box-shadow .2s;
        }

        input::placeholder {
          color: #cbd5e1;
        }

        input:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37,99,235,.1);
        }

        .checkbox-wrapper {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 14px;
        }

        .checkbox-wrapper input {
          width: auto;
          margin: 0;
        }

        .checkbox-wrapper label {
          margin-bottom: 0;
          white-space: nowrap;
        }

        .error {
          font-size: .82rem;
          color: #dc2626;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 6px;
          padding: .6rem .85rem;
          margin-bottom: .9rem;
        }

        .btn {
          width: 100%;
          padding: .75rem;
          background: #2563eb;
          color: #fff;
          border: none;
          border-radius: 7px;
          font-family: 'DM Sans', sans-serif;
          font-size: .92rem;
          font-weight: 600;
          cursor: pointer;
          transition: background .15s;
          margin-top: .25rem;
        }

        .btn:hover:not(:disabled) {
          background: #1d4ed8;
        }

        .btn:disabled {
          opacity: .6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}