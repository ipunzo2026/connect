import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Wifi, Lock, User, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!usuario || !password) {
      setError('Por favor complete todos los campos.');
      return;
    }

    setError('');
    setIsSubmitting(true);
    try {
      await login(usuario, password);
        // Redirigir al dashboard (manejado por el App Router al cambiar el AuthContext)
      navigate('/dashboard'); //Forzar redirección al dashboard después del login exitoso
    } catch (err) {
      setError(err.message || 'Error de credenciales.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#090a0f] relative overflow-hidden px-4">
      {/* Círculos decorativos con desenfoque (glowing effects) */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-cyan-500/10 blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-blue-500/10 blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo/Título */}
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 items-center justify-center text-white shadow-xl shadow-cyan-500/20 mb-4">
            <Wifi className="w-7 h-7" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            CONNECT <span className="text-cyan-400">ISP</span>
          </h1>
          <p className="text-sm text-slate-500 mt-2">Plataforma de Administración y Cobros</p>
        </div>

        {/* Panel de Login */}
        <div className="bg-[#121420]/80 border border-brand-border rounded-3xl p-8 shadow-2xl glass-panel">
          <h2 className="text-xl font-bold text-slate-100 mb-6">Iniciar Sesión</h2>

          {error && (
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-950/20 border border-red-500/20 text-red-400 text-sm mb-6">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Usuario
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-950/50 border border-brand-border rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-premium"
                  placeholder="Ej: admin"
                  autoComplete="username"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-950/50 border border-brand-border rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-premium"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 font-bold rounded-xl shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:from-cyan-400 hover:to-blue-400 active:scale-[0.98] transition-premium flex items-center justify-center gap-2 mt-2"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Acceder al Panel'
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-xs text-slate-600">
          Tip: Contraseñas de prueba: <strong>admin / admin123</strong> o <strong>juan / juan123</strong>
        </div>
      </div>
    </div>
  );
};

export default Login;
