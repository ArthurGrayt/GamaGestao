import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { Users, Search, Filter, Shield, Briefcase, User as UserIcon, Crown } from 'lucide-react';

interface Role {
    id: number;
    name_roles: string;
}

interface Sector {
    id: number;
    sector_name: string;
}

interface User {
    id: string; // uuid
    username: string;
    img_url?: string;
    lider: boolean;
    role?: Role;
    sector?: Sector;
}

export const Usuarios: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            // Fetch users with relations
            const { data, error } = await supabase
                .from('users')
                .select(`
          *,
          role:roles (id, name_roles),
          sector:sector (id, sector_name)
        `);

            if (error) throw error;
            setUsers(data || []);
        } catch (error) {
            console.error('Erro ao buscar usuários:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = users.filter(user =>
        user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role?.name_roles?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.sector?.sector_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                        <Users className="text-blue-600" size={24} />
                        Usuários
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">Gerencie os usuários do sistema</p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative group w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por nome, cargo ou setor..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white/60 border border-white/60 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-sm backdrop-blur-sm shadow-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 overflow-y-auto pb-8">
                {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-48 bg-white/40 rounded-3xl animate-pulse border border-white/50"></div>
                    ))
                ) : (
                    filteredUsers.map((user) => (
                        <div
                            key={user.id}
                            className="group bg-white/60 backdrop-blur-xl p-6 rounded-3xl border border-white/60 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"
                        >
                            {/* Leader Badge */}
                            {user.lider && (
                                <div className="absolute top-4 right-4 bg-amber-100 text-amber-600 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm border border-amber-200">
                                    <Crown size={12} fill="currentColor" />
                                    LÍDER DE SETOR
                                </div>
                            )}

                            {/* Decorative Background */}
                            <div className="absolute -right-6 -top-6 w-32 h-32 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full blur-2xl opacity-50 group-hover:opacity-100 transition-opacity"></div>

                            <div className="relative z-10 flex flex-col items-center text-center">
                                {/* Avatar */}
                                <div className="w-24 h-24 rounded-full p-1 bg-white shadow-md mb-4 relative">
                                    <div className="w-full h-full rounded-full overflow-hidden bg-slate-100 flex items-center justify-center text-slate-400">
                                        {user.img_url ? (
                                            <img
                                                src={user.img_url}
                                                alt={user.username}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.src = ''; // Clear src to show fallback
                                                    target.style.display = 'none'; // Hide img
                                                    target.parentElement!.classList.remove('hidden'); // Ensure parent is visible
                                                }}
                                            />
                                        ) : (
                                            <UserIcon size={40} />
                                        )}
                                        {!user.img_url && <UserIcon size={40} />}
                                    </div>
                                </div>

                                <h3 className="text-lg font-bold text-slate-800 mb-1">{user.username}</h3>

                                <div className="flex flex-col gap-2 w-full mt-4">
                                    <div className="flex items-center gap-3 bg-white/50 p-2.5 rounded-xl border border-white/50 text-sm text-slate-600">
                                        <div className="bg-blue-100 text-blue-600 p-1.5 rounded-lg">
                                            <Shield size={16} />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Cargo</p>
                                            <p className="font-medium">{user.role?.name_roles || 'Não definido'}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 bg-white/50 p-2.5 rounded-xl border border-white/50 text-sm text-slate-600">
                                        <div className="bg-purple-100 text-purple-600 p-1.5 rounded-lg">
                                            <Briefcase size={16} />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Setor</p>
                                            <p className="font-medium">{user.sector?.sector_name || 'Não definido'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Usuarios;
