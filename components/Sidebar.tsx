import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Wallet, Stethoscope, Briefcase, ClipboardList, LogOut, Building2, MessageSquare } from 'lucide-react';
import { supabase } from '../services/supabase';

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();

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
    { name: 'Gama Talk', path: '/gama-talk', icon: <MessageSquare size={20} /> },
  ];

  return (
    <div className="h-screen w-64 bg-white/70 backdrop-blur-2xl border-r border-white/50 flex flex-col fixed left-0 top-0 shadow-2xl shadow-slate-200/50 z-20">
      <div className="p-8 flex flex-col items-center">
        <div className="w-16 h-16 mb-4 rounded-2xl bg-gradient-to-tr from-blue-50 to-white shadow-lg flex items-center justify-center p-2 border border-white/60">
          <img
            src="https://wofipjazcxwxzzxjsflh.supabase.co/storage/v1/object/public/Media/Image/image-removebg-preview%20(2).png"
            alt="Gama Logo"
            className="w-full h-auto object-contain"
          />
        </div>
        <h1 className="text-lg font-bold tracking-tight text-slate-800">Gama Manager</h1>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group ${isActive
                ? 'bg-white shadow-md shadow-slate-100 text-blue-600 font-semibold transform scale-[1.02]'
                : 'text-slate-500 hover:bg-white/50 hover:text-slate-800'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`transition-colors duration-300 ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`}>
                  {item.icon}
                </div>
                <span className="tracking-wide text-sm">{item.name}</span>
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
          <LogOut size={20} />
          <span className="text-sm font-medium">Sair</span>
        </button>
      </div>
    </div>
  );
};