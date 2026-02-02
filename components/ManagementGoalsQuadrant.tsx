import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { ShieldCheck, BarChart3, TrendingUp, ArrowDownWideNarrow, ArrowUpNarrowWide } from 'lucide-react';
import { formatCurrency } from '../utils/dateUtils';

interface Management {
    id: string;
    sigla: string;
    descricao: string;
    porcentagem: number;
}

interface ManagementPerformance extends Management {
    target: number;
    realized: number;
    performance: number; // percentage
}

export const ManagementGoalsQuadrant: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [metaReceita, setMetaReceita] = useState<number>(0);
    const [performances, setPerformances] = useState<ManagementPerformance[]>([]);
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // 1. Fetch Total Company Goal
                const { data: metaData } = await supabase
                    .from('gama_meta')
                    .select('meta_receita')
                    .maybeSingle();

                const totalGoal = metaData?.meta_receita || 0;
                setMetaReceita(totalGoal);

                // 2. Fetch Management Definitions
                const { data: mgmts } = await supabase
                    .from('gerencias')
                    .select('*')
                    .order('descricao');

                if (!mgmts) return;

                // 3. Fetch Realized Revenue grouped by management
                const { data: realizedData } = await supabase
                    .from('gerencia_meta')
                    .select('gerencia, faturamento');

                // Process Data
                const computedPerformances = mgmts.map((mgmt: Management) => {
                    // Calculate Target for this management
                    const target = totalGoal * (mgmt.porcentagem / 100);

                    // Sum realized revenue for this management
                    // Assuming 'gerencia' in gerencia_meta matches 'sigla' (or similar identifier) in gerencias
                    // The user prompt implies matching logic. I will match by 'sigla' as it's a common identifier.
                    // If 'gerencia' column stores the ID, logic differs. 
                    // Given the prompt: "tabela 'gerencias' e colunas 'sigla' e 'descricao' (para pegar quais são as gerências)"
                    // and "tabela 'gerencia_meta'... e 'gerencia' (para saber qual gerência fez a meta)"
                    // I'll assume matching strictly by textual identifier is safer if IDs aren't explicit.
                    // Let's try matching by 'sigla' first as it is unique and short.
                    const realized = realizedData
                        ?.filter((item: any) => item.gerencia === mgmt.sigla || item.gerencia === mgmt.id)
                        .reduce((sum: number, item: any) => sum + (Number(item.faturamento) || 0), 0) || 0;

                    const performance = target > 0 ? (realized / target) * 100 : 0;

                    return {
                        ...mgmt,
                        target,
                        realized,
                        performance
                    };
                });

                setPerformances(computedPerformances);

            } catch (err) {
                console.error('Error fetching management goals data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();

        // Realtime Subscription Setup
        const channels = [
            supabase.channel('meta-changes')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'gama_meta' }, fetchData)
                .on('postgres_changes', { event: '*', schema: 'public', table: 'gerencias' }, fetchData)
                .on('postgres_changes', { event: '*', schema: 'public', table: 'gerencia_meta' }, fetchData)
                .subscribe()
        ];

        return () => {
            channels.forEach(ch => supabase.removeChannel(ch));
        };
    }, []);

    if (loading) {
        return (
            <div className="bg-white/60 backdrop-blur-xl p-6 rounded-3xl shadow-lg border border-white/50 animate-pulse h-[450px]">
                <div className="h-6 w-48 bg-slate-200 rounded mb-6"></div>
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-20 bg-slate-100 rounded-2xl"></div>
                    ))}
                </div>
            </div>
        );
    }

    const totalRealized = performances.reduce((sum, mgmt) => sum + mgmt.realized, 0);

    return (
        <div className="bg-white/60 backdrop-blur-xl p-8 rounded-3xl shadow-lg shadow-slate-200/50 border border-white/50 h-[450px] flex flex-col">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <ShieldCheck size={24} className="text-blue-500" />
                        Metas de Gerência
                    </h3>
                    <div className="mt-1 space-y-1">
                        <p className="text-xs text-slate-500">
                            Meta Global: <span className="font-bold text-slate-700">{formatCurrency(metaReceita)}</span>
                        </p>
                        <p className="text-xs text-slate-500">
                            Meta atingida: <span className={`font-bold ${totalRealized >= metaReceita ? 'text-emerald-600' : 'text-blue-600'}`}>
                                {formatCurrency(totalRealized)}
                                <span className="ml-1 opacity-70">
                                    ({metaReceita > 0 ? ((totalRealized / metaReceita) * 100).toFixed(1) : 0}%)
                                </span>
                            </span>
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                        className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-blue-500 transition-all flex items-center gap-1.5 border border-transparent hover:border-slate-200"
                        title={sortOrder === 'desc' ? "Menor para maior" : "Maior para menor"}
                    >
                        {sortOrder === 'desc' ? <ArrowDownWideNarrow size={18} /> : <ArrowUpNarrowWide size={18} />}
                        <span className="text-[10px] font-bold uppercase hidden sm:inline">
                            {sortOrder === 'desc' ? "Menor" : "Maior"}
                        </span>
                    </button>
                    <div className="p-2 bg-blue-50 text-blue-500 rounded-xl">
                        <TrendingUp size={20} />
                    </div>
                </div>
            </div>

            <div className="space-y-6 overflow-y-auto pr-2 custom-scrollbar flex-1">
                {performances.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-50">
                        <BarChart3 size={48} className="mb-2" />
                        <p className="text-sm">Nenhuma gerência configurada</p>
                    </div>
                ) : (
                    [...performances]
                        .sort((a, b) => sortOrder === 'desc' ? b.performance - a.performance : a.performance - b.performance)
                        .map((mgmt) => (
                            <div key={mgmt.sigla || mgmt.id} className="space-y-2">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-sm font-bold text-slate-700">{mgmt.descricao}</span>
                                            <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold">{mgmt.sigla}</span>
                                        </div>
                                        <div className="text-[11px] text-slate-400 font-medium">
                                            {formatCurrency(mgmt.realized)} <span className="text-slate-300">/ {formatCurrency(mgmt.target)}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className={`text-lg font-black ${mgmt.performance >= 100 ? 'text-emerald-500' : 'text-slate-800'}`}>
                                            {mgmt.performance.toFixed(1)}%
                                        </span>
                                        <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">da meta</p>
                                    </div>
                                </div>

                                <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden relative">
                                    {/* Target Marker/Background if needed, but simple bar is enough for basic request */}
                                    <div
                                        className={`h-full rounded-full transition-all duration-1000 ease-out flex items-center justify-end pr-1
                                        ${mgmt.performance >= 100
                                                ? 'bg-gradient-to-r from-emerald-400 to-emerald-600 shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                                                : 'bg-gradient-to-r from-blue-500 to-blue-600'
                                            }`}
                                        style={{ width: `${Math.min(100, mgmt.performance)}%` }}
                                    />
                                </div>
                                <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium px-0.5">
                                    <span>Contribuição esperada: {mgmt.porcentagem}%</span>
                                    {mgmt.performance >= 100 && (
                                        <span className="text-emerald-600 font-bold flex items-center gap-1">
                                            Meta Batida! (+{(mgmt.performance - 100).toFixed(1)}% extra) 🎉
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))
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
