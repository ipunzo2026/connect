import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  DollarSign, 
  AlertTriangle, 
  Wifi, 
  BarChart3, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  User
} from 'lucide-react';

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Clientes', path: '/clientes', icon: Users },
    { name: 'Pagos del Mes', path: '/pagos', icon: DollarSign },
    { name: 'Deudores', path: '/deudores', icon: AlertTriangle, badge: 'vencidos' },
    { name: 'Planes', path: '/planes', icon: Wifi },
    { name: 'Estadísticas', path: '/estadisticas', icon: BarChart3 },
  ];

  const activeClass = "bg-gradient-to-r from-cyan-950 to-blue-950 text-cyan-400 border-l-4 border-cyan-500 shadow-neon-cyan";
  const inactiveClass = "text-slate-400 hover:bg-slate-900/50 hover:text-white";

  return (
    <div 
      className={`h-screen flex flex-col bg-[#0b0c15] border-r border-brand-border transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Header Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-brand-border">
        <Link to="/" className="flex items-center gap-2 overflow-hidden">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-cyan-500/25 shrink-0">
            <Wifi className="w-5 h-5 animate-pulse" />
          </div>
          {!collapsed && (
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              CONNECT <span className="text-cyan-400">ISP</span>
            </span>
          )}
        </Link>
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-900 border border-brand-border hidden md:block"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Menú de Navegación */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path !== '/' && location.pathname.startsWith(item.path));
          
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-3 rounded-lg font-medium text-sm transition-premium ${
                isActive ? activeClass : inactiveClass
              }`}
              title={collapsed ? item.name : ''}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span className="truncate">{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Info del Usuario */}
      <div className="p-4 border-t border-brand-border bg-[#07080e]/60">
        <div className="flex items-center justify-between gap-2 overflow-hidden">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-cyan-400 border border-brand-border shrink-0">
              <User className="w-4 h-4" />
            </div>
            {!collapsed && (
              <div className="text-left overflow-hidden">
                <p className="text-xs font-bold text-slate-200 truncate">{user?.nombre}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">{user?.rol}</p>
              </div>
            )}
          </div>
          <button
            onClick={logout}
            className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/20 transition-colors"
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
