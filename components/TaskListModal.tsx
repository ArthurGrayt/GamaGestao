import React, { useState, useMemo } from 'react';
import { X, Trophy, Calendar, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Task {
    id?: number;
    titulo?: string;
    score?: number;
    status: string;
    created_at: string;
}

interface TaskListModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    tasks: Task[];
    statusOptions?: string[];
}

export const TaskListModal: React.FC<TaskListModalProps> = ({ isOpen, onClose, title, tasks, statusOptions = [] }) => {
    const [selectedStatus, setSelectedStatus] = useState<string>('all');

    // Reset filter when modal opens/title changes
    React.useEffect(() => {
        if (isOpen) setSelectedStatus('all');
    }, [isOpen, title]);

    const filteredTasks = useMemo(() => {
        if (selectedStatus === 'all') return tasks;
        return tasks.filter(t => t.status?.toLowerCase().trim() === selectedStatus.toLowerCase().trim());
    }, [tasks, selectedStatus]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-white/60">

                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white/50 backdrop-blur-xl">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 tracking-tight">{title}</h3>
                        <p className="text-sm text-slate-500 mt-1">
                            Top Scores • {filteredTasks.length} tarefas filtradas (de {tasks.length})
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {statusOptions.length > 0 && (
                            <div className="relative group">
                                <div className="flex items-center gap-2 bg-slate-100/50 hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors">
                                    <Filter size={14} className="text-slate-400" />
                                    <select
                                        value={selectedStatus}
                                        onChange={(e) => setSelectedStatus(e.target.value)}
                                        className="bg-transparent text-sm text-slate-600 outline-none cursor-pointer appearance-none pr-4"
                                    >
                                        <option value="all">Todos os Status</option>
                                        {statusOptions.map(opt => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* List */}
                <div className="overflow-y-auto p-4 custom-scrollbar bg-slate-50/50 flex-1">
                    {filteredTasks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                            <p>Nenhuma tarefa encontrada.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredTasks.map((task, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => window.open('https://gama-talk.vercel.app/', '_blank')}
                                    className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm hover:shadow-md transition-all flex items-center gap-4 group cursor-pointer"
                                >
                                    {/* Rank/Index */}
                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0">
                                        #{idx + 1}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-semibold text-slate-800 truncate mb-1">
                                            {task.titulo || `Tarefa sem título #${task.id || idx}`}
                                        </h4>
                                        <div className="flex items-center gap-3 text-xs text-slate-500">
                                            <span className="flex items-center gap-1">
                                                <Calendar size={12} />
                                                {format(new Date(task.created_at), "d 'de' MMM", { locale: ptBR })}
                                            </span>
                                            <span className="px-1.5 py-0.5 rounded bg-slate-100 uppercase text-[10px] font-bold tracking-wider">
                                                {task.status}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Score */}
                                    <div className="flex flex-col items-end shrink-0">
                                        <div className={`px-2.5 py-1 rounded-lg font-bold text-sm flex items-center gap-1.5 ${(Number(task.score) || 0) > 0 ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-500'
                                            }`}>
                                            <Trophy size={14} />
                                            {Number(task.score) || 0}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-white border-t border-slate-100 text-xs text-center text-slate-400">
                    Ordenado pelo maior Score
                </div>
            </div>
        </div>
    );
};
