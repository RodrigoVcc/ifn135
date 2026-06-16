import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario]   = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { setCargando(false); return; }

    api.get('/auth/perfil')
      .then(({ usuario }) => setUsuario(usuario))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setCargando(false));
  }, []);

  async function login(nombre, password) {
    const data = await api.post('/auth/login', { nombre, password });
    localStorage.setItem('token', data.token);
    setUsuario(data.usuario);
    return data.usuario;
  }

  function logout() {
    localStorage.removeItem('token');
    setUsuario(null);
  }

  return (
    <AuthContext.Provider value={{ usuario, cargando, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
