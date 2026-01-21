import React from 'react';
import { X, Calendar, DollarSign, FileText, User, Tag } from 'lucide-react';
import { formatDateDisplay, formatCurrency } from '../utils/dateUtils';

interface ParcelaDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    parcela: any;
}

export const ParcelaDetailsModal: React.FC<ParcelaDetailsModalProps> = ({ isOpen, onClose, parcela }) => {
    if (!isOpen || !parcela) return null;

    const themeColor = parcela.tipo === 'RECEITA' ? 'text-green-600' :
        parcela.tipo === 'DESPESA' ? 'text-red-600' : 'text-slate-600';

    const bgColor = parcela.tipo === 'RECEITA' ? 'bg-green-50' :
        parcela.tipo === 'DESPESA' ? 'bg-red-50' : 'bg-slate-50';

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-white/60">

                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white/50 backdrop-blur-xl">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 tracking-tight">Detalhes da Parcela</h3>
                        <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">
                            ID: #{parcela.id}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6 bg-slate-50/30">

                    {/* Main Info */}
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 space-y-4">
                        <div className="flex items-start gap-4">
                            <div className={`p-3 rounded-xl ${bgColor} ${themeColor}`}>
                                <FileText size={24} />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800 text-lg leading-tight">
                                    {parcela.contas?.descricao || 'Sem descrição'}
                                </h4>
                                <div className="flex items-center gap-1.5 mt-1 text-sm text-slate-500">
                                    <Tag size={12} />
                                    <span>{parcela.tipo}</span>
                                </div>
                            </div>
                        </div>

                        {parcela.contas?.fornecedor && (
                            <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 p-2 rounded-lg">
                                <User size={14} className="text-slate-400" />
                                <span className="font-medium">{parcela.contas.fornecedor}</span>
                            </div>
                        )}
                    </div>

                    {/* Financial Details */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                            <p className="text-xs text-slate-400 font-bold uppercase mb-1">Vencimento</p>
                            <div className="flex items-center gap-2 text-slate-700 font-semibold">
                                <Calendar size={16} className="text-blue-500" />
                                {formatDateDisplay(new Date(parcela.data_vencimento))}
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                            <p className="text-xs text-slate-400 font-bold uppercase mb-1">Status</p>
                            <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold capitalize mt-0.5
                                ${parcela.status === 'Liquidado' || parcela.valor_restante === 0
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-yellow-100 text-yellow-700'}`}>
                                {parcela.status || (parcela.valor_restante === 0 ? 'Pago' : 'Pendente')}
                            </div>
                        </div>
                    </div>

                    {/* Values */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden divide-y divide-slate-100">
                        <div className="p-4 flex justify-between items-center hover:bg-slate-50/50 transition-colors">
                            <span className="text-sm text-slate-500 font-medium">Valor Esperado</span>
                            <span className="font-bold text-slate-800">{formatCurrency(parcela.valor_esperado)}</span>
                        </div>
                        <div className="p-4 flex justify-between items-center hover:bg-slate-50/50 transition-colors">
                            <span className="text-sm text-slate-500 font-medium">Valor Pago</span>
                            <span className="font-bold text-green-600">+ {formatCurrency(parcela.valor_pago)}</span>
                        </div>
                        {parcela.valor_restante > 0 && (
                            <div className="p-4 flex justify-between items-center bg-red-50/30">
                                <span className="text-sm text-red-500 font-bold">Valor Restante</span>
                                <span className="font-bold text-red-600">{formatCurrency(parcela.valor_restante)}</span>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};
