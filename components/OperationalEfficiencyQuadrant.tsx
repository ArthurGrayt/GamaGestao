import React, { useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { FilterContext } from '../layouts/MainLayout';
import { getUTCStart, getUTCEnd } from '../utils/dateUtils';
import { Timer, ClipboardList, RefreshCw, X, FileText, Info } from 'lucide-react';

export const OperationalEfficiencyQuadrant: React.FC = () => {
    const filter = useContext(FilterContext);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        slaAvg: 0,
        backlogCount: 0,
        reworkRate: 0,
        pendingDocs: [] as any[]
    });

    const [showModal, setShowModal] = useState(false);
    const [lastReviewDate, setLastReviewDate] = useState<Date | null>(null);

    useEffect(() => {
        // Load last review date from localStorage
        const storedDate = localStorage.getItem('op_efficiency_last_review');
        if (storedDate) {
            setLastReviewDate(new Date(storedDate));
        } else {
            // If never reviewed, set it to a date in the past to trigger the alert initially
            const defaultDate = new Date();
            defaultDate.setDate(defaultDate.getDate() - 10);
            setLastReviewDate(defaultDate);
        }
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const startDate = getUTCStart(filter.startDate);
                const endDate = getUTCEnd(filter.endDate);

                // 1. SLA Logic (agendamentos)
                // Filter by consultorio is not null (meaning attended)
                const { data: agendamentos } = await supabase
                    .from('agendamentos')
                    .select('data_atendimento, aso_liberado')
                    .not('consultorio', 'is', null)
                    .not('aso_liberado', 'is', null)
                    .gte('data_atendimento', startDate)
                    .lt('data_atendimento', endDate);

                let totalTime = 0;
                let countSLA = 0;

                agendamentos?.forEach(a => {
                    const start = new Date(a.data_atendimento).getTime();
                    const end = new Date(a.aso_liberado).getTime();
                    if (end > start) {
                        totalTime += (end - start);
                        countSLA++;
                    }
                });

                const slaAvg = countSLA > 0 ? (totalTime / countSLA) / (1000 * 60 * 60 * 24) : 0; // Average days

                // 2. Backlog and Rework Logic (doc_seg)
                const { data: docs } = await supabase
                    .from('doc_seg')
                    .select('*')
                    .gte('created_at', startDate)
                    .lt('created_at', endDate);

                const pendingDocs = docs?.filter(d => d.status === 'Pendente' || d.status === 'em Andamento') || [];
                const backlogCount = pendingDocs.length;

                // Rework logic: doc has data_entrega (was once finished/delivered) but status is back to Pendente/Andamento
                const reworkDocs = docs?.filter(d =>
                    d.data_entrega &&
                    (d.status === 'Pendente' || d.status === 'em Andamento')
                ) || [];

                const reworkRate = docs && docs.length > 0 ? (reworkDocs.length / docs.length) * 100 : 0;

                setStats({
                    slaAvg,
                    backlogCount,
                    reworkRate,
                    pendingDocs
                });

            } catch (err) {
                console.error('Error fetching operational efficiency data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [filter]);

    const handleBacklogClick = () => {
        const now = new Date();
        setLastReviewDate(now);
        localStorage.setItem('op_efficiency_last_review', now.toISOString());
        setShowModal(true);
    };

    // Check if backlog needs attention (more than 7 days since last review)
    const needsAttention = lastReviewDate ? (new Date().getTime() - lastReviewDate.getTime()) > (7 * 24 * 60 * 60 * 1000) : false;

    if (loading) {
        return (
            <div className="bg-white/60 backdrop-blur-xl p-8 rounded-3xl shadow-lg border border-white/50 animate-pulse">
                <div className="h-6 w-48 bg-slate-200 rounded mb-6"></div>
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-24 bg-slate-100 rounded-2xl"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white/60 backdrop-blur-xl p-8 rounded-3xl shadow-lg shadow-slate-200/50 border border-white/50 h-full relative overflow-hidden">
            {/* Background dynamic light effect for attention */}
            {needsAttention && (
                <div className="absolute inset-0 border-2 border-red-500/50 rounded-3xl pointer-events-none animate-pulse-slow"></div>
            )}

            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Timer size={24} className="text-purple-500" />
                Eficiência Operacional
            </h3>

            <div className="space-y-6">
                {/* Lead Time / SLA */}
                <div className="p-5 rounded-2xl bg-white/40 border border-white/40 shadow-sm transition-all hover:shadow-md hover:bg-white/60 group">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-purple-100 text-purple-600 group-hover:scale-110 transition-transform">
                                <Timer size={20} />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">SLA de Entrega</p>
                                <p className="text-sm text-slate-400 capitalize">Lead Time Médio</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-bold text-slate-800">{stats.slaAvg.toFixed(1)} <span className="text-sm font-normal text-slate-500">dias</span></p>
                        </div>
                    </div>
                </div>

                {/* Backlog */}
                <div
                    onClick={handleBacklogClick}
                    className={`p-5 rounded-2xl cursor-pointer transition-all hover:scale-[1.02] shadow-sm transform relative group
                        ${needsAttention
                            ? 'bg-red-50 border-red-200 hover:bg-red-100 shadow-red-100'
                            : 'bg-orange-50 border-orange-100 hover:bg-orange-100 shadow-orange-100'}`}
                >
                    {needsAttention && (
                        <span className="absolute -top-2 -right-2 flex h-4 w-4">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
                        </span>
                    )}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-xl ${needsAttention ? 'bg-red-200 text-red-600' : 'bg-orange-200 text-orange-600'}`}>
                                <ClipboardList size={20} />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Backlog de Pendências</p>
                                <div className="flex items-center gap-1">
                                    <p className="text-sm text-slate-400">Volumes parados</p>
                                    <Info size={12} className="text-slate-300" />
                                </div>
                            </div>
                        </div>
                        <p className={`text-3xl font-black ${needsAttention ? 'text-red-600' : 'text-orange-600'}`}>
                            {stats.backlogCount}
                        </p>
                    </div>
                </div>

                {/* Retrabalho */}
                <div className="p-5 rounded-2xl bg-blue-50 border border-blue-100 transition-all hover:shadow-md hover:bg-blue-100/50 group">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-blue-100 text-blue-600 group-hover:rotate-12 transition-transform">
                                <RefreshCw size={20} />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Taxa de Retrabalho</p>
                                <p className="text-sm text-slate-400">Documentos corrigidos</p>
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-blue-600">{stats.reworkRate.toFixed(1)}%</p>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-1.5 overflow-hidden">
                        <div
                            className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                            style={{ width: `${stats.reworkRate}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* Backlog Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800">Detalhes do Backlog</h3>
                                <p className="text-sm text-slate-500">Lista de documentos com pendências</p>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-red-500 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                            {stats.pendingDocs.length === 0 ? (
                                <div className="text-center py-12 text-slate-400">
                                    <FileText size={48} className="mx-auto mb-4 opacity-10" />
                                    <p>Nenhuma pendência encontrada.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {stats.pendingDocs.map((doc, idx) => (
                                        <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-blue-300 transition-all">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-blue-50 rounded-lg text-blue-500">
                                                    <FileText size={18} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-700">{doc.doc || 'Documento sem nome'}</p>
                                                    <p className="text-xs text-slate-500">{doc.empresa} • {doc.status}</p>
                                                </div>
                                            </div>
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${doc.status === 'em Andamento' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
                                                {doc.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="p-4 bg-white border-t border-slate-100 text-center">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-6 py-2 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors"
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes pulse-slow {
                    0%, 100% { opacity: 0.3; }
                    50% { opacity: 0.8; }
                }
                .animate-pulse-slow {
                    animation: pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
            `}</style>
        </div>
    );
};
