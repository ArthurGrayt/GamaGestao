import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../services/supabase';
import { User, Plus, Edit2, Trash2, Target, ChevronRight, Save, X, CheckCircle2, Circle, RefreshCw } from 'lucide-react';

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
    const [goals, setGoals] = useState<IndividualGoal[]>([
        { id: '1', collaborator: 'Arthur', objective: 'Fazer café', currentValue: 0, type: 'Copa', isCompleted: false },
        { id: '2', collaborator: 'Beatriz', objective: 'Realizar 50 atendimentos', targetValue: 50, currentValue: 35, type: 'Atendimento', isCompleted: false },
        { id: '3', collaborator: 'Carlos', objective: 'Recuperar documentos pendentes', targetValue: 20, currentValue: 5, type: 'Documentação', isCompleted: false },
    ]);
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
    }, []);

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
        <div className="bg-white/60 backdrop-blur-xl p-6 rounded-3xl shadow-lg shadow-slate-200/50 border border-white/50 h-[450px] flex flex-col overflow-hidden">
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
                    <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Colaborador</label>
                        <select
                            name="collaborator"
                            required
                            className="w-full bg-white/70 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none"
                            key={editingGoal?.id || 'new'}
                            defaultValue={editingGoal?.collaborator || ''}
                        >
                            <option value="" disabled>Quem?</option>
                            {users.map(user => (
                                <option key={user} value={user}>{user}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Tipo de Meta</label>
                        <input
                            name="type"
                            type="text"
                            required
                            className="w-full bg-white/70 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            placeholder="Atendimento, Copa..."
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

                <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Alvo (%)</label>
                        <input
                            name="targetValue"
                            type="number"
                            className="w-full bg-white/70 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            placeholder="Meta"
                            defaultValue={editingGoal?.targetValue}
                            key={`target-${editingGoal?.id || 'new'}`}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Atual</label>
                        <input
                            name="currentValue"
                            type="number"
                            className="w-full bg-white/70 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            placeholder="Realizado"
                            defaultValue={editingGoal?.currentValue}
                            key={`curr-${editingGoal?.id || 'new'}`}
                        />
                    </div>
                    <div className="flex items-center justify-center gap-2 pt-4">
                        <input
                            name="isCompleted"
                            type="checkbox"
                            id="goal-completed-quick"
                            className="w-4 h-4 rounded accent-emerald-500 cursor-pointer"
                            defaultChecked={editingGoal?.isCompleted}
                            key={`done-${editingGoal?.id || 'new'}`}
                        />
                        <label htmlFor="goal-completed-quick" className="text-[10px] font-bold text-slate-500 flex items-center gap-1 cursor-pointer">
                            Pronto
                        </label>
                    </div>
                </div>
            </form>

            {/* List Section */}
            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-4">
                {goals.map((goal, idx) => {
                    const hasProgress = goal.targetValue && goal.targetValue > 0;
                    const percent = hasProgress ? (goal.currentValue / (goal.targetValue || 1)) * 100 : 0;

                    const colors = [
                        'from-purple-500 to-purple-600',
                        'from-blue-500 to-blue-600',
                        'from-indigo-500 to-indigo-600',
                        'from-pink-500 to-pink-600'
                    ];
                    const color = colors[idx % colors.length];

                    return (
                        <div key={goal.id} className="group relative bg-white/20 p-3 rounded-2xl border border-white/40 hover:bg-white/50 transition-all">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div
                                        onClick={() => toggleGoalStatus(goal.id)}
                                        className={`w-8 h-8 rounded-lg bg-gradient-to-br ${goal.isCompleted ? 'from-emerald-400 to-emerald-600' : color} flex items-center justify-center text-white shadow-md cursor-pointer hover:scale-110 transition-all duration-300 flex-shrink-0`}
                                    >
                                        {goal.isCompleted ? <CheckCircle2 size={16} /> : <User size={16} />}
                                    </div>
                                    <div className="min-w-0">
                                        <p className={`text-xs font-bold truncate ${goal.isCompleted ? 'text-emerald-700 opacity-60' : 'text-slate-700'}`}>
                                            {goal.objective}
                                        </p>
                                        <p className="text-[10px] text-slate-400 font-medium">
                                            {goal.collaborator} • {goal.type}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setEditingGoal(goal)}
                                        className="p-1.5 hover:bg-blue-50 text-slate-300 hover:text-blue-500 rounded-lg transition-colors"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(goal.id)}
                                        className="p-1.5 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>

                            {(hasProgress || goal.isCompleted) && (
                                <div className="mt-2">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-[9px] font-bold text-slate-400">Progresso</span>
                                        <span className={`text-[9px] font-black ${goal.isCompleted ? 'text-emerald-600' : 'text-slate-600'}`}>
                                            {goal.isCompleted ? '100%' : `${percent.toFixed(0)}%`}
                                        </span>
                                    </div>
                                    <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full bg-gradient-to-r ${goal.isCompleted ? 'from-emerald-400 to-emerald-600' : color} transition-all duration-1000 ease-out`}
                                            style={{ width: `${goal.isCompleted ? 100 : Math.min(100, percent)}%` }}
                                        />
                                    </div>
                                </div>
                            )}
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
