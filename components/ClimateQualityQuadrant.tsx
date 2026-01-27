import React, { useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { FilterContext } from '../layouts/MainLayout';
import { getUTCStart, getUTCEnd } from '../utils/dateUtils';
import { Users, Server, Activity, AlertTriangle, CheckCircle, MessageSquare, Clock } from 'lucide-react';

interface AttendantVolume {
    userId: string;
    username: string;
    count: number;
    avgWaitTime: string;
    breakdown: string; // e.g. "5 Exames, 2 Consultas"
}

export const ClimateQualityQuadrant: React.FC = () => {
    const filter = useContext(FilterContext);
    const [loading, setLoading] = useState(true);
    const [workload, setWorkload] = useState<AttendantVolume[]>([]);
    const [dailyAtendimentos, setDailyAtendimentos] = useState<any[]>([]);
    const [agendamentosMap, setAgendamentosMap] = useState<Map<number, any>>(new Map());
    const [selectedUser, setSelectedUser] = useState<AttendantVolume | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [statusColor, setStatusColor] = useState<'green' | 'yellow' | 'red'>('green');
    const [statusReason, setStatusReason] = useState<string>('');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const startDate = getUTCStart(filter.startDate);
                const endDate = getUTCEnd(filter.endDate);

                // Daily range for Volume de Atendimento
                const todayStart = getUTCStart(new Date());
                const todayEnd = getUTCEnd(new Date());

                // 1. Volume por Atendimento (DAILY ONLY)
                const { data: atDataDaily, error: atError } = await supabase
                    .from('atendimentos')
                    .select('*, users(username)')
                    .gte('created_at', todayStart)
                    .lt('created_at', todayEnd);

                if (atError) throw atError;
                setDailyAtendimentos(atDataDaily || []);

                // Fetch details for daily agendamentos with JOINs
                const agIdsDaily = atDataDaily?.map((a: any) => a.agendamento_id).filter(Boolean) || [];
                let aMap = new Map();

                if (agIdsDaily.length > 0) {
                    const { data: agDetails } = await supabase
                        .from('agendamentos')
                        .select(`
                            id, 
                            tipo, 
                            status, 
                            exames_snapshot, 
                            consultorio,
                            compareceu,
                            colaboradores(nome),
                            unidades(nome_unidade)
                        `)
                        .in('id', agIdsDaily);

                    aMap = new Map(agDetails?.map(a => [a.id, a]));
                    setAgendamentosMap(aMap);
                }

                // Group by user
                const userStats: Record<string, { userId: string; count: number; totalWaitTime: number; username: string; types: Record<string, number> }> = {};

                atDataDaily?.forEach((at: any) => {
                    const userId = at.user_id;
                    const username = at.users?.username || 'Desconhecido';

                    if (!userStats[userId]) {
                        userStats[userId] = { userId, count: 0, totalWaitTime: 0, username, types: {} };
                    }

                    userStats[userId].count += 1;

                    if (at.chamou_em && at.finalizou_em) {
                        const start = new Date(at.chamou_em).getTime();
                        const end = new Date(at.finalizou_em).getTime();
                        const diffMinutes = (end - start) / (1000 * 60);
                        if (diffMinutes > 0) {
                            userStats[userId].totalWaitTime += diffMinutes;
                        }
                    }

                    const agendamento = aMap.get(at.agendamento_id);
                    if (agendamento) {
                        const type = agendamento.tipo || 'Outros';
                        userStats[userId].types[type] = (userStats[userId].types[type] || 0) + 1;
                    }
                });

                const workloadResult = Object.values(userStats)
                    .map(stat => {
                        const avg = stat.count > 0 ? stat.totalWaitTime / stat.count : 0;
                        const minutes = Math.floor(avg);
                        const seconds = Math.round((avg - minutes) * 60);

                        const sortedTypes = Object.entries(stat.types).sort((a, b) => b[1] - a[1]);
                        const breakdown = sortedTypes.slice(0, 2).map(([type, count]) => `${count} ${type}`).join(', ');

                        return {
                            userId: stat.userId,
                            username: stat.username,
                            count: stat.count,
                            avgWaitTime: `${minutes}m ${seconds}s`,
                            breakdown
                        };
                    })
                    .sort((a, b) => b.count - a.count);

                setWorkload(workloadResult);

                // 2. Logic for Traffic Light (Semáforo)
                // We'll fetch external dependencies for the rules
                const [
                    { data: recettes },
                    { data: _despesas },
                    { data: agendamentos },
                    { data: docSeg }
                ] = await Promise.all([
                    supabase.from('financeiro_receitas').select('valor_total, data_projetada').gte('data_projetada', startDate).lt('data_projetada', endDate),
                    supabase.from('financeiro_despesas').select('valor, data_projetada').gte('data_projetada', startDate).lt('data_projetada', endDate),
                    supabase.from('agendamentos').select('data_atendimento, aso_liberado, chegou_em').gte('data_atendimento', startDate).lt('data_atendimento', endDate),
                    supabase.from('doc_seg').select('status').gte('created_at', startDate).lt('created_at', endDate)
                ]);

                // Calculations
                const totalReceita = recettes?.reduce((acc, r) => acc + (Number(r.valor_total) || 0), 0) || 0;
                const faturamentoBruto = recordsProjected(recettes) || 1;
                const inadimplencia = ((faturamentoBruto - totalReceita) / faturamentoBruto) * 100;

                const slaTotal = agendamentos?.filter(a => a.aso_liberado).reduce((acc, a) => {
                    const diff = new Date(a.aso_liberado).getTime() - new Date(a.data_atendimento).getTime();
                    return acc + (diff / (1000 * 60 * 60));
                }, 0) || 0;
                const slaAvg = (agendamentos?.filter(a => a.aso_liberado).length || 0) > 0 ? slaTotal / agendamentos!.filter(a => a.aso_liberado).length : 0;

                const pendingDocs = docSeg?.filter(d => d.status === 'Pendente' || d.status === 'em Andamento').length || 0;

                const hasAtradoGrande = agendamentos?.some(a => {
                    if (!a.chegou_em) return false;
                    const diff = (new Date().getTime() - new Date(a.chegou_em).getTime()) / (1000 * 60);
                    return diff > 15; // Placeholder for "atrasos de 15 minutos na entrada"
                }) || false;

                // Decision Logic
                if (pendingDocs > 20 || hasAtradoGrande) {
                    setStatusColor('yellow');
                    setStatusReason(pendingDocs > 20 ? 'Mais de 20 documentos pendentes' : 'Atrasos de 15min na entrada');
                } else if (slaAvg < 48 && inadimplencia < 5) {
                    setStatusColor('green');
                    setStatusReason('Operação Saudável: SLA < 48h e Inadimplência < 5%');
                } else {
                    setStatusColor('green');
                    setStatusReason('Estabilidade Operacional');
                }

            } catch (err) {
                console.error('Error fetching quality data:', err);
                setStatusColor('red');
                setStatusReason('Erro crítico: Falha na conexão ou Sistema Indisponível');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [filter]);

    const recordsProjected = (data: any[] | null) => data?.reduce((acc, r) => acc + (Number(r.valor_total) || 0), 0) || 0;

    return (
        <>
            <div className="bg-white/60 backdrop-blur-xl p-8 rounded-3xl shadow-lg shadow-slate-200/50 border border-white/50 h-full flex flex-col">
                <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <Activity size={24} className="text-emerald-500" />
                    Clima e Qualidade
                </h3>

                <div className="flex-1 space-y-6">
                    {/* Volume por Atendente */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            <span>Volume de Atendimento</span>
                            <MessageSquare size={14} />
                        </div>
                        <div className="space-y-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                            {loading ? (
                                [1, 2].map(i => <div key={i} className="h-10 bg-slate-100 rounded-xl animate-pulse"></div>)
                            ) : workload.length > 0 ? (
                                workload.map((at, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => {
                                            setSelectedUser(at);
                                            setShowModal(true);
                                        }}
                                        className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 transition-all hover:bg-slate-100/50 cursor-pointer group"
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-blue-400 group-hover:scale-125 transition-transform"></div>
                                            <div>
                                                <span className="text-xs font-bold text-slate-700 block">{at.username}</span>
                                                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                                    <Clock size={10} /> {at.avgWaitTime}
                                                    <span className="mx-1">•</span>
                                                    <span className="truncate max-w-[80px]" title={at.breakdown}>{at.breakdown}</span>
                                                </span>
                                            </div>
                                        </div>
                                        <span className="text-xs font-black text-blue-600 group-hover:translate-x-[-4px] transition-transform">{at.count} <span className="text-[10px] text-slate-400 font-normal">atend.</span></span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-slate-400 text-center py-4">Nenhum atendimento no período.</p>
                            )}
                        </div>
                    </div>

                    {/* Disponibilidade do Sistema */}
                    <div className="p-4 rounded-2xl bg-slate-900 text-white flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/10 rounded-lg text-blue-400">
                                <Server size={18} />
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-bold tracking-widest opacity-50">Status do Sistema</p>
                                <p className="text-sm font-bold">100% Operacional</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/20">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                            <span className="text-[10px] font-black uppercase">Online</span>
                        </div>
                    </div>

                    {/* Semáforo de Satisfação */}
                    <div className="flex-1 flex flex-col justify-center items-center py-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                        <div className="flex gap-4 mb-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 shadow-lg ${statusColor === 'red' ? 'bg-red-500 ring-4 ring-red-100 scale-110 shadow-red-200' : 'bg-red-200/30'}`}>
                                <AlertTriangle size={18} className={statusColor === 'red' ? 'text-white' : 'text-slate-300'} />
                            </div>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 shadow-lg ${statusColor === 'yellow' ? 'bg-yellow-400 ring-4 ring-yellow-100 scale-110 shadow-yellow-200' : 'bg-yellow-100/30'}`}>
                                <AlertTriangle size={18} className={statusColor === 'yellow' ? 'text-white' : 'text-slate-300'} />
                            </div>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 shadow-lg ${statusColor === 'green' ? 'bg-emerald-500 ring-4 ring-emerald-100 scale-110 shadow-emerald-200' : 'bg-emerald-100/30'}`}>
                                <CheckCircle size={18} className={statusColor === 'green' ? 'text-white' : 'text-slate-300'} />
                            </div>
                        </div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Satisfação & Clima</p>
                        <p className={`text-xs font-bold text-center px-4 ${statusColor === 'red' ? 'text-red-600' : statusColor === 'yellow' ? 'text-yellow-700' : 'text-emerald-600'}`}>
                            {statusReason || 'Carregando indicadores...'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Modal de Detalhes */}
            {showModal && selectedUser && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h4 className="text-lg font-bold text-slate-800">Detalhes de Atendimento</h4>
                                <p className="text-xs text-slate-500">Colaborador: <span className="font-bold text-blue-600">{selectedUser.username}</span></p>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x text-slate-500"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                            {dailyAtendimentos
                                .filter(a => a.user_id === selectedUser.userId)
                                .map((a, i) => {
                                    const agenda = agendamentosMap.get(a.agendamento_id);
                                    const hasStarted = !!a.chamou_em;
                                    const hasFinished = !!a.finalizou_em;
                                    const waitTime = hasStarted && hasFinished
                                        ? Math.round((new Date(a.finalizou_em).getTime() - new Date(a.chamou_em).getTime()) / (1000 * 60))
                                        : null;

                                    return (
                                        <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${agenda?.tipo === 'Exame' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
                                                            }`}>
                                                            {agenda?.tipo || 'N/A'}
                                                        </span>
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${agenda?.compareceu ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                                                            }`}>
                                                            {agenda?.compareceu ? 'Presente' : 'Ausente'}
                                                        </span>
                                                    </div>
                                                    <h5 className="text-sm font-bold text-slate-700">
                                                        {agenda?.colaboradores?.nome || 'Paciente Desconhecido'}
                                                    </h5>
                                                    <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                                                        <Activity size={10} className="text-blue-400" />
                                                        {agenda?.unidades?.nome_unidade || 'Empresa não informada'}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Tempo Atendimento</p>
                                                    <p className="text-sm font-black text-blue-600">
                                                        {waitTime !== null ? `${waitTime} min` : (hasStarted ? 'Em andamento' : 'Aguardando')}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 text-[11px] py-2 border-y border-slate-200/50 border-dashed">
                                                <div className="space-y-1">
                                                    <p className="text-slate-400 font-medium">Chamado em: <span className="text-slate-600 font-bold">{a.chamou_em ? new Date(a.chamou_em).toLocaleTimeString('pt-BR') : '-'}</span></p>
                                                    <p className="text-slate-400 font-medium">Finalizado em: <span className="text-slate-600 font-bold">{a.finalizou_em ? new Date(a.finalizou_em).toLocaleTimeString('pt-BR') : '-'}</span></p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-slate-400 font-medium">Status: <span className="text-emerald-600 font-bold uppercase">{agenda?.consultorio || 'N/A'}</span></p>
                                                    <p className="text-slate-400 font-medium">Atendimento ID: <span className="text-slate-500 font-mono">#{a.id}</span></p>
                                                </div>
                                            </div>

                                            {agenda?.exames_snapshot && Array.isArray(agenda.exames_snapshot) && agenda.exames_snapshot.length > 0 && (
                                                <div className="pt-1">
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2">Exames & Procedimentos</p>
                                                    <div className="flex flex-wrap gap-1">
                                                        {agenda.exames_snapshot.map((ex: string, j: number) => (
                                                            <span key={j} className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-[9px] text-slate-600 font-medium shadow-sm hover:border-blue-200 transition-colors">
                                                                {ex}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            {dailyAtendimentos.filter(a => a.user_id === selectedUser.userId).length === 0 && (
                                <p className="text-center text-slate-400 py-8">Nenhum detalhe encontrado.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

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
        </>
    );
};
