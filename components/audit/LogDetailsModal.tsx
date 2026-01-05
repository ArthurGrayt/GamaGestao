import React from 'react';
import { X, Calendar, AppWindow, Activity, User } from 'lucide-react';

interface LogDetailsModalProps {
    log: any; // Using any for flexibility, but ideally should be typed
    isOpen: boolean;
    onClose: () => void;
}

export const LogDetailsModal: React.FC<LogDetailsModalProps> = ({ log, isOpen, onClose }) => {
    if (!isOpen || !log) return null;

    // Translation map
    const opLabels: Record<string, string> = {
        'LOGIN': 'Login',
        'LOGOUT': 'Logout',
        'CREATE': 'Criação',
        'UPDATE': 'Edição',
        'DELETE': 'Exclusão',
        'EXPORT': 'Exportação'
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h3 className="text-lg font-semibold text-slate-800">Detalhes do Log</h3>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-slate-200/50 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">

                    {/* User Section - Large */}
                    <div className="flex flex-col items-center justify-center pb-6 border-b border-slate-100">
                        {log.users?.img_url ? (
                            <img
                                src={log.users.img_url}
                                alt={log.users?.username}
                                className="w-20 h-20 rounded-full object-cover shadow-sm mb-3 border-4 border-white ring-1 ring-slate-100"
                            />
                        ) : (
                            <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center text-2xl text-slate-400 font-bold mb-3 border-4 border-white ring-1 ring-slate-100">
                                {log.users?.username?.charAt(0) || '?'}
                            </div>
                        )}
                        <h4 className="text-xl font-bold text-slate-800">{log.users?.username || 'Usuário Desconhecido'}</h4>
                        <span className="text-sm text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded mt-1">
                            {log.user_uuid}
                        </span>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 gap-4">

                        {/* Operation */}
                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                <Activity size={20} />
                            </div>
                            <div>
                                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Operação</span>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                  ${log.action === 'LOGIN' ? 'bg-green-50 text-green-700 border-green-200' :
                                        log.action === 'DELETE' ? 'bg-red-50 text-red-700 border-red-200' :
                                            log.action === 'UPDATE' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                'bg-slate-50 text-slate-700 border-slate-200'}`}
                                >
                                    {opLabels[log.action] || log.action}
                                </span>
                            </div>
                        </div>

                        {/* App */}
                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                                <AppWindow size={20} />
                            </div>
                            <div>
                                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Aplicativo</span>
                                <span className="text-sm font-medium text-slate-700">{log.appname || 'N/A'}</span>
                            </div>
                        </div>

                        {/* Date */}
                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                                <Calendar size={20} />
                            </div>
                            <div>
                                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Data e Hora</span>
                                <span className="text-sm font-medium text-slate-700">{formatDate(log.timelog)}</span>
                            </div>
                        </div>

                        {/* Description - Full Width */}
                        <div className="mt-2 pt-4 border-t border-slate-100">
                            <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Descrição da Atividade</span>
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-sm text-slate-600 leading-relaxed">
                                {log.logtxt || 'Sem descrição'}
                            </div>
                        </div>

                    </div>
                </div>

                {/* Footer */}
                <div className="bg-slate-50 px-6 py-4 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50 hover:text-slate-800 transition-colors shadow-sm"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
};
