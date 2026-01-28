import React from 'react';
import { Rocket, Users, Target, BarChart3, TrendingUp } from 'lucide-react';
import { formatCurrency } from '../utils/dateUtils';
import { supabase } from '../services/supabase';

export const ExpansionAcademyQuadrant: React.FC = () => {
    const [vidasAtivas, setVidasAtivas] = React.useState(0);
    const [loading, setLoading] = React.useState(true);

    // Mock data for other indicators
    const empresasConvertidas = 45;
    const totalEmpresasConsultoria = 411;
    const mrrAtual = 25333.33; // ~304k / 12
    const mrrMetaAnual = 304000;

    React.useEffect(() => {
        const fetchClients = async () => {
            try {
                const { count } = await supabase
                    .from('clientes')
                    .select('*', { count: 'exact', head: true });
                setVidasAtivas(count || 0);
            } catch (err) {
                console.error('Error fetching lives:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchClients();
    }, []);

    const taxaConversao = (empresasConvertidas / totalEmpresasConsultoria) * 100;
    const progressoMetaMRR = (mrrAtual * 12 / mrrMetaAnual) * 100;

    if (loading) {
        return (
            <div className="bg-white/60 backdrop-blur-xl p-8 rounded-3xl shadow-lg border border-white/50 animate-pulse h-full">
                <div className="h-6 w-48 bg-slate-200 rounded mb-6"></div>
                <div className="space-y-4">
                    <div className="h-20 bg-slate-100 rounded-2xl"></div>
                    <div className="h-24 bg-slate-100 rounded-2xl"></div>
                    <div className="h-28 bg-slate-100 rounded-2xl"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white/60 backdrop-blur-xl p-8 rounded-3xl shadow-lg shadow-slate-200/50 border border-white/50 h-full overflow-hidden relative group transition-all duration-300 hover:shadow-xl">
            {/* Animated background element */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all duration-500"></div>

            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Rocket size={24} className="text-blue-600 animate-bounce-subtle" />
                Expansão (Gama Academy)
            </h3>

            <div className="space-y-6">
                {/* Vidas Ativas */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100/50 transition-all hover:scale-[1.02]">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-200">
                            <Users size={20} />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Vidas Ativas</p>
                            <p className="text-2xl font-black text-slate-800">
                                {vidasAtivas.toLocaleString('pt-BR')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Taxa de Conversão */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 transition-all hover:bg-white/80">
                    <div className="flex justify-between items-end mb-3">
                        <div className="flex items-center gap-2">
                            <Target size={16} className="text-orange-500" />
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Conversão da Base</p>
                        </div>
                        <p className="text-lg font-bold text-slate-800">
                            {taxaConversao.toFixed(1)}%
                        </p>
                    </div>
                    <div className="space-y-2">
                        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                            <div
                                className="h-full bg-orange-500 rounded-full transition-all duration-1000"
                                style={{ width: `${taxaConversao}%` }}
                            ></div>
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium">
                            {empresasConvertidas} de {totalEmpresasConsultoria} empresas aderiram (R$ 18,00/vida)
                        </p>
                    </div>
                </div>

                {/* MRR / Faturamento Recorrente */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100/50 shadow-md shadow-slate-200/50 transition-all hover:scale-[1.02] group/mrr">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <BarChart3 size={18} className="text-blue-600" />
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Faturamento Recorrente (MBR)</p>
                        </div>
                        <TrendingUp size={16} className="text-green-600" />
                    </div>

                    <div className="mb-4">
                        <p className="text-3xl font-black text-slate-800">{formatCurrency(mrrAtual)}</p>
                        <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-tighter font-medium">
                            Foco Anual: {formatCurrency(mrrMetaAnual)}
                        </p>
                    </div>

                    <div className="space-y-1.5">
                        <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest text-slate-400">
                            <span>Progresso Meta</span>
                            <span className="text-slate-600">{progressoMetaMRR.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-1 overflow-hidden">
                            <div
                                className="h-full bg-blue-600 rounded-full transition-all duration-1000"
                                style={{ width: `${progressoMetaMRR}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes bounce-subtle {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-4px); }
                }
                .animate-bounce-subtle {
                    animation: bounce-subtle 3s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
};
