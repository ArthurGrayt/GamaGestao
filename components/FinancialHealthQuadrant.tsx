import React, { useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { FilterContext } from '../layouts/MainLayout';
import { getUTCStart, getUTCEnd, formatCurrency } from '../utils/dateUtils';
import { TrendingUp, TrendingDown, Clock, Activity, Ticket, AlertCircle } from 'lucide-react';

export const FinancialHealthQuadrant: React.FC = () => {
    const filter = useContext(FilterContext);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        retencao: 0,
        faturamentoBruto: 0,
        faturamentoRecebido: 0,
        prazoMedio: 0,
        recuperacaoPassivo: 0,
        ticketMedio: 0
    });

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const startDate = getUTCStart(filter.startDate);
                const endDate = getUTCEnd(filter.endDate);

                // 1. Retention (Receitas - Despesas)
                const { data: receitas } = await supabase
                    .from('financeiro_receitas')
                    .select('valor_total, data_executada, data_projetada, contratante')
                    .gte('data_executada', startDate)
                    .lt('data_executada', endDate);

                const { data: despesas } = await supabase
                    .from('financeiro_despesas')
                    .select('valor, data_projetada, data_executada')
                    .gte('data_projetada', startDate)
                    .lt('data_projetada', endDate);

                const totalReceita = receitas?.reduce((acc, r) => acc + (Number(r.valor_total) || 0), 0) || 0;
                const totalDespesa = despesas?.reduce((acc, d) => acc + (Number(d.valor) || 0), 0) || 0;
                const retencao = totalReceita - totalDespesa;

                // 2. Faturamento Bruto X Recebido
                // Bruto: based on data_projetada (expected)
                // Recebido: based on data_executada (actual)
                const { data: receitasBruto } = await supabase
                    .from('financeiro_receitas')
                    .select('valor_total')
                    .gte('data_projetada', startDate)
                    .lt('data_projetada', endDate);

                const faturamentoBruto = receitasBruto?.reduce((acc, r) => acc + (Number(r.valor_total) || 0), 0) || 0;
                const faturamentoRecebido = totalReceita; // Already filtered by data_executada in step 1

                // 3. Prazo Médio de Recebimento
                // Using financeiro_despesas as requested (data_executada - data_projetada)
                const despesasComPagamento = despesas?.filter(d => d.data_executada && d.data_projetada) || [];
                let totalDias = 0;
                despesasComPagamento.forEach(d => {
                    const diff = new Date(d.data_executada).getTime() - new Date(d.data_projetada).getTime();
                    totalDias += Math.max(0, diff / (1000 * 60 * 60 * 24));
                });
                const prazoMedio = despesasComPagamento.length > 0 ? totalDias / despesasComPagamento.length : 0;

                // 4. Recuperação de Passivo
                // Receitas in current month where debt was overdue by > 30 days (expected date < current month start - 30 days)
                const thirtyDaysAgo = new Date(filter.startDate);
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                const thirtyDaysAgoISO = getUTCStart(thirtyDaysAgo);

                const recuperacaoPassivo = receitas?.filter(r => {
                    if (!r.data_projetada) return false;
                    return r.data_projetada < thirtyDaysAgoISO;
                }).reduce((acc, r) => acc + (Number(r.valor_total) || 0), 0) || 0;

                // 5. Ticket Médio
                const uniqueClients = new Set(receitas?.map(r => r.contratante).filter(Boolean));
                const ticketMedio = uniqueClients.size > 0 ? totalReceita / uniqueClients.size : 0;

                setStats({
                    retencao,
                    faturamentoBruto,
                    faturamentoRecebido,
                    prazoMedio,
                    recuperacaoPassivo,
                    ticketMedio
                });

            } catch (err) {
                console.error('Error fetching financial health data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [filter]);

    if (loading) {
        return (
            <div className="bg-white/60 backdrop-blur-xl p-6 rounded-3xl shadow-lg border border-white/50 animate-pulse">
                <div className="h-6 w-48 bg-slate-200 rounded mb-6"></div>
                <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="h-12 bg-slate-100 rounded-xl"></div>
                    ))}
                </div>
            </div>
        );
    }

    const gapInadimplencia = stats.faturamentoBruto > 0
        ? ((stats.faturamentoBruto - stats.faturamentoRecebido) / stats.faturamentoBruto) * 100
        : 0;

    return (
        <div className="bg-white/60 backdrop-blur-xl p-8 rounded-3xl shadow-lg shadow-slate-200/50 border border-white/50 h-full">
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Activity size={24} className="text-blue-500" />
                Saúde Financeira
            </h3>

            <div className="space-y-6">
                {/* Retenção de Valor */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 transition-all hover:shadow-md">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${stats.retencao >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                            {stats.retencao >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Retenção de Valor</p>
                            <p className={`text-lg font-bold ${stats.retencao >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(stats.retencao)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* GAP de Inadimplência */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 transition-all hover:shadow-md">
                    <div className="flex justify-between items-start mb-3">
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Faturamento (Bruto x Recebido)</p>
                            <p className="text-lg font-bold text-slate-800">
                                {formatCurrency(stats.faturamentoRecebido)} <span className="text-sm font-normal text-slate-400">/ {formatCurrency(stats.faturamentoBruto)}</span>
                            </p>
                        </div>
                        <div className={`px-2 py-1 rounded-lg text-xs font-bold ${gapInadimplencia > 10 ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                            GAP: {gapInadimplencia.toFixed(1)}%
                        </div>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-1000 ${gapInadimplencia > 10 ? 'bg-red-500' : 'bg-blue-500'}`}
                            style={{ width: `${Math.min(100, (stats.faturamentoRecebido / (stats.faturamentoBruto || 1)) * 100)}%` }}
                        ></div>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Prazo Médio */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 transition-all hover:shadow-md">
                        <div className="flex items-center gap-3 mb-1">
                            <Clock size={16} className="text-purple-500" />
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Prazo Médio</p>
                        </div>
                        <p className="text-xl font-bold text-slate-800">{stats.prazoMedio.toFixed(1)} <span className="text-sm font-normal text-slate-500">dias</span></p>
                    </div>

                    {/* Recuperação de Passivo */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 transition-all hover:shadow-md">
                        <div className="flex items-center gap-3 mb-1">
                            <AlertCircle size={16} className="text-orange-500" />
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Recuperação</p>
                        </div>
                        <p className="text-xl font-bold text-slate-800">{formatCurrency(stats.recuperacaoPassivo)}</p>
                    </div>
                </div>

                {/* Ticket Médio */}
                <div className="p-4 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200 transition-all hover:scale-[1.02]">
                    <div className="flex items-center gap-3 mb-1">
                        <Ticket size={18} />
                        <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Ticket Médio p/ Cliente</p>
                    </div>
                    <p className="text-2xl font-bold">{formatCurrency(stats.ticketMedio)}</p>
                </div>
            </div>
        </div>
    );
};
