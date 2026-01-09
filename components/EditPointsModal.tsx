import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabase';
import { X, Calendar, User as UserIcon, Save, Edit2, Clock, AlertCircle, Trash2, Plus, ChevronDown, Check, Wand2 } from 'lucide-react';
import { format, parseISO, startOfDay, endOfDay } from 'date-fns';

interface User {
    id: number;
    user_id: string;
    username: string;
    img_url?: string;
    role_id?: number;
}

interface PointRecord {
    id: number;
    user_id: string;
    datahora: string;
    tipo: string;
    justificativa_local?: string;
    ordem: number;
    horas_acumuladas?: number;
    tempo_almoco?: number;
}

interface EditPointsModalProps {
    isOpen: boolean;
    onClose: () => void;
    users: User[]; // Passed from parent to avoid re-fetching
}

export const EditPointsModal: React.FC<EditPointsModalProps> = ({ isOpen, onClose, users }) => {
    const [selectedUserId, setSelectedUserId] = useState<string>('');
    const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
    const [loading, setLoading] = useState(false);
    const [points, setPoints] = useState<PointRecord[]>([]);

    // Custom Dropdown State
    const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Edit Form State
    const [editingPoint, setEditingPoint] = useState<PointRecord | null>(null);
    const [Saving, setSaving] = useState(false);

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

    useEffect(() => {
        if (selectedUserId && selectedDate) {
            fetchPoints();
        } else {
            setPoints([]);
            setEditingPoint(null);
        }
    }, [selectedUserId, selectedDate]);

    const fetchPoints = async () => {
        setLoading(true);
        try {
            // Filter by full day range for the selected date
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
            justificativa_local: '',
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
    }

    const handleSavePoint = async () => {
        if (!editingPoint) return;
        setSaving(true);
        try {
            const payload = {
                user_id: editingPoint.user_id,
                datahora: editingPoint.datahora,
                tipo: editingPoint.tipo,
                justificativa_local: editingPoint.justificativa_local,
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
            console.log('Normalizando para:', currentUser);
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
                        justificativa_local: 'Normalização Automática (Estágio)'
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
                        justificativa_local: 'Normalização Automática (Estágio)'
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
                        justificativa_local: 'Normalização Automática'
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
                        justificativa_local: 'Normalização Automática'
                    });

                    const v = new Date(dateBase);
                    v.setHours(13, 15, 0, 0);
                    newPoints.push({
                        user_id: selectedUserId,
                        datahora: v.toISOString(),
                        tipo: 'Volta do almoço',
                        ordem: 3,
                        justificativa_local: 'Normalização Automática'
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
                        justificativa_local: 'Normalização Automática'
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

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl flex flex-col h-[85vh] overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="bg-amber-100 p-2.5 rounded-xl text-amber-600">
                            <Edit2 size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">Editar Pontos</h2>
                            <p className="text-slate-500 text-sm">Gerencie os registros de ponto manualmente</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>

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
                                            disabled={Saving}
                                            className="bg-amber-500 hover:bg-amber-600 text-white px-8 py-2 rounded-xl font-bold shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                        >
                                            {Saving ? (
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
            </div>
        </div>
    );
};
