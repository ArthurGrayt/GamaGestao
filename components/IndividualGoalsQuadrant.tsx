import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../services/supabase';
import { User, Plus, Edit2, Trash2, Target, ChevronRight, Save, X, CheckCircle2, Circle, RefreshCw, Info } from 'lucide-react';

interface IndividualGoal {
    id: string;
    collaborator: string;
    objective: string;
    targetValue?: number;
    currentValue: number;
    type: string;
    isCompleted: boolean;
}

export const IndividualGoalsQuadrant: React.FC = () => {
    const [users, setUsers] = useState<string[]>([]);
    const [goals, setGoals] = useState<IndividualGoal[]>([]);
    const [editingGoal, setEditingGoal] = useState<IndividualGoal | null>(null);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);

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

        if (editingGoal) {
            setGoals(prev => prev.map(g => g.id === editingGoal.id ? { ...g, collaborator, objective, targetValue, currentValue, type, isCompleted } : g));
            setEditingGoal(null);
        } else {
            setGoals(prev => [{
                id: Math.random().toString(36).substr(2, 9),
                collaborator, objective, targetValue, currentValue, type, isCompleted
            }, ...prev]);
        }
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
                        <input
                            name="collaborator"
                            list="users-list"
                            required
                            className="w-full bg-white/70 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            placeholder="Pesquisar..."
                            defaultValue={editingGoal?.collaborator || ''}
                            key={editingGoal?.id || 'new'}
                        />
                        <datalist id="users-list">
                            {users.map(user => (
                                <option key={user} value={user} />
                            ))}
                        </datalist>
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
                        <button
                            type="submit"
                            className="bg-blue-600 text-white px-4 rounded-xl text-xs font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center gap-1.5"
                        >
                            {editingGoal ? <Save size={14} /> : <Plus size={14} />}
                            {editingGoal ? 'Salvar' : 'Add'}
                        </button>
                    </div>
                </div>

                {/* Content removed to simplify UI as requested */}
            </form>

            {/* List Section */}
            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-4">
                {goals.map((goal, idx) => {
                    // Removed hasProgress and percent calculation as progress bars are removed
                    const colors = [
                        'from-purple-500 to-purple-600',
                        'from-blue-500 to-blue-600',
                        'from-indigo-500 to-indigo-600',
                        'from-pink-500 to-pink-600'
                    ];
                    const color = colors[idx % colors.length];

                    return (
                        <div key={goal.id} className="group relative bg-white/30 backdrop-blur-sm p-4 rounded-3xl border border-white/60 hover:bg-white/50 transition-all duration-300 shadow-sm hover:shadow-md">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <div
                                        onClick={() => toggleGoalStatus(goal.id)}
                                        className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${goal.isCompleted ? 'from-emerald-400 to-emerald-600' : color} flex items-center justify-center text-white shadow-lg transition-all duration-300 flex-shrink-0`}
                                    >
                                        {goal.isCompleted ? <CheckCircle2 size={20} /> : <User size={20} />}
                                    </div>
                                    <div className="min-w-0">
                                        <p className={`text-sm font-bold tracking-tight ${goal.isCompleted ? 'text-emerald-700/60 line-through' : 'text-slate-800'}`}>
                                            {goal.objective}
                                        </p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{goal.collaborator}</span>
                                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                                            <span className="text-[10px] font-medium text-slate-500">{goal.type}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => setEditingGoal(goal)}
                                        className="p-2 hover:bg-blue-50 text-slate-400 hover:text-blue-500 rounded-xl transition-colors"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(goal.id)}
                                        className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-xl transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {goals.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-6 text-slate-400 opacity-30">
                        <Target size={32} className="mb-1" />
                        <p className="text-[10px] font-bold uppercase">Nenhuma meta definida</p>
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
