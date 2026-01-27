import React, { useContext, useEffect, useState, useMemo } from 'react';
import { format } from 'date-fns';
import { getUTCStart, getUTCEnd, formatCurrency } from '../utils/dateUtils';
import { FilterContext } from '../layouts/MainLayout';
import { KPICard } from '../components/KPICard';
import { supabase } from '../services/supabase';
import { UserCheck, Clock, Activity, X, Search, Zap, Building2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { differenceInDays, parseISO, getHours, getDate } from 'date-fns';

export const Saude: React.FC = () => {
  const filter = useContext(FilterContext);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    total: { current: 0, prev: 0 },
    attended: { current: 0, prev: 0 },
    pending: { current: 0, prev: 0 },
    rate: { current: 0, prev: 0 },
    patientCompanyRate: { current: 0, prev: 0 },
    units: { current: 0, prev: 0 }
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [peakData, setPeakData] = useState<any[]>([]);
  const [peakType, setPeakType] = useState<'days' | 'hours'>('days');
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [rateBreakdown, setRateBreakdown] = useState<{ company: string, count: number }[]>([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalList, setModalList] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Data State to avoid re-fetching
  const [currData, setCurrData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const startDate = getUTCStart(filter.startDate);
        const endDate = getUTCEnd(filter.endDate);
        const prevStart = getUTCStart(filter.prevStartDate);
        const prevEnd = getUTCEnd(filter.prevEndDate);

        const fetchAgendamentos = async (start: string, end: string) => {
          const { data, error } = await supabase.from('agendamentos')
            .select(`
                *,
                colaboradores:colaborador_id (
                    nome,
                    setor,
                    cargos (
                        nome
                    ),
                    unidades (
                        nome_unidade
                    )
                )
            `)
            .gte('data_atendimento', start)
            .lt('data_atendimento', end)
            .range(0, 9999);

          if (error) throw error;
          return data || [];
        }

        const fetchFinanceiro = async (start: string, end: string) => {
          const { data, error } = await supabase.from('financeiro_receitas')
            .select('valor_total, status')
            .gte('data_projetada', start)
            .lt('data_projetada', end);

          if (error) throw error;

          const summary = { total: 0, realizado: 0, pendente: 0 };
          data?.forEach(r => {
            const val = Number(r.valor_total) || 0;
            summary.total += val;
            if (r.status === 'pago') {
              summary.realizado += val;
            } else if (r.status === 'Pendente' || r.status === 'Aguardando') {
              summary.pendente += val;
            }
          });
          return summary;
        }

        const [curr, prev, currFin, prevFin] = await Promise.all([
          fetchAgendamentos(startDate, endDate),
          fetchAgendamentos(prevStart, prevEnd),
          fetchFinanceiro(startDate, endDate),
          fetchFinanceiro(prevStart, prevEnd)
        ]);

        setCurrData(curr);

        const calc = (rows: any[]) => {
          const total = rows.length;
          const attendedRows = rows.filter(r => r.compareceu === true);
          const attended = attendedRows.length;
          const pending = rows.filter(r => r.compareceu === false || r.compareceu === null).length;
          const rate = total > 0 ? (attended / total) * 100 : 0;

          const uniqueUnits = new Set(attendedRows.map(r => r.colaboradores?.unidades?.nome_unidade).filter(Boolean));
          const unitsCount = uniqueUnits.size;
          const patientPerUnitRate = unitsCount > 0 ? attended / unitsCount : 0;

          return { total, attended, pending, rate, patientPerUnitRate, unitsCount };
        }

        const c = calc(curr);
        const p = calc(prev);

        setMetrics({
          total: { current: c.total, prev: p.total },
          attended: { current: c.attended, prev: p.attended },
          pending: { current: c.pending, prev: p.pending },
          rate: { current: c.rate, prev: p.rate },
          patientCompanyRate: { current: c.patientPerUnitRate, prev: p.patientPerUnitRate },
          units: { current: c.unitsCount, prev: p.unitsCount }
        });

        setChartData([
          { name: 'Realizados', Atual: c.attended, Anterior: p.attended, valorAtual: currFin.realizado, valorAnterior: prevFin.realizado },
          { name: 'Pendentes', Atual: c.pending, Anterior: p.pending, valorAtual: currFin.pendente, valorAnterior: prevFin.pendente },
          { name: 'Total', Atual: c.total, Anterior: p.total, valorAtual: currFin.total, valorAnterior: prevFin.total },
        ]);

        // Peak Analysis Logic
        const diffDays = differenceInDays(filter.endDate, filter.startDate);
        const isDayView = diffDays <= 1;
        setPeakType(isDayView ? 'hours' : 'days');

        const peakMap = new Map<string, number>();

        curr.forEach((item: any) => {
          // Use data_atendimento for peak analysis
          if (!item.data_atendimento) return;

          // Only count attended patients for "Peak" analysis
          if (item.compareceu !== true) return;

          let key = '';

          // Logic for Hours (Day View) vs Days (Month View)
          if (isDayView) {
            // For "Peak Hours", preferred source is 'chegou_em' (actual arrival), fallback to 'data_atendimento'
            const timeSource = item.chegou_em || item.data_atendimento;

            if (!timeSource) return;

            let h = 0;
            // Handle "HH:mm:ss" string format (common in Postgres time types)
            if (typeof timeSource === 'string' && timeSource.includes(':') && timeSource.length === 8) {
              h = parseInt(timeSource.split(':')[0], 10);
            } else {
              // Handle ISO Date
              const date = parseISO(timeSource);
              h = getHours(date);
            }

            const endH = (h + 1) % 24;
            key = `${h.toString().padStart(2, '0')}:00 às ${endH.toString().padStart(2, '0')}:00`;
          } else {
            const date = parseISO(item.data_atendimento);
            key = format(date, 'dd/MM');
          }

          peakMap.set(key, (peakMap.get(key) || 0) + 1);
        });

        const sortedPeak = Array.from(peakMap.entries())
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, isDayView ? 4 : 7); // Top 4 for Hours, Top 7 for Days

        // Sort back by label for timeline consistency if needed, or by value for "Peak". 
        // User asked for "Peak Days", usually implying ranking. "Most appointments". 
        // Keeping them sorted by value (descending) is best for "Peak" identification.

        setPeakData(sortedPeak);

      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [filter]);

  const openModal = (title: string, list: any[]) => {
    setModalTitle(title);
    setModalList(list);
    setSearchTerm(''); // Reset search on open
    setIsModalOpen(true);
  };

  const handleTotalClick = () => {
    openModal('Total de Agendamentos', currData);
  };

  const handleAttendedClick = () => {
    const list = currData.filter(r => r.compareceu === true);
    openModal('Pacientes Atendidos', list);
  };

  const handlePendingClick = () => {
    const list = currData.filter(r => r.compareceu === false || r.compareceu === null);
    openModal('Pendentes / Faltas', list);
  };

  const handleRateClick = () => {
    const attendedRows = currData.filter(r => r.compareceu === true);
    const companyCountMap: Record<string, number> = {};

    attendedRows.forEach(row => {
      const unitName = row.colaboradores?.unidades?.nome_unidade || 'Sem Unidade';
      companyCountMap[unitName] = (companyCountMap[unitName] || 0) + 1;
    });

    const breakdown = Object.entries(companyCountMap)
      .map(([company, count]) => ({ company, count }))
      .sort((a, b) => b.count - a.count);

    setRateBreakdown(breakdown);
    setIsRateModalOpen(true);
  };

  const filteredList = useMemo(() => {
    if (!isModalOpen) return [];
    return modalList.filter(item => {
      const searchLower = searchTerm.toLowerCase();

      const nome = item.colaboradores?.nome?.toLowerCase() || '';
      const setor = item.colaboradores?.setor?.toLowerCase() || '';
      const cargo = item.colaboradores?.cargos?.nome?.toLowerCase() || '';
      const unidade = item.colaboradores?.unidades?.nome_unidade?.toLowerCase() || '';

      return nome.includes(searchLower) ||
        setor.includes(searchLower) ||
        cargo.includes(searchLower) ||
        unidade.includes(searchLower);
    });
  }, [modalList, searchTerm, isModalOpen]);

  return (
    <div className="space-y-8 relative">
      <h2 className="text-xl font-bold text-slate-800 border-b border-slate-200/50 pb-2">Setor de Saúde (Agendamentos)</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <KPICard
          title="Total Agendamentos"
          value={metrics.total.current}
          prevValue={metrics.total.prev}
          isLoading={loading}
          icon={<Activity size={24} />}
          onClick={handleTotalClick}
        />
        <KPICard
          title="Pacientes Atendidos"
          value={metrics.attended.current}
          prevValue={metrics.attended.prev}
          isLoading={loading}
          icon={<UserCheck size={24} />}
          onClick={handleAttendedClick}
        />
        <KPICard
          title="Pendentes/Faltas"
          value={metrics.pending.current}
          prevValue={metrics.pending.prev}
          isLoading={loading}
          icon={<Clock size={24} />}
          onClick={handlePendingClick}
        />
        <KPICard
          title="Taxa de Comparecimento (%)"
          value={parseFloat(metrics.rate.current.toFixed(1))}
          prevValue={parseFloat(metrics.rate.prev.toFixed(1))}
          isLoading={loading}
          icon={<UserCheck size={24} />}
        />
        <KPICard
          title="Taxa de Pacientes por Empresa"
          value={Math.round(metrics.patientCompanyRate.current)}
          prevValue={Math.round(metrics.patientCompanyRate.prev)}
          isLoading={loading}
          icon={<Building2 size={24} />}
          extraInfo={`${metrics.attended.current} Pacientes / ${metrics.units.current} Empresas`}
          onClick={handleRateClick}
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Volume Chart - 55% */}
        <div className="w-full lg:w-[55%] bg-white/60 backdrop-blur-xl p-8 rounded-3xl shadow-lg shadow-slate-200/50 border border-white/50">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Volume de Atendimentos</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip
                  cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-white/50 shadow-xl overflow-hidden min-w-[200px]">
                          <p className="text-sm font-bold text-slate-800 mb-2 border-b border-slate-100 pb-1">{label}</p>
                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between items-center gap-4">
                              <span className="text-emerald-600 font-bold flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                Atual:
                              </span>
                              <div className="text-right">
                                <span className="text-slate-700 font-bold block">{payload[1].value} pacientes</span>
                                <span className="text-slate-500 block">{formatCurrency(payload[1].payload.valorAtual)}</span>
                              </div>
                            </div>
                            <div className="flex justify-between items-center gap-4">
                              <span className="text-slate-400 font-bold flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                                Anterior:
                              </span>
                              <div className="text-right">
                                <span className="text-slate-500 font-bold block">{payload[0].value} pacientes</span>
                                <span className="text-slate-400 block">{formatCurrency(payload[0].payload.valorAnterior)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="Anterior" fill="#94a3b8" radius={[8, 8, 8, 8]} />
                <Bar dataKey="Atual" fill="#10b981" radius={[8, 8, 8, 8]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Peak Analysis - 45% */}
        <div className="w-full lg:w-[45%] bg-white/60 backdrop-blur-xl p-8 rounded-3xl shadow-lg shadow-slate-200/50 border border-white/50">
          <div className="flex items-center gap-2 mb-6">
            <div className="bg-amber-100 p-2 rounded-lg text-amber-600">
              <Zap size={20} />
            </div>
            <h3 className="text-lg font-bold text-slate-800">
              {peakType === 'days' ? 'Dias de Maior Movimento' : 'Horários de Pico'}
            </h3>
          </div>

          <div className="h-80 w-full">
            {peakData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={peakData} layout="vertical" margin={{ left: 0, right: 30, top: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(0,0,0,0.05)" />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    width={110}
                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                    contentStyle={{
                      backgroundColor: 'rgba(255,255,255,0.8)',
                      backdropFilter: 'blur(8px)',
                      borderRadius: '16px',
                      border: '1px solid rgba(255,255,255,0.5)',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={24}>
                    {peakData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#f59e0b' : '#94a3b8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <Activity size={48} className="mb-4 opacity-20" />
                <p>Sem dados suficientes</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col p-6 border-b border-slate-100 gap-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-800">{modalTitle}</h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  placeholder="Buscar por nome, setor, cargo ou unidade..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="p-0 max-h-[60vh] overflow-y-auto">
              {filteredList.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  Nenhum registro encontrado.
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {filteredList.map((item, idx) => (
                    <div key={idx} className="p-4 hover:bg-slate-50 transition-colors flex items-center gap-4">
                      <div className={`w-2 h-2 rounded-full ${item.compareceu === true ? 'bg-green-500' :
                        item.compareceu === false ? 'bg-red-500' : 'bg-amber-500'
                        }`}></div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-slate-800 truncate">
                          {item.colaboradores?.nome || 'Colaborador desconhecido'}
                        </div>
                        <div className="flex flex-wrap gap-x-2 text-xs text-slate-500 mt-0.5">
                          {item.colaboradores?.setor && (
                            <span>{item.colaboradores.setor}</span>
                          )}
                          {item.colaboradores?.cargos?.nome && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span>{item.colaboradores.cargos.nome}</span>
                            </>
                          )}
                          {item.colaboradores?.unidades?.nome_unidade && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span className="text-blue-600">{item.colaboradores.unidades.nome_unidade}</span>
                            </>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          Chegada: {(() => {
                            if (!item.chegou_em) return 'Não registrado';
                            try {
                              if (typeof item.chegou_em === 'string' && item.chegou_em.length === 8 && item.chegou_em.includes(':')) {
                                return item.chegou_em.substring(0, 5);
                              }
                              return format(new Date(item.chegou_em), "dd/MM/yyyy HH:mm");
                            } catch (e) {
                              return item.chegou_em;
                            }
                          })()}
                        </div>
                      </div>
                      <div className="text-xs font-medium px-2.5 py-1 rounded-lg border whitespace-nowrap">
                        {item.compareceu === true ? (
                          <span className="text-green-600 border-green-100 bg-green-50">Compareceu</span>
                        ) : item.compareceu === false ? (
                          <span className="text-red-600 border-red-100 bg-red-50">Faltou</span>
                        ) : (
                          <span className="text-amber-600 border-amber-100 bg-amber-50">Pendente</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-medium text-sm"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rate Breakdown Modal */}
      {isRateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col p-6 border-b border-slate-100 bg-white">
              <div className="flex justify-between items-center mb-1">
                <h3 className="text-lg font-bold text-slate-800">Detalhamento por Empresa</h3>
                <button
                  onClick={() => setIsRateModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                Total: {metrics.units.current} Empresas | {metrics.attended.current} Pacientes Atendidos
              </p>
            </div>
            <div className="p-0 max-h-[50vh] overflow-y-auto bg-slate-50/30">
              {rateBreakdown.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  <Building2 size={48} className="mx-auto mb-3 opacity-20" />
                  <p>Nenhum dado disponível.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {rateBreakdown.map((item, idx) => (
                    <div key={idx} className="px-6 py-4 flex items-center justify-between hover:bg-white transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 text-blue-500 rounded-xl group-hover:bg-blue-100 transition-colors">
                          <Building2 size={18} />
                        </div>
                        <span className="font-semibold text-slate-700">{item.company}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-800 bg-slate-100 px-3 py-1 rounded-full group-hover:bg-slate-200 transition-colors">
                          {item.count} {item.count === 1 ? 'Paciente' : 'Pacientes'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button
                onClick={() => setIsRateModalOpen(false)}
                className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-100 font-bold text-sm transition-all active:scale-95 shadow-sm"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};