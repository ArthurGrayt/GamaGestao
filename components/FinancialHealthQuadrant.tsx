import React, { useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { FilterContext } from '../layouts/MainLayout';
import { getUTCStart, getUTCEnd, formatCurrency } from '../utils/dateUtils';
import { TrendingUp, TrendingDown, Clock, Activity, Ticket, AlertCircle } from 'lucide-react';

export const FinancialHealthQuadrant: React.FC = () => {
    const filter = useContext(FilterContext);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        faturamentoLiquido: 0, // Now: Receitas (Executada) - Despesas (Projetada)
        faturamentoTotal: 0,   // Now: Receitas (Executada)
        prazoMedio: 0,
        recuperacaoPassivo: 0,
        ticketMedio: 0,
        totalDespesas: 0       // Now: Despesas (Projetada)
    });

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const startDate = getUTCStart(filter.startDate);
                const endDate = getUTCEnd(filter.endDate);

                // 1. Receitas (Baseado na Data de Pagamento / Executada)
                const { data: receitasExecutadas } = await supabase
                    .from('financeiro_receitas')
                    .select('valor_total, data_executada, data_projetada, contratante')
                    .gte('data_executada', startDate)
                    .lt('data_executada', endDate);

                const totalReceitas = receitasExecutadas?.reduce((acc, r) => acc + (Number(r.valor_total) || 0), 0) || 0;

                // 2. Despesas (Baseado na Data Projetada)
                const { data: despesasProjetadas } = await supabase
                    .from('financeiro_despesas')
                    .select('valor, data_projetada')
                    .gte('data_projetada', startDate)
                    .lt('data_projetada', endDate);

                const totalDespesas = despesasProjetadas?.reduce((acc, d) => acc + (Number(d.valor) || 0), 0) || 0;

                // 3. Faturamento Líquido (Receitas - Despesas)
                const faturamentoLiquido = totalReceitas - totalDespesas;

                // 4. Prazo Médio (Mantendo lógica original se possível, mas usando o dataset carregado)
                // Usaremos as receitas executadas pois já as temos.
                const paidReceitas = receitasExecutadas?.filter(r => r.data_executada && r.data_projetada) || [];
                let totalDiasRecebimento = 0;
                paidReceitas.forEach(r => {
                    const diff = new Date(r.data_executada).getTime() - new Date(r.data_projetada).getTime();
                    totalDiasRecebimento += Math.max(0, diff / (1000 * 60 * 60 * 24));
                });
                const prazoMedio = paidReceitas.length > 0 ? totalDiasRecebimento / paidReceitas.length : 0;

                // 5. Recuperação de Passivo
                // Paid in current period but billed > 30 days before period start
                const startOfCurrentPeriod = new Date(filter.startDate);
                const thirtyDaysBeforeStart = new Date(startOfCurrentPeriod);
                thirtyDaysBeforeStart.setDate(thirtyDaysBeforeStart.getDate() - 30);
                const thirtyDaysBeforeISO = getUTCStart(thirtyDaysBeforeStart);

                const recuperacaoPassivo = receitasExecutadas?.filter(r => {
                    if (!r.data_projetada) return false;
                    return r.data_projetada < thirtyDaysBeforeISO;
                }).reduce((acc, r) => acc + (Number(r.valor_total) || 0), 0) || 0;

                // 6. Ticket Médio (Receitas Executadas / Unique clients)
                const uniqueClients = new Set(receitasExecutadas?.map(r => r.contratante).filter(Boolean));
                const totalClients = uniqueClients.size || 1;
                const ticketMedio = totalReceitas / totalClients;

                setStats({
                    faturamentoLiquido,
                    faturamentoTotal: totalReceitas,
                    prazoMedio,
                    recuperacaoPassivo,
                    ticketMedio,
                    totalDespesas
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

    const gapInadimplencia = stats.faturamentoTotal > 0
        ? ((stats.faturamentoTotal - stats.faturamentoLiquido) / stats.faturamentoTotal) * 100
        : 0; // Keeping variable name for compatibility but logic is changed in render

    return (
        <div className="bg-white/60 backdrop-blur-xl p-8 rounded-3xl shadow-lg shadow-slate-200/50 border border-white/50 h-full">
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Activity size={24} className="text-blue-500" />
                Saúde Financeira
            </h3>

            <div className="space-y-6">
                {/* Faturamento Líquido (Ex-Retenção) */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 transition-all hover:shadow-md">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${stats.faturamentoLiquido >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                            {stats.faturamentoLiquido >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Faturamento Líquido (Resultado)</p>
                            <p className={`text-lg font-bold ${stats.faturamentoLiquido >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(stats.faturamentoLiquido)}
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] text-slate-400 uppercase font-medium">Investimento</p>
                        <p className="text-sm font-semibold text-slate-600">-{formatCurrency(stats.totalDespesas)}</p>
                    </div>
                </div>

                {/* Desempenho (Recebido / Faturamento) */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 transition-all hover:shadow-md">
                    <div className="flex justify-between items-start mb-3">
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Desempenho (Recebido / Faturamento)</p>
                            <p className="text-lg font-bold text-slate-800">
                                <span className={stats.faturamentoLiquido >= 0 ? "text-green-600" : "text-red-600"}>{formatCurrency(stats.faturamentoLiquido)}</span>
                                <span className="text-black/60"> / {formatCurrency(stats.faturamentoTotal)}</span>
                            </p>
                        </div>
                        {/* We use Faturamento Liquido / Faturamento Total as the ratio */}
                        <div className={`px-2 py-1 rounded-lg text-xs font-bold ${gapInadimplencia > 0 ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'}`}>
                            {stats.faturamentoTotal > 0 ? ((stats.faturamentoLiquido / stats.faturamentoTotal) * 100).toFixed(1) : 0}%
                        </div>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-1000 ${stats.faturamentoLiquido >= 0 ? 'bg-blue-500' : 'bg-red-500'}`}
                            style={{ width: `${Math.min(100, Math.max(0, (stats.faturamentoLiquido / (stats.faturamentoTotal || 1)) * 100))}%` }}
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
                        <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Ticket Médio p/ Cliente (Bruto)</p>
                    </div>
                    <p className="text-2xl font-bold">{formatCurrency(stats.ticketMedio)}</p>
                </div>
            </div>
        </div>

    );
};
