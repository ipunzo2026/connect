import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { TableSkeleton } from '../components/LoadingSkeleton';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import {
    Search,
    UserPlus,
    Eye,
    Edit2,
    Trash2,
    DollarSign,
    Filter,
    Smartphone,
    MapPin,
    Calendar,
    AlertCircle
} from 'lucide-react';

const Clientes = () => {
    // Estados de datos
    const [clientes, setClientes] = useState([]);
    const [planes, setPlanes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [paginacion, setPaginacion] = useState({ total: 0, pagina: 1, paginas: 1, limite: 10 });

    // Controles de filtrado y búsqueda
    const [buscar, setBuscar] = useState('');
    const [estado, setEstado] = useState('todos');
    const [pagina, setPagina] = useState(1);

    // Estados de Modales
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);

    // Cliente activo para CRUD
    const [selectedCliente, setSelectedCliente] = useState(null);
    const [selectedDetails, setSelectedDetails] = useState(null); // Incluye historial pagos

    // Formularios
    const [formData, setFormData] = useState({
        nombre: '', telefono: '', direccion: '', colonia: '', plan_id: '', precio_mensual: '', dia_pago: 5, notas: ''
    });
    const [paymentData, setPaymentData] = useState({
        mes: '', fecha_pago: '', monto: '', metodo_pago: 'Efectivo', notas: ''
    });

    // Notificaciones Toast
    const [toast, setToast] = useState(null);

    const triggerToast = (message, type = 'success') => {
        setToast({ message, type });
    };

    const loadData = async () => {
        setLoading(true);
        try {
            // Cargar clientes con filtros
            const res = await api.get(`/clientes?buscar=${buscar}&estado=${estado}&pagina=${pagina}&limite=10`);
            setClientes(res.datos || []);
            if (res?.paginacion) {
                setPaginacion(res.paginacion);
            }

            // Cargar planes para los dropdowns
            const planesRes = await api.get('/planes');
            // Forzamos a que si la respuesta no es un arreglo directo, busque la propiedad interna o asigne un arreglo vacío
            const listaPlanes = Array.isArray(planesRes) ? planesRes : (planesRes?.datos || []);
            setPlanes(planesRes);
        } catch (err) {
            console.error(err);
            triggerToast('Error al cargar la información.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [buscar, estado, pagina]);

    // Manejar cambio de plan en formulario para auto-completar precio_mensual
    const handlePlanChange = (planId) => {
        const plan = planes.find(p => p.id === planId);
        setFormData(prev => ({
            ...prev,
            plan_id: planId,
            precio_mensual: plan ? plan.precio : ''
        }));
    };

    // Abrir Agregar Cliente
    const openAddModal = () => {
        setFormData({
            nombre: '',
            telefono: '',
            direccion: '',
            colonia: '',
            plan_id: planes[0]?.id || '',
            precio_mensual: planes[0]?.precio || '',
            dia_pago: 5,
            notas: ''
        });
        setIsAddOpen(true);
    };

    // Enviar nuevo cliente
    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await api.post('/clientes', formData);
            setIsAddOpen(false);
            triggerToast('Cliente registrado exitosamente.');
            loadData();
        } catch (err) {
            triggerToast(err.message || 'Error al registrar cliente.', 'error');
        }
    };

    // Abrir Editar Cliente
    const openEditModal = (cliente) => {
        setSelectedCliente(cliente);
        setFormData({
            nombre: cliente.nombre,
            telefono: cliente.telefono || '',
            direccion: cliente.direccion || '',
            colonia: cliente.colonia || '',
            plan_id: cliente.plan_id,
            precio_mensual: cliente.precio_mensual,
            dia_pago: cliente.dia_pago,
            activo: cliente.activo,
            notas: cliente.notas || ''
        });
        setIsEditOpen(true);
    };

    // Enviar edición cliente
    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/clientes/${selectedCliente.id}`, formData);
            setIsEditOpen(false);
            triggerToast('Información del cliente actualizada.');
            loadData();
        } catch (err) {
            triggerToast(err.message || 'Error al actualizar cliente.', 'error');
        }
    };

    // Abrir Detalle Cliente
    const openDetailModal = async (cliente) => {
        try {
            const res = await api.get(`/clientes/${cliente.id}`);
            setSelectedDetails(res);
            setIsDetailOpen(true);
        } catch (err) {
            triggerToast('No se pudo obtener el historial del cliente.', 'error');
        }
    };

    // Abrir Confirmar Eliminación (Soft Delete)
    const openDeleteModal = (cliente) => {
        setSelectedCliente(cliente);
        setIsDeleteOpen(true);
    };

    // Confirmar desactivación
    const handleDelete = async () => {
        try {
            await api.delete(`/clientes/${selectedCliente.id}`);
            setIsDeleteOpen(false);
            triggerToast('Cliente dado de baja correctamente.');
            loadData();
        } catch (err) {
            triggerToast(err.message || 'No se pudo desactivar al cliente.', 'error');
        }
    };

    // Abrir Registro de Pago
    const openPaymentModal = (cliente) => {
        setSelectedCliente(cliente);
        const now = new Date();
        const currentMonth = now.toISOString().slice(0, 7);
        const currentDate = now.toISOString().slice(0, 10);

        setPaymentData({
            cliente_id: cliente.id,
            mes: currentMonth,
            fecha_pago: currentDate,
            monto: cliente.precio_mensual,
            metodo_pago: 'Efectivo',
            notas: ''
        });
        setIsPaymentOpen(true);
    };

    // Guardar Pago
    const handleSavePayment = async (e) => {
        e.preventDefault();
        try {
            await api.post('/pagos', paymentData);
            setIsPaymentOpen(false);
            triggerToast('Pago registrado correctamente.');

            // Si el modal de detalle estaba abierto, refrescarlo
            if (isDetailOpen && selectedDetails?.cliente.id === selectedCliente.id) {
                const res = await api.get(`/clientes/${selectedCliente.id}`);
                setSelectedDetails(res);
            }

            loadData();
        } catch (err) {
            triggerToast(err.message || 'Error al registrar el pago.', 'error');
        }
    };

    // Anular Pago desde Detalle
    const handleAnnulPayment = async (pagoId) => {
        if (!window.confirm('¿Estás seguro de que deseas anular este pago? Esta acción no se puede deshacer.')) return;
        try {
            await api.delete(`/pagos/${pagoId}`);
            triggerToast('Pago anulado correctamente.');
            // Actualizar modal detalle
            const res = await api.get(`/clientes/${selectedDetails.cliente.id}`);
            setSelectedDetails(res);
            loadData();
        } catch (err) {
            triggerToast(err.message || 'Error al anular pago.', 'error');
        }
    };

    const getBadgeClass = (estado) => {
        switch (estado) {
            case 'al_corriente': return 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30';
            case 'pendiente': return 'bg-amber-950/40 text-amber-400 border-amber-500/30';
            case 'vencido': return 'bg-red-950/40 text-red-400 border-red-500/30';
            case 'inactivo': return 'bg-slate-950/40 text-slate-400 border-slate-500/30';
            default: return 'bg-slate-900 text-slate-400';
        }
    };

    const translateEstado = (estado) => {
        switch (estado) {
            case 'al_corriente': return '🟢 Al corriente';
            case 'pendiente': return '🟡 Pendiente';
            case 'vencido': return '🔴 Vencido';
            case 'inactivo': return '⚫ Inactivo';
            default: return estado;
        }
    };

    return (
        <div className="space-y-6">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">Gestión de Clientes</h1>
                    <p className="text-slate-400 text-sm mt-1">Busca, agrega, edita clientes y registra cobros mensuales.</p>
                </div>
                <button
                    onClick={openAddModal}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 font-bold rounded-xl shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:from-cyan-400 hover:to-blue-400 active:scale-[0.98] transition-premium self-start sm:self-auto"
                >
                    <UserPlus size={18} />
                    Nuevo Cliente
                </button>
            </div>

            {/* Barra de Filtros & Búsqueda */}
            <div className="glass-panel border border-brand-border rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center">
                {/* Input Buscador */}
                <div className="relative w-full md:flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                        <Search size={18} />
                    </div>
                    <input
                        type="text"
                        value={buscar}
                        onChange={(e) => { setBuscar(e.target.value); setPagina(1); }}
                        placeholder="Buscar por nombre, colonia o plan..."
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-950/30 border border-brand-border rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-premium"
                    />
                </div>

                {/* Filtro de Estado */}
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <Filter size={16} className="text-slate-500 shrink-0" />
                    <select
                        value={estado}
                        onChange={(e) => { setEstado(e.target.value); setPagina(1); }}
                        className="w-full md:w-48 px-3 py-2.5 bg-slate-950/30 border border-brand-border rounded-xl text-slate-200 focus:outline-none focus:border-cyan-500 transition-premium"
                    >
                        <option value="todos">Todos los Activos</option>
                        <option value="al_corriente">🟢 Al corriente</option>
                        <option value="pendiente">🟡 Pendiente</option>
                        <option value="vencido">🔴 Vencidos</option>
                        <option value="inactivo">⚫ Inactivos</option>
                    </select>
                </div>
            </div>

            {/* Tabla de Clientes */}
            {loading ? (
                <TableSkeleton rows={6} cols={5} />
            ) : (clientes || []).length === 0 ? (
                <div className="glass-panel border border-brand-border rounded-2xl p-12 text-center text-slate-500">
                    <AlertCircle className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                    <p className="font-semibold text-lg text-slate-400">Sin resultados</p>
                    <p className="text-sm mt-1">No se encontraron clientes que coincidan con la búsqueda o filtros aplicados.</p>
                </div>
            ) : (
                <div className="glass-panel border border-brand-border rounded-2xl overflow-hidden shadow-neon-card">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-950/40 border-b border-brand-border">
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Cliente / Contacto</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Ubicación</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Plan Contratado</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Día de Pago</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Estado</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-brand-border bg-slate-900/10">
                                {(clientes || []).map((c) => (
                                    <tr key={c.id} className="hover:bg-slate-950/20 transition-premium">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-100">{c.nombre}</div>
                                            <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                                                <Smartphone size={12} /> {c.telefono || 'Sin teléfono'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-300">
                                            <div className="flex items-center gap-1">
                                                <MapPin size={14} className="text-slate-500" />
                                                <span>{c.colonia}</span>
                                            </div>
                                            <div className="text-xs text-slate-500 mt-1 max-w-[200px] truncate">{c.direccion}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <span className="font-semibold text-slate-200">{c.plan_nombre || 'Sin plan'}</span>
                                            <div className="text-xs text-cyan-400 mt-1 font-mono">${c.precio_mensual} / mes</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-300">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar size={14} className="text-slate-500" />
                                                <span>Día {c.dia_pago}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-xs">
                                            <span className={`inline-flex px-2.5 py-1 rounded-full border font-semibold ${getBadgeClass(c.estado)}`}>
                                                {translateEstado(c.estado)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                {c.estado !== 'al_corriente' && c.estado !== 'inactivo' && (
                                                    <button
                                                        onClick={() => openPaymentModal(c)}
                                                        className="p-2 bg-emerald-950/50 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-900/50 rounded-lg transition-colors border border-emerald-500/20"
                                                        title="Registrar Pago"
                                                    >
                                                        <DollarSign size={16} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => openDetailModal(c)}
                                                    className="p-2 bg-slate-950/50 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors border border-brand-border"
                                                    title="Ver Historial"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                <button
                                                    onClick={() => openEditModal(c)}
                                                    className="p-2 bg-cyan-950/40 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-900/40 rounded-lg transition-colors border border-cyan-500/10"
                                                    title="Editar"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                {c.activo && (
                                                    <button
                                                        onClick={() => openDeleteModal(c)}
                                                        className="p-2 bg-red-950/30 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded-lg transition-colors border border-red-500/10"
                                                        title="Dar de baja"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Paginación */}
                    {paginacion.paginas > 1 && (
                        <div className="px-6 py-4 bg-slate-950/40 border-t border-brand-border flex items-center justify-between">
                            <span className="text-xs text-slate-500">
                                Mostrando {clientes.length} de {paginacion.total} clientes
                            </span>
                            <div className="flex items-center gap-1">
                                <button
                                    disabled={pagina === 1}
                                    onClick={() => setPagina(p => Math.max(1, p - 1))}
                                    className="px-3 py-1.5 text-xs bg-slate-900 hover:bg-slate-800 rounded-lg text-slate-300 disabled:opacity-40 disabled:hover:bg-slate-900 transition-colors"
                                >
                                    Anterior
                                </button>
                                {Array.from({ length: paginacion.paginas }).map((_, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setPagina(idx + 1)}
                                        className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${pagina === idx + 1
                                                ? 'bg-cyan-500 text-slate-950 font-bold'
                                                : 'bg-slate-900 hover:bg-slate-800 text-slate-400'
                                            }`}
                                    >
                                        {idx + 1}
                                    </button>
                                ))}
                                <button
                                    disabled={pagina === paginacion.paginas}
                                    onClick={() => setPagina(p => Math.min(paginacion.paginas, p + 1))}
                                    className="px-3 py-1.5 text-xs bg-slate-900 hover:bg-slate-800 rounded-lg text-slate-300 disabled:opacity-40 disabled:hover:bg-slate-900 transition-colors"
                                >
                                    Siguiente
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* MODAL: ALTA DE CLIENTE */}
            <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Registrar Nuevo Cliente">
                <form onSubmit={handleCreate} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Nombre Completo</label>
                        <input
                            type="text"
                            required
                            value={formData.nombre}
                            onChange={(e) => setFormData(p => ({ ...p, nombre: e.target.value }))}
                            className="w-full px-3 py-2 bg-slate-950/50 border border-brand-border rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500"
                            placeholder="Ej: Juan Antonio Pérez"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Teléfono</label>
                            <input
                                type="text"
                                value={formData.telefono}
                                onChange={(e) => setFormData(p => ({ ...p, telefono: e.target.value }))}
                                className="w-full px-3 py-2 bg-slate-950/50 border border-brand-border rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500"
                                placeholder="Ej: 555-0100"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Día de Pago Límite</label>
                            <input
                                type="number"
                                min="1"
                                max="28"
                                required
                                value={formData.dia_pago}
                                onChange={(e) => setFormData(p => ({ ...p, dia_pago: parseInt(e.target.value) }))}
                                className="w-full px-3 py-2 bg-slate-950/50 border border-brand-border rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Colonia</label>
                            <input
                                type="text"
                                value={formData.colonia}
                                onChange={(e) => setFormData(p => ({ ...p, colonia: e.target.value }))}
                                className="w-full px-3 py-2 bg-slate-950/50 border border-brand-border rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500"
                                placeholder="Ej: Centro"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Dirección Completa</label>
                            <input
                                type="text"
                                value={formData.direccion}
                                onChange={(e) => setFormData(p => ({ ...p, direccion: e.target.value }))}
                                className="w-full px-3 py-2 bg-slate-950/50 border border-brand-border rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500"
                                placeholder="Calle e int/ext"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Plan de Internet</label>
                            <select
                                value={formData.plan_id}
                                onChange={(e) => handlePlanChange(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-950/50 border border-brand-border rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500"
                            >
                                <option value="" disabled>Seleccione un plan</option>
                                {planes?.map(p => (
                                    <option key={p.id} value={p.id}>{p.nombre} - ${p.precio}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Precio de Cobro ($)</label>
                            <input
                                type="number"
                                step="0.01"
                                required
                                value={formData.precio_mensual}
                                onChange={(e) => setFormData(p => ({ ...p, precio_mensual: parseFloat(e.target.value) }))}
                                className="w-full px-3 py-2 bg-slate-950/50 border border-brand-border rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Notas / Comentarios</label>
                        <textarea
                            value={formData.notas}
                            onChange={(e) => setFormData(p => ({ ...p, notas: e.target.value }))}
                            rows="2"
                            className="w-full px-3 py-2 bg-slate-950/50 border border-brand-border rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500"
                            placeholder="Detalles sobre equipo, router, instalación, etc."
                        ></textarea>
                    </div>
                    <div className="flex justify-end gap-3 pt-3 border-t border-brand-border">
                        <button
                            type="button"
                            onClick={() => setIsAddOpen(false)}
                            className="px-4 py-2 text-sm bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-5 py-2 text-sm bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 font-bold rounded-xl hover:opacity-90"
                        >
                            Guardar Cliente
                        </button>
                    </div>
                </form>
            </Modal>

            {/* MODAL: EDICIÓN DE CLIENTE */}
            <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Editar Información del Cliente">
                <form onSubmit={handleUpdate} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Nombre Completo</label>
                        <input
                            type="text"
                            required
                            value={formData.nombre}
                            onChange={(e) => setFormData(p => ({ ...p, nombre: e.target.value }))}
                            className="w-full px-3 py-2 bg-slate-950/50 border border-brand-border rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Teléfono</label>
                            <input
                                type="text"
                                value={formData.telefono}
                                onChange={(e) => setFormData(p => ({ ...p, telefono: e.target.value }))}
                                className="w-full px-3 py-2 bg-slate-950/50 border border-brand-border rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Día de Pago Límite</label>
                            <input
                                type="number"
                                min="1"
                                max="28"
                                required
                                value={formData.dia_pago}
                                onChange={(e) => setFormData(p => ({ ...p, dia_pago: parseInt(e.target.value) }))}
                                className="w-full px-3 py-2 bg-slate-950/50 border border-brand-border rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Colonia</label>
                            <input
                                type="text"
                                value={formData.colonia}
                                onChange={(e) => setFormData(p => ({ ...p, colonia: e.target.value }))}
                                className="w-full px-3 py-2 bg-slate-950/50 border border-brand-border rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Dirección Completa</label>
                            <input
                                type="text"
                                value={formData.direccion}
                                onChange={(e) => setFormData(p => ({ ...p, direccion: e.target.value }))}
                                className="w-full px-3 py-2 bg-slate-950/50 border border-brand-border rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Plan de Internet</label>
                            <select
                                value={formData.plan_id}
                                onChange={(e) => handlePlanChange(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-950/50 border border-brand-border rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500"
                            >
                                {planes?.map(p => (
                                    <option key={p.id} value={p.id}>{p.nombre} - ${p.precio}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Precio de Cobro ($)</label>
                            <input
                                type="number"
                                step="0.01"
                                required
                                value={formData.precio_mensual}
                                onChange={(e) => setFormData(p => ({ ...p, precio_mensual: parseFloat(e.target.value) }))}
                                className="w-full px-3 py-2 bg-slate-950/50 border border-brand-border rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Estado</label>
                            <select
                                value={formData.activo ? '1' : '0'}
                                onChange={(e) => setFormData(p => ({ ...p, activo: e.target.value === '1' }))}
                                className="w-full px-3 py-2 bg-slate-950/50 border border-brand-border rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500"
                            >
                                <option value="1">🟢 Activo / Servicio habilitado</option>
                                <option value="0">⚫ Inactivo / Servicio suspendido</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Notas / Comentarios</label>
                        <textarea
                            value={formData.notas}
                            onChange={(e) => setFormData(p => ({ ...p, notas: e.target.value }))}
                            rows="2"
                            className="w-full px-3 py-2 bg-slate-950/50 border border-brand-border rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500"
                        ></textarea>
                    </div>
                    <div className="flex justify-end gap-3 pt-3 border-t border-brand-border">
                        <button
                            type="button"
                            onClick={() => setIsEditOpen(false)}
                            className="px-4 py-2 text-sm bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-5 py-2 text-sm bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 font-bold rounded-xl hover:opacity-90"
                        >
                            Guardar Cambios
                        </button>
                    </div>
                </form>
            </Modal>

            {/* MODAL: DETALLE DE CLIENTE E HISTORIAL */}
            <Modal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} title="Historial del Cliente" size="lg">
                {selectedDetails && (
                    <div className="space-y-6">
                        {/* Cabecera Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/55 p-5 border border-brand-border rounded-2xl">
                            <div>
                                <h4 className="text-xl font-bold text-slate-100">{selectedDetails.cliente.nombre}</h4>
                                <p className="text-xs text-slate-500 mt-1">ID: {selectedDetails.cliente.id}</p>
                                <div className="flex items-center gap-1.5 text-slate-400 text-sm mt-3">
                                    <Smartphone size={14} className="text-slate-500" />
                                    <span>{selectedDetails.cliente.telefono || 'Sin teléfono'}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-slate-400 text-sm mt-1.5">
                                    <MapPin size={14} className="text-slate-500" />
                                    <span>{selectedDetails.cliente.colonia}, {selectedDetails.cliente.direccion}</span>
                                </div>
                            </div>
                            <div className="flex flex-col md:items-end justify-between">
                                <span className={`inline-flex px-3 py-1 rounded-full border font-bold text-xs self-start md:self-auto ${getBadgeClass(selectedDetails.cliente.estado)}`}>
                                    {translateEstado(selectedDetails.cliente.estado)}
                                </span>
                                <div className="text-left md:text-right mt-3 md:mt-0">
                                    <p className="text-xs text-slate-500">Plan contratado:</p>
                                    <p className="text-base font-bold text-slate-200">{selectedDetails.cliente.plan_nombre}</p>
                                    <p className="text-sm font-semibold text-cyan-400 font-mono mt-0.5">${selectedDetails.cliente.precio_mensual} / mes</p>
                                </div>
                            </div>
                        </div>

                        {/* Notas */}
                        {selectedDetails.cliente.notas && (
                            <div className="p-3 bg-slate-900/50 border border-brand-border rounded-xl text-xs text-slate-400">
                                <strong className="text-slate-200">Notas del Cliente:</strong> {selectedDetails.cliente.notas}
                            </div>
                        )}

                        {/* Listado Historial Pagos */}
                        <div>
                            <div className="flex items-center justify-between mb-3.5">
                                <h4 className="text-base font-bold text-slate-200">Historial de Pagos Mensuales</h4>
                                {selectedDetails.cliente.estado !== 'al_corriente' && selectedDetails.cliente.activo && (
                                    <button
                                        onClick={() => {
                                            setIsDetailOpen(false);
                                            openPaymentModal(selectedDetails.cliente);
                                        }}
                                        className="px-3 py-1.5 bg-emerald-950 text-emerald-400 hover:text-emerald-300 font-bold border border-emerald-500/20 text-xs rounded-xl flex items-center gap-1 transition-colors"
                                    >
                                        <DollarSign size={14} /> Registrar Pago
                                    </button>
                                )}
                            </div>

                            {(selectedDetails?.pagos || []).length === 0 ? (
                                <div className="p-6 text-center text-slate-600 bg-slate-950/20 border border-brand-border rounded-xl">
                                    No se registran pagos previos para este cliente.
                                </div>
                            ) : (
                                <div className="border border-brand-border rounded-xl overflow-hidden">
                                    <table className="w-full text-left border-collapse text-xs">
                                        <thead>
                                            <tr className="bg-slate-950/30 border-b border-brand-border text-slate-400">
                                                <th className="px-4 py-3">Mes del Servicio</th>
                                                <th className="px-4 py-3">Fecha del Cobro</th>
                                                <th className="px-4 py-3">Monto Cobrado</th>
                                                <th className="px-4 py-3">Método</th>
                                                <th className="px-4 py-3">Observaciones</th>
                                                <th className="px-4 py-3 text-right">Acciones</th>
                                            </tr>
                                        </thead>
                                            <tbody className="divide-y divide-brand-border bg-slate-950/10 text-slate-300">
                                                {(selectedDetails?.pagos || []).map(pago => (
                                                    <tr key={pago.id} className="hover:bg-slate-950/15">
                                                        <td className="px-4 py-3 font-semibold text-slate-100">{pago.mes}</td>
                                                        <td className="px-4 py-3">{pago.fecha_pago}</td>
                                                        <td className="px-4 py-3 font-mono text-emerald-400 font-semibold">${pago.monto}</td>
                                                        <td className="px-4 py-3">{pago.metodo_pago}</td>
                                                        <td className="px-4 py-3 truncate max-w-[150px]">{pago.notas || '-'}</td>
                                                        <td className="px-4 py-3 text-right">
                                                            <button
                                                                onClick={() => handleAnnulPayment(pago.id)}
                                                                className="text-red-400 hover:text-red-300 p-1.5 rounded bg-red-950/20 border border-red-500/10 transition-colors"
                                                                title="Anular Pago"
                                                            >
                                                                Anular
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end pt-3 border-t border-brand-border">
                            <button
                                onClick={() => setIsDetailOpen(false)}
                                className="px-4 py-2 text-sm bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl"
                            >
                                Cerrar Ventana
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* MODAL: REGISTRO DE PAGO */}
            <Modal isOpen={isPaymentOpen} onClose={() => setIsPaymentOpen(false)} title="Registrar Cobro de Internet">
                {selectedCliente && (
                    <form onSubmit={handleSavePayment} className="space-y-4">
                        <div className="bg-slate-950/30 p-4 border border-brand-border rounded-xl flex justify-between items-center">
                            <div>
                                <span className="text-xs text-slate-500 block">Cliente:</span>
                                <span className="font-bold text-slate-200">{selectedCliente.nombre}</span>
                            </div>
                            <div className="text-right">
                                <span className="text-xs text-slate-500 block">Monto Mensual:</span>
                                <span className="font-mono font-bold text-cyan-400">${selectedCliente.precio_mensual}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Mes a Cobrar</label>
                                <input
                                    type="month"
                                    required
                                    value={paymentData.mes}
                                    onChange={(e) => setPaymentData(p => ({ ...p, mes: e.target.value }))}
                                    className="w-full px-3 py-2 bg-slate-950/50 border border-brand-border rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Fecha de Recepción</label>
                                <input
                                    type="date"
                                    required
                                    value={paymentData.fecha_pago}
                                    onChange={(e) => setPaymentData(p => ({ ...p, fecha_pago: e.target.value }))}
                                    className="w-full px-3 py-2 bg-slate-950/50 border border-brand-border rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Monto Recibido ($)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    required
                                    value={paymentData.monto}
                                    onChange={(e) => setPaymentData(p => ({ ...p, monto: parseFloat(e.target.value) }))}
                                    className="w-full px-3 py-2 bg-slate-950/50 border border-brand-border rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Método de Pago</label>
                                <select
                                    value={paymentData.metodo_pago}
                                    onChange={(e) => setPaymentData(p => ({ ...p, metodo_pago: e.target.value }))}
                                    className="w-full px-3 py-2 bg-slate-950/50 border border-brand-border rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500"
                                >
                                    <option value="Efectivo">Efectivo</option>
                                    <option value="Transferencia">Transferencia</option>
                                    <option value="Otro">Otro método</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Comentarios adicionales</label>
                            <input
                                type="text"
                                value={paymentData.notas}
                                onChange={(e) => setPaymentData(p => ({ ...p, notas: e.target.value }))}
                                className="w-full px-3 py-2 bg-slate-950/50 border border-brand-border rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500"
                                placeholder="Ej: Pago de familiar o abono"
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-3 border-t border-brand-border">
                            <button
                                type="button"
                                onClick={() => setIsPaymentOpen(false)}
                                className="px-4 py-2 text-sm bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="px-5 py-2 text-sm bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold rounded-xl hover:opacity-90"
                            >
                                Registrar Pago
                            </button>
                        </div>
                    </form>
                )}
            </Modal>

            {/* MODAL: BAJA DE CLIENTE */}
            <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Dar de Baja Cliente">
                {selectedCliente && (
                    <div className="space-y-4">
                        <div className="flex items-start gap-3 p-4 bg-red-950/20 border border-red-500/20 rounded-xl text-red-400 text-sm">
                            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                            <div>
                                <p className="font-semibold">¿Seguro que deseas dar de baja a {selectedCliente.nombre}?</p>
                                <p className="text-xs text-red-400/80 mt-1">
                                    El cliente será marcado como <strong>Inactivo</strong> y su servicio quedará suspendido.
                                    No se eliminará su historial de cobros de la base de datos.
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-3 border-t border-brand-border">
                            <button
                                onClick={() => setIsDeleteOpen(false)}
                                className="px-4 py-2 text-sm bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDelete}
                                className="px-5 py-2 text-sm bg-red-600 text-white font-bold rounded-xl hover:bg-red-500"
                            >
                                Confirmar Baja
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default Clientes;