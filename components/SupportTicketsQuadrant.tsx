
import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { MessageSquare, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface ResponsibleStats {
    name: string;
    completed: number;
}

export const SupportTicketsQuadrant: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<ResponsibleStats[]>([]);
    const [hasWaiting, setHasWaiting] = useState(false);

    useEffect(() => {
        const fetchChamados = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('chamados')
                    .select('status, responsavel');

                if (error) throw error;

                if (data) {
                    // Group by responsible for COMPLETED tickets
                    const respMap: Record<string, number> = {};
                    let waiting = false;

                    data.forEach(ch => {
                        if (ch.status === 'Concluído') {
                            const resp = ch.responsavel || 'Não atribuído';
                            respMap[resp] = (respMap[resp] || 0) + 1;
                        } else {
                            // Any status other than 'Concluído' is considered waiting/in-progress
                            waiting = true;
                        }
                    });

                    const statsResult = Object.entries(respMap)
                        .map(([name, completed]) => ({ name, completed }))
                        .sort((a, b) => b.completed - a.completed);

                    setStats(statsResult);
                    setHasWaiting(waiting);
                }
            } catch (err) {
                console.error('Error fetching chamados:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchChamados();
    }, []);

    return (
        <div className="bg-white/60 backdrop-blur-xl p-8 rounded-3xl shadow-lg shadow-slate-200/50 border border-white/50 h-full flex flex-col">
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <MessageSquare size={24} className="text-blue-500" />
                Chamados de Suporte
            </h3>

            <div className="flex-1 space-y-6">
                {/* Atendidos por Responsável */}
                <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        <span>Chamados Atendidos</span>
                        <CheckCircle size={14} className="text-emerald-500" />
                    </div>
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                        {loading ? (
                            [1, 2].map(i => <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse"></div>)
                        ) : stats.length > 0 ? (
                            stats.map((s, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 transition-all hover:bg-slate-100/50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                                            {s.name.charAt(0)}
                                        </div>
                                        <span className="text-xs font-bold text-slate-700">{s.name}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs font-black text-blue-600">{s.completed}</span>
                                        <span className="text-[10px] text-slate-400 block font-normal">atendidos</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-xs text-slate-400 text-center py-4">Nenhum chamado concluído.</p>
                        )}
                    </div>
                </div>

                {/* Status de Aguardo */}
                <div className={`p-4 rounded-2xl flex items-center justify-between transition-colors ${hasWaiting ? 'bg-amber-50 border border-amber-100' : 'bg-emerald-50 border border-emerald-100'}`}>
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${hasWaiting ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                            {hasWaiting ? <Clock size={18} /> : <CheckCircle size={18} />}
                        </div>
                        <div>
                            <p className="text-[10px] uppercase font-bold tracking-widest opacity-60">Fila de Espera</p>
                            <p className={`text-sm font-bold ${hasWaiting ? 'text-amber-700' : 'text-emerald-700'}`}>
                                {hasWaiting ? 'Há chamados aguardando' : 'Tudo em dia!'}
                            </p>
                        </div>
                    </div>
                    {hasWaiting && (
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 text-amber-600 rounded-full border border-amber-500/20">
                            <AlertCircle size={12} />
                            <span className="text-[10px] font-black uppercase tracking-tighter">Pendente</span>
                        </div>
                    )}
                </div>
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
