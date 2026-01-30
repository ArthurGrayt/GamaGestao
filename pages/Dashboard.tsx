import React, { useContext, useEffect, useState } from 'react';
// import { format } from 'date-fns'; // Removed
import { getUTCStart, getUTCEnd } from '../utils/dateUtils';
import { FilterContext } from '../layouts/MainLayout';
import { KPICard } from '../components/KPICard';
import { supabase } from '../services/supabase';
import { X, Users, DollarSign, CheckCircle, Stethoscope, Building2, ArrowLeft, User, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { FinancialHealthQuadrant } from '../components/FinancialHealthQuadrant';
import { OperationalEfficiencyQuadrant } from '../components/OperationalEfficiencyQuadrant';
import { ExpansionAcademyQuadrant } from '../components/ExpansionAcademyQuadrant';
import { ClimateQualityQuadrant } from '../components/ClimateQualityQuadrant';
import { ManagementGoalsQuadrant } from '../components/ManagementGoalsQuadrant';
import { IndividualGoalsQuadrant } from '../components/IndividualGoalsQuadrant';
import { SupportTicketsQuadrant } from '../components/SupportTicketsQuadrant';


export const Dashboard: React.FC = () => {
  const filter = useContext(FilterContext);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    revenue: { current: 0, prev: 0 },
    clients: { current: 0, prev: 0 },
    appointments: { current: 0, prev: 0 },
    tasks: { current: 0, prev: 0 },
  });

  const [chartData, setChartData] = useState<any[]>([]);

  const [showModal, setShowModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [breakdownData, setBreakdownData] = useState<{ name: string, count: number, percent: number }[]>([]);
  const [rawAppointments, setRawAppointments] = useState<any[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);

  // Function to calculate breakdown of companies
  const handleShowBreakdown = async () => {
    setShowModal(true);
    setModalLoading(true);
    setSelectedUnit(null); // Reset drill-down
    try {
      const startDate = getUTCStart(filter.startDate);
      const endDate = getUTCEnd(filter.endDate);

      // Fetch appointments with unit info (via employee)
      const { data, error } = await supabase
        .from('agendamentos')
        .select(`
          id,
          colaborador:colaborador_id (
            nome,
            unidades ( nome_unidade )
          )
        `)
        .gte('data_atendimento', startDate)
        .lt('data_atendimento', endDate);

      if (error) {
        console.error('Error fetching breakdown:', error);
        return;
      }

      if (data) {
        setRawAppointments(data); // Store raw data for drill-down

        const total = data.length;
        const countMap: Record<string, number> = {};

        data.forEach((item: any) => {
          // Extract unit name safely
          const unitName = item.colaborador?.unidades?.nome_unidade || 'Sem Unidade';
          countMap[unitName] = (countMap[unitName] || 0) + 1;
        });

        // Convert to array and sort
        const result = Object.entries(countMap)
          .map(([name, count]) => ({
            name,
            count,
            percent: total > 0 ? (count / total) * 100 : 0
          }))
          .sort((a, b) => b.count - a.count);

        setBreakdownData(result);
      }

    } catch (err) {
      console.error(err);
    } finally {
      setModalLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const startDate = getUTCStart(filter.startDate);
        const endDate = getUTCEnd(filter.endDate);
        const prevStart = getUTCStart(filter.prevStartDate);
        const prevEnd = getUTCEnd(filter.prevEndDate);

        // Define Queries
        const qCurrRev = supabase.from('financeiro_receitas')
          .select('valor_total')
          .gte('data_projetada', startDate)
          .lt('data_projetada', endDate);

        const qPrevRev = supabase.from('financeiro_receitas')
          .select('valor_total')
          .gte('data_projetada', prevStart)
          .lt('data_projetada', prevEnd);

        const qCurrCli = supabase.from('clientes')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', startDate)
          .lt('created_at', endDate);

        const qPrevCli = supabase.from('clientes')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', prevStart)
          .lt('created_at', prevEnd);

        const qCurrApp = supabase.from('agendamentos')
          .select('*', { count: 'exact', head: true })
          .gte('data_atendimento', startDate)
          .lt('data_atendimento', endDate);

        const qPrevApp = supabase.from('agendamentos')
          .select('*', { count: 'exact', head: true })
          .gte('data_atendimento', prevStart)
          .lt('data_atendimento', prevEnd);

        const qCurrTask = supabase.from('kanban')
          .select('*', { count: 'exact', head: true })
          .not('concluido_em', 'is', null)
          .gte('concluido_em', startDate)
          .lt('concluido_em', endDate);

        const qPrevTask = supabase.from('kanban')
          .select('*', { count: 'exact', head: true })
          .not('concluido_em', 'is', null)
          .gte('concluido_em', prevStart)
          .lt('concluido_em', prevEnd);

        // Execute all in parallel
        const [
          { data: currRev },
          { data: prevRev },
          { count: currCli },
          { count: prevCli },
          { count: currApp },
          { count: prevApp },
          { count: currTask },
          { count: prevTask }
        ] = await Promise.all([
          qCurrRev,
          qPrevRev,
          qCurrCli,
          qPrevCli,
          qCurrApp,
          qPrevApp,
          qCurrTask,
          qPrevTask
        ]);

        const totalCurrRev = currRev?.reduce((acc, curr) => acc + (Number(curr.valor_total) || 0), 0) || 0;
        const totalPrevRev = prevRev?.reduce((acc, curr) => acc + (Number(curr.valor_total) || 0), 0) || 0;

        setStats({
          revenue: { current: totalCurrRev, prev: totalPrevRev },
          clients: { current: currCli || 0, prev: prevCli || 0 },
          appointments: { current: currApp || 0, prev: prevApp || 0 },
          tasks: { current: currTask || 0, prev: prevTask || 0 },
        });

        // Simplified Chart Data - No longer normalized
        setChartData([
          { name: 'Receita', Atual: totalCurrRev, Anterior: totalPrevRev },
          { name: 'Clientes', Atual: currCli || 0, Anterior: prevCli || 0 },
          { name: 'Atendimentos', Atual: currApp || 0, Anterior: prevApp || 0 },
        ]);

      } catch (error) {
        console.error("Error fetching dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filter]);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Faturamento (Bruto)"
          value={stats.revenue.current}
          prevValue={stats.revenue.prev}
          isCurrency
          isLoading={loading}
          icon={<DollarSign size={24} />}
        />
        <KPICard
          title="Novos Clientes"
          value={stats.clients.current}
          prevValue={stats.clients.prev}
          isLoading={loading}
          icon={<Users size={24} />}
        />
        <KPICard
          title="Atendimentos"
          value={stats.appointments.current}
          prevValue={stats.appointments.prev}
          isLoading={loading}
          icon={<Stethoscope size={24} />}
          onClick={handleShowBreakdown}
        />
        {/* Breakdown Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white">
                <div className="flex items-center gap-3">
                  {selectedUnit && (
                    <button
                      onClick={() => setSelectedUnit(null)}
                      className="p-1.5 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
                    >
                      <ArrowLeft size={20} />
                    </button>
                  )}
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">
                      {selectedUnit ? selectedUnit : "Taxa por Empresa"}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {selectedUnit ? "Colaboradores atendidos no período" : "Distribuição dos atendimentos no período"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-red-500 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                {modalLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                    <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-3"></div>
                    <p className="text-sm">Calculando estatísticas...</p>
                  </div>
                ) : selectedUnit ? (
                  // Drill-Down View
                  <div className="space-y-3">
                    {(() => {
                      // Filter and deduplicate collaborators for the selected unit
                      const collaborators = rawAppointments
                        .filter(item => {
                          const uName = item.colaborador?.unidades?.nome_unidade || 'Sem Unidade';
                          return uName === selectedUnit;
                        })
                        .map(item => item.colaborador?.nome || 'Nome Indisponível')
                        .sort();

                      const uniqueCollaborators = [...new Set(collaborators)];

                      if (uniqueCollaborators.length === 0) {
                        return (
                          <div className="text-center py-8 text-slate-400">
                            <User size={32} className="mx-auto mb-2 opacity-20" />
                            <p>Nenhum colaborador encontrado.</p>
                          </div>
                        );
                      }

                      return uniqueCollaborators.map((name, idx) => (
                        <div key={idx} className="bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
                          <div className="bg-blue-50 p-2 rounded-full text-blue-500">
                            <User size={16} />
                          </div>
                          <span className="font-medium text-slate-700">{name}</span>
                        </div>
                      ));
                    })()}
                  </div>
                ) : breakdownData.length === 0 ? (
                  <div className="text-center py-10 text-slate-400">
                    <Building2 size={40} className="mx-auto mb-2 opacity-20" />
                    <p>Nenhum dado encontrado para este período.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {breakdownData.map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm cursor-pointer hover:border-blue-300 hover:shadow-md transition-all group"
                        onClick={() => setSelectedUnit(item.name)}
                      >
                        <div className="flex justify-between items-end mb-2">
                          <span className="font-bold text-slate-700 group-hover:text-blue-600 transition-colors">{item.name}</span>
                          <div className="text-right">
                            <span className="text-lg font-bold text-blue-600">{item.percent.toFixed(1)}%</span>
                            <span className="text-xs text-slate-400 ml-1">({item.count})</span>
                          </div>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-blue-500 h-full rounded-full transition-all duration-500 group-hover:bg-blue-600"
                            style={{ width: `${item.percent}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        <KPICard
          title="Tarefas Concluídas"
          value={stats.tasks.current}
          prevValue={stats.tasks.prev}
          isLoading={loading}
          icon={<CheckCircle size={24} />}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Chart 1: Revenue */}
        <div className="bg-white/60 backdrop-blur-xl p-6 rounded-3xl shadow-lg shadow-slate-200/50 border border-white/50">
          <h3 className="text-md font-bold text-slate-800 mb-6 tracking-tight flex items-center gap-2">
            <DollarSign size={18} className="text-blue-500" />
            Receita
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[chartData[0] || {}]} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="name" hide />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                <Tooltip
                  cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                  contentStyle={{ backgroundColor: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(8px)', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  formatter={(value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
                />
                <Bar dataKey="Anterior" name="Anterior" fill="#94a3b8" radius={[4, 4, 4, 4]} />
                <Bar dataKey="Atual" name="Atual" fill="#3b82f6" radius={[4, 4, 4, 4]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Clients */}
        <div className="bg-white/60 backdrop-blur-xl p-6 rounded-3xl shadow-lg shadow-slate-200/50 border border-white/50">
          <h3 className="text-md font-bold text-slate-800 mb-6 tracking-tight flex items-center gap-2">
            <Users size={18} className="text-purple-500" />
            Novos Clientes
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[chartData[1] || {}]} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="name" hide />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                  contentStyle={{ backgroundColor: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(8px)', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                />
                <Bar dataKey="Anterior" name="Anterior" fill="#94a3b8" radius={[4, 4, 4, 4]} />
                <Bar dataKey="Atual" name="Atual" fill="#a855f7" radius={[4, 4, 4, 4]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Appointments */}
        <div className="bg-white/60 backdrop-blur-xl p-6 rounded-3xl shadow-lg shadow-slate-200/50 border border-white/50">
          <h3 className="text-md font-bold text-slate-800 mb-6 tracking-tight flex items-center gap-2">
            <Stethoscope size={18} className="text-pink-500" />
            Atendimentos
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[chartData[2] || {}]} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="name" hide />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                  contentStyle={{ backgroundColor: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(8px)', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                />
                <Bar dataKey="Anterior" name="Anterior" fill="#94a3b8" radius={[4, 4, 4, 4]} />
                <Bar dataKey="Atual" name="Atual" fill="#ec4899" radius={[4, 4, 4, 4]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <FinancialHealthQuadrant />
        <OperationalEfficiencyQuadrant />
        <ExpansionAcademyQuadrant />
        <ClimateQualityQuadrant />
        <ManagementGoalsQuadrant />
        <IndividualGoalsQuadrant />
        <SupportTicketsQuadrant />
      </div>
    </div>
  );
};