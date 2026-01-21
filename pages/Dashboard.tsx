import React, { useContext, useEffect, useState } from 'react';
// import { format } from 'date-fns'; // Removed
import { getUTCStart, getUTCEnd } from '../utils/dateUtils';
import { FilterContext } from '../layouts/MainLayout';
import { KPICard } from '../components/KPICard';
import { supabase } from '../services/supabase';
import { Users, DollarSign, CheckCircle, Stethoscope } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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
          title="Faturamento (Real)"
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
        />
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
                <Bar dataKey="Atual" name="Atual" fill="#3b82f6" radius={[4, 4, 4, 4]} />
                <Bar dataKey="Anterior" name="Anterior" fill="#e2e8f0" radius={[4, 4, 4, 4]} />
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
                <Bar dataKey="Atual" name="Atual" fill="#a855f7" radius={[4, 4, 4, 4]} />
                <Bar dataKey="Anterior" name="Anterior" fill="#e2e8f0" radius={[4, 4, 4, 4]} />
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
                <Bar dataKey="Atual" name="Atual" fill="#ec4899" radius={[4, 4, 4, 4]} />
                <Bar dataKey="Anterior" name="Anterior" fill="#e2e8f0" radius={[4, 4, 4, 4]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};