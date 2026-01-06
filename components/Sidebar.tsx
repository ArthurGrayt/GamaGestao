import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Wallet, Stethoscope, Briefcase, ClipboardList, LogOut, Building2, MessageSquare, Users, ShieldCheck, FileText } from 'lucide-react';
import { supabase } from '../services/supabase';
import { useNotifications } from '../contexts/NotificationContext';


interface SidebarProps {
  isExpanded: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isExpanded, onMouseEnter, onMouseLeave }) => {
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();


  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const navItems = [
    { name: 'Visão Geral', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Clientes', path: '/clientes', icon: <Building2 size={20} /> },
    { name: 'Financeiro', path: '/financeiro', icon: <Wallet size={20} /> },
    { name: 'Saúde', path: '/saude', icon: <Stethoscope size={20} /> },
    { name: 'Comercial', path: '/comercial', icon: <Briefcase size={20} /> },
    { name: 'Operacional', path: '/operacional', icon: <ClipboardList size={20} /> },
    { name: 'Usuários', path: '/usuarios', icon: <Users size={20} /> },
    { name: 'Auditoria', path: '/auditoria', icon: <ShieldCheck size={20} /> },
    { name: 'Formulários', path: '/formularios', icon: <FileText size={20} /> },
  ];

  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`h-screen bg-white/70 backdrop-blur-2xl border-r border-white/50 flex flex-col fixed left-0 top-0 shadow-2xl shadow-slate-200/50 z-50 transition-all duration-300 overflow-hidden ${isExpanded ? 'w-64' : 'w-20'}`}
    >
      <div className="p-6 flex flex-col items-center mb-6">
        <div className={`mb-4 rounded-xl bg-gradient-to-tr from-blue-50 to-white shadow-lg flex items-center justify-center p-1 border border-white/60 transition-all duration-300 ${isExpanded ? 'w-16 h-16 min-w-[4rem] rounded-2xl' : 'w-10 h-10 min-w-[2.5rem]'}`}>
          <img
            src="https://wofipjazcxwxzzxjsflh.supabase.co/storage/v1/object/public/Media/Image/image-removebg-preview%20(2).png"
            alt="Gama Logo"
            className="w-full h-auto object-contain"
          />
        </div>
        <h1 className={`text-lg font-bold tracking-tight text-slate-800 transition-opacity duration-300 whitespace-nowrap absolute top-28 ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>Gama Manager</h1>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center px-4 py-3.5 rounded-2xl transition-all duration-300 relative ${isActive
                ? 'bg-white shadow-md shadow-slate-100 text-blue-600 font-semibold'
                : 'text-slate-500 hover:bg-white/50 hover:text-slate-800'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`transition-colors duration-300 min-w-[1.25rem] flex justify-center relative ${isActive ? 'text-blue-600' : 'text-slate-400'}`}>
                  {item.icon}
                  {item.name === 'Clientes' && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] sm:text-[9px] flex items-center justify-center rounded-full border-2 border-white/80 shadow-sm animate-pulse">
                      {unreadCount}
                    </span>
                  )}

                </div>
                <span className={`tracking-wide text-sm whitespace-nowrap transition-all duration-300 ml-3 ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>{item.name}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-6">
        <button
          onClick={handleLogout}
          className="flex items-center space-x-3 text-slate-400 hover:text-red-500 hover:bg-red-50 w-full px-4 py-3 rounded-2xl transition-all duration-300"
        >
          <div className="min-w-[1.25rem] flex justify-center"><LogOut size={20} /></div>
          <span className={`text-sm font-medium transition-all duration-300 whitespace-nowrap ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>Sair</span>
        </button>
      </div>
    </div>
  );
};