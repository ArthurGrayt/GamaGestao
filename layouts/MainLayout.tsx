import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

import { Sidebar } from '../components/Sidebar';
import { DateFilter } from '../components/DateFilter';

import { supabase } from '../services/supabase';
import { NotificationProvider } from '../contexts/NotificationContext';

import { DateRangeType, DateFilterState } from '../types';
import { calculateDateRange, formatDateDisplay } from '../utils/dateUtils';
import { ShieldAlert, LogOut } from 'lucide-react';

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
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          navigate('/login');
          return;
        }

        // Check user role
        const { data: userProfile, error } = await supabase
          .from('users')
          .select('role')
          .eq('user_id', session.user.id)
          .single();

        if (error) {
          console.error('Error fetching user role:', error);
          setAuthorized(false);
        } else {
          const roleValue = Number(userProfile?.role);
          if (!isNaN(roleValue) && roleValue >= 5) {
            setAuthorized(true);
          } else {
            setAuthorized(false);
          }
        }
      } catch (err) {
        console.error('Auth check error:', err);
        setAuthorized(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    setFilterState(calculateDateRange(dateRangeType, selectedDate));
  }, [dateRangeType, selectedDate]);

  if (loading) return <div className="h-screen w-screen flex items-center justify-center bg-gray-50/50 backdrop-blur-sm">Carregando...</div>;

  if (!authorized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-gray-100">
          <div className="bg-red-50 text-red-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldAlert size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Acesso Restrito</h2>
          <p className="text-gray-500 mb-8">
            Seu usuário não possui permissão suficiente para acessar o sistema.
            <br />
            <span className="text-sm text-gray-400 mt-2 block">(Nível de acesso inferior a 5)</span>
          </p>
          <button
            onClick={() => {
              supabase.auth.signOut().then(() => navigate('/login'));
            }}
            className="w-full bg-slate-900 text-white py-3 rounded-xl font-medium hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
          >
            <LogOut size={18} />
            Sair da Conta
          </button>
        </div>
      </div>
    );
  }

  return (
    <NotificationProvider>
      <div className="flex min-h-screen">
        <div className="print:hidden">
          <Sidebar
            isExpanded={isSidebarExpanded}
            onMouseEnter={() => setIsSidebarExpanded(true)}
            onMouseLeave={() => setIsSidebarExpanded(false)}
          />
        </div>
        <div className={`flex-1 flex flex-col relative transition-all duration-300 ${isSidebarExpanded ? 'ml-64' : 'ml-20'} print:ml-0 print:w-auto print:h-auto print:static`}>
          {!['/clientes', '/usuarios', '/formularios', '/auditoria'].includes(location.pathname) && (
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
          <main className="p-8 overflow-y-auto flex-1 print:overflow-visible print:h-auto print:block">
            <FilterContext.Provider value={filterState}>
              <Outlet />
            </FilterContext.Provider>
          </main>
        </div>
      </div>
    </NotificationProvider>
  );
};