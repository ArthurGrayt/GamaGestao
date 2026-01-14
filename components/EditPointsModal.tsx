import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabase';
import { X, Calendar as CalendarIcon, User as UserIcon, Save, Edit2, Clock, AlertCircle, Trash2, Plus, ChevronDown, Check, Wand2, Settings, CalendarDays } from 'lucide-react';
import { format, parseISO, startOfDay, endOfDay, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface User {
    id: number;
    user_id: string; // UUID from auth or FK
    username: string;
    img_url?: string;
    role_id?: number;
}

interface PointRecord {
    id: number;
    user_id: string;
    datahora: string;
    tipo: string;
    ordem: number;
    horas_acumuladas?: number; // Only for reference if needed
    tempo_almoco?: number; // Calculated/Stored
}

interface Holiday {
    id?: number;
    titulo: string;
    data: string; // YYYY-MM-DD or ISO
    tipo?: string;
}

interface EditPointsModalProps {
    isOpen: boolean;
    onClose: () => void;
    users: User[];
}

export const EditPointsModal: React.FC<EditPointsModalProps> = ({ isOpen, onClose, users }) => {
    // --- TABS STATE ---
    const [activeTab, setActiveTab] = useState<'points' | 'holidays'>('points');

    // --- POINTS TAB STATE ---
    const [selectedUserId, setSelectedUserId] = useState<string>('');
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [points, setPoints] = useState<PointRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Custom Dropdown State for Points Tab
    const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

    // Edit/Add Point State
    const [editingPoint, setEditingPoint] = useState<PointRecord | null>(null); // If null, adding new.

    const dropdownRef = useRef<HTMLDivElement>(null);

    // --- HOLIDAYS TAB STATE ---
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedHolidayDate, setSelectedHolidayDate] = useState<Date | null>(null);
    const [holidayTitle, setHolidayTitle] = useState('');
    const [holidaysList, setHolidaysList] = useState<Holiday[]>([]);
    const [isLoadingHolidays, setIsLoadingHolidays] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (activeTab === 'points') {
                if (selectedUserId && selectedDate) {
                    fetchPoints();
                }
            } else {
                fetchHolidays();
            }
        }
    }, [isOpen, selectedUserId, selectedDate, activeTab, currentMonth]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsUserDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // --- POINTS LOGIC ---

    const fetchPoints = async () => {
        if (!selectedUserId) return;
        setLoading(true);
        try {
            const start = startOfDay(parseISO(selectedDate)).toISOString();
            const end = endOfDay(parseISO(selectedDate)).toISOString();

            const { data, error } = await supabase
                .from('ponto_registros')
                .select('*')
                .eq('user_id', selectedUserId)
                .gte('datahora', start)
                .lte('datahora', end)
                .order('datahora', { ascending: true });

            if (error) throw error;
            setPoints(data || []);
            setEditingPoint(null); // Close edit form if open
        } catch (error) {
            console.error('Erro ao buscar pontos:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePoint = () => {
        if (!selectedUserId) return;

        // Default new point time to current selected date at 08:00 or current time if same day
        const now = new Date();
        const selected = parseISO(selectedDate);
        let defaultTime = new Date(selected);
        if (now.toDateString() === selected.toDateString()) {
            defaultTime = now;
        } else {
            defaultTime.setHours(8, 0, 0, 0);
        }

        setEditingPoint({
            id: 0, // 0 indicates new record
            user_id: selectedUserId,
            datahora: defaultTime.toISOString(),
            tipo: 'Entrada',
            ordem: points.length + 1,
            horas_acumuladas: 0,
            tempo_almoco: 0
        });
    };

    const handleDeletePoint = async () => {
        if (!editingPoint || editingPoint.id === 0) return;

        if (!confirm('Tem certeza que deseja excluir este registro de ponto? Esta ação não pode ser desfeita.')) return;

        setSaving(true);
        try {
            const { error } = await supabase
                .from('ponto_registros')
                .delete()
                .eq('id', editingPoint.id);

            if (error) throw error;

            fetchPoints();
            setEditingPoint(null);
            alert('Ponto excluído com sucesso!');
        } catch (error) {
            console.error('Erro ao excluir ponto:', error);
            alert('Erro ao excluir ponto.');
        } finally {
            setSaving(false);
        }
    };

    const handleSavePoint = async () => {
        if (!editingPoint) return;
        setSaving(true);
        try {
            const payload = {
                user_id: editingPoint.user_id,
                datahora: editingPoint.datahora,
                tipo: editingPoint.tipo,
                ordem: editingPoint.ordem,
                horas_acumuladas: editingPoint.horas_acumuladas,
                tempo_almoco: editingPoint.tempo_almoco
            };

            if (editingPoint.id === 0) {
                // INSERT
                const { error } = await supabase
                    .from('ponto_registros')
                    .insert([payload]);
                if (error) throw error;
                alert('Ponto criado com sucesso!');
            } else {
                // UPDATE
                const { error } = await supabase
                    .from('ponto_registros')
                    .update(payload)
                    .eq('id', editingPoint.id);
                if (error) throw error;
                alert('Ponto atualizado com sucesso!');
            }

            // Refresh list
            fetchPoints();
            setEditingPoint(null);

        } catch (error) {
            console.error('Erro ao salvar ponto:', error);
            alert('Erro ao salvar alterações.');
        } finally {
            setSaving(false);
        }
    };

    const handleNormalizePoints = async () => {
        if (!selectedUserId || !selectedDate) return;

        if (!confirm('Deseja normalizar os pontos deste dia? O sistema irá preencher automaticamente os horários faltantes (07:00, 12:00, 13:15, 17:00).')) {
            return;
        }

        setLoading(true);
        try {
            const hasEntrada = points.some(p => p.tipo === 'Entrada');
            const hasSaidaAlmoco = points.some(p => p.tipo === 'Saída para almoço');
            const hasVoltaAlmoco = points.some(p => p.tipo === 'Volta do almoço');
            const hasFimExpediente = points.some(p => p.tipo === 'Fim de expediente');

            const dateBase = parseISO(selectedDate);
            const newPoints = [];

            const currentUser = users.find(u => u.user_id === selectedUserId);
            const isIntern = currentUser?.role_id === 2; // 2 = Estagiário

            if (isIntern) {
                // Lógica para ESTAGIÁRIOS (08:00 - 14:00)

                // 1. Entrada (08:00)
                if (!hasEntrada) {
                    const d = new Date(dateBase);
                    d.setHours(8, 0, 0, 0);
                    newPoints.push({
                        user_id: selectedUserId,
                        datahora: d.toISOString(),
                        tipo: 'Entrada',
                        ordem: 1,
                    });
                }

                // 2. Fim de Expediente (14:00)
                if (!hasFimExpediente) {
                    const f = new Date(dateBase);
                    f.setHours(14, 0, 0, 0);
                    newPoints.push({
                        user_id: selectedUserId,
                        datahora: f.toISOString(),
                        tipo: 'Fim de expediente',
                        ordem: 2,
                    });
                }

            } else {
                // Lógica PADRÃO (07:00 - 12:00 - 13:15 - 17:00)

                // 1. Entrada (07:00)
                if (!hasEntrada) {
                    const d = new Date(dateBase);
                    d.setHours(7, 0, 0, 0);
                    newPoints.push({
                        user_id: selectedUserId,
                        datahora: d.toISOString(),
                        tipo: 'Entrada',
                        ordem: 1,
                    });
                }

                // 2. Almoço (12:00 e 13:15)
                if (!hasSaidaAlmoco && !hasVoltaAlmoco) {
                    const s = new Date(dateBase);
                    s.setHours(12, 0, 0, 0);
                    newPoints.push({
                        user_id: selectedUserId,
                        datahora: s.toISOString(),
                        tipo: 'Saída para almoço',
                        ordem: 2,
                    });

                    const v = new Date(dateBase);
                    v.setHours(13, 15, 0, 0);
                    newPoints.push({
                        user_id: selectedUserId,
                        datahora: v.toISOString(),
                        tipo: 'Volta do almoço',
                        ordem: 3,
                    });
                }

                // 3. Fim de Expediente (17:00)
                if (!hasFimExpediente) {
                    const f = new Date(dateBase);
                    f.setHours(17, 0, 0, 0);
                    newPoints.push({
                        user_id: selectedUserId,
                        datahora: f.toISOString(),
                        tipo: 'Fim de expediente',
                        ordem: 4,
                    });
                }
            }

            if (newPoints.length > 0) {
                const { error } = await supabase
                    .from('ponto_registros')
                    .insert(newPoints);

                if (error) throw error;
                alert(`${newPoints.length} pontos adicionados automaticamente.`);
                fetchPoints();
            } else {
                alert('Nenhum ponto precisou ser normalizado.');
            }

        } catch (error) {
            console.error('Erro ao normalizar pontos:', error);
            alert('Erro ao normalizar pontos.');
        } finally {
            setLoading(false);
        }
    };

    // --- HOLIDAYS LOGIC ---

    const fetchHolidays = async () => {
        setIsLoadingHolidays(true);
        try {
            const start = startOfMonth(currentMonth).toISOString();
            const end = endOfMonth(currentMonth).toISOString();

            const { data, error } = await supabase
                .from('holidays')
                .select('*')
                .gte('data', start)
                .lte('data', end);

            if (error) {
                console.error("Erro holidays", error);
            };

            setHolidaysList(data || []);
        } catch (error) {
            console.error('Erro ao buscar feriados:', error);
        } finally {
            setIsLoadingHolidays(false);
        }
    };

    const handleSaveHoliday = async () => {
        if (!selectedHolidayDate || !holidayTitle.trim()) {
            alert("Selecione uma data e insira um título.");
            return;
        }

        setSaving(true);
        try {
            const payload = {
                titulo: holidayTitle,
                data: format(selectedHolidayDate, 'yyyy-MM-dd'),
                tipo: 'feriado'
            };

            const { error } = await supabase
                .from('holidays')
                .insert([payload]);

            if (error) throw error;

            alert('Feriado adicionado com sucesso!');
            setHolidayTitle('');
            setSelectedHolidayDate(null);
            fetchHolidays(); // Refresh calendar
        } catch (error: any) {
            console.error('Erro ao salvar feriado:', error);
            alert(`Erro ao salvar feriado: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteHoliday = async (id: number) => {
        if (!confirm('Tem certeza que deseja excluir este feriado?')) return;
        setSaving(true);
        try {
            const { error } = await supabase
                .from('holidays')
                .delete()
                .eq('id', id);

            if (error) throw error;

            alert('Feriado removido com sucesso!');
            fetchHolidays();
            setSelectedHolidayDate(null);
        } catch (error) {
            console.error('Erro ao deletar feriado:', error);
            alert('Erro ao excluir feriado.');
        } finally {
            setSaving(false);
        }
    };

    // --- CALENDAR RENDER HELPERS ---
    const getDaysInMonth = () => {
        const start = startOfMonth(currentMonth);
        const end = endOfMonth(currentMonth);
        return eachDayOfInterval({ start, end });
    };

    // --- RENDER ---

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex justify-center items-center p-4">
            <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden">
                {/* Header with Tabs */}
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 rounded-t-2xl shrink-0">
                    <div className="flex justify-between items-start mb-4">
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <div className="bg-amber-100 p-2 rounded-xl text-amber-600">
                                <Settings size={20} />
                            </div>
                            Configuração de Ponto
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setActiveTab('points')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'points'
                                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                                : 'text-slate-500 hover:bg-white hover:text-slate-700'
                                }`}
                        >
                            <Edit2 size={16} />
                            Edição de Ponto
                        </button>
                        <button
                            onClick={() => setActiveTab('holidays')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'holidays'
                                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                                : 'text-slate-500 hover:bg-white hover:text-slate-700'
                                }`}
                        >
                            <CalendarDays size={16} />
                            Feriados
                        </button>
                    </div>
                </div>

                {/* Content Body */}
                <div className="flex-1 overflow-hidden flex flex-col">

                    {/* --- TAB 1: POINTS EDIT (LEGACY LAYOUT) --- */}
                    {activeTab === 'points' && (
                        <div className="flex flex-1 overflow-hidden">
                            {/* Left Sidebar: Filters & List */}
                            <div className="w-1/3 border-r border-slate-100 flex flex-col bg-slate-50/30">
                                <div className="p-4 space-y-4 border-b border-slate-100">
                                    {/* User Select - CUSTOM DROPDOWN */}
                                    <div className="space-y-1 relative" ref={dropdownRef}>
                                        <label className="text-xs font-bold text-slate-500 uppercase">Colaborador</label>

                                        <button
                                            onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none flex items-center justify-between shadow-sm hover:bg-slate-50 transition-colors"
                                        >
                                            {selectedUserId ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center border border-slate-200">
                                                        {users.find(u => u.user_id === selectedUserId)?.img_url ? (
                                                            <img src={users.find(u => u.user_id === selectedUserId)?.img_url} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <UserIcon size={14} className="text-slate-400" />
                                                        )}
                                                    </div>
                                                    <span className="font-medium text-slate-700">{users.find(u => u.user_id === selectedUserId)?.username}</span>
                                                </div>
                                            ) : (
                                                <span className="text-slate-400">Selecione um usuário...</span>
                                            )}
                                            <ChevronDown size={16} className={`text-slate-400 transition-transform ${isUserDropdownOpen ? 'rotate-180' : ''}`} />
                                        </button>

                                        {isUserDropdownOpen && (
                                            <div className="absolute top-full left-0 w-full mt-1 bg-white rounded-xl shadow-xl border border-slate-100 z-50 max-h-60 overflow-y-auto">
                                                <div className="p-1">
                                                    {users.map(u => (
                                                        <div
                                                            key={u.user_id}
                                                            onClick={() => {
                                                                setSelectedUserId(u.user_id);
                                                                setIsUserDropdownOpen(false);
                                                            }}
                                                            className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${selectedUserId === u.user_id ? 'bg-amber-50 text-amber-700' : 'hover:bg-slate-50 text-slate-700'}`}
                                                        >
                                                            <div className="w-8 h-8 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center border border-slate-200 shrink-0">
                                                                {u.img_url ? (
                                                                    <img src={u.img_url} alt="" className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <UserIcon size={16} className="text-slate-400" />
                                                                )}
                                                            </div>
                                                            <span className="font-medium text-sm truncate">{u.username}</span>
                                                            {selectedUserId === u.user_id && <Check size={16} className="ml-auto text-amber-600" />}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Date Select */}
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Data</label>
                                        <input
                                            type="date"
                                            value={selectedDate}
                                            onChange={(e) => setSelectedDate(e.target.value)}
                                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                                        />
                                    </div>

                                    {/* Add Button */}
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={handleCreatePoint}
                                            disabled={!selectedUserId}
                                            className="py-2 bg-blue-600 text-white rounded-lg font-bold text-xs hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                                        >
                                            <Plus size={14} /> Adicionar
                                        </button>
                                        <button
                                            onClick={handleNormalizePoints}
                                            disabled={!selectedUserId}
                                            className="py-2 bg-indigo-600 text-white rounded-lg font-bold text-xs hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                                        >
                                            <Wand2 size={14} /> Normalizar
                                        </button>
                                    </div>
                                </div>

                                {/* Points List */}
                                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                                    {loading ? (
                                        <div className="text-center py-8 text-slate-400 text-sm">Carregando...</div>
                                    ) : points.length === 0 ? (
                                        <div className="text-center py-8 text-slate-400 text-sm italic">
                                            {!selectedUserId ? 'Selecione um usuário' : 'Nenhum ponto neste dia'}
                                        </div>
                                    ) : (
                                        points.map(point => (
                                            <div
                                                key={point.id}
                                                onClick={() => setEditingPoint(point)}
                                                className={`p-3 rounded-xl border cursor-pointer transition-all ${editingPoint?.id === point.id
                                                    ? 'bg-amber-50 border-amber-200 ring-1 ring-amber-200 shadow-sm'
                                                    : 'bg-white border-slate-200 hover:border-amber-300 hover:shadow-sm'
                                                    }`}
                                            >
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${point.tipo === 'Entrada' ? 'bg-green-100 text-green-700' :
                                                        point.tipo === 'Saída para almoço' ? 'bg-orange-100 text-orange-700' :
                                                            point.tipo === 'Volta do almoço' ? 'bg-blue-100 text-blue-700' :
                                                                'bg-red-100 text-red-700'
                                                        }`}>
                                                        {point.tipo}
                                                    </span>
                                                    <span className="text-xs text-slate-400 font-mono">ID: {point.id}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-slate-700 font-bold text-lg">
                                                    <Clock size={16} className="text-slate-400" />
                                                    {format(parseISO(point.datahora), 'HH:mm')}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Right Panel: Edit Form */}
                            <div className="flex-1 p-6 overflow-y-auto bg-white">
                                {editingPoint ? (
                                    <div className="space-y-6 max-w-lg mx-auto animate-in fade-in slide-in-from-right-4 duration-300">
                                        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${editingPoint.id === 0 ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500'}`}>
                                                {editingPoint.id === 0 ? <Plus size={20} /> : points.findIndex(p => p.id === editingPoint.id) + 1}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg text-slate-800">
                                                    {editingPoint.id === 0 ? 'Novo Registro' : 'Editar Registro'}
                                                </h3>
                                                <p className="text-xs text-slate-500">
                                                    {editingPoint.id === 0 ? 'Criando um novo ponto manual' : `Editando ID ${editingPoint.id}`}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* DataHora */}
                                            <div className="space-y-2 col-span-2">
                                                <label className="text-sm font-medium text-slate-700">Data e Hora</label>
                                                <input
                                                    type="datetime-local"
                                                    value={editingPoint.datahora ? format(parseISO(editingPoint.datahora), "yyyy-MM-dd'T'HH:mm") : ''}
                                                    onChange={(e) => {
                                                        const newDate = new Date(e.target.value);
                                                        setEditingPoint({ ...editingPoint, datahora: newDate.toISOString() });
                                                    }}
                                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                                                />
                                            </div>

                                            {/* Tipo */}
                                            <div className="space-y-2 col-span-2">
                                                <label className="text-sm font-medium text-slate-700">Tipo de Registro</label>
                                                <select
                                                    value={editingPoint.tipo}
                                                    onChange={(e) => setEditingPoint({ ...editingPoint, tipo: e.target.value })}
                                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none bg-white"
                                                >
                                                    <option value="Entrada">Entrada</option>
                                                    <option value="Saída para almoço">Saída para almoço</option>
                                                    <option value="Volta do almoço">Volta do almoço</option>
                                                    <option value="Fim de expediente">Fim de expediente</option>
                                                </select>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="pt-6 flex justify-between items-center">
                                            {editingPoint.id !== 0 && (
                                                <button
                                                    onClick={handleDeletePoint}
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 px-4 py-2 rounded-xl transition-colors flex items-center gap-2 text-sm font-medium"
                                                >
                                                    <Trash2 size={18} /> Excluir Ponto
                                                </button>
                                            )}
                                            <div className={`flex gap-3 ${editingPoint.id === 0 ? 'ml-auto' : ''}`}>
                                                <button
                                                    onClick={() => setEditingPoint(null)}
                                                    className="px-6 py-2 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors font-medium"
                                                >
                                                    Cancelar
                                                </button>
                                                <button
                                                    onClick={handleSavePoint}
                                                    disabled={saving}
                                                    className="bg-amber-500 hover:bg-amber-600 text-white px-8 py-2 rounded-xl font-bold shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                                >
                                                    {saving ? (
                                                        'Salvando...'
                                                    ) : (
                                                        <>
                                                            <Save size={18} /> {editingPoint.id === 0 ? 'Criar Ponto' : 'Salvar Alterações'}
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-300">
                                        <Edit2 size={64} className="mb-4 opacity-50" />
                                        <p className="text-lg font-medium">Selecione um ponto ou adicione um novo</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* --- TAB 2: HOLIDAYS --- */}
                    {activeTab === 'holidays' && (
                        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 h-full overflow-y-auto">
                            {/* Left: Calendar */}
                            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col">
                                <div className="flex justify-between items-center mb-6">
                                    <button
                                        onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                                        className="p-2 hover:bg-slate-100 rounded-full text-slate-500"
                                    >
                                        &lt;
                                    </button>
                                    <h3 className="font-bold text-slate-800 text-lg capitalize">
                                        {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
                                    </h3>
                                    <button
                                        onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                                        className="p-2 hover:bg-slate-100 rounded-full text-slate-500"
                                    >
                                        &gt;
                                    </button>
                                </div>

                                <div className="grid grid-cols-7 gap-1 text-center mb-2">
                                    {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(d => (
                                        <div key={d} className="text-xs font-bold text-slate-400 py-1">{d}</div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-7 gap-1">
                                    {/* Empty slots for start of month */}
                                    {Array.from({ length: getDay(startOfMonth(currentMonth)) }).map((_, i) => (
                                        <div key={`empty-${i}`} className="aspect-square" />
                                    ))}

                                    {/* Days */}
                                    {getDaysInMonth().map(day => {
                                        const isToday = isSameDay(day, new Date());
                                        const isSelected = selectedHolidayDate && isSameDay(day, selectedHolidayDate);
                                        const holiday = holidaysList.find(h => isSameDay(parseISO(h.data), day));

                                        return (
                                            <button
                                                key={day.toString()}
                                                onClick={() => setSelectedHolidayDate(day)}
                                                className={`
                                                    aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all
                                                    ${isSelected ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20' : 'hover:bg-slate-50 text-slate-700'}
                                                    ${isToday && !isSelected ? 'border border-amber-200 bg-amber-50/50' : ''}
                                                    ${holiday && !isSelected ? 'bg-red-50 text-red-600 border border-red-100 font-bold' : ''}
                                                `}
                                            >
                                                <span className="text-sm">{format(day, 'd')}</span>
                                                {holiday && (
                                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 absolute bottom-1.5"></span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="mt-4 flex items-center gap-4 text-xs text-slate-500 justify-center">
                                    <div className="flex items-center gap-1">
                                        <div className="w-2 h-2 rounded-full bg-red-500" />
                                        Feriado
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <div className="w-2 h-2 rounded-full bg-amber-500" />
                                        Selecionado
                                    </div>
                                </div>
                            </div>

                            {/* Right: Form / Details */}
                            <div className="flex flex-col">
                                {selectedHolidayDate ? (
                                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm animate-in fade-in slide-in-from-right-4 duration-300">
                                        <h3 className="text-lg font-bold text-slate-800 mb-1">
                                            {format(selectedHolidayDate, "dd 'de' MMMM", { locale: ptBR })}
                                        </h3>
                                        <p className="text-slate-400 text-sm mb-6 capitalize">
                                            {format(selectedHolidayDate, "EEEE", { locale: ptBR })}
                                        </p>

                                        {/* Existing holiday info or Form */}
                                        {holidaysList.find(h => isSameDay(parseISO(h.data), selectedHolidayDate)) ? (
                                            <div className="space-y-4">
                                                <div className="bg-red-50 p-4 rounded-xl border border-red-100 text-red-800 mb-4">
                                                    <div className="flex items-start gap-3">
                                                        <CalendarIcon className="shrink-0 mt-0.5" size={18} />
                                                        <div>
                                                            <p className="font-bold">Feriado Registrado</p>
                                                            <p className="text-sm opacity-80 mt-1">
                                                                {holidaysList.find(h => isSameDay(parseISO(h.data), selectedHolidayDate))?.titulo}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => {
                                                        const h = holidaysList.find(h => isSameDay(parseISO(h.data), selectedHolidayDate!));
                                                        if (h && h.id) handleDeleteHoliday(h.id);
                                                    }}
                                                    className="w-full bg-white border border-red-200 text-red-600 font-bold py-2.5 rounded-xl hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                                                >
                                                    <Trash2 size={16} />
                                                    Excluir Feriado
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-semibold text-slate-700">Título do Feriado</label>
                                                    <input
                                                        type="text"
                                                        value={holidayTitle}
                                                        onChange={(e) => setHolidayTitle(e.target.value)}
                                                        placeholder="Ex: Confraternização Universal"
                                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                                                    />
                                                </div>

                                                <button
                                                    onClick={handleSaveHoliday}
                                                    disabled={saving || !holidayTitle}
                                                    className="w-full bg-amber-500 text-white font-bold py-3 rounded-xl hover:bg-amber-600 active:scale-[0.98] transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                                >
                                                    {saving ? (
                                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    ) : (
                                                        <>
                                                            <Save size={18} />
                                                            Salvar Feriado
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        )}

                                        {!holidaysList.find(h => isSameDay(parseISO(h.data), selectedHolidayDate)) && (
                                            <p className="text-xs text-slate-400 mt-4 text-center">
                                                Ao salvar, o sistema irá considerar este dia como feriado para todos os cálculos.
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl p-8 bg-slate-50/50">
                                        <CalendarIcon size={48} className="text-slate-200 mb-4" />
                                        <p>Selecione uma data no calendário para configurar um feriado.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
