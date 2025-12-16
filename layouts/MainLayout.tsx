import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { DateFilter } from '../components/DateFilter';
import { ToastSystem } from '../components/ToastSystem';
import { supabase } from '../services/supabase';
import { DateRangeType, DateFilterState } from '../types';
import { calculateDateRange, formatDateDisplay } from '../utils/dateUtils';

// Context to pass date filters to pages
export const FilterContext = React.createContext<DateFilterState>(calculateDateRange('mes', new Date()));

export const MainLayout: React.FC = () => {
  const [dateRangeType, setDateRangeType] = useState<DateRangeType>('mes');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  const [filterState, setFilterState] = useState<DateFilterState>(calculateDateRange('mes', new Date()));
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check auth
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/login');
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    // Recalculate range whenever type or selected specific date changes
    setFilterState(calculateDateRange(dateRangeType, selectedDate));
  }, [dateRangeType, selectedDate]);

  if (loading) return <div className="h-screen w-screen flex items-center justify-center bg-gray-50/50 backdrop-blur-sm">Carregando...</div>;

  return (
    <div className="flex min-h-screen">
      <Sidebar
        isExpanded={isSidebarExpanded}
        onMouseEnter={() => setIsSidebarExpanded(true)}
        onMouseLeave={() => setIsSidebarExpanded(false)}
      />
      <div className={`flex-1 flex flex-col relative transition-all duration-300 ${isSidebarExpanded ? 'ml-64' : 'ml-20'}`}>
        {location.pathname !== '/clientes' && (
          <header className="bg-white/60 backdrop-blur-xl h-24 px-8 flex items-center justify-between sticky top-0 z-10 shadow-sm border-b border-white/40">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Dashboard</h2>
              <p className="text-sm text-slate-500 font-medium mt-1">
                {formatDateDisplay(filterState.startDate)} - {formatDateDisplay(filterState.endDate)}
              </p>
            </div>
            <DateFilter
              selectedRange={dateRangeType}
              selectedDate={selectedDate}
              onRangeChange={setDateRangeType}
              onDateChange={setSelectedDate}
            />
          </header>
        )}
        <main className="p-8 overflow-y-auto flex-1">
          <FilterContext.Provider value={filterState}>
            <Outlet />
          </FilterContext.Provider>
        </main>
      </div>
      <ToastSystem />
    </div>
  );
};