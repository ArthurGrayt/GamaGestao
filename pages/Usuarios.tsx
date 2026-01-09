
import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { Users, Search, Filter, Shield, Briefcase, User as UserIcon, Crown, FileText, CheckSquare, Square, X, Edit2, Save, Camera, Calendar, Mail, Stethoscope } from 'lucide-react';
import { PointReportModal } from '../components/PointReportModal';

interface Role {
    id: number;
    name_roles: string;
}

interface Sector {
    id: number;
    sector_name: string;
}

// Medical Access Profile Interface
interface PerfilMed {
    id: number;
    acesso: string; // Strictly from schema
}

interface User {
    id: number;
    user_id: string; // UUID
    username: string;
    img_url?: string;
    lider: boolean;
    role?: Role;
    role_id?: number; // Raw FK
    sector?: Sector;
    sector_id?: number; // Raw FK
    email: string;
    created_at: string;
    acesso_med?: number; // FK to perfil_med
    acesso_med_rel?: PerfilMed; // Relation view
    phone_contact?: string;
}

export const Usuarios: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Auxiliary Data for Dropdowns
    const [roles, setRoles] = useState<Role[]>([]);
    const [sectors, setSectors] = useState<Sector[]>([]);
    const [medProfiles, setMedProfiles] = useState<PerfilMed[]>([]);

    // Selection & Report Mode
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedUserIds, setSelectedUserIds] = useState<Set<number>>(new Set());
    const [showReportModal, setShowReportModal] = useState(false);

    // Detail Modal State
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Edit Form State
    const [editForm, setEditForm] = useState<Partial<User>>({});

    useEffect(() => {
        fetchUsers();
        fetchAuxData();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('users')
                .select(`
          *,
          role:roles (id, name_roles),
          sector:sector (id, sector_name),
          acesso_med_rel:perfil_med (id, acesso)
        `);

            if (error) throw error;
            setUsers(data || []);
        } catch (error) {
            console.error('Erro ao buscar usuários:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAuxData = async () => {
        try {
            const { data: rolesData } = await supabase.from('roles').select('*');
            if (rolesData) setRoles(rolesData);

            const { data: sectorsData } = await supabase.from('sector').select('*');
            if (sectorsData) setSectors(sectorsData);

            const { data: medData } = await supabase.from('perfil_med').select('*');
            if (medData) setMedProfiles(medData);
        } catch (error) {
            console.error('Erro ao buscar dados auxiliares:', error);
        }
    }
    // ... (skip unchanged functions)
    // ...
    {/* Acesso Medico */ }
    <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
            <Stethoscope size={16} className="text-blue-500" /> Acesso Médico
        </label>
        <select
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
            value={editForm.acesso_med || ''}
            onChange={(e) => setEditForm({ ...editForm, acesso_med: Number(e.target.value) || null })}
        >
            <option value="">Sem Acesso Médico</option>
            {medProfiles.map(p => (
                <option key={p.id} value={p.id}>{p.acesso}</option>
            ))}
        </select>
    </div>

    const toggleSelectionMode = (initialUserId?: number) => {
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

    const toggleUserSelection = (userId: number) => {
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

    const openUserModal = (user: User) => {
        setSelectedUser(user);
        setEditForm({
            ...user,
            role_id: user.role?.id ?? user.role as unknown as number,
            sector_id: user.sector?.id ?? user.sector as unknown as number,
            acesso_med: user.acesso_med ?? (user.acesso_med_rel?.id)
        });
        setIsEditModalOpen(true);
    };

    const handleSaveUser = async () => {
        if (!selectedUser || !editForm) return;
        setIsSaving(true);
        try {
            const updates = {
                username: editForm.username,
                email: editForm.email,
                role: editForm.role_id,
                sector: editForm.sector_id,
                lider: editForm.lider,
                acesso_med: editForm.acesso_med,
                // img_url removed from edit logic
                // created_at is read-only
            };

            const { error } = await supabase
                .from('users')
                .update(updates)
                .eq('id', selectedUser.id);

            if (error) throw error;

            setUsers(prev => prev.map(u => {
                if (u.id === selectedUser.id) {
                    return {
                        ...u,
                        ...updates,
                        role: roles.find(r => r.id === updates.role),
                        sector: sectors.find(s => s.id === updates.sector),
                        acesso_med_rel: medProfiles.find(m => m.id === updates.acesso_med)
                    } as User;
                }
                return u;
            }));

            setIsEditModalOpen(false);
        } catch (error) {
            console.error("Erro ao salvar usuário:", error);
            alert("Erro ao salvar alterações.");
        } finally {
            setIsSaving(false);
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
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Users className="text-blue-600" size={24} /> Usuários
            </h2>

            {/* Header Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 print:hidden">
                <div className="text-slate-500 text-sm">
                    Gerencie os usuários do sistema
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
                                onClick={() => isSelectionMode ? toggleUserSelection(user.id) : openUserModal(user)}
                                className={`group bg-white/60 backdrop-blur-xl p-5 rounded-2xl border shadow-sm transition-all duration-300 relative overflow-hidden ${isSelectionMode
                                    ? 'cursor-pointer hover:bg-blue-50/80 ' + (isSelected ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-white/60 opacity-80 hover:opacity-100')
                                    : 'cursor-pointer hover:shadow-lg hover:-translate-y-1 border-white/60'
                                    }`}
                            >
                                {/* Checkbox for Selection Mode */}
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
                                                        target.style.display = 'none';
                                                        target.parentElement!.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
                                                    }}
                                                />
                                            ) : (
                                                <UserIcon size={32} />
                                            )}
                                        </div>
                                    </div>

                                    <h3 className="text-base font-bold text-slate-800 mb-0.5">{user.username}</h3>
                                    <p className="text-xs text-slate-500 mb-3">{user.email}</p>

                                    <div className="flex flex-col gap-1.5 w-full mt-1">
                                        <div className="flex items-center gap-2 bg-white/50 p-2 rounded-lg border border-white/50 text-xs text-slate-600">
                                            <Shield size={14} className="text-blue-500" />
                                            <p className="truncate">{user.role?.name_roles || 'Sem Cargo'}</p>
                                        </div>
                                        <div className="flex items-center gap-2 bg-white/50 p-2 rounded-lg border border-white/50 text-xs text-slate-600">
                                            <Briefcase size={14} className="text-purple-500" />
                                            <p className="truncate">{user.sector?.sector_name || 'Sem Setor'}</p>
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
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white pl-6 pr-2 py-2 rounded-full shadow-2xl shadow-slate-900/40 flex items-center gap-6 animate-in slide-in-from-bottom-10 fade-in duration-300 print:hidden">
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

            {/* Point Report Modal */}
            <PointReportModal
                isOpen={showReportModal}
                onClose={() => setShowReportModal(false)}
                users={selectedUsersList.map(u => ({ ...u, id: String(u.id) }))} // Adapter for ID type mismatch if needed. Check PointReportModal props.
            />

            {/* EDIT USER MODAL */}
            {isEditModalOpen && selectedUser && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex justify-center items-center p-4">
                    <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-2xl">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-slate-200 overflow-hidden border-2 border-white shadow-sm">
                                    {selectedUser.img_url ? (
                                        <img src={selectedUser.img_url} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-400"><UserIcon size={20} /></div>
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800">Editar Colaborador</h3>
                                    <p className="text-sm text-slate-500">ID: {selectedUser.user_id}</p>
                                </div>
                            </div>
                            <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 overflow-y-auto space-y-6">
                            {/* NOTE: Profile Image URL Field Removed as per request */}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Username */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                        <UserIcon size={16} className="text-blue-500" /> Nome Completo
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium"
                                        value={editForm.username || ''}
                                        onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                                    />
                                </div>

                                {/* Email */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                        <Mail size={16} className="text-blue-500" /> Email
                                    </label>
                                    <input
                                        type="email"
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                                        value={editForm.email || ''}
                                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                    />
                                </div>

                                {/* Created At - READ ONLY */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                        <Calendar size={16} className="text-blue-500" /> Cadastrado em
                                    </label>
                                    <input
                                        type="datetime-local"
                                        disabled
                                        className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 text-sm cursor-not-allowed"
                                        value={editForm.created_at ? new Date(editForm.created_at).toISOString().slice(0, 16) : ''}
                                    />
                                </div>

                                {/* Role */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                        <Shield size={16} className="text-blue-500" /> Cargo
                                    </label>
                                    <select
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                                        value={editForm.role_id || ''}
                                        onChange={(e) => setEditForm({ ...editForm, role_id: Number(e.target.value) })}
                                    >
                                        <option value="">Selecione um cargo</option>
                                        {roles.map(r => (
                                            <option key={r.id} value={r.id}>{r.name_roles}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Sector */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                        <Briefcase size={16} className="text-blue-500" /> Setor
                                    </label>
                                    <select
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                                        value={editForm.sector_id || ''}
                                        onChange={(e) => setEditForm({ ...editForm, sector_id: Number(e.target.value) })}
                                    >
                                        <option value="">Selecione um setor</option>
                                        {sectors.map(s => (
                                            <option key={s.id} value={s.id}>{s.sector_name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Acesso Medico */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                        <Stethoscope size={16} className="text-blue-500" /> Acesso Médico
                                    </label>
                                    <select
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                                        value={editForm.acesso_med || ''}
                                        onChange={(e) => setEditForm({ ...editForm, acesso_med: Number(e.target.value) || null })}
                                    >
                                        <option value="">Sem Acesso Médico</option>
                                        {/* Using 'acesso' column as confirmed by database screenshot */}
                                        {medProfiles.map(p => (
                                            <option key={p.id} value={p.id}>
                                                {p.acesso}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Lider Toggle */}
                            <div className="flex items-center gap-4 p-4 border border-slate-100 rounded-xl bg-slate-50/50">
                                <div className={`w-10 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${editForm.lider ? 'bg-amber-500' : 'bg-slate-300'}`} onClick={() => setEditForm({ ...editForm, lider: !editForm.lider })}>
                                    <div className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform ${editForm.lider ? 'translate-x-4' : 'translate-x-0'}`}></div>
                                </div>
                                <div>
                                    <p className="font-bold text-slate-700 text-sm flex items-center gap-2">
                                        <Crown size={14} className={editForm.lider ? 'text-amber-500' : 'text-slate-400'} />
                                        Cargo de Liderança
                                    </p>
                                    <p className="text-xs text-slate-500">Habilita permissões de gestão de equipe</p>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50 rounded-b-2xl">
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium text-sm transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSaveUser}
                                disabled={isSaving}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl font-bold text-sm shadow-sm shadow-blue-500/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSaving ? 'Salvando...' : (
                                    <>
                                        <Save size={18} /> Salvar Alterações
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Usuarios;
