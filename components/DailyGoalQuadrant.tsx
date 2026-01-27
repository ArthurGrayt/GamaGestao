import React, { useState, useEffect } from 'react';
import { Plus, Check, Trophy, Sparkles, Target, Trash2 } from 'lucide-react';

interface GoalItem {
    id: string;
    text: string;
    completed: boolean;
}

export const DailyGoalQuadrant: React.FC = () => {
    const [goals, setGoals] = useState<GoalItem[]>([]);
    const [newGoalText, setNewGoalText] = useState('');
    const [currentTime, setCurrentTime] = useState(new Date());


    const today = new Date().toISOString().split('T')[0];
    const STORAGE_KEY = `daily_goals_v2_${today}`;

    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            setGoals(JSON.parse(saved));
        }

        // Cleanup old versions and old dates
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith('daily_goal') && key !== STORAGE_KEY) {
                localStorage.removeItem(key);
            }
        }

        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, [STORAGE_KEY]);

    const save = (updatedGoals: GoalItem[]) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedGoals));
    };

    const addGoal = () => {
        if (!newGoalText.trim() || goals.length >= 5) return;
        const newGoal: GoalItem = {
            id: Date.now().toString(),
            text: newGoalText.trim(),
            completed: false
        };
        const updated = [...goals, newGoal];
        setGoals(updated);
        setNewGoalText('');
        save(updated);
    };

    const toggleGoal = (id: string) => {
        const updated = goals.map(g => g.id === id ? { ...g, completed: !g.completed } : g);
        setGoals(updated);
        save(updated);
    };

    const removeGoal = (id: string) => {
        const updated = goals.filter(g => g.id !== id);
        setGoals(updated);
        save(updated);
    };

    const currentHour = currentTime.getHours();
    const allCompleted = goals.length > 0 && goals.every(g => g.completed);
    const isCelebrating = allCompleted && currentHour >= 17;


    return (
        <div className={`
            relative p-5 rounded-3xl transition-all duration-700 border h-fit min-h-[280px] overflow-visible flex flex-col
            ${isCelebrating
                ? 'celebration-active'
                : 'bg-white/60 backdrop-blur-xl border-white/50 shadow-md shadow-slate-200/40'}
        `}>
            {/* Fireworks Particles */}
            {isCelebrating && (
                <div className="absolute inset-0 pointer-events-none overflow-visible">
                    {[...Array(8)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute firework-particle"
                            style={{
                                top: `${Math.random() * 100}%`,
                                left: `${Math.random() * 100}%`,
                                animationDelay: `${Math.random() * 3}s`
                            }}
                        >
                            <div className="w-1 h-1 bg-white rounded-full shadow-[0_0_8px_white,0_0_12px_#fbbf24]" />
                            <Sparkles size={8} className="text-white absolute -top-1 -left-1 opacity-50" />
                        </div>
                    ))}
                </div>
            )}

            {/* Minimalist Header */}
            <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="flex items-center gap-2">
                    <Target size={18} className={isCelebrating ? 'text-amber-500' : 'text-slate-400'} />
                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-tight">Metas do Dia</h3>
                </div>
                {goals.length > 0 && (
                    <span className="text-[10px] font-bold text-slate-400">
                        {goals.filter(g => g.completed).length}/{goals.length}
                    </span>
                )}
            </div>

            {/* List Area */}
            <div className="flex-1 space-y-2 mb-4 relative z-10">
                {goals.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-6 border-2 border-dashed border-slate-100 rounded-2xl opacity-40">
                        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Defina seu foco</p>
                    </div>
                ) : (
                    goals.map((goal) => (
                        <div key={goal.id} className="group flex items-center gap-3 p-2.5 rounded-xl bg-white/50 border border-white/80 hover:bg-white/90 transition-all">
                            <button
                                onClick={() => toggleGoal(goal.id)}
                                className={`
                                    w-5 h-5 rounded flex items-center justify-center transition-all border-2
                                    ${goal.completed
                                        ? 'bg-amber-500 border-amber-500 text-white'
                                        : 'border-slate-200 hover:border-amber-300 bg-white/50'}
                                `}
                            >
                                {goal.completed && <Check size={12} strokeWidth={4} />}
                            </button>
                            <span className={`text-xs font-medium flex-1 truncate ${goal.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                                {goal.text}
                            </span>
                            <button
                                onClick={() => removeGoal(goal.id)}
                                className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-red-400 transition-all"
                            >
                                <Trash2 size={12} />
                            </button>
                        </div>
                    ))
                )}
            </div>

            {/* Input Area (Bottom) */}
            {goals.length < 5 && (
                <div className="mt-auto pt-2 border-t border-slate-100/50 relative z-10">
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            placeholder="Nova meta..."
                            className="flex-1 bg-white/70 border border-slate-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-amber-400 transition-all"
                            value={newGoalText}
                            onChange={(e) => setNewGoalText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addGoal()}
                        />
                        <button
                            onClick={addGoal}
                            disabled={!newGoalText.trim()}
                            className="bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-800 disabled:opacity-30 transition-all flex items-center gap-1 shrink-0"
                        >
                            <Plus size={14} />
                            Criar
                        </button>
                    </div>
                </div>
            )}

            {/* Celebration Indicator */}
            {isCelebrating && (
                <div className="absolute top-2 right-2 flex gap-1 animate-pulse z-20">
                    <Sparkles size={14} className="text-amber-400" />
                    <Trophy size={14} className="text-amber-500" />
                </div>
            )}

            <style>{`
                @keyframes border-wave {
                    0% { border-color: #fbbf24; }
                    25% { border-color: #f59e0b; }
                    50% { border-color: #d97706; }
                    75% { border-color: #b45309; }
                    100% { border-color: #fbbf24; }
                }

                @keyframes bg-blink-smooth {
                    0%, 100% { background-color: rgba(255, 251, 235, 0.9); }
                    50% { background-color: rgba(254, 243, 199, 0.95); }
                }

                @keyframes firework-pop {
                    0% { transform: scale(0); opacity: 0; }
                    20% { opacity: 1; }
                    100% { transform: scale(1.5) translate(var(--tw-translate-x, 0), -5px); opacity: 0; }
                }


                .celebration-active {
                    animation: 
                        border-wave 3s linear infinite,
                        bg-blink-smooth 2s ease-in-out infinite;
                    border-width: 2px;
                    box-shadow: 0 0 20px rgba(245, 158, 11, 0.2);
                }

                .firework-particle {
                    animation: firework-pop 2s ease-out infinite;
                }
            `}</style>
        </div>
    );
};
