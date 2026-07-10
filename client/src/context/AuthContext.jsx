import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('usuario');
      
      if (token && savedUser) {
        try {
          setUser(JSON.parse(savedUser));
          // Verificar token con el backend
          const res = await api.get('/auth/me');
          const datos = res.data;
          setUser(datos.usuario);
          //setUser(res.usuario);
          localStorage.setItem('usuario', JSON.stringify(datos.usuario));
        } catch (error) {
          console.error('Error al restaurar sesión:', error);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (usuario, password) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { usuario, password });
      localStorage.setItem('token', res.token);
      localStorage.setItem('usuario', JSON.stringify(res.usuario));
      const datos = res.data;
      // Guardamos usando la información real del servidor
      localStorage.setItem('token', datos.token);
      localStorage.setItem('usuario', JSON.stringify(datos.usuario));
      setUser(datos.usuario);
      return datos.usuario;
    } catch (error) {
      logout();
      // Para asegurarnos de capturar el mensaje real que manda el backend en Axios:
      throw new Error(error.response?.data?.mensaje || 'Error de credenciales.');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, esAdmin: user?.rol === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
