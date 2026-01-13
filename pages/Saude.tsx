import React, { useContext, useEffect, useState } from 'react';
import { format } from 'date-fns';
import { FilterContext } from '../layouts/MainLayout';
import { KPICard } from '../components/KPICard';
import { supabase } from '../services/supabase';
import { UserCheck, Clock, Activity, X, Search } from 'lucide-react'; // Added Search icon
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const Saude: React.FC = () => {
  const filter = useContext(FilterContext);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    total: { current: 0, prev: 0 },
    attended: { current: 0, prev: 0 },
    pending: { current: 0, prev: 0 },
    rate: { current: 0, prev: 0 }
  });
  const [chartData, setChartData] = useState<any[]>([]);

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
        const startDate = format(filter.startDate, "yyyy-MM-dd'T'00:00:00");
        const endDate = format(filter.endDate, "yyyy-MM-dd'T'23:59:59");
        const prevStart = format(filter.prevStartDate, "yyyy-MM-dd'T'00:00:00");
        const prevEnd = format(filter.prevEndDate, "yyyy-MM-dd'T'23:59:59");

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
            .lte('data_atendimento', end);

          if (error) throw error;
          return data || [];
        }

        const curr = await fetchAgendamentos(startDate, endDate);
        const prev = await fetchAgendamentos(prevStart, prevEnd);

        setCurrData(curr);

        const calc = (rows: any[]) => {
          const total = rows.length;
          const attended = rows.filter(r => r.compareceu === true).length;
          const pending = rows.filter(r => r.compareceu === false || r.compareceu === null).length;
          const rate = total > 0 ? (attended / total) * 100 : 0;
          return { total, attended, pending, rate };
        }

        const c = calc(curr);
        const p = calc(prev);

        setMetrics({
          total: { current: c.total, prev: p.total },
          attended: { current: c.attended, prev: p.attended },
          pending: { current: c.pending, prev: p.pending },
          rate: { current: c.rate, prev: p.rate }
        });

        setChartData([
          { name: 'Realizados', Atual: c.attended, Anterior: p.attended },
          { name: 'Pendentes', Atual: c.pending, Anterior: p.pending },
          { name: 'Total', Atual: c.total, Anterior: p.total },
        ]);

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

  const filteredList = modalList.filter(item => {
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

  return (
    <div className="space-y-8 relative">
      <h2 className="text-xl font-bold text-slate-800 border-b border-slate-200/50 pb-2">Setor de Saúde (Agendamentos)</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
      </div>

      <div className="bg-white/60 backdrop-blur-xl p-8 rounded-3xl shadow-lg shadow-slate-200/50 border border-white/50">
        <h3 className="text-lg font-bold text-slate-800 mb-6">Volume de Atendimentos</h3>
        <div className="h-96 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barSize={40}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
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
              <Bar dataKey="Atual" fill="#10b981" radius={[8, 8, 8, 8]} />
              <Bar dataKey="Anterior" fill="#e2e8f0" radius={[8, 8, 8, 8]} />
            </BarChart>
          </ResponsiveContainer>
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
    </div>
  );
};