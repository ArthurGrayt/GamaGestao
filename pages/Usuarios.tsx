import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from '../services/supabase';
import { Users, Search, Filter, Shield, Briefcase, User as UserIcon, Crown, FileText, CheckSquare, Square, X, Edit2, Save, Camera, Calendar, Mail, Stethoscope, Trash2, Eye, EyeOff, Archive, RefreshCcw, ChevronDown, UserPlus, Lock, Clock } from 'lucide-react';
import { PointReportModal } from '../components/PointReportModal';
import { EditPointsModal } from '../components/EditPointsModal';
import { JustificationDetailsModal, Justification } from '../components/JustificationDetailsModal';

interface Role {
    id: number;
    name_roles: string;
}

interface Sector {
    id: number;
    sector_name: string;
}

interface PerfilMed {
    id: number;
    acesso: string;
}

interface User {
    id: number;
    user_id: string; // UUID from auth or FK
    username: string;
    img_url?: string;
    lider: boolean;
    role?: Role;
    role_id?: number;
    sector?: Sector;
    sector_id?: number;
    email: string;
    created_at: string;
    acesso_med?: number;
    acesso_med_rel?: PerfilMed;
    active?: boolean;
    status?: 'Disponível' | 'Almoçando' | 'Indisponível' | 'Justificativa pendente'; // Added status field
    pendingJustification?: Justification;
}

export function Usuarios() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [roles, setRoles] = useState<Role[]>([]);
    const [sectors, setSectors] = useState<Sector[]>([]);
    const [medProfiles, setMedProfiles] = useState<PerfilMed[]>([]);

    const [searchTerm, setSearchTerm] = useState('');
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedUserIds, setSelectedUserIds] = useState<Set<number>>(new Set());
    const [showReportModal, setShowReportModal] = useState(false);
    const [showHidden, setShowHidden] = useState(false);

    // Detail Modal State
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isEditPointsModalOpen, setIsEditPointsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Justification Modal State
    const [selectedJustification, setSelectedJustification] = useState<Justification | null>(null);
    const [isJustificationModalOpen, setIsJustificationModalOpen] = useState(false);
    const [justificationUser, setJustificationUser] = useState<string>('');

    // Edit Form State
    const [editForm, setEditForm] = useState<Partial<User>>({});

    // Create Form State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [createForm, setCreateForm] = useState<Partial<User> & { password?: string }>({ active: true, lider: false });

    useEffect(() => {
        fetchUsers();
        fetchAuxData();
    }, []);

    // NEW: Function to determine status based on last point
    const calculateStatus = (lastType?: string): 'Disponível' | 'Almoçando' | 'Indisponível' => {
        if (!lastType) return 'Indisponível'; // Default if no record today

        if (lastType === 'Entrada' || lastType === 'Volta do almoço') {
            return 'Disponível';
        }
        if (lastType === 'Saída para almoço') {
            return 'Almoçando';
        }
        if (lastType === 'Fim de expediente') {
            return 'Indisponível';
        }
        return 'Indisponível';
    };

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
        `)
                .neq('role', 999);

            if (error) throw error;

            let fetchedUsers: User[] = data || [];
            const userIds = fetchedUsers.map(u => u.user_id);

            if (userIds.length > 0) {
                // 1. Fetch Points for Status
                const todayStart = new Date();
                todayStart.setHours(0, 0, 0, 0);
                const todayEnd = new Date();
                todayEnd.setHours(23, 59, 59, 999);

                console.log('Fetching points for date range:', todayStart.toISOString(), 'to', todayEnd.toISOString());
                const { data: pointsData, error: pointsError } = await supabase
                    .from('ponto_registros')
                    .select('user_id, tipo, datahora')
                    .in('user_id', userIds)
                    .gte('datahora', todayStart.toISOString())
                    .lte('datahora', todayEnd.toISOString())
                    .order('datahora', { ascending: true }); // Get all to find the last one

                // 2. Fetch Pending Justifications (Global check)
                const { data: justData, error: justError } = await supabase
                    .from('justificativa')
                    .select('*')
                    .in('usuario', userIds)
                    .or('aprovada.eq.false,aprovada.is.null'); // Pending (null) or Rejected (false) triggers status


                fetchedUsers = fetchedUsers.map(u => {
                    // Check Justification First
                    const myJustifications = justData?.filter(j => j.usuario === u.user_id) || [];
                    const hasPending = myJustifications.length > 0;

                    let status: any = 'Indisponível';

                    if (hasPending) {
                        status = 'Justificativa pendente';
                    } else {
                        // Calculate standard status
                        const myPoints = pointsData?.filter(p => p.user_id === u.user_id) || [];
                        const lastPoint = myPoints.length > 0 ? myPoints[myPoints.length - 1] : null;
                        status = calculateStatus(lastPoint?.tipo);
                    }

                    return {
                        ...u,
                        status: status,
                        pendingJustification: hasPending ? myJustifications[0] : undefined // Attach the first one found
                    };
                });
            }

            setUsers(fetchedUsers);
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

    const handleOpenJustification = (e: React.MouseEvent, user: User) => {
        e.stopPropagation(); // Prevent opening user modal
        if (user.pendingJustification) {
            setSelectedJustification(user.pendingJustification);
            setJustificationUser(user.username);
            setIsJustificationModalOpen(true);
        }
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

    const handleToggleActiveStatus = async () => {
        if (!selectedUser) return;

        const newStatus = selectedUser.active === false ? true : false; // Toggle
        const actionName = newStatus ? 'Reexibir' : 'Ocultar';

        if (!confirm(`Deseja realmente ${actionName} o usuário ${selectedUser.username}?`)) {
            return;
        }

        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('users')
                .update({ active: newStatus })
                .eq('id', selectedUser.id);

            if (error) throw error;

            await fetchUsers();
            setIsEditModalOpen(false);
            alert(`Usuário ${newStatus ? 'reexibido' : 'ocultado'} com sucesso.`);
        } catch (error) {
            console.error(`Erro ao ${actionName} usuário:`, error);
            alert(`Erro ao ${actionName} usuário.`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleResetPassword = async () => {
        const email = editForm.email?.trim();
        if (!email) {
            alert("Email não encontrado para este usuário.");
            return;
        }

        if (!confirm(`Deseja enviar um email de redefinição de senha para ${email}?`)) {
            return;
        }

        setIsSaving(true);
        try {
            console.log(`Tentando enviar reset password para: ${email} com redirect para https://gamaredefpass.vercel.app/redefinir-senha`);

            const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: 'https://gamaredefpass.vercel.app/redefinir-senha'
            });

            console.log('Resultado do reset password:', { data, error });

            if (error) throw error;

            alert(`Solicitação enviada realizado com sucesso!\n\nSe o email ${email} estiver cadastrado no sistema de Autenticação, ele receberá o link em instantes.\n\nVerifique também a caixa de Spam.`);
        } catch (error: any) {
            console.error("Erro ao enviar email de redefinição:", error);
            alert(`Erro ao enviar email: ${error.message || error}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteUser = async () => {
        if (!selectedUser) return;

        if (!confirm('ATENÇÃO: Você está prestes a excluir permanentemente este perfil de colaborador. Todas as informações associadas serão perdidas. Deseja continuar?')) {
            return;
        }

        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('users')
                .delete()
                .eq('id', selectedUser.id);

            if (error) throw error;

            await fetchUsers();
            setIsEditModalOpen(false);
            alert('Colaborador excluído com sucesso.');
        } catch (error) {
            console.error('Erro ao excluir usuário:', error);
            alert('Erro ao excluir usuário. Verifique se existem registros vinculados.');
        } finally {
            setIsSaving(false);
        }
    }

    const handleCreateUser = async () => {
        if (!createForm.email || !createForm.password || !createForm.username) {
            alert("Preencha todos os campos obrigatórios (Nome, Email, Senha).");
            return;
        }

        setIsSaving(true);
        try {
            // 1. Create temporary client to avoid logging out the admin
            const tempSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
                auth: {
                    persistSession: false,
                    autoRefreshToken: false,
                    detectSessionInUrl: false
                }
            });

            // 2. Create User in Auth
            const { data: authData, error: authError } = await tempSupabase.auth.signUp({
                email: createForm.email,
                password: createForm.password,
                options: {
                    data: {
                        username: createForm.username
                    }
                }
            });

            if (authError) throw authError;
            if (!authData.user) throw new Error("Usuário não criado.");

            // 3. Insert into Public Users
            const newUser = {
                user_id: authData.user.id, // Use the real Auth ID
                username: createForm.username,
                email: createForm.email,
                role: createForm.role_id,
                sector: createForm.sector_id,
                lider: createForm.lider || false,
                acesso_med: createForm.acesso_med,
                // active: true, // removed
                created_at: new Date().toISOString()
            };

            const { error } = await supabase
                .from('users')
                .insert([newUser]);

            if (error) {
                // Optional: Rollback auth user creation if public insert fails (complex without admin api, skipping for now)
                throw error;
            }

            await fetchUsers();
            setIsCreateModalOpen(false);
            setCreateForm({ active: true, lider: false });
            alert('Colaborador criado com sucesso! O Login já está ativo.');
        } catch (error: any) {
            console.error("Erro ao criar usuário:", error);
            alert(`Erro ao criar usuário: ${error.message || error}`);
        } finally {
            setIsSaving(false);
        }
    };

    const filteredUsers = users.filter(user => {
        // Filter by Search Term
        const matchesSearch = user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.role?.name_roles?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.sector?.sector_name?.toLowerCase().includes(searchTerm.toLowerCase());

        // Filter by Active Status
        const isActive = user.active !== false; // Null or True = Active. False = Inactive.

        if (showHidden) {
            return matchesSearch && !isActive; // Show only hidden
        }
        return matchesSearch && isActive; // Show only active
    });

    const selectedUsersList = users.filter(u => selectedUserIds.has(u.id));

    // Status Badge Helpers
    const getStatusColor = (status?: string) => {
        switch (status) {
            case 'Disponível': return 'bg-green-100 text-green-700 border-green-200';
            case 'Almoçando': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'Indisponível': return 'bg-slate-100 text-slate-500 border-slate-200';
            case 'Justificativa pendente': return 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200 animate-pulse cursor-pointer';
            default: return 'bg-slate-100 text-slate-500 border-slate-200';
        }
    };

    const getStatusIcon = (status?: string) => {
        switch (status) { // Only icons if needed, but text is requested. Using for decorative maybe?
            default: return null;
        }
    };

    const handleApproveJustification = async (id: number) => {
        try {
            const { error } = await supabase
                .from('justificativa')
                .update({ aprovada: true })
                .eq('id', id);

            if (error) throw error;
            await fetchUsers();
            alert("Justificativa aceita com sucesso!");
        } catch (error) {
            console.error("Erro ao aceitar justificativa:", error);
            throw error; // Let modal handle error state
        }
    };

    const handleRejectJustification = async (id: number) => {
        try {
            const { error } = await supabase
                .from('justificativa')
                .update({ aprovada: false })
                .eq('id', id);

            if (error) throw error;
            await fetchUsers();
            alert("Justificativa recusada com sucesso!");
        } catch (error) {
            console.error("Erro ao recusar justificativa:", error);
            throw error; // Let modal handle error state
        }
    };

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
                        <>
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-green-700 transition-colors shadow-sm shadow-green-500/20"
                            >
                                <UserPlus size={18} />
                                <span className="hidden xl:inline">Novo Colaborador</span>
                                <span className="xl:hidden">Novo</span>

                            </button>
                            <button
                                onClick={() => setIsEditPointsModalOpen(true)}
                                className="flex items-center gap-2 bg-amber-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-amber-600 transition-colors shadow-sm shadow-amber-500/20"
                            >
                                <Edit2 size={18} />
                                <span className="hidden xl:inline">Configuração de Ponto</span>
                                <span className="xl:hidden">Config</span>
                            </button>
                            <button
                                onClick={() => toggleSelectionMode()}
                                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/20"
                            >
                                <FileText size={18} />
                                <span className="hidden xl:inline">Relatório de Ponto</span>
                                <span className="xl:hidden">Relatório</span>
                            </button>

                        </>
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
                            placeholder="Buscar..."
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
                                    <div className="absolute top-3 left-3 z-30">
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

                                {/* STATUS BADGE - Absolute Position */}
                                <div
                                    onClick={(e) => user.status === 'Justificativa pendente' && handleOpenJustification(e, user)}
                                    className={`absolute top-3 ${isSelectionMode ? 'left-12' : 'left-3'} z-20 px-2.5 py-1 rounded-lg text-[10px] uppercase font-bold tracking-wider border shadow-sm backdrop-blur-sm transition-all duration-300 ${getStatusColor(user.status)}`}
                                >
                                    {user.status || 'Indisponível'}
                                </div>

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
                                    <div className="w-16 h-16 rounded-full p-1 bg-white shadow-md mb-3 relative mt-6">
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

                                    {/* Removed Old Relative Status Badge */}

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
            {
                isSelectionMode && (
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
                )
            }

            {/* Point Report Modal */}
            <PointReportModal
                isOpen={showReportModal}
                onClose={() => setShowReportModal(false)}
                users={selectedUsersList.map(u => ({ ...u, id: String(u.id), role_id: u.role?.id || u.role_id }))}
            />

            {/* NEW: Edit Points Modal */}
            <EditPointsModal
                isOpen={isEditPointsModalOpen}
                onClose={() => setIsEditPointsModalOpen(false)}
                users={users}
            />

            {/* Justification Details Modal */}
            <JustificationDetailsModal
                isOpen={isJustificationModalOpen}
                onClose={() => setIsJustificationModalOpen(false)}
                justification={selectedJustification}
                applicantName={justificationUser}
                onApprove={handleApproveJustification}
                onReject={handleRejectJustification}
            />

            {/* CREATE USER MODAL */}
            {
                isCreateModalOpen && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex justify-center items-center p-4">
                        <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
                            {/* Header */}
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-2xl">
                                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                                    <div className="bg-green-100 p-2 rounded-xl text-green-600">
                                        <UserPlus size={20} />
                                    </div>
                                    Novo Colaborador
                                </h2>
                                <button
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Form Body */}
                            <div className="p-8 overflow-y-auto space-y-6">
                                {/* Avatar Placeholder */}
                                <div className="flex flex-col items-center justify-center mb-6">
                                    <div className="w-24 h-24 rounded-full bg-slate-100 mb-3 overflow-hidden border-4 border-white shadow-lg flex items-center justify-center text-slate-300">
                                        <UserIcon size={40} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Username */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">Nome Completo</label>
                                        <div className="relative">
                                            <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <input
                                                type="text"
                                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                                                value={createForm.username || ''}
                                                onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                                                placeholder="Ex: João da Silva"
                                            />
                                        </div>
                                    </div>

                                    {/* Email */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">Email Corporativo</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <input
                                                type="email"
                                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                                                value={createForm.email || ''}
                                                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                                                placeholder="Ex: joao@empresa.com"
                                                autoComplete="off"
                                            />
                                        </div>
                                    </div>

                                    {/* Password */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">Senha de Acesso</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                className="w-full pl-10 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                                                value={createForm.password || ''}
                                                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                                                placeholder="••••••••"
                                                autoComplete="new-password"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                            >
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Role */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">Cargo / Função</label>
                                        <div className="relative">
                                            <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <select
                                                className="w-full pl-10 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm appearance-none"
                                                value={createForm.role_id || ''}
                                                onChange={(e) => setCreateForm({ ...createForm, role_id: Number(e.target.value) })}
                                            >
                                                <option value="">Selecione...</option>
                                                {roles.map(r => (
                                                    <option key={r.id} value={r.id}>{r.name_roles}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Sector */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">Setor / Departamento</label>
                                        <div className="relative">
                                            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <select
                                                className="w-full pl-10 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm appearance-none"
                                                value={createForm.sector_id || ''}
                                                onChange={(e) => setCreateForm({ ...createForm, sector_id: Number(e.target.value) })}
                                            >
                                                <option value="">Selecione...</option>
                                                {sectors.map(s => (
                                                    <option key={s.id} value={s.id}>{s.sector_name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Acesso Gama Recep */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">Acesso Gama Recep</label>
                                        <div className="relative group">
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-blue-500 transition-colors pointer-events-none">
                                                <Stethoscope size={18} />
                                            </div>
                                            <select
                                                className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm appearance-none transition-all shadow-sm hover:border-blue-300 cursor-pointer text-slate-700 font-medium"
                                                value={createForm.acesso_med || ''}
                                                onChange={(e) => setCreateForm({ ...createForm, acesso_med: Number(e.target.value) || null })}
                                            >
                                                <option value="">Selecione o tipo de acesso...</option>
                                                {medProfiles.map(p => (
                                                    <option key={p.id} value={p.id}>{p.id} - {p.acesso}</option>
                                                ))}
                                            </select>
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-slate-600 transition-colors pointer-events-none">
                                                <ChevronDown size={16} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Leader Toggle */}
                                    <div className="col-span-1 md:col-span-2 pt-2">
                                        <label className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={createForm.lider || false}
                                                onChange={(e) => setCreateForm({ ...createForm, lider: e.target.checked })}
                                                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                                            />
                                            <div>
                                                <span className="font-bold text-slate-800 text-sm block">Atribuir Perfil de Liderança</span>
                                                <span className="text-xs text-slate-500">Permite acesso a dashboards de gestão e relatórios de equipe</span>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-6 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl flex justify-end items-center gap-3">
                                <button
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-5 py-2.5 rounded-xl text-slate-600 font-medium hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 transition-all text-sm"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleCreateUser}
                                    disabled={isSaving}
                                    className="bg-green-600 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-green-700 active:scale-95 transition-all shadow-lg shadow-green-500/20 flex items-center gap-2 text-sm disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {isSaving ? 'Criando...' : (
                                        <>
                                            <UserPlus size={18} />
                                            Criar Colaborador
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* EDIT USER MODAL */}
            {
                isEditModalOpen && selectedUser && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex justify-center items-center p-4">
                        <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
                            {/* Header */}
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-2xl">
                                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                                    <div className="bg-blue-100 p-2 rounded-xl text-blue-600">
                                        <Users size={20} />
                                    </div>
                                    Editar Colaborador
                                </h2>
                                <button
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Form Body */}
                            <div className="p-8 overflow-y-auto space-y-6">
                                {/* Avatar Section */}
                                <div className="flex flex-col items-center justify-center mb-6">
                                    <div className="w-24 h-24 rounded-full bg-slate-100 mb-3 overflow-hidden border-4 border-white shadow-lg relative group">
                                        {editForm.img_url ? (
                                            <img src={editForm.img_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                <UserIcon size={40} />
                                            </div>
                                        )}
                                    </div>

                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Username */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">Nome Completo</label>
                                        <div className="relative">
                                            <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <input
                                                type="text"
                                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                                                value={editForm.username || ''}
                                                onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    {/* Email */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">Email Corporativo</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <input
                                                type="email"
                                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                                                value={editForm.email || ''}
                                                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    {/* Role */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">Cargo / Função</label>
                                        <div className="relative">
                                            <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <select
                                                className="w-full pl-10 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm appearance-none"
                                                value={editForm.role_id || ''}
                                                onChange={(e) => setEditForm({ ...editForm, role_id: Number(e.target.value) })}
                                            >
                                                <option value="">Selecione...</option>
                                                {roles.map(r => (
                                                    <option key={r.id} value={r.id}>{r.name_roles}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Sector */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">Setor / Departamento</label>
                                        <div className="relative">
                                            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <select
                                                className="w-full pl-10 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm appearance-none"
                                                value={editForm.sector_id || ''}
                                                onChange={(e) => setEditForm({ ...editForm, sector_id: Number(e.target.value) })}
                                            >
                                                <option value="">Selecione...</option>
                                                {sectors.map(s => (
                                                    <option key={s.id} value={s.id}>{s.sector_name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Created At (Read Only) */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">Cadastrado em</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <input
                                                type="text" // Text because it's read-only
                                                readOnly
                                                disabled
                                                className="w-full pl-10 pr-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed text-sm font-mono"
                                                value={editForm.created_at ? new Date(editForm.created_at).toLocaleDateString() : ''}
                                            />
                                        </div>
                                    </div>

                                    {/* Acesso Gama Recep */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">Acesso Gama Recep</label>
                                        <div className="relative group">
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-blue-500 transition-colors pointer-events-none">
                                                <Stethoscope size={18} />
                                            </div>
                                            <select
                                                className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm appearance-none transition-all shadow-sm hover:border-blue-300 cursor-pointer text-slate-700 font-medium"
                                                value={editForm.acesso_med || ''}
                                                onChange={(e) => setEditForm({ ...editForm, acesso_med: Number(e.target.value) || null })}
                                            >
                                                <option value="">Selecione o tipo de acesso...</option>
                                                {medProfiles.map(p => (
                                                    <option key={p.id} value={p.id}>{p.id} - {p.acesso}</option>
                                                ))}
                                            </select>
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-slate-600 transition-colors pointer-events-none">
                                                <ChevronDown size={16} />
                                            </div>
                                        </div>
                                    </div>



                                    {/* Leader Toggle */}
                                    <div className="col-span-1 md:col-span-2 pt-2">
                                        <label className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={editForm.lider || false}
                                                onChange={(e) => setEditForm({ ...editForm, lider: e.target.checked })}
                                                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                                            />
                                            <div>
                                                <span className="font-bold text-slate-800 text-sm block">Atribuir Perfil de Liderança</span>
                                                <span className="text-xs text-slate-500">Permite acesso a dashboards de gestão e relatórios de equipe</span>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-6 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl flex flex-wrap justify-between items-center gap-4">
                                <div className="flex gap-3 flex-wrap">
                                    <button
                                        onClick={handleDeleteUser}
                                        className="px-5 py-2.5 rounded-xl text-red-500 font-medium hover:bg-red-50 border border-transparent hover:border-red-100 transition-all text-sm flex items-center gap-2"
                                    >
                                        <Trash2 size={18} />
                                        Apagar Perfil
                                    </button>
                                    <button
                                        onClick={handleResetPassword}
                                        className="px-5 py-2.5 rounded-xl text-amber-600 font-medium hover:bg-amber-50 border border-transparent hover:border-amber-100 transition-all text-sm flex items-center gap-2"
                                    >
                                        <Lock size={18} />
                                        Esqueci minha senha
                                    </button>
                                </div>
                                <div className="flex gap-3 ml-auto">
                                    <button
                                        onClick={() => setIsEditModalOpen(false)}
                                        className="px-5 py-2.5 rounded-xl text-slate-600 font-medium hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 transition-all text-sm"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleSaveUser}
                                        disabled={isSaving}
                                        className="bg-blue-600 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2 text-sm disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {isSaving ? 'Salvando...' : (
                                            <>
                                                <Save size={18} />
                                                Salvar Alterações
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
