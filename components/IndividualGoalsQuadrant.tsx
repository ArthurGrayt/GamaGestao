import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../services/supabase';
import { User, Plus, Edit2, Trash2, Target, ChevronRight, Save, X, CheckCircle2, Circle, RefreshCw, Info, ChevronDown, Maximize2, ShieldAlert } from 'lucide-react';

interface IndividualGoal {
    id: string;
    collaborator: string; // db: colaborador
    objective: string;    // db: descricao
    type: string;         // db: tipo
    created_at?: string;  // db: created_at
    targetValue?: number;
    currentValue: number;
    isCompleted: boolean;
}

export const IndividualGoalsQuadrant: React.FC = () => {
    const [users, setUsers] = useState<string[]>([]);
    const [goals, setGoals] = useState<IndividualGoal[]>([]);
    const [loading, setLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [filteredUsers, setFilteredUsers] = useState<string[]>([]);
    const formRef = useRef<HTMLFormElement>(null);

    const [editingGoal, setEditingGoal] = useState<IndividualGoal | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);

    // Goal type dropdown state
    const goalTypes = ['resultado', 'processo', 'aprendizado', 'qualitativo'];
    const [filteredTypes, setFilteredTypes] = useState<string[]>(goalTypes);
    const [showTypeDropdown, setShowTypeDropdown] = useState(false);

    // Authorization state
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [checkingAuth, setCheckingAuth] = useState(true);
    const [currentUser, setCurrentUser] = useState<string>('');

    // Check authorization
    useEffect(() => {
        const checkAuthorization = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();

                if (!session) {
                    setIsAuthorized(false);
                    setCheckingAuth(false);
                    return;
                }

                const { data: userData, error } = await supabase
                    .from('users')
                    .select('username')
                    .eq('user_id', session.user.id)
                    .single();

                if (error || !userData) {
                    console.error('Error fetching user:', error);
                    setIsAuthorized(false);
                } else {
                    const authorizedUsers = ['Clárison Gamarano', 'Daiane Gamarano', 'Pedro Borba'];
                    const username = userData.username;
                    setCurrentUser(username);
                    setIsAuthorized(authorizedUsers.includes(username));
                }
            } catch (err) {
                console.error('Authorization check error:', err);
                setIsAuthorized(false);
            } finally {
                setCheckingAuth(false);
            }
        };

        checkAuthorization();
    }, []);

    useEffect(() => {
        const fetchUserData = async () => {
            setLoading(true);
            try {
                // Fetch Users for autocomplete
                const { data: userData, error: userError } = await supabase
                    .from('users')
                    .select('username')
                    .order('username');

                if (userError) throw userError;
                if (userData) {
                    setUsers(userData.map(u => u.username));
                }

                // Fetch existing goals from Supabase
                const { data: goalData, error: goalError } = await supabase
                    .from('metas_usuarios')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (goalError) throw goalError;
                if (goalData) {
                    const mappedGoals: IndividualGoal[] = goalData.map(g => ({
                        id: g.id,
                        collaborator: g.colaborador,
                        objective: g.descricao,
                        type: g.tipo,
                        created_at: g.created_at,
                        // Defaults for fields not present in this table
                        currentValue: 0,
                        isCompleted: false
                    }));
                    setGoals(mappedGoals);
                }
            } catch (err) {
                console.error('Error fetching data:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchUserData();
    }, []);

    // No longer using localStorage as primary storage
    /* 
    useEffect(() => {
        localStorage.setItem('gama_individual_goals', JSON.stringify(goals));
    }, [goals]);
    */

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const collaborator = formData.get('collaborator') as string;
        const objective = formData.get('objective') as string;
        const type = formData.get('type') as string;

        setLoading(true);
        try {
            if (editingGoal) {
                const { error } = await supabase
                    .from('metas_usuarios')
                    .update({
                        colaborador: collaborator,
                        descricao: objective,
                        tipo: type
                    })
                    .eq('id', editingGoal.id);

                if (error) throw error;

                setGoals(prev => prev.map(g => g.id === editingGoal.id ? {
                    ...g, collaborator, objective, type
                } : g));
                setEditingGoal(null);
            } else {
                const { data, error } = await supabase
                    .from('metas_usuarios')
                    .insert([{
                        colaborador: collaborator,
                        descricao: objective,
                        tipo: type
                    }])
                    .select()
                    .single();

                if (error) throw error;

                if (data) {
                    setGoals(prev => [{
                        id: data.id,
                        collaborator: data.colaborador,
                        objective: data.descricao,
                        type: data.tipo,
                        created_at: data.created_at,
                        currentValue: 0,
                        isCompleted: false
                    }, ...prev]);
                }
            }
            formRef.current?.reset();
        } catch (err) {
            console.error('Error saving goal:', err);
            alert('Erro ao salvar meta no banco de dados.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        setLoading(true);
        try {
            const { error } = await supabase
                .from('metas_usuarios')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setGoals(prev => prev.filter(g => g.id !== id));
            if (editingGoal?.id === id) setEditingGoal(null);
        } catch (err) {
            console.error('Error deleting goal:', err);
            alert('Erro ao excluir meta do banco de dados.');
        } finally {
            setLoading(false);
        }
    };

    const toggleGoalStatus = (id: string) => {
        // Since is_completed is not in DB yet, this will only be local
        setGoals(prev => prev.map(g => g.id === id ? { ...g, isCompleted: !g.isCompleted } : g));
    };

    // Loading state
    if (checkingAuth) {
        return (
            <div className="bg-white/60 backdrop-blur-xl p-6 rounded-3xl shadow-lg shadow-slate-200/50 border border-white/50 h-[450px] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <RefreshCw size={32} className="text-purple-500 animate-spin" />
                    <p className="text-sm text-slate-500 font-medium">Verificando permissões...</p>
                </div>
            </div>
        );
    }

    // Access denied state
    if (!isAuthorized) {
        return (
            <div className="bg-white/60 backdrop-blur-xl p-6 rounded-3xl shadow-lg shadow-slate-200/50 border border-white/50 h-[450px] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4 max-w-sm text-center">
                    <div className="bg-orange-50 text-orange-500 w-16 h-16 rounded-2xl flex items-center justify-center">
                        <ShieldAlert size={32} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 mb-2">Acesso Restrito</h3>
                        <p className="text-sm text-slate-500 leading-relaxed">
                            Este quadrante está disponível apenas para usuários autorizados a atribuir metas individuais.
                        </p>
                        {currentUser && (
                            <p className="text-xs text-slate-400 mt-3 italic">
                                Usuário atual: {currentUser}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white/60 backdrop-blur-xl p-6 rounded-3xl shadow-lg shadow-slate-200/50 border border-white/50 h-[450px] flex flex-col relative">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
                <div>
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Target size={20} className="text-purple-500" />
                        Metas p/ Indivíduo
                    </h3>
                </div>
                <div className="flex items-center gap-2">
                    {editingGoal && (
                        <button
                            onClick={() => {
                                setEditingGoal(null);
                                formRef.current?.reset();
                            }}
                            className="text-[10px] font-bold text-red-500 uppercase flex items-center gap-1 hover:bg-red-50 px-2 py-1 rounded-lg transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
                        >
                            <X size={12} /> Cancelar Edição
                        </button>
                    )}
                </div>
            </div>

            {/* Quick Form Section */}
            <form
                ref={formRef}
                onSubmit={handleSave}
                className="bg-white/40 border border-white/60 p-4 rounded-2xl mb-4 space-y-3 flex-shrink-0 transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-white/50"
            >
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <div className="h-4 flex items-center ml-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase">Colaborador</label>
                        </div>
                        <div className="relative">
                            <input
                                name="collaborator"
                                required
                                autoComplete="off"
                                className="w-full bg-white/70 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
                                placeholder="Pesquisar..."
                                defaultValue={editingGoal?.collaborator || ''}
                                key={editingGoal?.id || 'new'}
                                onChange={(e) => {
                                    const value = e.target.value.toLowerCase();
                                    const filtered = users.filter(u => u.toLowerCase().includes(value));
                                    setFilteredUsers(filtered);
                                    setShowSuggestions(true);
                                }}
                                onFocus={() => {
                                    setFilteredUsers(users);
                                    setShowSuggestions(true);
                                }}
                                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} // Delay to allow click
                            />
                            {showSuggestions && (
                                <div className="absolute top-full left-0 w-full mt-2 bg-white/90 backdrop-blur-md border border-slate-200 rounded-xl shadow-xl max-h-[120px] overflow-y-auto z-50 custom-scrollbar animate-in fade-in zoom-in-95 duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]">
                                    {filteredUsers.length > 0 ? (
                                        filteredUsers.map(user => (
                                            <div
                                                key={user}
                                                className="px-3 py-2 text-xs text-slate-700 hover:bg-blue-50 cursor-pointer transition-colors border-b border-slate-100/50 last:border-0"
                                                onClick={() => {
                                                    const input = document.querySelector('input[name="collaborator"]') as HTMLInputElement;
                                                    if (input) {
                                                        input.value = user;
                                                        // Trigger change event if needed for React form handling, though uncontrolled here
                                                    }
                                                    setShowSuggestions(false);
                                                }}
                                            >
                                                {user}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="px-3 py-2 text-[10px] text-slate-400 italic text-center">
                                            Nenhum encontrado
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <div className="h-4 flex items-center gap-1 ml-1 relative group/tooltip">
                            <label className="text-[9px] font-bold text-slate-400 uppercase">Tipo de Meta</label>
                            <Info size={10} className="text-orange-500/50 cursor-help" />

                            {/* Tooltip Balloon */}
                            <div className="absolute bottom-full left-0 mb-3 w-64 p-3 bg-slate-800/95 text-white text-[10px] rounded-2xl shadow-2xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] z-[100] pointer-events-none border border-slate-700/50 backdrop-blur-md translate-y-2 group-hover/tooltip:translate-y-0">
                                <p className="leading-relaxed">
                                    Uma forma de classificar a meta, como uma etiqueta. Ajuda a entender para que ela serve e como deve ser acompanhada.
                                    <br /><br />
                                    <span className="font-bold text-orange-400">Exemplos:</span><br />
                                    • “Vender 10 produtos” → Meta de resultado<br />
                                    • “Estudar 30 min/dia” → Meta de processo<br />
                                    • “Concluir curso” → Meta de aprendizado<br />
                                    • “Melhorar atendimento” → Meta qualitativa
                                </p>
                                {/* Triangle Arrow */}
                                <div className="absolute top-full left-4 -mt-1 w-2 h-2 bg-slate-800 rotate-45 border-r border-b border-slate-700/50" />
                            </div>
                        </div>
                        <div className="relative">
                            <input
                                name="type"
                                type="text"
                                required
                                autoComplete="off"
                                className="w-full bg-white/70 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
                                placeholder="Pesquisar..."
                                defaultValue={editingGoal?.type}
                                key={`type-${editingGoal?.id || 'new'}`}
                                onChange={(e) => {
                                    const value = e.target.value.toLowerCase();
                                    const filtered = goalTypes.filter(t => t.toLowerCase().includes(value));
                                    setFilteredTypes(filtered);
                                    setShowTypeDropdown(true);
                                }}
                                onFocus={() => {
                                    setFilteredTypes(goalTypes);
                                    setShowTypeDropdown(true);
                                }}
                                onBlur={() => setTimeout(() => setShowTypeDropdown(false), 200)}
                            />
                            {showTypeDropdown && (
                                <div className="absolute top-full left-0 w-full mt-2 bg-white/90 backdrop-blur-md border border-slate-200 rounded-xl shadow-xl max-h-[120px] overflow-y-auto z-50 custom-scrollbar animate-in fade-in zoom-in-95 duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]">
                                    {filteredTypes.length > 0 ? (
                                        filteredTypes.map(type => (
                                            <div
                                                key={type}
                                                className="px-3 py-2 text-xs text-slate-700 hover:bg-blue-50 cursor-pointer transition-colors border-b border-slate-100/50 last:border-0 capitalize"
                                                onClick={() => {
                                                    const input = document.querySelector('input[name="type"]') as HTMLInputElement;
                                                    if (input) {
                                                        input.value = type;
                                                    }
                                                    setShowTypeDropdown(false);
                                                }}
                                            >
                                                {type}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="px-3 py-2 text-[10px] text-slate-400 italic text-center">
                                            Nenhum encontrado
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Objetivo (Meta)</label>
                    <div className="flex gap-2">
                        <input
                            name="objective"
                            type="text"
                            required
                            className="flex-1 bg-white/70 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
                            placeholder="Descreva a meta..."
                            defaultValue={editingGoal?.objective}
                            key={`obj-${editingGoal?.id || 'new'}`}
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? <RefreshCw size={14} className="animate-spin" /> : (editingGoal ? <Save size={14} /> : <Plus size={14} />)}
                    {editingGoal ? 'Salvar Alterações' : 'Adicionar Meta'}
                </button>
            </form>

            {/* View Goals Section (Always Visible) */}
            <div className="flex-1 flex flex-col min-h-0">
                <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-white/50 rounded-t-2xl">
                    <p className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                        <Target size={12} className="text-purple-500" />
                        Lista de Metas ({goals.length})
                    </p>
                    <button
                        onClick={() => setIsExpanded(true)}
                        className="p-1 px-2 hover:bg-slate-100 text-slate-400 hover:text-blue-600 rounded-lg transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] flex items-center gap-1.5 active:scale-95 group/expand"
                        title="Expandir visualização"
                    >
                        <span className="text-[9px] font-bold uppercase opacity-0 group-hover/expand:opacity-100 transition-opacity duration-500">Expandir</span>
                        <Maximize2 size={13} className="group-hover/expand:scale-110 transition-transform duration-500" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-3 custom-scrollbar space-y-3 bg-slate-50/50 rounded-b-2xl border-x border-b border-slate-100">
                    {goals.map((goal, idx) => {
                        const colors = [
                            'from-purple-500 to-purple-600',
                            'from-blue-500 to-blue-600',
                            'from-indigo-500 to-indigo-600',
                            'from-pink-500 to-pink-600'
                        ];
                        const color = colors[idx % colors.length];

                        return (
                            <div key={goal.id} className="group relative bg-white/50 backdrop-blur-sm p-3 rounded-2xl border border-white hover:border-slate-200 transition-all shadow-sm">
                                <div className="flex justify-between items-center gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div
                                            onClick={() => toggleGoalStatus(goal.id)}
                                            className={`w-8 h-8 rounded-xl bg-gradient-to-br ${goal.isCompleted ? 'from-emerald-400 to-emerald-600' : color} flex items-center justify-center text-white shadow-sm transition-all flex-shrink-0 cursor-pointer`}
                                        >
                                            {goal.isCompleted ? <CheckCircle2 size={14} /> : <User size={14} />}
                                        </div>
                                        <div className="min-w-0">
                                            <p className={`text-[11px] font-bold tracking-tight truncate ${goal.isCompleted ? 'text-emerald-700/60 line-through' : 'text-slate-800'}`}>
                                                {goal.objective}
                                            </p>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <span className="text-[9px] font-medium text-slate-400">{goal.type}</span>
                                                <span className="w-0.5 h-0.5 rounded-full bg-slate-300" />
                                                <span className="text-[9px] font-bold text-slate-400 uppercase truncate max-w-[60px]">{goal.collaborator}</span>
                                                {goal.created_at && (
                                                    <>
                                                        <span className="w-0.5 h-0.5 rounded-full bg-slate-300" />
                                                        <span className="text-[9px] font-medium text-slate-400 italic">
                                                            {new Date(goal.created_at).toLocaleDateString('pt-BR')}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 flex-shrink-0">
                                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] translate-x-2 group-hover:translate-x-0">
                                            <button
                                                onClick={() => {
                                                    setEditingGoal(goal);
                                                }}
                                                className="p-1 hover:bg-blue-50 text-slate-400 hover:text-blue-500 rounded-lg transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
                                            >
                                                <Edit2 size={12} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(goal.id)}
                                                className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {goals.length === 0 && (
                        <div className="text-center py-6 text-slate-300">
                            <Target size={24} className="mx-auto mb-1 opacity-20" />
                            <p className="text-[9px] font-bold uppercase tracking-wider">Nenhuma meta encontrada</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de Visualização Expandida (Portal) */}
            {isExpanded && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-1000">
                    <div
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-all duration-1000"
                        onClick={() => setIsExpanded(false)}
                    />
                    <div className="relative w-full max-w-5xl bg-white/90 backdrop-blur-3xl rounded-[40px] shadow-[0_32px_128px_-12px_rgba(0,0,0,0.3)] border border-white/50 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]">
                        {/* Modal Header */}
                        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white/40 backdrop-blur-xl">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-2xl bg-purple-100 text-purple-600">
                                    <Target size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800">Visualização de Metas</h3>
                                    <p className="text-xs text-slate-500 font-medium">{goals.length} meta(s) registradas</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsExpanded(false)}
                                className="p-3 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-2xl transition-all duration-500"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar grid grid-cols-1 md:grid-cols-2 gap-4">
                            {goals.map((goal, idx) => {
                                const colors = [
                                    'from-purple-500 to-purple-600',
                                    'from-blue-500 to-blue-600',
                                    'from-indigo-500 to-indigo-600',
                                    'from-pink-500 to-pink-600'
                                ];
                                const color = colors[idx % colors.length];

                                return (
                                    <div key={goal.id} className="group relative bg-white border border-slate-100 p-4 rounded-3xl hover:border-purple-200 hover:shadow-xl hover:shadow-purple-100/50 transition-all duration-500">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-start gap-4 flex-1">
                                                <div
                                                    onClick={() => toggleGoalStatus(goal.id)}
                                                    className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${goal.isCompleted ? 'from-emerald-400 to-emerald-600' : color} flex items-center justify-center text-white shadow-lg transition-all flex-shrink-0 cursor-pointer hover:scale-110 active:scale-95`}
                                                >
                                                    {goal.isCompleted ? <CheckCircle2 size={24} /> : <User size={24} />}
                                                </div>
                                                <div className="min-w-0 pt-0.5">
                                                    <p className={`text-sm font-bold leading-tight ${goal.isCompleted ? 'text-emerald-700/60 line-through' : 'text-slate-800'}`}>
                                                        {goal.objective}
                                                    </p>
                                                    <div className="flex flex-wrap items-center gap-2 mt-2">
                                                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">{goal.type}</span>
                                                        <span className="px-2 py-0.5 rounded-full bg-purple-50 text-[10px] font-bold text-purple-600 uppercase tracking-wider">{goal.collaborator}</span>
                                                        {goal.created_at && (
                                                            <span className="text-[10px] font-medium text-slate-400 italic">
                                                                Criado em: {new Date(goal.created_at).toLocaleDateString('pt-BR')}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-2">
                                                <button
                                                    onClick={() => {
                                                        setEditingGoal(goal);
                                                        setIsExpanded(false);
                                                    }}
                                                    className="p-2 hover:bg-blue-50 text-slate-400 hover:text-blue-500 rounded-xl transition-all duration-500"
                                                    title="Editar"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(goal.id)}
                                                    className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-xl transition-all duration-500"
                                                    title="Excluir"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>,
                document.body
            )}

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #cbd5e1;
                }
            `}</style>
        </div >
    );
};
