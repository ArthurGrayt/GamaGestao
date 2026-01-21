import React, { useContext, useEffect, useState } from 'react';
import { FilterContext } from '../layouts/MainLayout';
import { KPICard } from '../components/KPICard';
import { supabase } from '../services/supabase';
import { FileText, Clock, CheckCircle, XCircle, PieChart as PieChartIcon, BarChart3, TrendingUp, Layers, Package, X, Building2 } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface ItemStat {
  name: string;
  count: number;
}

export const Comercial: React.FC = () => {
  const filter = useContext(FilterContext);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({

    totalPeriod: { current: 0, prev: 0 },
    backlog: { current: 0, prev: 0 }, // Cumulative Pending
    approved: { current: 0, prev: 0 }, // Period Approved
    rejected: { current: 0, prev: 0 }, // Period Rejected
    totalApprovedValue: { current: 0, prev: 0 }, // New: Value of Approved Items
  });

  const [chartData, setChartData] = useState<any[]>([]);
  const [itemStats, setItemStats] = useState<{
    topApproved: ItemStat[];
    topRejected: ItemStat[];
  }>({ topFreq: [], topApproved: [], topRejected: [] });

  // Modal State
  const [showApprovedModal, setShowApprovedModal] = useState(false);
  const [approvedDetails, setApprovedDetails] = useState<any[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Handler to fetch and show details
  const handleShowApprovedDetails = async () => {
    setShowApprovedModal(true);
    setLoadingDetails(true);
    try {
      const startDate = filter.startDate.toISOString();
      const endDate = filter.endDate.toISOString();

      // 1. Fetch Proposals in Period
      const { data: proposals, error: propError } = await supabase
        .from('proposta')
        .select('id, created_at, unidade_id, itensproposta')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (propError) throw propError;
      if (!proposals || proposals.length === 0) {
        setApprovedDetails([]);
        setLoadingDetails(false);
        return;
      }

      // 2. Fetch Units
      const unitIds = [...new Set(proposals.map(p => p.unidade_id).filter(Boolean))];
      let unitsMap: Record<number, string> = {};
      if (unitIds.length > 0) {
        const { data: units } = await supabase
          .from('unidades')
          .select('id, nome_unidade')
          .in('id', unitIds);

        if (units) {
          units.forEach((u: any) => unitsMap[u.id] = u.nome_unidade);
        }
      }

      // 3. Fetch All Relevant Items
      const allItemIds: number[] = [];
      proposals.forEach(p => {
        if (Array.isArray(p.itensproposta)) allItemIds.push(...p.itensproposta);
      });

      let itemsMap: Record<number, any> = {};
      if (allItemIds.length > 0) {
        const { data: items } = await supabase
          .from('itensproposta')
          .select('id, status, preco, quantidade, idprocedimento, procedimento(nome)')
          .in('id', [...new Set(allItemIds)]);

        if (items) {
          items.forEach((i: any) => itemsMap[i.id] = i);
        }
      }

      // 4. Group and Build Result
      const results: any[] = [];
      proposals.forEach(p => {
        const unitName = unitsMap[p.unidade_id] || 'Unidade Desconhecida';

        const approvedItems: any[] = [];
        if (Array.isArray(p.itensproposta)) {
          p.itensproposta.forEach((itemId: number) => {
            const item = itemsMap[itemId];
            if (item) {
              const s = (item.status || '').toUpperCase();
              if (s === 'APPROVED' || s === 'APROVADO') {
                approvedItems.push({
                  ...item,
                  name: item.procedimento?.nome || 'Item sem nome',
                  total: (item.preco || 0) * (item.quantidade || 1)
                });
              }
            }
          });
        }

        if (approvedItems.length > 0) {
          results.push({
            proposal_id: p.id,
            created_at: p.created_at,
            unit_name: unitName,
            items: approvedItems,
            total_value: approvedItems.reduce((sum, i) => sum + i.total, 0)
          });
        }
      });

      // Sort by date desc
      results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setApprovedDetails(results);

    } catch (err) {
      console.error("Error fetching approved details:", err);
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const startDate = filter.startDate.toISOString();
        const endDate = filter.endDate.toISOString();
        const prevStart = filter.prevStartDate.toISOString();
        const prevEnd = filter.prevEndDate.toISOString();

        // Helper to fetch counts
        const getCount = async (start: string | null, end: string, status?: string) => {
          let query = supabase.from('proposta')
            .select('*', { count: 'exact', head: true })
            .lte('created_at', end);

          if (start) {
            query = query.gte('created_at', start);
          }

          if (status) {
            query = query.eq('status', status);
          }

          const { count, error } = await query;
          if (error) console.error('Error fetching proposals:', error);
          return count || 0;
        };

        // Helper to fetch total value of approved items
        const getTotalApprovedValue = async (start: string, end: string) => {
          // 1. Get Proposals in range to find relevant items
          const { data: proposals } = await supabase
            .from('proposta')
            .select('itensproposta')
            .gte('created_at', start)
            .lte('created_at', end);

          if (!proposals || proposals.length === 0) return 0;

          // 2. Collect all item IDs
          const allItemIds: number[] = [];
          proposals.forEach((p: any) => {
            if (Array.isArray(p.itensproposta)) allItemIds.push(...p.itensproposta);
          });

          if (allItemIds.length === 0) return 0;

          // 3. Fetch Items that are APPROVED
          const { data: items } = await supabase
            .from('itensproposta')
            .select('preco, quantidade, status')
            .in('id', [...new Set(allItemIds)]); // Dedup just in case

          if (!items) return 0;

          // 4. Sum Value (Price * Qty) of APPROVED items
          return items.reduce((sum, item) => {
            const s = (item.status || '').toUpperCase();
            if (s === 'APPROVED' || s === 'APROVADO') {
              return sum + ((item.preco || 0) * (item.quantidade || 1));
            }
            return sum;
          }, 0);
        };

        // --- Current Period & Statuses ---
        const [

          periodTotal,
          periodPending,
          periodApproved,
          periodRejected,
          backlogCurrent,
          periodValue // Total Value Current
        ] = await Promise.all([

          getCount(startDate, endDate), // Total In Period
          getCount(startDate, endDate, 'PENDING'),
          getCount(startDate, endDate, 'APPROVED'),
          getCount(startDate, endDate, 'REJECTED'),
          getCount(startDate, endDate, 'PENDING'),
          getTotalApprovedValue(startDate, endDate)
        ]);

        // --- Previous Period ---
        const [

          prevPeriodTotal,
          prevApproved,
          prevRejected,
          backlogPrev,
          prevValue // Total Value Previous
        ] = await Promise.all([

          getCount(prevStart, prevEnd),
          getCount(prevStart, prevEnd, 'APPROVED'),
          getCount(prevStart, prevEnd, 'REJECTED'),
          getCount(prevStart, prevEnd, 'PENDING'),
          getTotalApprovedValue(prevStart, prevEnd)
        ]);

        setData({

          totalPeriod: { current: periodTotal, prev: prevPeriodTotal },
          backlog: { current: backlogCurrent, prev: backlogPrev },
          approved: { current: periodApproved, prev: prevApproved },
          rejected: { current: periodRejected, prev: prevRejected },
          totalApprovedValue: { current: periodValue, prev: prevValue },
        });

        // --- Chart Data (Distribution of Proposals Created IN PERIOD) ---
        const newChartData = [
          { name: 'Aprovadas', value: periodApproved, color: '#10B981' }, // Emerald-500
          { name: 'Pendentes', value: periodPending, color: '#F59E0B' }, // Amber-500
          { name: 'Reprovadas', value: periodRejected, color: '#EF4444' }, // Red-500
        ].filter(item => item.value > 0);

        setChartData(newChartData);

        // --- Item Statistics ---
        // 1. Fetch Proposals in Period (to get IDs and Status)
        const { data: proposals, error: propError } = await supabase
          .from('proposta')
          .select('id, status, itensproposta, created_at')
          .gte('created_at', startDate)
          .lte('created_at', endDate);

        if (propError) {
          console.error('Error fetching proposals for items:', propError);
        } else if (proposals) {
          // 2. Extract All Item IDs
          const allItemIds: number[] = [];
          proposals.forEach(p => {
            if (Array.isArray(p.itensproposta)) {
              allItemIds.push(...p.itensproposta);
            }
          });

          if (allItemIds.length > 0) {
            // 3. Fetch Item Details (Name + Status)
            const uniqueIds = [...new Set(allItemIds)];

            const { data: itemDetails, error: itemError } = await supabase
              .from('itensproposta')
              .select('id, idprocedimento, status, procedimento(nome)')
              .in('id', uniqueIds);

            if (itemError) {
              console.error('Error fetching item details:', itemError);
            } else if (itemDetails) {
              // Map ID -> Details
              const detailsMap = new Map<number, { name: string; status: string }>();
              itemDetails.forEach((i: any) => {
                detailsMap.set(i.id, {
                  name: i.procedimento?.nome || 'Item Desconhecido',
                  status: i.status
                });
              });

              // 4. Calculate Stats
              // Note: We use the ITEM's status now, not the proposal's status.
              const freqMap: Record<string, number> = {};
              const approvedMap: Record<string, number> = {};
              const rejectedMap: Record<string, number> = {};

              proposals.forEach(p => {
                const items = p.itensproposta;

                if (Array.isArray(items)) {
                  items.forEach((itemId: number) => {
                    const details = detailsMap.get(itemId);
                    if (details) {
                      // Freq
                      freqMap[details.name] = (freqMap[details.name] || 0) + 1;

                      // Check Item Status
                      // Normalizing status check just in case (e.g. 'APPROVED', 'Approved', etc)
                      const s = details.status?.toUpperCase() || '';

                      if (s === 'APPROVED' || s === 'APROVADO') {
                        approvedMap[details.name] = (approvedMap[details.name] || 0) + 1;
                      } else if (s === 'REJECTED' || s === 'REPROVADO') {
                        rejectedMap[details.name] = (rejectedMap[details.name] || 0) + 1;
                      }
                    }
                  });
                }
              });

              const getTop5 = (map: Record<string, number>) => {
                return Object.entries(map)
                  .map(([name, count]) => ({ name, count }))
                  .sort((a, b) => b.count - a.count)
                  .slice(0, 5);
              };

              setItemStats({
                topFreq: getTop5(freqMap),
                topApproved: getTop5(approvedMap),
                topRejected: getTop5(rejectedMap)
              });
            }

          } else {
            // No items in proposals
            setItemStats({ topFreq: [], topApproved: [], topRejected: [] });
          }
        }

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [filter]);

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] overflow-hidden">
      <div className="flex flex-col gap-1 border-b border-slate-200/50 pb-4 shrink-0">
        <h2 className="text-xl font-bold text-slate-800 tracking-tight">Setor Comercial</h2>
        <p className="text-slate-500 text-xs">Acompanhamento de propostas e vendas</p>
      </div>

      <div className="flex flex-col xl:flex-row gap-4 flex-1 min-h-0 pt-4">

        {/* Left Column: Metrics & Item Analysis */}
        <div className="flex flex-col gap-4 w-full xl:w-2/3 h-full overflow-y-auto custom-scrollbar pr-1">

          {/* KPI Section */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 shrink-0">


            {/* 2. Total Periodo */}
            <KPICard
              title="Propostas Totais"
              value={data.totalPeriod.current}
              prevValue={data.totalPeriod.prev}
              isLoading={loading}
              icon={<FileText size={20} />}
            />

            {/* 3. Backlog (Cumulative Pending) */}
            <KPICard
              title="Propostas Pendentes"
              value={data.backlog.current}
              prevValue={data.backlog.prev}
              isLoading={loading}
              icon={<Clock size={20} />}
              color="warning"
            />

            {/* 4. Approved (Period) - RENAMED */}
            <KPICard
              title="Propostas totalmente Aprovadas"
              value={data.approved.current}
              prevValue={data.approved.prev}
              isLoading={loading}
              icon={<CheckCircle size={20} />}
              color="success"
            />

            {/* 5. Rejected (Period) */}
            <KPICard
              title="Reprovadas (Período)"
              value={data.rejected.current}
              prevValue={data.rejected.prev}
              isLoading={loading}
              icon={<XCircle size={20} />}
              color="danger"
            />
            {/* 6. Total Approved Value (New) */}
            <div onClick={handleShowApprovedDetails} className="cursor-pointer transition-transform active:scale-95">
              <KPICard
                title="Valor Acumulado (Aprovado)"
                value={data.totalApprovedValue.current.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                prevValue={data.totalApprovedValue.prev.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                isLoading={loading}
                icon={<TrendingUp size={20} />}
                color="success"
              />
            </div>
          </div>

          {/* Item Analysis Section */}
          <div className="bg-white/60 backdrop-blur-xl rounded-xl border border-white/50 p-4 shadow-sm flex-1">
            <div className="flex items-center gap-2 mb-4">
              <Package className="text-blue-500" size={20} />
              <h3 className="font-bold text-slate-700">Análise de Itens (Período)</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Mais Frequentes */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 pb-2">Mais Frequentes</h4>
                <div className="space-y-2">
                  {loading ? (
                    <p className="text-xs text-slate-400">Carregando...</p>
                  ) : itemStats.topFreq.length > 0 ? (
                    itemStats.topFreq.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm">
                        <span className="text-slate-700 truncate mr-2" title={item.name}>{idx + 1}. {item.name}</span>
                        <span className="font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full text-xs">{item.count}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic">Nenhum dado</p>
                  )}
                </div>
              </div>

              {/* Mais Aprovados */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-wider border-b border-emerald-100 pb-2">Mais Aprovados</h4>
                <div className="space-y-2">
                  {loading ? (
                    <p className="text-xs text-slate-400">Carregando...</p>
                  ) : itemStats.topApproved.length > 0 ? (
                    itemStats.topApproved.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm">
                        <span className="text-slate-700 truncate mr-2" title={item.name}>{idx + 1}. {item.name}</span>
                        <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-xs">{item.count}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic">Nenhum dado</p>
                  )}
                </div>
              </div>

              {/* Mais Reprovados */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-red-500 uppercase tracking-wider border-b border-red-100 pb-2">Mais Reprovados</h4>
                <div className="space-y-2">
                  {loading ? (
                    <p className="text-xs text-slate-400">Carregando...</p>
                  ) : itemStats.topRejected.length > 0 ? (
                    itemStats.topRejected.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm">
                        <span className="text-slate-700 truncate mr-2" title={item.name}>{idx + 1}. {item.name}</span>
                        <span className="font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full text-xs">{item.count}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic">Nenhum dado</p>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Chart */}
        <div className="bg-white/60 backdrop-blur-xl p-4 rounded-3xl shadow-lg shadow-slate-200/50 border border-white/50 h-full w-full xl:w-1/3 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-md font-bold text-slate-700">Distribuição do Período</h3>
              <p className="text-xs text-slate-500">Status das propostas criadas</p>
            </div>
          </div>

          <div className="w-full flex-1 min-h-0">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
              </div>
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    nameKey="name"
                    stroke="none"
                    label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell - ${index} `} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      borderRadius: '12px',
                      border: '1px solid #E2E8F0',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                    itemStyle={{ fontSize: '12px', fontWeight: 500, color: '#1e293b' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 500 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <PieChartIcon size={48} className="mb-2 opacity-20" />
                <span className="text-sm">Sem dados no período</span>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Approved Items Detail Modal */}
      {
        showApprovedModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white rounded-t-2xl">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Detalhamento de Valor Aprovado</h3>
                  <p className="text-sm text-slate-500">Listagem de itens aprovados por proposta no período</p>
                </div>
                <button onClick={() => setShowApprovedModal(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-red-500 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                {loadingDetails ? (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                    <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-3"></div>
                    <p>Carregando detalhes...</p>
                  </div>
                ) : approvedDetails.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                    <Package size={48} className="mb-2 opacity-20" />
                    <p>Nenhum item aprovado encontrado neste período.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {approvedDetails.map((prop, idx) => (
                      <div key={idx} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-white border border-slate-200 rounded-lg">
                              <Building2 size={16} className="text-blue-600" />
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-700 text-sm">{prop.unit_name}</h4>
                              <p className="text-xs text-slate-500">Proposta #{prop.proposal_id.toString().slice(0, 8)} • {new Date(prop.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="block text-sm font-bold text-emerald-600">
                              {prop.total_value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </span>
                            <span className="text-[10px] text-emerald-600/70 font-medium uppercase bg-emerald-50 px-1.5 py-0.5 rounded">Total Aprovado</span>
                          </div>
                        </div>

                        <div className="p-0">
                          <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 border-b border-slate-100">
                              <tr>
                                <th className="px-4 py-2 font-medium">Item</th>
                                <th className="px-4 py-2 font-medium text-right">Qtd</th>
                                <th className="px-4 py-2 font-medium text-right">Preço Unit.</th>
                                <th className="px-4 py-2 font-medium text-right">Subtotal</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                              {prop.items.map((item: any, iIdx: number) => (
                                <tr key={iIdx} className="hover:bg-slate-50/80 transition-colors">
                                  <td className="px-4 py-2.5 text-slate-700 font-medium">{item.name}</td>
                                  <td className="px-4 py-2.5 text-right text-slate-600">{item.quantidade}</td>
                                  <td className="px-4 py-2.5 text-right text-slate-600">
                                    {(item.preco || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                  </td>
                                  <td className="px-4 py-2.5 text-right font-bold text-slate-700">
                                    {item.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};