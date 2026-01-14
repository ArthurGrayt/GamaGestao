
import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { X, Calendar, FileText, Download, Clock } from 'lucide-react';
import { format, differenceInMinutes, isWeekend, eachDayOfInterval, startOfDay, endOfDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Role {
    id: number;
    name_roles: string;
}

interface Sector {
    id: number;
    sector_name: string;
}

export interface User {
    id: string; // PK (int)
    user_id: string; // UUID
    username: string;
    img_url?: string;
    lider: boolean;
    role?: Role;
    role_id?: number;
    sector?: Sector;
}

interface PointReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    users: User[];
}

interface PointRecord {
    id: number;
    user_id: string; // Changed from user_id
    datahora: string;
    ordem?: number;
    tipo?: string;
}

interface UserReport {
    user: User;
    points: PointRecord[];
    totalMinutes: number;
    avgMinutesPerDay: number;
    targetMinutes: number;
    daysWorked: number;
    businessDays: number;
    balanceMinutes: number;
}

export const PointReportModal: React.FC<PointReportModalProps> = ({ isOpen, onClose, users }) => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [loading, setLoading] = useState(false);
    const [reports, setReports] = useState<UserReport[]>([]);
    const [view, setView] = useState<'config' | 'report'>('config');

    const [considerHolidays, setConsiderHolidays] = useState(true);

    if (!isOpen) return null;

    const generateReport = async () => {
        if (!startDate || !endDate) return;

        setLoading(true);
        try {
            // Adjust dates to full day range
            const start = startOfDay(parseISO(startDate)).toISOString();
            const end = endOfDay(parseISO(endDate)).toISOString();

            const { data, error } = await supabase
                .from('ponto_registros')
                .select('*')
                .in('user_id', users.map(u => u.user_id))
                .gte('datahora', start)
                .lte('datahora', end)
                .order('datahora', { ascending: true });

            if (error) throw error;

            let holidays: string[] = [];
            if (considerHolidays) {
                const { data: holidaysData } = await supabase
                    .from('holidays')
                    .select('data')
                    .gte('data', start)
                    .lte('data', end);

                if (holidaysData) {
                    holidays = holidaysData.map(h => format(parseISO(h.data), 'yyyy-MM-dd'));
                }
            }

            const records: PointRecord[] = data || [];

            // Calculate Business Days in Range
            const rangeStart = parseISO(startDate);
            const rangeEnd = parseISO(endDate);
            const daysInRange = eachDayOfInterval({ start: rangeStart, end: rangeEnd });

            const businessDaysCount = daysInRange.filter(day => {
                const dayOfWeek = day.getDay();
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

                if (isWeekend) return false;

                if (considerHolidays) {
                    const formattedDay = format(day, 'yyyy-MM-dd');
                    if (holidays.includes(formattedDay)) return false;
                }

                return true;
            }).length;

            // const targetMinutes = businessDaysCount * (8 * 60 + 45); // Moved to inside map

            // Custom Sort Function
            const typePriority: { [key: string]: number } = {
                'Entrada': 1,
                'Saída para almoço': 2,
                'Volta do almoço': 3,
                'Fim de expediente': 4
            };

            const processedReports: UserReport[] = users.map(user => {
                const userPoints = records.filter(p => p.user_id === user.user_id);

                // Sort by Date ASC, then by Type Priority
                userPoints.sort((a, b) => {
                    const dateA = parseISO(a.datahora);
                    const dateB = parseISO(b.datahora);

                    // 1. Compare Days
                    const dayDiff = startOfDay(dateA).getTime() - startOfDay(dateB).getTime();
                    if (dayDiff !== 0) return dayDiff;

                    // 2. Compare Type Priority
                    const typeA = typePriority[a.tipo || ''] || 99;
                    const typeB = typePriority[b.tipo || ''] || 99;

                    if (typeA !== typeB) return typeA - typeB;

                    // 3. Fallback to time if types are same or unknown
                    return dateA.getTime() - dateB.getTime();
                });

                // Calculate Total Hours logic remains...
                let totalMin = 0;
                let validDays = new Set<string>();

                for (let i = 0; i < userPoints.length - 1; i += 2) {
                    const startP = userPoints[i];
                    const endP = userPoints[i + 1];

                    // Basic pair check logic
                    const diff = differenceInMinutes(parseISO(endP.datahora), parseISO(startP.datahora));
                    if (diff > 0 && diff < 24 * 60) {
                        totalMin += diff;
                        validDays.add(format(parseISO(startP.datahora), 'yyyy-MM-dd'));
                    }
                }

                const daysWorkedCount = validDays.size;
                const avg = daysWorkedCount > 0 ? totalMin / daysWorkedCount : 0;

                // Determine Target based on Role
                // ID 2 = Estagiário (Intern) -> 6 hours (360 min)
                const isIntern = user.role_id === 2;
                const dailyTarget = isIntern ? (6 * 60) : (8 * 60 + 45);
                const targetMinutes = businessDaysCount * dailyTarget;

                const balance = targetMinutes - totalMin;

                return {
                    user,
                    points: userPoints,
                    totalMinutes: totalMin,
                    avgMinutesPerDay: avg,
                    targetMinutes,
                    daysWorked: daysWorkedCount,
                    businessDays: businessDaysCount,
                    balanceMinutes: balance
                };
            });

            setReports(processedReports);
            setView('report');
        } catch (err) {
            console.error(err);
            alert('Erro ao gerar relatório. Verifique o console ou contate o suporte.');
        } finally {
            setLoading(false);
        }
    };

    const formatMinutes = (mins: number) => {
        const h = Math.floor(mins / 60);
        const m = Math.round(mins % 60);
        return `${h}h ${m.toString().padStart(2, '0')}m`;
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm print:static print:bg-white print:p-0 print:block">
            <style>
                {`
                    @media print {
                        html, body, #root {
                            height: auto !important;
                            overflow: visible !important;
                            min-height: 0 !important;
                        }
                    }
                `}
            </style>
            <div className={`bg-white rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden transition-all duration-500 print:static print:shadow-none print:w-full print:max-w-none print:h-auto print:max-h-none print:rounded-none print:overflow-visible print:block ${view === 'report' ? 'h-[80vh]' : 'h-auto'}`}>

                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-center print:hidden">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2.5 rounded-xl text-blue-600">
                            <FileText size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">Relatório de Ponto</h2>
                            <p className="text-slate-500 text-sm">
                                {view === 'config' ? 'Configure o período do relatório' : `Relatório gerado para ${users.length} usuário(s)`}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent print:p-0 print:overflow-visible">

                    {view === 'config' && (
                        <div className="flex flex-col gap-6 max-w-lg mx-auto py-8">
                            <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 text-sm text-blue-800 flex items-start gap-3">
                                <Clock className="shrink-0 mt-0.5" size={16} />
                                <p>Usuarios selecionados: <span className="font-bold">{users.map(u => u.username).join(', ')}</span></p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700 ml-1">Data Inicial</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={e => {
                                                const date = parseISO(e.target.value);
                                                if (isWeekend(date)) {
                                                    alert("Finais de semana não podem ser selecionados como data de início.");
                                                    return;
                                                }
                                                setStartDate(e.target.value);
                                            }}
                                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700 ml-1">Data Final</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={e => {
                                                const date = parseISO(e.target.value);
                                                if (isWeekend(date)) {
                                                    alert("Finais de semana não podem ser selecionados como data final.");
                                                    return;
                                                }
                                                setEndDate(e.target.value);
                                            }}
                                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Holiday Toggle */}
                            <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                                <input
                                    type="checkbox"
                                    id="considerHolidays"
                                    checked={considerHolidays}
                                    onChange={(e) => setConsiderHolidays(e.target.checked)}
                                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                                />
                                <label htmlFor="considerHolidays" className="text-sm text-slate-700 font-medium cursor-pointer select-none">
                                    Descontar <span className="font-bold text-slate-900">feriados</span> da meta mensal
                                </label>
                            </div>

                            <p className="text-xs text-slate-400 text-center -mt-2">
                                * Sabádos e Domingos são desconsiderados automaticamente do cálculo.
                            </p>

                            <button
                                onClick={generateReport}
                                disabled={!startDate || !endDate || loading}
                                className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed mt-4 flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <FileText size={20} />
                                        Gerar Relatório
                                    </>
                                )}
                            </button>
                        </div>
                    )}

                    {view === 'report' && (
                        <div className="space-y-12 print:space-y-0 print:block">
                            <div className="hidden print:hidden text-center mb-8">
                                <h1 className="text-2xl font-bold text-slate-900">Relatório de Ponto</h1>
                                <p className="text-slate-500">Período: {format(parseISO(startDate), 'dd/MM/yyyy')} a {format(parseISO(endDate), 'dd/MM/yyyy')}</p>
                            </div>

                            {reports.map((report, idx) => (
                                <div key={report.user.user_id} className={`bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-8 print:border-none print:shadow-none print:p-0 print:mb-0 print:py-8 ${idx < reports.length - 1 ? 'print:break-after-page' : 'print:pb-10'} last:mb-0`}>
                                    {/* User Header */}
                                    <div className="flex items-center gap-4 mb-6 border-b border-slate-100 pb-4 break-inside-avoid">
                                        <div className="w-12 h-12 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center text-slate-400 border border-slate-200">
                                            {report.user.img_url ? (
                                                <img src={report.user.img_url} className="w-full h-full object-cover" alt="" />
                                            ) : (
                                                <span className="font-bold text-lg">{report.user.username.charAt(0)}</span>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900">{report.user.username}</h3>
                                            <div className="flex gap-4 text-xs text-slate-500">
                                                <span>{report.user.role?.name_roles}</span>
                                                <span>•</span>
                                                <span>{report.user.sector?.sector_name}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Points Table */}
                                    <div className="overflow-hidden rounded-xl border border-slate-200 mb-6 print:border-slate-300">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 print:bg-slate-100">
                                                <tr>
                                                    <th className="p-3">Data</th>
                                                    <th className="p-3">Horário</th>
                                                    <th className="p-3">Tipo</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 print:divide-slate-200">
                                                {report.points.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={3} className="p-8 text-center text-slate-400">Nenhum registro encontrado neste período.</td>
                                                    </tr>
                                                ) : (
                                                    report.points.map(point => (
                                                        <tr key={point.id} className="hover:bg-slate-50/50">
                                                            <td className="p-3 text-slate-700">{format(parseISO(point.datahora), 'dd/MM/yyyy')}</td>
                                                            <td className="p-3 font-mono text-slate-600">{format(parseISO(point.datahora), 'HH:mm:ss')}</td>
                                                            <td className="p-3 text-slate-500">
                                                                {point.tipo ? (
                                                                    <span className={`px-2 py-1 rounded text-xs font-medium ${point.tipo === 'Entrada' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                                        {point.tipo}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-slate-400">-</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Stats Footer */}
                                    <div className="bg-blue-50/50 rounded-2xl p-6 border border-blue-100 flex flex-col md:flex-row justify-between gap-6 print:border-blue-200 print:bg-blue-50 break-inside-avoid">
                                        <div className="space-y-1">
                                            <p className="text-xs uppercase tracking-wider text-slate-500 font-bold">Total Trabalhado</p>
                                            <p className="text-2xl font-bold text-blue-700">{formatMinutes(report.totalMinutes)}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xs uppercase tracking-wider text-slate-500 font-bold">Média Diária</p>
                                            <p className="text-xl font-bold text-slate-700">{formatMinutes(report.avgMinutesPerDay)}</p>
                                            <p className="text-[10px] text-slate-400">Baseado em {report.daysWorked} dias trabalhados</p>
                                        </div>
                                        <div className="space-y-1 opacity-75">
                                            <p className="text-xs uppercase tracking-wider text-slate-500 font-bold">Meta do Mês (Período)</p>
                                            <p className="text-xl font-bold text-slate-600">{formatMinutes(report.targetMinutes)}</p>
                                            <p className="text-[10px] text-slate-400">{report.businessDays} dias úteis x 8h 45m</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xs uppercase tracking-wider text-slate-500 font-bold">Saldo de Horas</p>
                                            <p className={`text-xl font-bold ${report.balanceMinutes > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                {report.balanceMinutes > 0 ? '-' : '+'}{formatMinutes(Math.abs(report.balanceMinutes))}
                                            </p>
                                            <p className="text-[10px] text-slate-400">Meta - Trabalhado</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                </div>

                {/* Footer Actions */}
                {view === 'report' && (
                    <div className="p-6 border-t border-slate-100 flex justify-between bg-slate-50/50 print:hidden">
                        <button
                            onClick={() => setView('config')}
                            className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-white hover:border-slate-300 transition-all"
                        >
                            Voltar
                        </button>
                        <button
                            onClick={handlePrint}
                            className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-medium hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg shadow-slate-900/10"
                        >
                            <Download size={18} />
                            Baixar PDF
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
