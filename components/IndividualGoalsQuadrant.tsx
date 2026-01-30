import React, { useState } from 'react';
import { User, Plus, Edit2, Trash2, ArrowLeft, Settings, Target, ChevronRight, Save, X } from 'lucide-react';
import { formatCurrency } from '../utils/dateUtils';

interface IndividualGoal {
    id: string;
    name: string;
    goal: number;
    current: number;
    unit: string; // New field for generic units
}

export const IndividualGoalsQuadrant: React.FC = () => {
    const [mode, setMode] = useState<'view' | 'manage' | 'edit'>('view');
    const [goals, setGoals] = useState<IndividualGoal[]>([
        { id: '1', name: 'Colaborador Exemplo 1', goal: 50, current: 35, unit: 'Documentos' },
        { id: '2', name: 'Colaborador Exemplo 2', goal: 100, current: 80, unit: 'Atendimentos' },
        { id: '3', name: 'Colaborador Exemplo 3', goal: 20, current: 5, unit: 'Cafés' },
    ]);
    const [editingGoal, setEditingGoal] = useState<IndividualGoal | null>(null);

    const formatValue = (value: number, unit: string) => {
        if (unit.toLowerCase() === 'r$' || unit.toLowerCase() === 'brl' || unit.toLowerCase() === 'reais') {
            return formatCurrency(value);
        }
        return `${value} ${unit}`;
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const name = formData.get('name') as string;
        const goal = Number(formData.get('goal'));
        const current = Number(formData.get('current'));
        const unit = formData.get('unit') as string;

        if (editingGoal) {
            setGoals(prev => prev.map(g => g.id === editingGoal.id ? { ...g, name, goal, current, unit } : g));
        } else {
            setGoals(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), name, goal, current, unit }]);
        }
        setMode('manage');
    };

    const handleDelete = (id: string) => {
        setGoals(prev => prev.filter(g => g.id !== id));
    };

    if (mode === 'edit') {
        return (
            <div className="bg-white/60 backdrop-blur-xl p-8 rounded-3xl shadow-lg border border-white/50 h-[450px] flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center gap-3 mb-8">
                    <button
                        onClick={() => setMode('manage')}
                        className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h3 className="text-xl font-bold text-slate-800">{editingGoal ? 'Editar Meta' : 'Nova Meta'}</h3>
                        <p className="text-xs text-slate-500">Defina o objetivo e a unidade de medida</p>
                    </div>
                </div>

                <form onSubmit={handleSave} className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Colaborador</label>
                        <input
                            name="name"
                            type="text"
                            required
                            className="w-full bg-white/50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            placeholder="Nome do colaborador..."
                            defaultValue={editingGoal?.name}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Unidade de Medida</label>
                        <input
                            name="unit"
                            type="text"
                            required
                            className="w-full bg-white/50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            placeholder="Ex: Atendimentos, Documentos, R$..."
                            defaultValue={editingGoal?.unit}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Objetivo (Meta)</label>
                            <input
                                name="goal"
                                type="number"
                                required
                                className="w-full bg-white/50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                placeholder="0"
                                defaultValue={editingGoal?.goal}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Progresso Atual</label>
                            <input
                                name="current"
                                type="number"
                                required
                                className="w-full bg-white/50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                placeholder="0"
                                defaultValue={editingGoal?.current}
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3 mt-auto">
                        <button
                            type="button"
                            onClick={() => setMode('manage')}
                            className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-2xl text-sm font-bold hover:bg-slate-50 transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="flex-1 py-3 bg-blue-600 text-white rounded-2xl text-sm font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                        >
                            <Save size={18} /> Salvar
                        </button>
                    </div>
                </form>
            </div>
        );
    }

    if (mode === 'manage') {
        return (
            <div className="bg-white/60 backdrop-blur-xl p-8 rounded-3xl shadow-lg border border-white/50 h-[450px] flex flex-col animate-in fade-in slide-in-from-left-4 duration-300">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setMode('view')}
                            className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h3 className="text-xl font-bold text-slate-800">Gerenciar Metas</h3>
                            <p className="text-xs text-slate-500">Configuração de objetivos</p>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            setEditingGoal(null);
                            setMode('edit');
                        }}
                        className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all group"
                    >
                        <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                    </button>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    {goals.map(goal => (
                        <div key={goal.id} className="bg-white/40 border border-white/60 p-4 rounded-2xl flex items-center justify-between group hover:bg-white/60 transition-all">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                                    <User size={20} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-slate-700 truncate">{goal.name}</p>
                                    <p className="text-[11px] text-slate-500">{goal.goal} {goal.unit}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => {
                                        setEditingGoal(goal);
                                        setMode('edit');
                                    }}
                                    className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button
                                    onClick={() => handleDelete(goal.id)}
                                    className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white/60 backdrop-blur-xl p-8 rounded-3xl shadow-lg shadow-slate-200/50 border border-white/50 h-[450px] flex flex-col">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Target size={24} className="text-purple-500" />
                        Metas p/ Indivíduo
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">Acompanhamento de performance individual</p>
                </div>
                <button
                    onClick={() => setMode('manage')}
                    className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-blue-500 transition-all"
                >
                    <Settings size={20} />
                </button>
            </div>

            <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {goals.map((goal, idx) => {
                    const percent = (goal.current / goal.goal) * 100;
                    const colors = [
                        'from-purple-500 to-purple-600',
                        'from-blue-500 to-blue-600',
                        'from-indigo-500 to-indigo-600',
                        'from-pink-500 to-pink-600'
                    ];
                    const color = colors[idx % colors.length];

                    return (
                        <div key={goal.id} className="space-y-3">
                            <div className="flex justify-between items-end">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white shadow-lg shadow-blue-100/20`}>
                                        <User size={18} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-700">{goal.name}</p>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <span className="text-[11px] text-slate-400 font-medium">
                                                {formatValue(goal.current, goal.unit)}
                                            </span>
                                            <ChevronRight size={10} className="text-slate-300" />
                                            <span className="text-[11px] text-slate-600 font-bold">
                                                {formatValue(goal.goal, goal.unit)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-base font-black text-slate-800">{percent.toFixed(0)}%</span>
                                </div>
                            </div>
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-1000 ease-out`}
                                    style={{ width: `${Math.min(100, percent)}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
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
