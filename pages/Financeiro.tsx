import React, { useContext, useEffect, useState } from 'react';
import { FilterContext } from '../layouts/MainLayout';
import { KPICard } from '../components/KPICard';
import { TransactionModal } from '../components/TransactionModal';
import { ParcelaDetailsModal } from '../components/ParcelaDetailsModal';
import { supabase } from '../services/supabase';
import { TrendingUp, TrendingDown, DollarSign, Wallet } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatCurrency, formatDateDisplay, getUTCStart, getUTCEnd } from '../utils/dateUtils';

export const Financeiro: React.FC = () => {
    const filter = useContext(FilterContext);
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({
        income: { current: 0, prev: 0 },
        expense: { current: 0, prev: 0 },
        balance: { current: 0, prev: 0 },
        pending: { current: 0, prev: 0 }
    });
    const [pieData, setPieData] = useState<any[]>([]);
    const [transactions, setTransactions] = useState<any[]>([]);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [modalTransactions, setModalTransactions] = useState<any[]>([]);

    // Parcela Modal State
    const [selectedParcela, setSelectedParcela] = useState<any>(null);
    const [isParcelaModalOpen, setIsParcelaModalOpen] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const startDate = getUTCStart(filter.startDate);
                const endDate = getUTCEnd(filter.endDate);
                const prevStart = getUTCStart(filter.prevStartDate);
                const prevEnd = getUTCEnd(filter.prevEndDate);

                // Fetch Parcelas with related Contas info for description
                const fetchParcelas = async (start: string, end: string) => {
                    const { data, error } = await supabase.from('parcelas')
                        .select(`
                id,
                tipo, 
                valor_esperado, 
                valor_pago, 
                valor_restante,
                status, 
                data_vencimento,
                contas (
                    descricao,
                    fornecedor
                )
            `)
                        .gte('data_vencimento', start)
                        .lte('data_vencimento', end)
                        .order('data_vencimento', { ascending: false });

                    if (error) {
                        console.error('Error fetching parcelas:', error);
                        return [];
                    }
                    return data || [];
                }

                const currData = await fetchParcelas(startDate, endDate);
                const prevData = await fetchParcelas(prevStart, prevEnd);

                // Fetch Pure Revenue from financeiro_receitas (matches Dashboard)
                const fetchRevenue = async (start: string, end: string) => {
                    const { data } = await supabase.from('financeiro_receitas')
                        .select('valor_total')
                        .gte('data_projetada', start)
                        .lt('data_projetada', end);

                    return data?.reduce((acc, curr) => acc + (Number(curr.valor_total) || 0), 0) || 0;
                };

                const currRevenue = await fetchRevenue(startDate, endDate);
                const prevRevenue = await fetchRevenue(prevStart, prevEnd);

                // Fetch Pure Expenses from financeiro_despesas
                const fetchExpenses = async (start: string, end: string) => {
                    const { data } = await supabase.from('financeiro_despesas')
                        .select('valor')
                        .gte('data_projetada', start)
                        .lt('data_projetada', end);

                    return data?.reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0) || 0;
                };

                const currExpense = await fetchExpenses(startDate, endDate);
                const prevExpense = await fetchExpenses(prevStart, prevEnd);

                // Calculate Metrics
                const calc = (items: any[]) => {
                    // Realized Income: Now fetched separately, but we keep this structure if needed for other things?
                    // Actually, we will override income outside logic or pass it in.
                    // Let's modify this function to accept an optional override or just ignore income calc here.

                    // Realized Expense: Sum of valor_pago for DESPESA

                    const expense = 0; // Now handled by fetchExpenses

                    // Pending: Sum of valor_restante (what is left to pay/receive)

                    // Pending: Sum of valor_restante (what is left to pay/receive)
                    const pending = items
                        .reduce((acc, i) => acc + (Number(i.valor_restante) || 0), 0);

                    return { expense, pending };
                }

                const current = calc(currData);
                const previous = calc(prevData);

                // Override income with the correctly fetched revenue
                const finalCurrIncome = currRevenue;
                const finalPrevIncome = prevRevenue;

                const finalCurrExpense = currExpense;
                const finalPrevExpense = prevExpense;

                // Recalculate balance with new income
                // Balance = Income - Expense
                const finalCurrBalance = finalCurrIncome - finalCurrExpense;
                const finalPrevBalance = finalPrevIncome - finalPrevExpense;

                setData({
                    income: { current: finalCurrIncome, prev: finalPrevIncome },
                    expense: { current: finalCurrExpense, prev: finalPrevExpense },
                    balance: { current: finalCurrBalance, prev: finalPrevBalance },
                    pending: { current: current.pending, prev: previous.pending }
                });

                setPieData([
                    { name: 'Receitas Realizadas', value: finalCurrIncome },
                    { name: 'Despesas Realizadas', value: finalCurrExpense },
                ]);

                // Take the latest 10 transactions for the table
                setTransactions(currData.slice(0, 10));

            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [filter]);

    const handleCardClick = async (type: 'income' | 'expense' | 'pending') => {
        setLoading(true);
        try {
            const startDate = getUTCStart(filter.startDate);
            const endDate = getUTCEnd(filter.endDate);

            let data: any[] = [];

            if (type === 'income') {
                setModalTitle('Receitas Realizadas');
                const { data: res } = await supabase.from('financeiro_receitas')
                    .select('*')
                    .gte('data_projetada', startDate)
                    .lt('data_projetada', endDate);

                data = res?.map(r => ({
                    id: r.id,
                    data: r.data_projetada || r.created_at,
                    descricao: r.descricao || 'Receita sem descrição',
                    valor: r.valor_total,
                    status: r.status || 'Realizado',
                    tipo: 'Receita'
                })) || [];

            } else if (type === 'expense') {
                setModalTitle('Despesas Realizadas');
                const { data: res } = await supabase.from('financeiro_despesas')
                    .select('*')
                    .gte('data_projetada', startDate)
                    .lt('data_projetada', endDate);

                data = res?.map(r => ({
                    id: r.id,
                    data: r.data_projetada || r.created_at,
                    descricao: r.desc || r.fornecedor || 'Despesa sem descrição',
                    valor: r.valor,
                    status: r.status || 'Realizado',
                    tipo: 'Despesa'
                })) || [];

            } else if (type === 'pending') {
                setModalTitle('Pendências');
                const { data: res } = await supabase.from('parcelas')
                    .select(`id, valor_restante, data_vencimento, contas (descricao, fornecedor)`)
                    .gte('data_vencimento', startDate)
                    .lte('data_vencimento', endDate)
                    .gt('valor_restante', 0);

                data = res?.map(p => ({
                    id: p.id,
                    data: p.data_vencimento,
                    descricao: (p.contas as any)?.descricao || (p.contas as any)?.fornecedor || 'Pendente',
                    valor: p.valor_restante,
                    status: 'Pendente',
                    tipo: 'Pendente'
                })) || [];
            }

            setModalTransactions(data);
            setIsModalOpen(true);

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };




    const handleParcelaClick = (parcela: any) => {
        setSelectedParcela(parcela);
        setIsParcelaModalOpen(true);
    };

    const COLORS = ['#10b981', '#ef4444'];

    return (
        <div className="space-y-8">
            <TransactionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={modalTitle}
                transactions={modalTransactions}
            />
            <ParcelaDetailsModal
                isOpen={isParcelaModalOpen}
                onClose={() => setIsParcelaModalOpen(false)}
                parcela={selectedParcela}
            />
            <h2 className="text-xl font-bold text-slate-800 border-b border-slate-200/50 pb-2">Setor Financeiro</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard
                    title="Receitas (Realizado)"
                    value={data.income.current}
                    prevValue={data.income.prev}
                    isCurrency
                    isLoading={loading}
                    icon={<TrendingUp size={24} />}
                    onClick={() => handleCardClick('income')}
                />
                <KPICard
                    title="Despesas (Realizado)"
                    value={data.expense.current}
                    prevValue={data.expense.prev}
                    isLoading={loading}
                    icon={<TrendingDown size={24} />}
                    onClick={() => handleCardClick('expense')}
                />
                <KPICard
                    title="Saldo Líquido"
                    value={data.balance.current}
                    prevValue={data.balance.prev}
                    isCurrency
                    isLoading={loading}
                    icon={<Wallet size={24} />}
                />
                <KPICard
                    title="Pendente (Total)"
                    value={data.pending.current}
                    prevValue={data.pending.prev}
                    isCurrency
                    isLoading={loading}
                    icon={<DollarSign size={24} />}
                    onClick={() => handleCardClick('pending')}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white/60 backdrop-blur-xl p-8 rounded-3xl shadow-lg shadow-slate-200/50 border border-white/50">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Composição Realizada</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'rgba(255,255,255,0.8)',
                                        backdropFilter: 'blur(8px)',
                                        borderRadius: '16px',
                                        border: '1px solid rgba(255,255,255,0.5)',
                                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                                    }}
                                    formatter={(value: number) => formatCurrency(value)}
                                />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white/60 backdrop-blur-xl p-8 rounded-3xl shadow-lg shadow-slate-200/50 border border-white/50">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Últimas Parcelas (Vencimento no Período)</h3>
                    <div className="overflow-x-auto rounded-xl border border-white/40">
                        <table className="min-w-full text-sm">
                            <thead className="bg-white/50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-slate-500 font-semibold">Vencimento</th>
                                    <th className="px-6 py-4 text-left text-slate-500 font-semibold">Descrição</th>
                                    <th className="px-6 py-4 text-right text-slate-500 font-semibold">Valor Pago</th>
                                    <th className="px-6 py-4 text-center text-slate-500 font-semibold">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/40 bg-white/30">
                                {loading ? (
                                    <tr><td colSpan={4} className="p-6 text-center text-slate-400">Carregando...</td></tr>
                                ) : transactions.length === 0 ? (
                                    <tr><td colSpan={4} className="p-6 text-center text-slate-500">Nenhuma movimentação encontrada.</td></tr>
                                ) : (
                                    transactions.map((t) => (
                                        <tr
                                            key={t.id}
                                            className="hover:bg-white/40 transition-colors cursor-pointer"
                                            onClick={() => handleParcelaClick(t)}
                                        >
                                            <td className="px-6 py-4 text-slate-700">
                                                {formatDateDisplay(new Date(t.data_vencimento))}
                                            </td>
                                            <td className="px-6 py-4 text-slate-700">
                                                <div className="font-medium text-slate-800">
                                                    {t.contas?.descricao || 'Sem descrição'}
                                                </div>
                                                <div className="text-xs text-slate-500">
                                                    {t.contas?.fornecedor} • {t.tipo}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right font-medium">
                                                <span className={t.tipo === 'RECEITA' ? 'text-green-600' : 'text-red-600'}>
                                                    {t.tipo === 'DESPESA' ? '-' : '+'}{formatCurrency(t.valor_pago)}
                                                </span>
                                                {t.valor_restante > 0 && (
                                                    <div className="text-xs text-slate-400 mt-1">
                                                        Resta: {formatCurrency(t.valor_restante)}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold capitalize
                                            ${t.status === 'Liquidado' || t.valor_restante === 0
                                                        ? 'bg-green-100/60 text-green-700'
                                                        : 'bg-yellow-100/60 text-yellow-700'}
                                         `}>
                                                    {t.status || (t.valor_restante === 0 ? 'Pago' : 'Pendente')}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};