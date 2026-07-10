import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { ChartSkeleton } from '../components/LoadingSkeleton';
import Toast from '../components/Toast';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { BarChart3, Calendar, RefreshCw } from 'lucide-react';

const COLORS = ['#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

const Estadisticas = () => {
  const today = new Date();
  const currentMonthStr = today.toISOString().slice(0, 7);
  
  const haceSeisMeses = new Date();
  haceSeisMeses.setMonth(today.getMonth() - 5);
  const haceSeisMesesStr = haceSeisMeses.toISOString().slice(0, 7);

  const [desde, setDesde] = useState(haceSeisMesesStr);
  const [hasta, setHasta] = useState(currentMonthStr);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const triggerToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const loadStats = async () => {
    setLoading(true);
    try {
      const stats = await api.get(`/dashboard/estadisticas?desde=${desde}&hasta=${hasta}`);
      setData(stats);
    } catch (err) {
      console.error(err);
      triggerToast('Error al cargar datos estadísticos.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [desde, hasta]);

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight flex items-center gap-3">
            <BarChart3 className="text-cyan-400" />
            Reportes e Indicadores
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Análisis financiero, distribución de servicios y crecimiento de la red.
          </p>
        </div>
        
        {/* Selector de Rango */}
        <div className="flex items-center gap-3 p-2 bg-slate-900/60 border border-brand-border rounded-xl self-start sm:self-auto text-xs">
          <Calendar size={14} className="text-slate-500 shrink-0" />
          <div className="flex items-center gap-2">
            <input
              type="month"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              className="bg-slate-950/60 border border-brand-border rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none focus:border-cyan-500"
            />
            <span className="text-slate-500">a</span>
            <input
              type="month"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              className="bg-slate-950/60 border border-brand-border rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>
          <button 
            onClick={loadStats} 
            className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-colors"
            title="Refrescar datos"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {loading || !data ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartSkeleton />
          <ChartSkeleton />
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 1. Ingresos Mensuales */}
          <div className="glass-panel border border-brand-border rounded-2xl p-6 bg-slate-900/10 h-[380px] flex flex-col">
            <h3 className="text-sm font-bold text-slate-300 mb-4 uppercase tracking-wider">Histórico de Ingresos ($)</h3>
            <div className="flex-1 w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.ingresosMensuales} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                  <XAxis dataKey="mes" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#121420', borderColor: 'rgba(255,255,255,0.08)' }}
                    labelClassName="text-slate-400"
                  />
                  <Bar dataKey="total_monto" fill="#06b6d4" name="Ingreso Total ($)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 2. Distribución de Clientes por Plan */}
          <div className="glass-panel border border-brand-border rounded-2xl p-6 bg-slate-900/10 h-[380px] flex flex-col">
            <h3 className="text-sm font-bold text-slate-300 mb-4 uppercase tracking-wider">Distribución de Clientes por Plan</h3>
            <div className="flex-1 w-full text-xs flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="w-full md:w-3/5 h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.distribucionPlanes}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {data?.distribucionPlanes.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#121420', borderColor: 'rgba(255,255,255,0.08)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              {/* Leyenda Personalizada */}
              <div className="flex flex-col gap-2 shrink-0 pr-4 text-xs w-full md:w-2/5">
                {data?.distribucionPlanes.map((entry, idx) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <div 
                      className="w-3.5 h-3.5 rounded-md shrink-0" 
                      style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                    ></div>
                    <span className="text-slate-400 truncate flex-1">{entry.name}</span>
                    <span className="font-bold text-slate-200">{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 3. Tasa de Cobro Histórica */}
          <div className="glass-panel border border-brand-border rounded-2xl p-6 bg-slate-900/10 h-[380px] flex flex-col">
            <h3 className="text-sm font-bold text-slate-300 mb-4 uppercase tracking-wider">Tasa de Eficiencia de Cobro (%)</h3>
            <div className="flex-1 w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.tasaCobro} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTasa" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                  <XAxis dataKey="mes" stroke="#64748b" />
                  <YAxis domain={[0, 100]} stroke="#64748b" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#121420', borderColor: 'rgba(255,255,255,0.08)' }}
                  />
                  <Area type="monotone" dataKey="tasa" name="Tasa de Pago (%)" stroke="#10b981" fillOpacity={1} fill="url(#colorTasa)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 4. Clientes Nuevos por Mes */}
          <div className="glass-panel border border-brand-border rounded-2xl p-6 bg-slate-900/10 h-[380px] flex flex-col">
            <h3 className="text-sm font-bold text-slate-300 mb-4 uppercase tracking-wider">Crecimiento (Clientes Nuevos)</h3>
            <div className="flex-1 w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.nuevosClientes} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                  <XAxis dataKey="mes" stroke="#64748b" />
                  <YAxis stroke="#64748b" allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#121420', borderColor: 'rgba(255,255,255,0.08)' }}
                  />
                  <Line type="monotone" dataKey="count" name="Altas Nuevas" stroke="#8b5cf6" strokeWidth={2.5} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 5. Distribución por Colonia (Full Width) */}
          <div className="glass-panel border border-brand-border rounded-2xl p-6 bg-slate-900/10 h-[380px] flex flex-col lg:col-span-2">
            <h3 className="text-sm font-bold text-slate-300 mb-4 uppercase tracking-wider">Distribución Geográfica (Clientes por Colonia)</h3>
            <div className="flex-1 w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={data.distribucionColonias}
                  margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                  <XAxis type="number" stroke="#64748b" />
                  <YAxis dataKey="name" type="category" stroke="#64748b" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#121420', borderColor: 'rgba(255,255,255,0.08)' }}
                  />
                  <Bar dataKey="value" name="Clientes Activos" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={15} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Estadisticas;
