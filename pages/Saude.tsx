import React, { useContext, useEffect, useState } from 'react';
import { FilterContext } from '../layouts/MainLayout';
import { KPICard } from '../components/KPICard';
import { supabase } from '../services/supabase';
import { UserCheck, Clock, Activity } from 'lucide-react';
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

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const startDate = filter.startDate.toISOString();
        const endDate = filter.endDate.toISOString();
        const prevStart = filter.prevStartDate.toISOString();
        const prevEnd = filter.prevEndDate.toISOString();

        const fetchAgendamentos = async (start: string, end: string) => {
            const { data } = await supabase.from('agendamentos')
                .select('status, compareceu')
                .gte('data_atendimento', start)
                .lte('data_atendimento', end);
            return data || [];
        }

        const curr = await fetchAgendamentos(startDate, endDate);
        const prev = await fetchAgendamentos(prevStart, prevEnd);

        const calc = (rows: any[]) => {
            const total = rows.length;
            const attended = rows.filter(r => r.compareceu === true).length;
            const pending = rows.filter(r => r.status === 'pendente').length;
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

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-bold text-slate-800 border-b border-slate-200/50 pb-2">Setor de Saúde (Agendamentos)</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Agendamentos"
          value={metrics.total.current}
          prevValue={metrics.total.prev}
          isLoading={loading}
          icon={<Activity size={24} />}
        />
        <KPICard
          title="Pacientes Atendidos"
          value={metrics.attended.current}
          prevValue={metrics.attended.prev}
          isLoading={loading}
          icon={<UserCheck size={24} />}
        />
        <KPICard
          title="Pendentes/Faltas"
          value={metrics.pending.current}
          prevValue={metrics.pending.prev}
          isLoading={loading}
          icon={<Clock size={24} />}
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
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                    cursor={{fill: 'rgba(0,0,0,0.02)'}}
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
    </div>
  );
};