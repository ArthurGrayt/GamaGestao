import React, { useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { FilterContext } from '../layouts/MainLayout';
import { formatCurrency } from '../utils/dateUtils';
import { ShieldCheck, BarChart3 } from 'lucide-react';

interface Management {
    id: string; // Assuming id exists, if not we'll use sigla or descricao as fallback
    descricao: string;
    porcentagem: number;
    sigla: string;
}

export const ManagementGoalsQuadrant: React.FC = () => {
    const filter = useContext(FilterContext);
    const [loading, setLoading] = useState(true);
    const [metaReceita, setMetaReceita] = useState<number>(0);
    const [managements, setManagements] = useState<Management[]>([]);

    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true);
            try {
                // Fetch Meta
                const { data: metaData } = await supabase
                    .from('gama_meta')
                    .select('meta_receita')
                    .maybeSingle();

                if (metaData) {
                    setMetaReceita(metaData.meta_receita || 0);
                }

                // Fetch managements
                const { data: mgmtData } = await supabase
                    .from('gerencias')
                    .select('*')
                    .order('descricao', { ascending: true });

                if (mgmtData) {
                    setManagements(mgmtData);
                }
            } catch (err) {
                console.error('Error fetching management goals:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();

        // Subscribe to real-time changes
        const metaChannel = supabase
            .channel('public:gama_meta_realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'gama_meta' }, (payload) => {
                if (payload.new && 'meta_receita' in payload.new) {
                    setMetaReceita(payload.new.meta_receita);
                }
            })
            .subscribe();

        const mgmtChannel = supabase
            .channel('public:gerencias_realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'gerencias' }, (payload) => {
                const { eventType, new: newRecord, old: oldRecord } = payload;
                if (eventType === 'INSERT') {
                    setManagements(prev => [...prev, newRecord as Management].sort((a, b) => a.descricao.localeCompare(b.descricao)));
                } else if (eventType === 'UPDATE') {
                    setManagements(prev => prev.map(m =>
                        (m.id && m.id === newRecord.id) || (m.sigla === newRecord.sigla)
                            ? { ...m, ...newRecord }
                            : m
                    ));
                } else if (eventType === 'DELETE') {
                    setManagements(prev => prev.filter(m =>
                        (m.id && m.id !== oldRecord.id) || (m.sigla !== oldRecord.sigla)
                    ));
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(metaChannel);
            supabase.removeChannel(mgmtChannel);
        };
    }, []);

    if (loading) {
        return (
            <div className="bg-white/60 backdrop-blur-xl p-6 rounded-3xl shadow-lg border border-white/50 animate-pulse h-[450px]">
                <div className="h-6 w-48 bg-slate-200 rounded mb-6"></div>
                <div className="space-y-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-16 bg-slate-100 rounded-2xl"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white/60 backdrop-blur-xl p-8 rounded-3xl shadow-lg shadow-slate-200/50 border border-white/50 h-[450px] flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <ShieldCheck size={24} className="text-blue-500" />
                        Metas de Gerência
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">Desempenho por gerência em tempo real</p>
                </div>
                <div className="bg-blue-600 shadow-md shadow-blue-200 text-white px-4 py-2 rounded-2xl text-xs font-bold border border-blue-500/20 whitespace-nowrap">
                    Meta: {formatCurrency(metaReceita)}
                </div>
            </div>

            <div className="space-y-5 overflow-y-auto pr-2 custom-scrollbar flex-1">
                {managements.map((mgmt, idx) => {
                    const achievedValue = (mgmt.porcentagem / 100) * metaReceita;
                    const colorGradients = [
                        'from-blue-500 to-blue-600',
                        'from-indigo-500 to-indigo-600',
                        'from-purple-500 to-purple-600',
                        'from-cyan-500 to-cyan-600',
                        'from-teal-500 to-teal-600',
                    ];
                    const gradient = colorGradients[idx % colorGradients.length];

                    return (
                        <div key={mgmt.id || mgmt.sigla} className="bg-white/40 border border-white/60 p-4 rounded-2xl hover:bg-white/60 transition-all duration-300">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex gap-3">
                                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-blue-100`}>
                                        {mgmt.sigla}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-700">{mgmt.descricao}</p>
                                        <p className="text-[11px] text-slate-500 font-medium">
                                            {formatCurrency(achievedValue)} realizados
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-lg font-black text-slate-800 leading-none">{mgmt.porcentagem}%</div>
                                    <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 tracking-wider text-right">Atingido</p>
                                </div>
                            </div>

                            <div className="relative h-2 w-full bg-slate-200/50 rounded-full overflow-hidden">
                                <div
                                    className={`absolute top-0 left-0 h-full bg-gradient-to-r ${gradient} rounded-full transition-all duration-1000 ease-out`}
                                    style={{ width: `${Math.min(100, mgmt.porcentagem)}%` }}
                                />
                            </div>
                        </div>
                    );
                })}

                {managements.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                        <BarChart3 size={48} className="opacity-10 mb-4" />
                        <p className="text-sm font-medium">Nenhum dado de gerência disponível</p>
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
