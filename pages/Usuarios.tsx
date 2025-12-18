
import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { Users, Search, Filter, Shield, Briefcase, User as UserIcon, Crown, FileText, CheckSquare, Square, X } from 'lucide-react';
import { PointReportModal } from '../components/PointReportModal';

interface Role {
    id: number;
    name_roles: string;
}

interface Sector {
    id: number;
    sector_name: string;
}

interface User {
    id: string; // This is actually number/int in DB representing PK
    user_id: string; // The UUID linking to auth/ponto
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

    // Report Selection State
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
    const [showReportModal, setShowReportModal] = useState(false);

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

    const toggleSelectionMode = (initialUserId?: string) => {
        if (isSelectionMode && !initialUserId) {
            // Cancel mode
            setIsSelectionMode(false);
            setSelectedUserIds(new Set());
        } else {
            // Start mode
            setIsSelectionMode(true);
            if (initialUserId) {
                setSelectedUserIds(new Set([initialUserId]));
            }
        }
    };

    const toggleUserSelection = (userId: string) => {
        const newSet = new Set(selectedUserIds);
        if (newSet.has(userId)) {
            newSet.delete(userId);
            if (newSet.size === 0) setIsSelectionMode(false);
        } else {
            newSet.add(userId);
        }
        setSelectedUserIds(newSet);
    };

    const handleSelectAll = () => {
        if (selectedUserIds.size === filteredUsers.length) {
            setSelectedUserIds(new Set());
            setIsSelectionMode(false);
        } else {
            const allIds = new Set(filteredUsers.map(u => u.id));
            setSelectedUserIds(allIds);
            setIsSelectionMode(true);
        }
    };

    const filteredUsers = users.filter(user =>
        user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role?.name_roles?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.sector?.sector_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectedUsersList = users.filter(u => selectedUserIds.has(u.id));

    return (
        <div className="h-full flex flex-col relative">
            <PointReportModal
                isOpen={showReportModal}
                onClose={() => setShowReportModal(false)}
                users={selectedUsersList}
            />

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 print:hidden">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                        <Users className="text-blue-600" size={24} />
                        Usuários
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">Gerencie os usuários do sistema</p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    {!isSelectionMode && (
                        <button
                            onClick={() => toggleSelectionMode()}
                            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/20"
                        >
                            <FileText size={18} />
                            Relatório de Ponto
                        </button>
                    )}

                    {isSelectionMode && (
                        <button
                            onClick={handleSelectAll}
                            className="text-sm font-medium text-slate-600 hover:text-blue-600 px-3 py-2 bg-white/50 rounded-xl transition-colors"
                        >
                            {selectedUserIds.size === filteredUsers.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                        </button>
                    )}
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
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 overflow-y-auto pb-24 print:hidden">
                {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-40 bg-white/40 rounded-3xl animate-pulse border border-white/50"></div>
                    ))
                ) : (
                    filteredUsers.map((user) => {
                        const isSelected = selectedUserIds.has(user.id);
                        return (
                            <div
                                key={user.id}
                                onClick={() => isSelectionMode && toggleUserSelection(user.id)}
                                className={`group bg-white/60 backdrop-blur-xl p-5 rounded-2xl border shadow-sm transition-all duration-300 relative overflow-hidden ${isSelectionMode
                                    ? 'cursor-pointer hover:bg-blue-50/80 ' + (isSelected ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-white/60 opacity-80 hover:opacity-100')
                                    : 'hover:shadow-lg hover:-translate-y-1 border-white/60'
                                    }`}
                            >
                                {/* Selection Checkbox Overlay */}
                                {isSelectionMode && (
                                    <div className="absolute top-3 left-3 z-20">
                                        {isSelected ? (
                                            <div className="bg-blue-500 text-white rounded-lg p-1 shadow-md shadow-blue-500/30">
                                                <CheckSquare size={18} className="fill-current" />
                                            </div>
                                        ) : (
                                            <div className="text-slate-300 bg-white/50 rounded-lg p-1">
                                                <Square size={18} />
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Leader Badge */}
                                {user.lider && (
                                    <div className="absolute top-3 right-3 bg-amber-100 text-amber-600 px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 shadow-sm border border-amber-200">
                                        <Crown size={10} fill="currentColor" />
                                        LÍDER
                                    </div>
                                )}

                                {/* Decorative Background */}
                                <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl transition-opacity ${isSelected ? 'bg-blue-200 opacity-80' : 'bg-gradient-to-br from-blue-50 to-indigo-50 opacity-50 group-hover:opacity-100'}`}></div>

                                <div className="relative z-10 flex flex-col items-center text-center mt-1">
                                    {/* Avatar */}
                                    <div className="w-16 h-16 rounded-full p-1 bg-white shadow-md mb-3 relative">
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
                                                <UserIcon size={32} />
                                            )}
                                        </div>
                                    </div>

                                    <h3 className="text-base font-bold text-slate-800 mb-0.5">{user.username}</h3>

                                    <div className="flex flex-col gap-1.5 w-full mt-3">
                                        <div className="flex items-center gap-2 bg-white/50 p-2 rounded-lg border border-white/50 text-xs text-slate-600">
                                            <div className="bg-blue-100 text-blue-600 p-1 rounded-md">
                                                <Shield size={14} />
                                            </div>
                                            <div className="text-left w-full truncate">
                                                <p className="font-medium truncate">{user.role?.name_roles || 'Não definido'}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 bg-white/50 p-2 rounded-lg border border-white/50 text-xs text-slate-600">
                                            <div className="bg-purple-100 text-purple-600 p-1 rounded-md">
                                                <Briefcase size={14} />
                                            </div>
                                            <div className="text-left w-full truncate">
                                                <p className="font-medium truncate">{user.sector?.sector_name || 'Não definido'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Selection Floating Bar */}
            {isSelectionMode && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white pl-6 pr-2 py-2 rounded-full shadow-2xl shadow-slate-900/40 flex items-center gap-6 animate-in slide-in-from-bottom-10 fade-in duration-300 print:hidden">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-600 rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                            {selectedUserIds.size}
                        </div>
                        <span className="font-medium text-sm">Usuários selecionados</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => toggleSelectionMode()}
                            className="px-4 py-2 hover:bg-white/10 rounded-full text-sm transition-colors text-slate-300 hover:text-white"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={() => setShowReportModal(true)}
                            className="bg-white text-slate-900 px-5 py-2 rounded-full font-bold text-sm hover:bg-blue-50 active:scale-95 transition-all flex items-center gap-2"
                        >
                            <FileText size={16} />
                            Gerar Relatório
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Usuarios;

