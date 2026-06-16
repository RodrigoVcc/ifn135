import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider }   from './context/AuthContext.jsx';
import ProtectedRoute     from './components/ProtectedRoute.jsx';
import Login              from './pages/Login.jsx';
import Dashboard          from './pages/Dashboard.jsx';
import Empleados          from './pages/Empleados.jsx';
import Pedidos            from './pages/Pedidos.jsx';
import Produccion         from './pages/Produccion.jsx';
import Inventario         from './pages/Inventario.jsx';
import Restock            from './pages/Restock.jsx';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/dashboard" element={
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          } />

          <Route path="/empleados" element={
            <ProtectedRoute roles={['Administrador']}><Empleados /></ProtectedRoute>
          } />

          <Route path="/pedidos" element={
            <ProtectedRoute roles={['Administrador','Recepcionista','Instalador']}><Pedidos /></ProtectedRoute>
          } />

          <Route path="/inventario" element={
            <ProtectedRoute roles={['Administrador','Operario']}><Inventario /></ProtectedRoute>
          } />

          <Route path="/produccion" element={
            <ProtectedRoute roles={['Administrador','Operario']}><Produccion /></ProtectedRoute>
          } />

          <Route path="/restock" element={
            <ProtectedRoute roles={['Administrador','Recepcionista']}><Restock /></ProtectedRoute>
          } />

          <Route path="/sin-permiso" element={
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center',
                          minHeight:'100vh', background:'#f1f5f9',
                          fontFamily:"'DM Sans',sans-serif", textAlign:'center' }}>
              <div>
                <h2 style={{ color:'#1e293b', marginBottom:'.5rem', fontSize:'2rem' }}>403</h2>
                <p style={{ color:'#94a3b8' }}>No tienes permiso para ver esta seccion.</p>
              </div>
            </div>
          } />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
