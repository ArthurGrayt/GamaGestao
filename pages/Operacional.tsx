import React, { useContext, useEffect, useState } from 'react';
import { FilterContext } from '../layouts/MainLayout';
import { KPICard } from '../components/KPICard';
import { supabase } from '../services/supabase';
import { CheckSquare, ListTodo, AlertCircle, Clock } from 'lucide-react';

export const Operacional: React.FC = () => {
  const filter = useContext(FilterContext);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    created: { current: 0, prev: 0 },
    done: { current: 0, prev: 0 },
    wip: { current: 0, prev: 0 },
    avgTime: { current: 0, prev: 0 } 
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const startDate = filter.startDate.toISOString();
        const endDate = filter.endDate.toISOString();
        const prevStart = filter.prevStartDate.toISOString();
        const prevEnd = filter.prevEndDate.toISOString();

        // Tasks Created
        const getCount = async (start: string, end: string, status?: string) => {
            let query = supabase.from('kanban').select('*', { count: 'exact', head: true }).gte('created_at', start).lte('created_at', end);
            if (status) query = query.eq('status', status);
            const { count } = await query;
            return count || 0;
        }

        const currCreated = await getCount(startDate, endDate);
        const prevCreated = await getCount(prevStart, prevEnd);

        // We assume 'concluido' is the status for done
        const currDone = await getCount(startDate, endDate, 'concluido');
        const prevDone = await getCount(prevStart, prevEnd, 'concluido');

        setData({
            created: { current: currCreated, prev: prevCreated },
            done: { current: currDone, prev: prevDone },
            wip: { current: currCreated - currDone, prev: prevCreated - prevDone }, // Rough approximation
            avgTime: { current: 0, prev: 0 } // Complexity of interval calc skipped for brevity
        });

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [filter]);

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-bold text-slate-800 border-b border-slate-200/50 pb-2">Setor Operacional (Kanban)</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Tarefas Criadas"
          value={data.created.current}
          prevValue={data.created.prev}
          isLoading={loading}
          icon={<ListTodo size={24} />}
        />
        <KPICard
          title="Tarefas Concluídas"
          value={data.done.current}
          prevValue={data.done.prev}
          isLoading={loading}
          icon={<CheckSquare size={24} />}
        />
        <KPICard
          title="Em Andamento"
          value={data.wip.current}
          prevValue={data.wip.prev}
          isLoading={loading}
          icon={<Clock size={24} />}
        />
        <KPICard
          title="Pendências Críticas"
          value={0} // Placeholder for priority logic
          prevValue={0}
          isLoading={loading}
          icon={<AlertCircle size={24} />}
        />
      </div>
      
      <div className="bg-white/60 backdrop-blur-xl p-8 rounded-3xl shadow-lg shadow-slate-200/50 border border-white/50">
          <p className="text-slate-500 text-center font-medium">Visualização detalhada de fluxo operacional em desenvolvimento.</p>
      </div>
    </div>
  );
};