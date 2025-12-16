import React, { useContext, useEffect, useState } from 'react';
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
        const startDate = filter.startDate.toISOString();
        const endDate = filter.endDate.toISOString();
        const prevStart = filter.prevStartDate.toISOString();
        const prevEnd = filter.prevEndDate.toISOString();

        // 1. Revenue (Financeiro Transacoes) - Receber AND Status != Cancelado
        const { data: currRev } = await supabase.from('financeiro_transacoes')
          .select('valor_original')
          .eq('tipo_transacao', 'Receber')
          .neq('status', 'Cancelado')
          .gte('data_emissao', startDate)
          .lte('data_emissao', endDate);

        const { data: prevRev } = await supabase.from('financeiro_transacoes')
          .select('valor_original')
          .eq('tipo_transacao', 'Receber')
          .neq('status', 'Cancelado')
          .gte('data_emissao', prevStart)
          .lte('data_emissao', prevEnd);

        // 2. Clients (Novos Clientes)
        const { count: currCli } = await supabase.from('clientes')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', startDate)
          .lte('created_at', endDate);

        const { count: prevCli } = await supabase.from('clientes')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', prevStart)
          .lte('created_at', prevEnd);

        // 3. Appointments (Agendamentos)
        const { count: currApp } = await supabase.from('agendamentos')
          .select('*', { count: 'exact', head: true })
          .gte('data_atendimento', startDate)
          .lte('data_atendimento', endDate);

        const { count: prevApp } = await supabase.from('agendamentos')
          .select('*', { count: 'exact', head: true })
          .gte('data_atendimento', prevStart)
          .lte('data_atendimento', prevEnd);

         // 4. Tasks (Kanban Done)
         const { count: currTask } = await supabase.from('kanban')
         .select('*', { count: 'exact', head: true })
         .eq('status', 'concluido')
         .gte('concluido_em', startDate)
         .lte('concluido_em', endDate);

       const { count: prevTask } = await supabase.from('kanban')
         .select('*', { count: 'exact', head: true })
         .eq('status', 'concluido')
         .gte('concluido_em', prevStart)
         .lte('concluido_em', prevEnd);


        const totalCurrRev = currRev?.reduce((acc, curr) => acc + (Number(curr.valor_original) || 0), 0) || 0;
        const totalPrevRev = prevRev?.reduce((acc, curr) => acc + (Number(curr.valor_original) || 0), 0) || 0;

        setStats({
          revenue: { current: totalCurrRev, prev: totalPrevRev },
          clients: { current: currCli || 0, prev: prevCli || 0 },
          appointments: { current: currApp || 0, prev: prevApp || 0 },
          tasks: { current: currTask || 0, prev: prevTask || 0 },
        });

        // Simplified Chart Data - Normalized for visual comparison
        setChartData([
          { name: 'Receita', Atual: totalCurrRev, Anterior: totalPrevRev },
          { name: 'Clientes (x100)', Atual: (currCli || 0) * 100, Anterior: (prevCli || 0) * 100 },
          { name: 'Atendimentos (x10)', Atual: (currApp || 0) * 10, Anterior: (prevApp || 0) * 10 },
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

      <div className="bg-white/60 backdrop-blur-xl p-8 rounded-3xl shadow-lg shadow-slate-200/50 border border-white/50">
        <h3 className="text-lg font-bold text-slate-800 mb-8 tracking-tight">Comparativo de Performance</h3>
        <div className="h-96 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barSize={40}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#64748b', fontSize: 12}} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#64748b', fontSize: 12}} 
              />
              <Tooltip 
                cursor={{fill: 'rgba(0,0,0,0.02)'}}
                contentStyle={{
                    backgroundColor: 'rgba(255,255,255,0.8)', 
                    backdropFilter: 'blur(8px)', 
                    borderRadius: '16px', 
                    border: '1px solid rgba(255,255,255,0.5)',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                }}
                formatter={(value: number, name: string) => {
                    if (name === 'Receita') return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
                    return value;
                }}
              />
              <Bar dataKey="Atual" fill="#3b82f6" radius={[8, 8, 8, 8]} />
              <Bar dataKey="Anterior" fill="#e2e8f0" radius={[8, 8, 8, 8]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};