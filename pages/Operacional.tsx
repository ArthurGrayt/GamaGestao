import React, { useContext, useEffect, useState, useRef } from 'react';
import { FilterContext } from '../layouts/MainLayout';
import { KPICard } from '../components/KPICard';
import { TaskListModal } from '../components/TaskListModal';
import { supabase } from '../services/supabase';
import {
  CheckSquare, ListTodo, AlertCircle, Clock, Filter, User as UserIcon, ChevronDown, Building2, Layout,
  ClipboardList, Loader2, CheckCircle2, XCircle, AlertOctagon, Archive, PlayCircle, FileCheck, Layers, PlusCircle, BadgeCheck
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, eachDayOfInterval, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';



interface Sector {
  id: number;
  sector_name: string;
}

interface User {
  user_id: string;
  username: string;
  img_url?: string;
  sector?: {
    id: number;
  };
}

interface KanbanColumn {
  id: number;
  collumname: string;
  sector: number;
}

export const Operacional: React.FC = () => {
  const filter = useContext(FilterContext);
  const [loading, setLoading] = useState(true);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const [selectedSector, setSelectedSector] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<string>('all');

  // Dropdown Visibility
  const [isSectorOpen, setIsSectorOpen] = useState(false);
  const [isUserOpen, setIsUserOpen] = useState(false);

  const sectorRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);


  // Dynamic Columns
  const [kanbanColumns, setKanbanColumns] = useState<KanbanColumn[]>([]);
  const [dynamicCounts, setDynamicCounts] = useState<Record<string, { current: number, prev: number, score: number }>>({});

  const [data, setData] = useState({
    created: { current: 0, prev: 0 },
    done: { current: 0, prev: 0 },
    wip: { current: 0, prev: 0 }
  });

  const [chartData, setChartData] = useState<any[]>([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalTasks, setModalTasks] = useState<any[]>([]);
  const [rawTasks, setRawTasks] = useState<any[]>([]); // Store all tasks for filtering

  // 1. Init: Fetch Sectors & Users
  useEffect(() => {
    const fetchMetadata = async () => {
      const { data: sectorData } = await supabase.from('sector').select('id, sector_name');
      if (sectorData) setSectors(sectorData);

      const { data: userData } = await supabase
        .from('users')
        .select('user_id, username, img_url, sector(id)');

      if (userData) {
        setUsers(userData as unknown as User[]);
      }
    };
    fetchMetadata();

    const handleClickOutside = (event: MouseEvent) => {
      if (sectorRef.current && !sectorRef.current.contains(event.target as Node)) setIsSectorOpen(false);
      if (userRef.current && !userRef.current.contains(event.target as Node)) setIsUserOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 2. Helper: Auto-switch Sector when User selected
  const handleUserChange = (userId: string) => {
    setSelectedUser(userId);
    setIsUserOpen(false);
    if (userId !== 'all') {
      const user = users.find(u => u.user_id === userId);
      if (user && user.sector?.id) {
        setSelectedSector(String(user.sector.id));
      }
    }
  };

  const handleSectorChange = (sectorId: string) => {
    setSelectedSector(sectorId);
    setIsSectorOpen(false);
    if (sectorId !== 'all' && selectedUser !== 'all') {
      const user = users.find(u => u.user_id === selectedUser);
      if (user?.sector?.id !== Number(sectorId)) {
        setSelectedUser('all');
      }
    }
  };

  // 3. Fetch Dynamic Columns from 'colunaskanban' (Primary) or 'colunas_kanban' (Backup)
  useEffect(() => {
    const fetchColumns = async () => {
      setKanbanColumns([]);

      if (selectedSector !== 'all') {
        // User screenshot showed 'colunaskanban', so we try that FIRST.
        let { data: cols, error } = await supabase
          .from('colunaskanban')
          .select('*')
          .eq('sector', Number(selectedSector))
          .order('id', { ascending: true });

        // Backup
        if (!cols || cols.length === 0) {
          const { data: colsBackup } = await supabase
            .from('colunas_kanban')
            .select('*')
            .eq('pai', Number(selectedSector)) // Try 'pai' if 'sector' fails in backup table
            .order('id', { ascending: true });

          if (colsBackup && colsBackup.length > 0) cols = colsBackup;
        }

        if (cols && cols.length > 0) {
          setKanbanColumns(cols);
        }
      }
    };
    fetchColumns();
  }, [selectedSector]);


  // 4. Main Data Fetching (Counts)
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const startDate = filter.startDate.toISOString();
        const endDate = filter.endDate.toISOString();
        const prevStart = filter.prevStartDate.toISOString();
        const prevEnd = filter.prevEndDate.toISOString();

        // Helper to apply filters
        const applyCommonFilters = (query: any) => {
          query = query.eq('visible', true); // Only visible items
          if (selectedSector !== 'all') query = query.eq('pai', selectedSector);
          if (selectedUser !== 'all') query = query.eq('responsavel', selectedUser);
          return query;
        };

        // ---------------------------------------------------------
        // 1. Fetch ACCUMULATED TASKS (Up to End Date)
        // Used for: Dynamic Cards (Accumulated View) AND CurrCreated (Subset) AND CurrDone (Subset)
        // ---------------------------------------------------------
        let mainQuery = supabase
          .from('kanban')
          .select('id, titulo, status, created_at, datadeentrega, concluido_em, score')
          .lte('created_at', endDate); // Accumulated until end of period

        mainQuery = applyCommonFilters(mainQuery);
        const { data: accumulatedTasks, error: mainError } = await mainQuery;

        if (mainError) console.error("Error fetching tasks:", mainError);

        setRawTasks(accumulatedTasks || []); // Store raw tasks for modal filtering

        // ---------------------------------------------------------
        // 2. Fetch PREVIOUS Created Tasks (Specific Range)
        // Used for: "Tarefas Criadas" vs Previous
        // ---------------------------------------------------------
        let prevCreatedQuery = supabase
          .from('kanban')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', prevStart)
          .lte('created_at', prevEnd);
        prevCreatedQuery = applyCommonFilters(prevCreatedQuery);
        const { count: prevCreatedCount } = await prevCreatedQuery;

        // ---------------------------------------------------------
        // 3. Process Metrics
        // ---------------------------------------------------------

        // ---------------------------------------------------------
        // 3. Process Metrics (Unified)
        // ---------------------------------------------------------
        const normalize = (s: string) => s ? s.trim().toLowerCase() : '';
        const isDoneStatus = (s: string) => {
          const n = normalize(s);
          return n === 'concluido' || n === 'concluído' || n === 'concluída' || n === 'concluídas';
        };

        // A. Tarefas Criadas (Cohort: Start <= Created <= End) - GLOBAL
        const currCreated = accumulatedTasks?.filter(t => t.created_at >= startDate).length || 0;
        const prevCreated = prevCreatedCount || 0;

        // B. Tarefas Concluídas (Throughput: Start <= ConcluidoEm <= End) - GLOBAL
        const currDone = accumulatedTasks?.filter(t => t.concluido_em && t.concluido_em >= startDate && t.concluido_em <= endDate).length || 0;

        // Previous Done (Query)
        let prevDoneQuery = supabase
          .from('kanban')
          .select('id', { count: 'exact', head: true })
          .gte('concluido_em', prevStart)
          .lte('concluido_em', prevEnd);
        prevDoneQuery = applyCommonFilters(prevDoneQuery);
        const { count: pDone } = await prevDoneQuery;
        const prevDone = pDone || 0;

        // C. Pre-compute Snapshot Counts (Status Counts)
        // This section was moved up, but the forEach loop below still uses `accumulatedTasks`
        // which is now correctly defined from `dataList`.
        const currStatusCounts: Record<string, number> = {};
        const currStatusScores: Record<string, number> = {};

        accumulatedTasks?.forEach(t => {
          const s = normalize(t.status);
          currStatusCounts[s] = (currStatusCounts[s] || 0) + 1;
          const sc = Number(t.score) || 0;
          currStatusScores[s] = (currStatusScores[s] || 0) + sc;
        });

        const prevStatusCounts: Record<string, number> = {};
        accumulatedTasks?.forEach(t => {
          if (t.created_at <= prevEnd) {
            const s = normalize(t.status);
            prevStatusCounts[s] = (prevStatusCounts[s] || 0) + 1;
          }
        });

        // D. WIP (Snapshot: All tasks NOT done) - GLOBAL
        const currWip = accumulatedTasks?.filter(t => !isDoneStatus(t.status)).length || 0;

        // Previous WIP (Approximation via Query or Filter)
        let prevWipQuery = supabase
          .from('kanban')
          .select('*', { count: 'exact', head: true })
          .not('status', 'ilike', '%conclu%') // Simple filter for safety
          .lte('created_at', prevEnd);
        prevWipQuery = applyCommonFilters(prevWipQuery);
        const { count: pWip } = await prevWipQuery;
        const prevWip = pWip || 0;


        // E. Dynamic Columns Counts (if needed)
        const newDynamicCounts: Record<string, { current: number, prev: number, score: number }> = {};
        const coveredStatuses = new Set<string>();

        if (kanbanColumns.length > 0) {
          kanbanColumns.forEach(col => {
            const colKey = normalize(col.collumname);
            let cVal = 0;
            let pVal = 0;
            let cScore = 0;

            if (isDoneStatus(colKey)) {
              // If column is "Done", map to Throughput (currDone)
              cVal = currDone;
              pVal = prevDone;
              // For Done Score
              cScore = accumulatedTasks?.filter(t => t.concluido_em && t.concluido_em >= startDate && t.concluido_em <= endDate)
                .reduce((acc, curr) => acc + (Number(curr.score) || 0), 0) || 0;

              coveredStatuses.add('done');
            } else {
              // Standard Inventory
              cVal = currStatusCounts[colKey] || 0;
              pVal = prevStatusCounts[colKey] || 0;
              cScore = currStatusScores[colKey] || 0;
            }
            newDynamicCounts[col.collumname] = { current: cVal, prev: pVal, score: cScore };
          });
          setDynamicCounts(newDynamicCounts);
        }

        // Update Standard Data State
        setData({
          created: { current: currCreated, prev: prevCreated },
          done: { current: currDone, prev: prevDone },
          wip: { current: currWip, prev: prevWip }
        });

        // ---------------------------------------------------------
        // 4. Process Chart Data (Snapshot Distribution)
        // ---------------------------------------------------------
        try {
          const newChartData: any[] = [];

          if (selectedSector !== 'all' && kanbanColumns.length > 0) {
            // Dynamic Mode: Show ALL columns
            kanbanColumns.forEach(col => {
              const count = newDynamicCounts[col.collumname]?.current || 0;
              newChartData.push({ name: col.collumname, value: count });
            });

            // If "Done" was NOT covered by a column, add it?
            // User said "todas as colunas do setor". If proper Kanban, Done is a column.
            // If Done is NOT a column, adding it might be confusing if it's not in the Cards.
            // But usually we want to see Done. Use heuristic: if 'coveredStatuses' has 'done', skip.
            if (!coveredStatuses.has('done') && currDone > 0) {
              newChartData.push({ name: 'Concluídas', value: currDone });
            }

          } else {
            // Standard Mode: WIP vs Done
            // Filter out 0s for cleaner chart, or keep for legend? 
            // Standard mode only has 2 slices usually.
            if (currWip > 0) newChartData.push({ name: 'Em Andamento', value: currWip });
            if (currDone > 0) newChartData.push({ name: 'Concluídas', value: currDone });
          }

          setChartData(newChartData);

        } catch (chartErr) {
          console.error("Error generating chart data:", chartErr);
          setChartData([]);
        }

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [filter, selectedSector, selectedUser, kanbanColumns]);

  // UI Helpers
  const getSelectedSectorName = () => {
    if (selectedSector === 'all') return 'Todos os Setores';
    return sectors.find(s => String(s.id) === selectedSector)?.sector_name || 'Setor desconhecido';
  };
  const getSelectedUser = () => {
    if (selectedUser === 'all') return null;
    return users.find(u => u.user_id === selectedUser);
  };
  const selectedUserObj = getSelectedUser();

  // Icon Helper for Columns
  const getColumnIcon = (name: string) => {
    const n = name.toLowerCase().trim();
    if (n.includes('novos') || n.includes('new') || n.includes('criadas')) return <PlusCircle size={16} />;
    if (n.includes('backlog') || n.includes('aguardando')) return <Layers size={16} />;
    if (n.includes('fazer') || n.includes('todo') || n.includes('to do')) return <ClipboardList size={16} />;
    if (n.includes('andamento') || n.includes('doing') || n.includes('progresso')) return <Loader2 size={16} />;
    if (n.includes('revis') || n.includes('valid')) return <FileCheck size={16} />;
    if (n.includes('bloquead') || n.includes('impediment')) return <AlertOctagon size={16} />;
    if (n.includes('concluid') || n.includes('finaliz') || n.includes('done') || n.includes('entregue')) return <BadgeCheck size={16} />;
    if (n.includes('cancel')) return <XCircle size={16} />;
    return <Layout size={16} />;
  };

  const handleCardClick = (title: string, type: 'created' | 'done' | 'wip' | 'dynamic') => {
    let filtered: any[] = [];
    const normalize = (s: string) => s ? s.trim().toLowerCase() : '';

    // Ensure we are comparing dates correctly
    const startStr = filter.startDate.toISOString();
    const endStr = filter.endDate.toISOString();

    if (type === 'created') {
      // Created in Range
      filtered = rawTasks.filter(t => t.created_at >= startStr);
    } else if (type === 'done') {
      // Done in Range (Throughput)
      filtered = rawTasks.filter(t => t.concluido_em && t.concluido_em >= startStr && t.concluido_em <= endStr);
    } else if (type === 'wip') {
      // Not Done Snapshot
      filtered = rawTasks.filter(t => {
        const isDone = ['concluído', 'concluido', 'concluida', 'concluída', 'done', 'finalizado'].some(d => normalize(t.status) === d);
        return !isDone;
      });
    } else if (type === 'dynamic') {
      // Specific Status Snapshot
      const isDoneCol = ['concluído', 'concluido', 'concluida', 'concluída', 'done', 'finalizado'].some(d => normalize(title) === d);

      if (isDoneCol) {
        filtered = rawTasks.filter(t => t.concluido_em && t.concluido_em >= startStr && t.concluido_em <= endStr);
      } else {
        filtered = rawTasks.filter(t => normalize(t.status) === normalize(title));
      }
    }

    // Sort by Score Desc
    const sorted = [...filtered].sort((a, b) => (Number(b.score) || 0) - (Number(a.score) || 0));

    setModalTitle(title);
    setModalTasks(sorted);
    setIsModalOpen(true);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] overflow-hidden">
      <TaskListModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalTitle}
        tasks={modalTasks}
      />
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-slate-200/50 pb-4 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Setor Operacional</h2>
          <p className="text-slate-500 text-xs mt-0.5">Monitore o desempenho e fluxo de tarefas</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">

          {/* Sector Dropdown */}
          <div className="relative" ref={sectorRef}>
            <div
              onClick={() => setIsSectorOpen(!isSectorOpen)}
              className={`flex items-center gap-2 bg-white/70 backdrop-blur-md px-3 py-2 rounded-xl border transition-all cursor-pointer hover:shadow-md hover:bg-white/90 min-w-[200px] justify-between ${isSectorOpen ? 'border-blue-500/50 ring-2 ring-blue-500/10 shadow-lg' : 'border-white/60 shadow-sm'}`}
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="bg-blue-50 text-blue-600 p-1 rounded-md shrink-0">
                  <Building2 size={14} />
                </div>
                <span className="text-xs font-semibold text-slate-700 truncate">{getSelectedSectorName()}</span>
              </div>
              <ChevronDown size={14} className={`text-slate-400 transition-transform duration-300 ${isSectorOpen ? 'rotate-180' : ''}`} />
            </div>
            {/* Sector Menu */}
            <div className={`absolute top-full right-0 mt-2 w-full sm:w-[260px] bg-white/80 backdrop-blur-xl border border-white/60 rounded-xl shadow-xl z-50 overflow-hidden transition-all duration-200 origin-top-right ${isSectorOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}`}>
              <div className="p-1 max-h-[300px] overflow-y-auto custom-scrollbar">
                <div onClick={() => handleSectorChange('all')} className={`px-2 py-2 rounded-lg cursor-pointer flex items-center gap-2 transition-colors ${selectedSector === 'all' ? 'bg-blue-50 text-blue-700 font-medium' : 'hover:bg-slate-50 text-slate-600'}`}>
                  <span className="truncate text-xs">Todos os Setores</span>
                </div>
                {sectors.map(sector => (
                  <div key={sector.id} onClick={() => handleSectorChange(String(sector.id))} className={`px-2 py-2 rounded-lg cursor-pointer flex items-center gap-2 transition-colors ${selectedSector === String(sector.id) ? 'bg-blue-50 text-blue-700 font-medium' : 'hover:bg-slate-50 text-slate-600'}`}>
                    <span className="truncate text-xs">{sector.sector_name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* User Dropdown */}
          <div className="relative" ref={userRef}>
            <div onClick={() => setIsUserOpen(!isUserOpen)} className={`flex items-center gap-2 bg-white/70 backdrop-blur-md px-3 py-2 rounded-xl border transition-all cursor-pointer hover:shadow-md hover:bg-white/90 min-w-[220px] justify-between ${isUserOpen ? 'border-purple-500/50 ring-2 ring-purple-500/10 shadow-lg' : 'border-white/60 shadow-sm'}`}>
              <div className="flex items-center gap-2 overflow-hidden">
                {selectedUser !== 'all' && selectedUserObj ? (
                  <div className="w-6 h-6 rounded-full overflow-hidden border border-slate-200 shrink-0">
                    {selectedUserObj.img_url ? (
                      <img src={selectedUserObj.img_url} alt={selectedUserObj.username} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <UserIcon size={12} />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-purple-50 text-purple-600 p-1 rounded-md shrink-0">
                    <UserIcon size={14} />
                  </div>
                )}
                <span className="text-xs font-semibold text-slate-700 truncate">
                  {selectedUser !== 'all' ? selectedUserObj?.username : 'Todos Colaboradores'}
                </span>
              </div>
              <ChevronDown size={14} className={`text-slate-400 transition-transform duration-300 ${isUserOpen ? 'rotate-180' : ''}`} />
            </div>
            {/* User Menu */}
            <div className={`absolute top-full right-0 mt-2 w-full sm:w-[280px] bg-white/80 backdrop-blur-xl border border-white/60 rounded-xl shadow-xl z-50 overflow-hidden transition-all duration-200 origin-top-right ${isUserOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}`}>
              <div className="p-1 max-h-[300px] overflow-y-auto custom-scrollbar">
                <div onClick={() => handleUserChange('all')} className={`px-2 py-2 rounded-lg cursor-pointer flex items-center gap-2 transition-colors ${selectedUser === 'all' ? 'bg-purple-50 text-purple-700 font-medium' : 'hover:bg-slate-50 text-slate-600'}`}>
                  <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200 shrink-0"><UserIcon size={12} /></div>
                  <span className="truncate text-xs">Todos os Colaboradores</span>
                </div>
                {users.map(user => (
                  <div key={user.user_id} onClick={() => handleUserChange(user.user_id)} className={`px-2 py-2 rounded-lg cursor-pointer flex items-center gap-2 transition-colors ${selectedUser === user.user_id ? 'bg-purple-50 text-purple-700 font-medium' : 'hover:bg-slate-50 text-slate-600'}`}>
                    <div className="w-6 h-6 rounded-full overflow-hidden border border-slate-200 shrink-0 relative bg-slate-100">
                      {user.img_url ? (<img src={user.img_url} alt={user.username} className="w-full h-full object-cover" />) : (<div className="w-full h-full flex items-center justify-center text-slate-400"><UserIcon size={10} /></div>)}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="truncate text-xs">{user.username}</span>
                      {user.sector && (<span className="text-[10px] text-slate-400 truncate">{sectors.find(s => s.id === user.sector?.id)?.sector_name}</span>)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-4 flex-1 min-h-0 pt-4">
        {/* Left Col: Metric Cards */}
        <div className={`grid grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-2 w-full xl:w-2/3 content-start overflow-hidden`}>
          {/* Metric 1: Created */}
          <KPICard
            title="Criadas"
            value={data.created.current}
            prevValue={data.created.prev}
            isLoading={loading}
            icon={<PlusCircle size={16} />}
            onClick={() => handleCardClick('Tarefas Criadas', 'created')}
          />

          {/* Dynamic OR Fallback */}
          {selectedSector !== 'all' && kanbanColumns.length > 0 ? (
            kanbanColumns.map(col => (
              <KPICard
                key={col.id}
                title={col.collumname}
                value={dynamicCounts[col.collumname]?.current || 0}
                prevValue={dynamicCounts[col.collumname]?.prev || 0}
                score={dynamicCounts[col.collumname]?.score || 0}
                isLoading={loading}
                icon={getColumnIcon(col.collumname)}
                onClick={() => handleCardClick(col.collumname, 'dynamic')}
              />
            ))
          ) : (
            <>
              <KPICard
                title="Concluídas"
                value={data.done.current}
                prevValue={data.done.prev}
                isLoading={loading}
                icon={<BadgeCheck size={16} />}
                onClick={() => handleCardClick('Tarefas Concluídas', 'done')}
              />
              <KPICard
                title="Andamento"
                value={data.wip.current}
                prevValue={data.wip.prev}
                isLoading={loading}
                icon={<Loader2 size={16} />}
                onClick={() => handleCardClick('Em Andamento', 'wip')}
              />
            </>
          )}


        </div>

        {/* Right Col: Chart Section */}
        <div className="bg-white/60 backdrop-blur-xl p-4 rounded-3xl shadow-lg shadow-slate-200/50 border border-white/50 h-full w-full xl:w-1/3 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-md font-bold text-slate-700">Distribuição de Demandas</h3>
              <p className="text-xs text-slate-500">Volume de tarefas por status</p>
            </div>
          </div>
          <div className="w-full flex-1 min-h-0">
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
                  label={({ percent }) => percent > 0 ? `${(percent * 100).toFixed(0)}%` : ''}
                  labelLine={false}
                >
                  {chartData.map((entry, index) => {
                    const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#6366F1', '#EC4899', '#8B5CF6'];
                    const normalize = (s: string) => s ? s.trim().toLowerCase() : '';
                    const n = normalize(entry.name);

                    let color = COLORS[index % COLORS.length];

                    // Specific Colors
                    if (n === 'concluídas' || n === 'concluidas' || n === 'concluido' || n === 'concluído') color = '#10B981'; // Green
                    else if (n === 'em andamento' || n === 'execução' || n === 'execucao') color = '#F59E0B'; // Amber
                    else if (n === 'pendente' || n === 'backlog') color = '#64748B'; // Slate
                    else if (n === 'criadas' || n === 'novo') color = '#3B82F6'; // Blue

                    return <Cell key={`cell-${index}`} fill={color} strokeWidth={0} />;
                  })}
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
          </div>
        </div>
      </div>
    </div>
  );
};