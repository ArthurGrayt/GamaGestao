import React, { useContext, useEffect, useState } from 'react';
import { FilterContext } from '../layouts/MainLayout';
import { KPICard } from '../components/KPICard';
import { supabase } from '../services/supabase';
import { Briefcase, FileText, Award, Users } from 'lucide-react';

export const Comercial: React.FC = () => {
  const filter = useContext(FilterContext);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    newClients: { current: 0, prev: 0 },
    proposals: { current: 0, prev: 0 },
    activeContracts: { current: 0, prev: 0 },
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const startDate = filter.startDate.toISOString();
        const endDate = filter.endDate.toISOString();
        const prevStart = filter.prevStartDate.toISOString();
        const prevEnd = filter.prevEndDate.toISOString();

        const getClients = async (start: string, end: string) => {
            const { count } = await supabase.from('clientes')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', start)
            .lte('created_at', end);
            return count || 0;
        }

        const getProposals = async (start: string, end: string) => {
            const { count } = await supabase.from('proposta')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', start)
            .lte('created_at', end);
            return count || 0;
        }

        const currCli = await getClients(startDate, endDate);
        const prevCli = await getClients(prevStart, prevEnd);
        const currProp = await getProposals(startDate, endDate);
        const prevProp = await getProposals(prevStart, prevEnd);

        setData({
            newClients: { current: currCli, prev: prevCli },
            proposals: { current: currProp, prev: prevProp },
            activeContracts: { current: 0, prev: 0 } // Logic depends on specific status fields not fully clear in schema
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
      <h2 className="text-xl font-bold text-slate-800 border-b border-slate-200/50 pb-2">Setor Comercial</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <KPICard
          title="Novos Clientes"
          value={data.newClients.current}
          prevValue={data.newClients.prev}
          isLoading={loading}
          icon={<Users size={24} />}
        />
        <KPICard
          title="Propostas Geradas"
          value={data.proposals.current}
          prevValue={data.proposals.prev}
          isLoading={loading}
          icon={<FileText size={24} />}
        />
        <KPICard
          title="Contratos Ativos"
          value={data.activeContracts.current}
          prevValue={data.activeContracts.prev}
          isLoading={loading}
          icon={<Award size={24} />}
        />
      </div>
    </div>
  );
};