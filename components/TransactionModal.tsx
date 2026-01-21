import React from 'react';
import { X, Calendar } from 'lucide-react';
import { formatDateDisplay, formatCurrency } from '../utils/dateUtils';

interface Transaction {
    id: number | string;
    data: string; // ISO String
    descricao: string;
    valor: number;
    status: string;
    tipo: 'Receita' | 'Despesa' | 'Pendente';
}

interface TransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    transactions: Transaction[];
}

export const TransactionModal: React.FC<TransactionModalProps> = ({ isOpen, onClose, title, transactions }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-white/60">

                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white/50 backdrop-blur-xl">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 tracking-tight">{title}</h3>
                        <p className="text-sm text-slate-500 mt-1">
                            {transactions.length} registros encontrados
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* List */}
                <div className="overflow-y-auto p-4 custom-scrollbar bg-slate-50/50 flex-1">
                    {transactions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                            <p>Nenhum registro encontrado.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {transactions.map((t, idx) => (
                                <div
                                    key={t.id || idx}
                                    className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm hover:shadow-md transition-all flex items-center gap-4 group"
                                >
                                    {/* Icon/Type Indicator */}
                                    <div className={`w-2 h-10 rounded-full shrink-0 ${t.tipo === 'Receita' ? 'bg-green-500' :
                                            t.tipo === 'Despesa' ? 'bg-red-500' : 'bg-yellow-500'
                                        }`}></div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-semibold text-slate-800 truncate mb-1">
                                            {t.descricao || 'Sem descrição'}
                                        </h4>
                                        <div className="flex items-center gap-3 text-xs text-slate-500">
                                            <span className="flex items-center gap-1">
                                                <Calendar size={12} />
                                                {formatDateDisplay(new Date(t.data))}
                                            </span>
                                            <span className="px-1.5 py-0.5 rounded bg-slate-100 uppercase text-[10px] font-bold tracking-wider">
                                                {t.status}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Value */}
                                    <div className="flex flex-col items-end shrink-0">
                                        <div className={`font-bold text-sm ${t.tipo === 'Receita' ? 'text-green-600' :
                                                t.tipo === 'Despesa' ? 'text-red-600' : 'text-yellow-600'
                                            }`}>
                                            {t.tipo === 'Despesa' ? '-' : '+'} {formatCurrency(t.valor)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-white border-t border-slate-100 text-xs text-center text-slate-400">
                    Total: {formatCurrency(transactions.reduce((acc, t) => acc + (Number(t.valor) || 0), 0))}
                </div>
            </div>
        </div>
    );
};
