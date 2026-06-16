import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProtectedRoute({ children, roles }) {
  const { usuario, cargando } = useAuth();

  if (cargando) return <div className="loading">Cargando…</div>;
  if (!usuario) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(usuario.rol)) return <Navigate to="/sin-permiso" replace />;

  return children;
}
