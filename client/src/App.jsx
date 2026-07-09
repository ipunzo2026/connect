import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clientes from './pages/Clientes';
import Pagos from './pages/Pagos';
import Deudores from './pages/Deudores';
import Planes from './pages/Planes';
import Estadisticas from './pages/Estadisticas';
import { Wifi } from 'lucide-react';

// Componente para proteger rutas privadas
const PrivateLayout = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090a0f] flex flex-col items-center justify-center text-slate-400 gap-4">
        <Wifi className="w-10 h-10 text-cyan-400 animate-pulse" />
        <span className="text-sm font-semibold tracking-widest">Cargando ISP Portal...</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen w-screen bg-[#090a0f] overflow-hidden">
      {/* Sidebar de navegación */}
      <Sidebar />

      {/* Contenido Principal */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <div className="w-full max-w-7xl mx-auto px-4 py-8 md:px-8">
          {children}
        </div>
      </main>
    </div>
  );
};

// Componente para evitar acceso al Login si ya tiene sesión
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090a0f] flex flex-col items-center justify-center text-slate-400 gap-4">
        <Wifi className="w-10 h-10 text-cyan-400 animate-pulse" />
        <span className="text-sm font-semibold tracking-widest">Cargando ISP Portal...</span>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Ruta pública (Login) */}
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } 
          />

          {/* Rutas Protegidas */}
          <Route 
            path="/" 
            element={
              <PrivateLayout>
                <Dashboard />
              </PrivateLayout>
            } 
          />
          <Route 
            path="/clientes" 
            element={
              <PrivateLayout>
                <Clientes />
              </PrivateLayout>
            } 
          />
          <Route 
            path="/pagos" 
            element={
              <PrivateLayout>
                <Pagos />
              </PrivateLayout>
            } 
          />
          <Route 
            path="/deudores" 
            element={
              <PrivateLayout>
                <Deudores />
              </PrivateLayout>
            } 
          />
          <Route 
            path="/planes" 
            element={
              <PrivateLayout>
                <Planes />
              </PrivateLayout>
            } 
          />
          <Route 
            path="/estadisticas" 
            element={
              <PrivateLayout>
                <Estadisticas />
              </PrivateLayout>
            } 
          />

          {/* Fallback de redirección */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
