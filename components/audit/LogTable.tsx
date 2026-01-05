import React from 'react';
import { UserCell } from './UserCell';

interface LogTableProps {
    logs: any[];
    loading: boolean;
    onRowClick: (log: any) => void;
}

export const LogTable: React.FC<LogTableProps> = ({ logs, loading, onRowClick }) => {

    // Translation map
    const opLabels: Record<string, string> = {
        'LOGIN': 'Login',
        'LOGOUT': 'Logout',
        'CREATE': 'Criação',
        'UPDATE': 'Edição',
        'DELETE': 'Exclusão',
        'EXPORT': 'Exportação'
    };

    if (loading) {
        return (
            <div className="w-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[400px]">
                <div className="animate-pulse space-y-4 p-6">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex gap-4">
                            <div className="h-10 w-10 bg-slate-100 rounded-full"></div>
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-slate-100 rounded w-1/4"></div>
                                <div className="h-3 bg-slate-50 rounded w-1/2"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100 text-left">
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-1/4">Usuário</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-32">Operação</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Descrição</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-40">App</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-48 text-right">Data / Hora</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {logs.length > 0 ? (
                            logs.map((log) => (
                                <tr
                                    key={log.id}
                                    onClick={() => onRowClick(log)}
                                    className="hover:bg-blue-50/50 cursor-pointer transition-colors group"
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <UserCell
                                            username={log.users?.username}
                                            img_url={log.users?.img_url}
                                        // email={log.users?.email} // Add if available in join
                                        />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                      ${log.action === 'LOGIN' ? 'bg-green-50 text-green-700 border-green-200' :
                                                log.action === 'DELETE' ? 'bg-red-50 text-red-700 border-red-200' :
                                                    log.action === 'UPDATE' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                        'bg-slate-50 text-slate-700 border-slate-200'}`}
                                        >
                                            {opLabels[log.action] || log.action}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm text-slate-600 line-clamp-1 max-w-lg">{log.logtxt}</p>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2 text-slate-500">
                                            <span className="text-xs font-medium px-2 py-1 bg-slate-100 rounded-md text-slate-600 border border-slate-200/50">
                                                {log.appname}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-500 font-tabular-nums">
                                        {new Date(log.timelog).toLocaleString('pt-BR', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: '2-digit',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                    Nenhum log encontrado para os filtros selecionados.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
