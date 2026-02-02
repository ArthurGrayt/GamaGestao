import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../services/supabase';
import { User, Plus, Edit2, Trash2, Target, ChevronRight, Save, X, CheckCircle2, Circle, RefreshCw, Info, ChevronDown } from 'lucide-react';

interface IndividualGoal {
    id: string;
    collaborator: string;
    objective: string;
    targetValue?: number;
    currentValue: number;
    type: string;
    isCompleted: boolean;
    gut_g?: number;
    gut_u?: number;
    gut_t?: number;
}

export const IndividualGoalsQuadrant: React.FC = () => {
    const [users, setUsers] = useState<string[]>([]);
    const [goals, setGoals] = useState<IndividualGoal[]>([]);
    const [editingGoal, setEditingGoal] = useState<IndividualGoal | null>(null);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [filteredUsers, setFilteredUsers] = useState<string[]>([]);
    const [gutValues, setGutValues] = useState({ g: 1, u: 1, t: 1 });
    const [isGutExpanded, setIsGutExpanded] = useState(false);
    const [showList, setShowList] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        if (editingGoal) {
            setGutValues({
                g: editingGoal.gut_g || 1,
                u: editingGoal.gut_u || 1,
                t: editingGoal.gut_t || 1
            });
            // Auto expand if there are relevant values
            if ((editingGoal.gut_g || 1) > 1 || (editingGoal.gut_u || 1) > 1 || (editingGoal.gut_t || 1) > 1) {
                setIsGutExpanded(true);
            }
        } else {
            setGutValues({ g: 1, u: 1, t: 1 });
            setIsGutExpanded(false);
        }
    }, [editingGoal]);

    useEffect(() => {
        const fetchUsers = async () => {
            setLoadingUsers(true);
            try {
                const { data, error } = await supabase
                    .from('users')
                    .select('username')
                    .order('username');

                if (error) throw error;
                if (data) {
                    setUsers(data.map(u => u.username));
                }
            } catch (err) {
                console.error('Error fetching users:', err);
            } finally {
                setLoadingUsers(false);
            }
        };
        fetchUsers();

        // Load goals from local storage
        const savedGoals = localStorage.getItem('gama_individual_goals');
        if (savedGoals) {
            try {
                setGoals(JSON.parse(savedGoals));
            } catch (e) {
                console.error('Error loading goals from localStorage:', e);
            }
        }
    }, []);

    // Save goals to local storage whenever they change
    useEffect(() => {
        localStorage.setItem('gama_individual_goals', JSON.stringify(goals));
    }, [goals]);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const collaborator = formData.get('collaborator') as string;
        const objective = formData.get('objective') as string;
        const type = formData.get('type') as string;
        const isCompleted = formData.get('isCompleted') === 'on';

        const targetValueStr = formData.get('targetValue') as string;
        const currentValueStr = formData.get('currentValue') as string;

        const targetValue = targetValueStr ? Number(targetValueStr) : undefined;
        const currentValue = currentValueStr ? Number(currentValueStr) : 0;

        const gut_g = Number(formData.get('gut_g')) || 1;
        const gut_u = Number(formData.get('gut_u')) || 1;
        const gut_t = Number(formData.get('gut_t')) || 1;

        if (editingGoal) {
            setGoals(prev => prev.map(g => g.id === editingGoal.id ? {
                ...g, collaborator, objective, targetValue, currentValue, type, isCompleted,
                gut_g, gut_u, gut_t
            } : g));
            setEditingGoal(null);
        } else {
            setGoals(prev => [{
                id: Math.random().toString(36).substr(2, 9),
                collaborator, objective, targetValue, currentValue, type, isCompleted,
                gut_g, gut_u, gut_t
            }, ...prev]);
        }
        setIsGutExpanded(false);
        formRef.current?.reset();
    };

    const handleDelete = (id: string) => {
        setGoals(prev => prev.filter(g => g.id !== id));
        if (editingGoal?.id === id) setEditingGoal(null);
    };

    const toggleGoalStatus = (id: string) => {
        setGoals(prev => prev.map(g => g.id === id ? { ...g, isCompleted: !g.isCompleted } : g));
    };

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
                {editingGoal && (
                    <button
                        onClick={() => {
                            setEditingGoal(null);
                            formRef.current?.reset();
                        }}
                        className="text-[10px] font-bold text-red-500 uppercase flex items-center gap-1 hover:bg-red-50 px-2 py-1 rounded-lg transition-all"
                    >
                        <X size={12} /> Cancelar Edição
                    </button>
                )}
            </div>

            {/* Quick Form Section */}
            <form
                ref={formRef}
                onSubmit={handleSave}
                className="bg-white/40 border border-white/60 p-4 rounded-2xl mb-4 space-y-3 flex-shrink-0"
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
                                className="w-full bg-white/70 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none transition-all"
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
                                <div className="absolute top-full left-0 w-full mt-1 bg-white/90 backdrop-blur-md border border-slate-200 rounded-xl shadow-xl max-h-[120px] overflow-y-auto z-50 custom-scrollbar">
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
                            <div className="absolute bottom-full left-0 mb-2 w-64 p-3 bg-slate-800/95 text-white text-[10px] rounded-2xl shadow-2xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-300 z-[100] pointer-events-none border border-slate-700/50 backdrop-blur-md">
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
                        <input
                            name="type"
                            type="text"
                            required
                            className="w-full bg-white/70 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            placeholder=""
                            defaultValue={editingGoal?.type}
                            key={`type-${editingGoal?.id || 'new'}`}
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Objetivo (Meta)</label>
                    <div className="flex gap-2">
                        <input
                            name="objective"
                            type="text"
                            required
                            className="flex-1 bg-white/70 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            placeholder="Descreva a meta..."
                            defaultValue={editingGoal?.objective}
                            key={`obj-${editingGoal?.id || 'new'}`}
                        />
                    </div>
                </div>

                {/* GUT Matrix Section */}
                <div className="bg-slate-50/50 rounded-xl border border-slate-100 overflow-hidden transition-all duration-300">
                    <div
                        onClick={() => setIsGutExpanded(!isGutExpanded)}
                        className={`flex items-center justify-between cursor-pointer hover:bg-slate-100/50 transition-colors ${isGutExpanded ? 'p-3 border-b border-slate-100' : 'p-2'}`}
                    >
                        <p className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-2">
                            Prioridade (GUT)
                            {!isGutExpanded && (
                                <span className={`text-[8px] font-normal normal-case px-1.5 py-0.5 rounded border transition-colors ${(gutValues.g || 1) * (gutValues.u || 1) * (gutValues.t || 1) > 45 ? 'bg-orange-100 text-orange-600 border-orange-200' :
                                    'bg-white text-slate-400 border-slate-100'
                                    }`}>
                                    Score: {(gutValues.g || 1) * (gutValues.u || 1) * (gutValues.t || 1)}
                                </span>
                            )}
                        </p>
                        <ChevronDown size={14} className={`text-slate-400 transition-transform duration-300 ${isGutExpanded ? 'rotate-180' : ''}`} />
                    </div>

                    {isGutExpanded && (
                        <div className="px-3 py-3 space-y-4 animate-in slide-in-from-top-2 duration-300">
                            <div className="flex justify-end mb-2">
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${(gutValues.g || 1) * (gutValues.u || 1) * (gutValues.t || 1) > 45 ? 'bg-orange-100 text-orange-600 border-orange-200' :
                                    'bg-white text-slate-500 border-slate-100'
                                    }`}>
                                    Total Score: {(gutValues.g || 1) * (gutValues.u || 1) * (gutValues.t || 1)}
                                </span>
                            </div>

                            {[
                                { label: 'Gravidade', name: 'gut_g', tip: 'Impacto do problema', val: gutValues.g, set: (v: number) => setGutValues(prev => ({ ...prev, g: v })) },
                                { label: 'Urgência', name: 'gut_u', tip: 'Prazo para resolver', val: gutValues.u, set: (v: number) => setGutValues(prev => ({ ...prev, u: v })) },
                                { label: 'Tendência', name: 'gut_t', tip: 'Piora se não agir', val: gutValues.t, set: (v: number) => setGutValues(prev => ({ ...prev, t: v })) }
                            ].map((field) => (
                                <div key={field.name} className="space-y-1 relative">
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="text-[9px] font-bold text-slate-500 uppercase ml-1" title={field.tip}>{field.label}</label>
                                        <span className={`text-[10px] font-bold ${field.val >= 5 ? 'text-red-500' :
                                            field.val >= 3 ? 'text-orange-500' : 'text-green-500'
                                            }`}>{field.val}</span>
                                    </div>
                                    <div className="relative h-2 w-full rounded-full bg-gradient-to-r from-emerald-400 via-yellow-400 to-red-500">
                                        <input
                                            type="range"
                                            name={field.name}
                                            min="1"
                                            max="5"
                                            step="1"
                                            value={field.val}
                                            onChange={(e) => field.set(Number(e.target.value))}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        />
                                        {/* Custom Thumb Indicator Position */}
                                        <div
                                            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-slate-200 rounded-full shadow-sm pointer-events-none transition-all duration-75"
                                            style={{ left: `calc(${((field.val - 1) / 4) * 100}% - 8px)` }}
                                        />
                                    </div>
                                    <div className="flex justify-between px-0.5 mt-1">
                                        <span className="text-[7px] text-slate-400 font-medium uppercase">Baixo</span>
                                        <span className="text-[7px] text-slate-400 font-medium uppercase">Alto</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <button
                    type="submit"
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center gap-1.5"
                >
                    {editingGoal ? <Save size={14} /> : <Plus size={14} />}
                    {editingGoal ? 'Salvar Alterações' : 'Adicionar Meta'}
                </button>

                {/* Content removed to simplify UI as requested */}
            </form>

            {/* View Goals Toggle / Card */}
            <div className="mt-auto">
                {!showList ? (
                    <button
                        onClick={() => setShowList(true)}
                        className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between group hover:bg-slate-100 transition-all"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-purple-100 text-purple-600 group-hover:scale-110 transition-transform">
                                <Target size={18} />
                            </div>
                            <div className="text-left">
                                <p className="text-xs font-bold text-slate-700">Mostrar Metas</p>
                                <p className="text-[10px] text-slate-500">{goals.length} meta(s) cadastrada(s)</p>
                            </div>
                        </div>
                        <ChevronRight size={16} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
                    </button>
                ) : (
                    <div className="bg-slate-50/80 rounded-2xl border border-slate-100 flex flex-col max-h-[220px] animate-in slide-in-from-bottom-2 duration-300">
                        <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-white/50">
                            <p className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                                <Target size={12} className="text-purple-500" />
                                Lista de Metas
                            </p>
                            <button
                                onClick={() => setShowList(false)}
                                className="text-[10px] font-bold text-blue-600 hover:text-blue-700 transition-colors px-2 py-1"
                            >
                                Ocultar
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-3 custom-scrollbar space-y-3">
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
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 flex-shrink-0">
                                                <div className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase text-center min-w-[32px]
                                                    ${(goal.gut_g || 1) * (goal.gut_u || 1) * (goal.gut_t || 1) > 90 ? 'bg-red-100 text-red-600' :
                                                        (goal.gut_g || 1) * (goal.gut_u || 1) * (goal.gut_t || 1) > 45 ? 'bg-orange-100 text-orange-600' :
                                                            'bg-green-100 text-green-600'
                                                    }`}
                                                >
                                                    {(goal.gut_g || 1) * (goal.gut_u || 1) * (goal.gut_t || 1)}
                                                </div>

                                                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => {
                                                            setEditingGoal(goal);
                                                            // When editing, we might want to stay in list or close it. 
                                                            // Usually, for space, we might close the list to show the form.
                                                            setShowList(false);
                                                        }}
                                                        className="p-1 hover:bg-blue-50 text-slate-400 hover:text-blue-500 rounded-lg transition-colors"
                                                    >
                                                        <Edit2 size={12} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(goal.id)}
                                                        className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
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
                )}
            </div>

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
        </div>
    );
};
