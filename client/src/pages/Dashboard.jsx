import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { CardSkeleton } from '../components/LoadingSkeleton';
import { 
  Users, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  DollarSign, 
  TrendingUp,
  Percent,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.get('/dashboard/stats');
        setStats(data);
      } catch (err) {
        console.error(err);
        setError('No se pudieron cargar las estadísticas del dashboard.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-100">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center glass-panel rounded-2xl border border-red-500/20 text-red-400">
        <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
        <p className="font-medium">{error}</p>
      </div>
    );
  }

  const {
    clientesActivos,
    clientesAlCorriente,
    clientesPendientes,
    clientesVencidos,
    ingresosCobrados,
    ingresosEsperados
  } = stats;

  const tasaCobro = ingresosEsperados > 0 ? ((ingresosCobrados / ingresosEsperados) * 100).toFixed(1) : 0;

  const cards = [
    {
      title: 'Clientes Activos',
      value: clientesActivos,
      desc: 'Clientes activos en servicio',
      icon: Users,
      color: 'from-blue-500/20 to-indigo-500/5 text-blue-400 border-blue-500/20',
    },
    {
      title: 'Al Corriente',
      value: clientesAlCorriente,
      desc: 'Pagos completados este mes',
      icon: CheckCircle,
      color: 'from-emerald-500/20 to-teal-500/5 text-emerald-400 border-emerald-500/20',
    },
    {
      title: 'Pendientes',
      value: clientesPendientes,
      desc: 'Por cobrar antes del día límite',
      icon: Clock,
      color: 'from-amber-500/20 to-orange-500/5 text-amber-400 border-amber-500/20',
    },
    {
      title: 'Pagos Vencidos',
      value: clientesVencidos,
      desc: 'Atraso en fecha límite',
      icon: AlertTriangle,
      color: 'from-red-500/20 to-rose-500/5 text-red-400 border-red-500/20',
      link: '/deudores'
    },
    {
      title: 'Cobrado este Mes',
      value: `$${(ingresosCobrados || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
      desc: 'Ingresos reales percibidos',
      icon: DollarSign,
      color: 'from-cyan-500/20 to-cyan-500/5 text-cyan-400 border-cyan-500/20',
    },
    {
      title: 'Esperado este Mes',
      value: `$${(ingresosEsperados || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
      desc: 'Potencial total de facturación',
      icon: TrendingUp,
      color: 'from-purple-500/20 to-purple-500/5 text-purple-400 border-purple-500/20',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-100 font-sans">
          Resumen General
        </h1>
        <p className="text-slate-400 text-sm mt-1">Estado de facturación, cobros e indicadores clave del mes actual.</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          const CardContent = (
            <div className={`glass-panel border rounded-2xl p-6 bg-gradient-to-br ${card.color} transition-all duration-300 hover:scale-[1.02] hover:shadow-neon-cyan`}>
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 rounded-xl bg-black/30">
                  <Icon className="w-6 h-6" />
                </div>
                {card.link && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-950/40 text-red-400 border border-red-500/25 flex items-center gap-1 animate-pulse">
                    Ver deudores <ChevronRight size={12} />
                  </span>
                )}
              </div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">{card.title}</h3>
              <p className="text-3xl font-extrabold text-slate-100 mt-2 font-sans">{card.value}</p>
              <p className="text-xs text-slate-500 mt-2">{card.desc}</p>
            </div>
          );

          if (card.link) {
            return (
              <Link key={idx} to={card.link}>
                {CardContent}
              </Link>
            );
          }
          return <div key={idx}>{CardContent}</div>;
        })}
      </div>

      {/* Tasa de Cobro Panel */}
      <div className="glass-panel border border-brand-border rounded-3xl p-8 bg-[#121420]/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 text-slate-800 opacity-20 pointer-events-none">
          <Percent className="w-36 h-36" />
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <h2 className="text-xl font-extrabold text-slate-100">Eficiencia en la Cobranza</h2>
            <p className="text-slate-400 text-sm max-w-xl">
              Este indicador mide el porcentaje de los ingresos totales proyectados del mes que han sido cobrados efectivamente.
            </p>
          </div>
          
          <div className="flex items-center gap-6 shrink-0">
            <div className="text-right">
              <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Tasa de Efectividad</span>
              <span className="text-5xl font-black text-cyan-400 tracking-tight">{tasaCobro}%</span>
            </div>
            {/* Progress Circle Visual */}
            <div className="relative w-20 h-20">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-800"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-cyan-400"
                  strokeDasharray={`${tasaCobro}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
