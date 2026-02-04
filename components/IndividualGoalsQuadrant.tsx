import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../services/supabase';
import { User, Plus, Edit2, Trash2, Target, ChevronRight, Save, X, CheckCircle2, Circle, RefreshCw, Info, ChevronDown, Maximize2, ShieldAlert, Briefcase, ListChecks } from 'lucide-react';

const SECTOR_ACTIVITIES: Record<string, string[]> = {
    'administrativo': [
        'Gestão de Recursos Humanos',
        'Administração Financeira e Orçamentária',
        'Gestão de Materiais e Logística',
        'Arquivos, Registros e Documentação',
        'Elaboração e Implementação de Políticas Internas'
    ],
    'medicina ocupacional': [
        'Realização de exames ocupacionais',
        'Prevenção de doenças e acidentes',
        'Avaliação de riscos e ambiente de trabalho'
    ],
    'segurança do trabalho': [
        'Identificar e prevenir riscos no ambiente de trabalho',
        'Elaborar e aplicar normas de segurança',
        'Realizar treinamentos e palestras',
        'Investigar acidentes e propor melhorias',
        'Garantir o cumprimento das leis e normas regulamentadoras (NRs)'
    ],
    'tecnologia da informação': [
        'Manutenção de computadores, redes e sistemas',
        'Suporte técnico aos usuários',
        'Desenvolvimento e atualização de softwares e sistemas',
        'Gestão da segurança da informação',
        'Backup e proteção de dados'
    ],
    'comercial': [
        'Prospecção e atendimento de clientes',
        'Elaboração de propostas e contratos',
        'Negociação de preços e condições',
        'Acompanhamento pós-venda',
        'Análise de mercado e metas de vendas'
    ]
};

interface ComponentUser {
    id: string; // db: user_id
    username: string;
    sector_name?: string;
}

interface IndividualGoal {
    id: number; // db: id_meta (Changed to number based on probe)
    destinatario_id: string; // ID of the collaborator (assignee)
    remetente_id: string;    // ID of the creator (assigner)
    collaboratorName: string; // Display name for UI only
    objective: string;    // db: descricao
    type: string;         // db: tipo
    created_at?: string;  // db: created_at
    deadline?: string;    // db: data_limite
    data_entregue?: string | null; // db: data_entregue
    targetValue?: number;
    currentValue: number;
    isCompleted: boolean;
}

export const IndividualGoalsQuadrant: React.FC = () => {
    const [users, setUsers] = useState<ComponentUser[]>([]);
    const [goals, setGoals] = useState<IndividualGoal[]>([]);
    const [loading, setLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [filteredUsers, setFilteredUsers] = useState<ComponentUser[]>([]);
    const formRef = useRef<HTMLFormElement>(null);

    const [editingGoal, setEditingGoal] = useState<IndividualGoal | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);

    // Goal type dropdown state
    const goalTypes = ['resultado', 'processo', 'aprendizado', 'qualitativo'];
    const [filteredTypes, setFilteredTypes] = useState<string[]>(goalTypes);
    const [showTypeDropdown, setShowTypeDropdown] = useState(false);
    const [isTypeValid, setIsTypeValid] = useState(true);

    // Authorization state
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [checkingAuth, setCheckingAuth] = useState(true);
    const [currentUserName, setCurrentUserName] = useState<string>('');
    const [currentUserId, setCurrentUserId] = useState<string>('');

    // Check authorization
    useEffect(() => {
        const checkAuthorization = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();

                if (!session) {
                    setIsAuthorized(false);
                    setCheckingAuth(false);
                    return;
                }

                setCurrentUserId(session.user.id);

                const { data: userData, error } = await supabase
                    .from('users')
                    .select('username, sector')
                    .eq('user_id', session.user.id)
                    .single();

                if (error || !userData) {
                    console.error('Error fetching user:', error);
                    setIsAuthorized(false);
                } else {
                    const authorizedUsers = ['Clárison Gamarano', 'Daiane Gamarano', 'Pedro Borba'];
                    const username = userData.username;
                    setCurrentUserName(username);

                    // Authorize only if user is in the specific whitelist
                    const isAuthorizedUser = authorizedUsers.includes(username);
                    setIsAuthorized(isAuthorizedUser);
                }
            } catch (err) {
                console.error('Authorization check error:', err);
                setIsAuthorized(false);
            } finally {
                setCheckingAuth(false);
            }
        };

        checkAuthorization();
    }, []);

    useEffect(() => {
        const fetchUserData = async () => {
            setLoading(true);
            try {
                // Fetch Users for autocomplete with IDs
                const { data: userData, error: userError } = await supabase
                    .from('users')
                    .select('user_id, username, sector ( sector_name )')
                    .order('username');

                if (userError) throw userError;

                let loadedUsers: ComponentUser[] = [];
                if (userData) {
                    loadedUsers = userData.map(u => {
                        const s = u.sector as any;
                        return {
                            id: u.user_id,
                            username: u.username,
                            sector_name: Array.isArray(s) ? s[0]?.sector_name : s?.sector_name
                        };
                    });
                    setUsers(loadedUsers);
                }

                // Fetch existing goals from Supabase
                const { data: goalData, error: goalError } = await supabase
                    .from('metas_usuarios')
                    .select('id_meta, destinatario_id, remetente_id, descricao, tipo, created_at, data_limite, data_entregue')
                    .order('created_at', { ascending: false });

                if (goalError) throw goalError;
                if (goalData) {
                    const mappedGoals: IndividualGoal[] = goalData.map(g => {
                        // Find collaborator name from loaded Users
                        const collaboratorUser = loadedUsers.find(u => u.id === g.destinatario_id);
                        const collaboratorName = collaboratorUser ? collaboratorUser.username : 'Desconhecido';

                        return {
                            id: g.id_meta, // Map id_meta to id
                            destinatario_id: g.destinatario_id,
                            remetente_id: g.remetente_id,
                            collaboratorName: collaboratorName,
                            objective: g.descricao,
                            type: g.tipo,
                            created_at: g.created_at,
                            deadline: g.data_limite,
                            data_entregue: g.data_entregue,
                            currentValue: 0,
                            isCompleted: !!g.data_entregue
                        };
                    });
                    setGoals(mappedGoals);
                }
            } catch (err) {
                console.error('Error fetching data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget as HTMLFormElement);
        const collaboratorNameInput = formData.get('collaborator') as string;
        const objective = formData.get('objective') as string;
        const type = formData.get('type') as string;
        const deadline = formData.get('deadline') as string;

        if (!collaboratorNameInput || !objective || !type) {
            alert('Preencha todos os campos obrigatórios.');
            return;
        }

        if (!isTypeValid) {
            alert('Informe um tipo de meta válido antes de salvar.');
            return;
        }

        const selectedUser = users.find(u => u.username.toLowerCase() === collaboratorNameInput.toLowerCase());
        if (!selectedUser) {
            alert('Colaborador não encontrado. Selecione um usuário da lista.');
            return;
        }

        if (!currentUserId) {
            alert('Erro de autenticação. Recarregue a página.');
            return;
        }

        setLoading(true);
        try {
            if (editingGoal) {
                const { error } = await supabase
                    .from('metas_usuarios')
                    .update({
                        destinatario_id: selectedUser.id,
                        descricao: objective,
                        tipo: type,
                        data_limite: deadline || null
                    })
                    .eq('id_meta', editingGoal.id);

                if (error) throw error;

                setGoals(prev => prev.map(g => g.id === editingGoal.id ? {
                    ...g,
                    destinatario_id: selectedUser.id,
                    collaboratorName: selectedUser.username,
                    objective,
                    type,
                    deadline: deadline || undefined
                } : g));
                setEditingGoal(null);
            } else {
                // Generate a random ID for id_meta (assuming integer)
                const newIdMeta = Math.floor(Math.random() * 2147483647); // Safe integer range

                const { data, error } = await supabase
                    .from('metas_usuarios')
                    .insert([{
                        id_meta: newIdMeta,
                        destinatario_id: selectedUser.id,
                        remetente_id: currentUserId,
                        descricao: objective,
                        tipo: type,
                        data_limite: deadline || null
                    }])
                    .select()
                    .single();

                if (error) throw error;

                if (data) {
                    setGoals(prev => [{
                        id: data.id_meta,
                        destinatario_id: data.destinatario_id,
                        remetente_id: data.remetente_id,
                        collaboratorName: selectedUser.username,
                        objective: data.descricao,
                        type: data.tipo,
                        created_at: data.created_at,
                        deadline: data.data_limite,
                        data_entregue: data.data_entregue,
                        currentValue: 0,
                        isCompleted: !!data.data_entregue
                    }, ...prev]);
                }
            }
            formRef.current?.reset();
        } catch (err) {
            console.error('Error saving goal:', err);
            alert('Erro ao salvar meta no banco de dados.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        setLoading(true);
        try {
            const { error } = await supabase
                .from('metas_usuarios')
                .delete()
                .eq('id_meta', id);

            if (error) throw error;

            setGoals(prev => prev.filter(g => g.id !== id));
            if (editingGoal?.id === id) setEditingGoal(null);
        } catch (err) {
            console.error('Error deleting goal:', err);
            alert('Erro ao excluir meta do banco de dados.');
        } finally {
            setLoading(false);
        }
    };

    const toggleGoalStatus = async (id: number, currentStatus: boolean) => {
        const newStatus = !currentStatus;
        const newDataEntregue = newStatus ? new Date().toISOString() : null;

        setGoals(prev => prev.map(g => g.id === id ? { ...g, isCompleted: newStatus, data_entregue: newDataEntregue || undefined } : g));

        try {
            const { error } = await supabase
                .from('metas_usuarios')
                .update({
                    data_entregue: newDataEntregue
                })
                .eq('id_meta', id);

            if (error) {
                setGoals(prev => prev.map(g => g.id === id ? { ...g, isCompleted: currentStatus, data_entregue: currentStatus ? (g.data_entregue) : null } : g));
                throw error;
            }
        } catch (err) {
            console.error('Error updating goal status:', err);
            alert('Erro ao atualizar status da meta.');
        }
    };

    // Loading state
    if (checkingAuth) {
        return (
            <div className="bg-white/60 backdrop-blur-xl p-6 rounded-3xl shadow-lg shadow-slate-200/50 border border-white/50 h-[600px] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <RefreshCw size={32} className="text-purple-500 animate-spin" />
                    <p className="text-sm text-slate-500 font-medium">Verificando permissões...</p>
                </div>
            </div>
        );
    }

    // Access denied state
    if (!isAuthorized) {
        return (
            <div className="bg-white/60 backdrop-blur-xl p-6 rounded-3xl shadow-lg shadow-slate-200/50 border border-white/50 h-[600px] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4 max-w-sm text-center">
                    <div className="bg-orange-50 text-orange-500 w-16 h-16 rounded-2xl flex items-center justify-center">
                        <ShieldAlert size={32} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 mb-2">Acesso Restrito</h3>
                        <p className="text-sm text-slate-500 leading-relaxed">
                            Este quadrante está disponível apenas para usuários autorizados a atribuir metas individuais.
                        </p>
                        {currentUserName && (
                            <p className="text-xs text-slate-400 mt-3 italic">
                                Usuário atual: {currentUserName}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white/60 backdrop-blur-xl p-6 rounded-3xl shadow-lg shadow-slate-200/50 border border-white/50 h-[600px] flex flex-col relative">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
                <div>
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Target size={20} className="text-purple-500" />
                        Metas p/ Indivíduo
                    </h3>
                </div>
                <div className="flex items-center gap-2">
                    {editingGoal && (
                        <button
                            onClick={() => {
                                setEditingGoal(null);
                                formRef.current?.reset();
                            }}
                            className="text-[10px] font-bold text-red-500 uppercase flex items-center gap-1 hover:bg-red-50 px-2 py-1 rounded-lg transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
                        >
                            <X size={12} /> Cancelar Edição
                        </button>
                    )}
                </div>
            </div>

            {/* Quick Form Section */}
            <form
                ref={formRef}
                onSubmit={handleSave}
                className="bg-white/40 border border-white/60 p-4 rounded-2xl mb-4 space-y-3 flex-shrink-0 transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-white/50"
            >
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <div className="h-4 flex items-center ml-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase">Colaborador</label>
                        </div>
                        <div className="relative">
                            <input
                                name="collaborator"
                                required
                                autoComplete="off"
                                className="w-full bg-white/70 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
                                placeholder="Pesquisar..."
                                defaultValue={editingGoal?.collaboratorName || ''}
                                key={editingGoal?.id || 'new'}
                                onChange={(e) => {
                                    const value = e.target.value.toLowerCase();
                                    const filtered = users.filter(u => u.username.toLowerCase().includes(value));
                                    setFilteredUsers(filtered);
                                    setShowSuggestions(true);
                                }}
                                onFocus={() => {
                                    setFilteredUsers(users);
                                    setShowSuggestions(true);
                                }}
                                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} // Delay to allow click
                            />
                            {showSuggestions && (
                                <div className="absolute top-full left-0 w-full mt-2 bg-white/90 backdrop-blur-md border border-slate-200 rounded-xl shadow-xl max-h-[120px] overflow-y-auto z-50 custom-scrollbar animate-in fade-in zoom-in-95 duration-500 ease-[cubic-bezier(0,4,0,0.2,1)]">
                                    {filteredUsers.length > 0 ? (
                                        filteredUsers.map(user => (
                                            <div
                                                key={user.id}
                                                className="px-3 py-2 text-xs text-slate-700 hover:bg-blue-50 cursor-pointer transition-colors border-b border-slate-100/50 last:border-0"
                                                onClick={() => {
                                                    const input = document.querySelector('input[name="collaborator"]') as HTMLInputElement;
                                                    if (input) {
                                                        input.value = user.username;
                                                    }
                                                    setShowSuggestions(false);
                                                }}
                                            >
                                                {user.username}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="px-3 py-2 text-[10px] text-slate-400 italic text-center">
                                            Nenhum encontrado
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>


                    </div>
                    <div className="space-y-1.5">
                        <div className="h-4 flex items-center gap-1 ml-1 relative group/tooltip">
                            <label className="text-[9px] font-bold text-slate-400 uppercase">Tipo de Meta</label>
                            <Info size={10} className="text-orange-500/50 cursor-help" />

                            {/* Tooltip Balloon */}
                            <div className="absolute bottom-full left-0 mb-3 w-64 p-3 bg-slate-800/95 text-white text-[10px] rounded-2xl shadow-2xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] z-[100] pointer-events-none border border-slate-700/50 backdrop-blur-md translate-y-2 group-hover/tooltip:translate-y-0">
                                <p className="leading-relaxed">
                                    Uma forma de classificar a meta, como uma etiqueta. Ajuda a entender para que ela serve e como deve ser acompanhada.
                                    <br /><br />
                                    <span className="font-bold text-orange-400">Exemplos:</span><br />
                                    • “Vender 10 produtos” → Meta de resultado<br />
                                    • “Estudar 30 min/dia” → Meta de processo<br />
                                    • “Concluir curso” → Meta de aprendizado<br />
                                    • “Melhorar atendimento” → Meta qualitativa
                                </p>
                                {/* Triangle Arrow */}
                                <div className="absolute top-full left-4 -mt-1 w-2 h-2 bg-slate-800 rotate-45 border-r border-b border-slate-700/50" />
                            </div>
                        </div>
                        <div className="relative">
                            <input
                                name="type"
                                type="text"
                                required
                                autoComplete="off"
                                className={`w-full bg-white/70 border ${!isTypeValid ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-200'} rounded-xl px-3 py-2 text-xs focus:ring-2 ${!isTypeValid ? 'focus:ring-red-500' : 'focus:ring-blue-500'} outline-none transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]`}
                                placeholder="Pesquisar..."
                                defaultValue={editingGoal?.type}
                                key={`type-${editingGoal?.id || 'new'}`}
                                onChange={(e) => {
                                    const value = e.target.value.toLowerCase();
                                    const filtered = goalTypes.filter(t => t.toLowerCase().includes(value));
                                    setFilteredTypes(filtered);
                                    setShowTypeDropdown(true);
                                    setIsTypeValid(goalTypes.includes(value));
                                }}
                                onFocus={() => {
                                    setFilteredTypes(goalTypes);
                                    setShowTypeDropdown(true);
                                }}
                                onBlur={(e) => {
                                    setTimeout(() => setShowTypeDropdown(false), 200);
                                    setIsTypeValid(goalTypes.includes(e.target.value.toLowerCase()));
                                }}
                            />
                            {!isTypeValid && (
                                <p className="text-[9px] text-red-500 font-bold mt-1 ml-1 animate-in fade-in slide-in-from-top-1">
                                    Informe um tipo de meta válido
                                </p>
                            )}
                            {showTypeDropdown && (
                                <div className="absolute top-full left-0 w-full mt-2 bg-white/90 backdrop-blur-md border border-slate-200 rounded-xl shadow-xl max-h-[120px] overflow-y-auto z-50 custom-scrollbar animate-in fade-in zoom-in-95 duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]">
                                    {filteredTypes.length > 0 ? (
                                        filteredTypes.map(type => (
                                            <div
                                                key={type}
                                                className="px-3 py-2 text-xs text-slate-700 hover:bg-blue-50 cursor-pointer transition-colors border-b border-slate-100/50 last:border-0 capitalize"
                                                onClick={() => {
                                                    const input = document.querySelector('input[name="type"]') as HTMLInputElement;
                                                    if (input) {
                                                        input.value = type;
                                                        setIsTypeValid(true);
                                                    }
                                                    setShowTypeDropdown(false);
                                                }}
                                            >
                                                {type}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="px-3 py-2 text-[10px] text-slate-400 italic text-center">
                                            Nenhum encontrado
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sector Activities Card (Full Width) */}
                {(editingGoal?.collaboratorName || (formRef.current?.querySelector('[name="collaborator"]') as HTMLInputElement)?.value) && (() => {
                    const inputValue = (document.querySelector('input[name="collaborator"]') as HTMLInputElement)?.value || editingGoal?.collaboratorName || '';
                    const selectedUser = users.find(u => u.username.toLowerCase() === inputValue.toLowerCase());
                    const sectorName = selectedUser?.sector_name?.toLowerCase();
                    const activities = (sectorName && SECTOR_ACTIVITIES[sectorName]) || [];

                    if (!selectedUser) return null;

                    // If we have activities using the new logic
                    if (sectorName && activities.length > 0) {
                        return (
                            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3 mb-3 animate-in fade-in slide-in-from-top-2 duration-500">
                                <h4 className="text-[10px] font-bold text-blue-700 uppercase flex items-center gap-1.5 mb-2">
                                    <Briefcase size={12} />
                                    Atividades do Setor: <span className="text-blue-600 font-extrabold">{selectedUser.sector_name}</span>
                                </h4>
                                <ul className="space-y-1">
                                    {activities.map((activity, i) => (
                                        <li key={i} className="flex items-start gap-1.5 text-[10px] text-slate-600 leading-tight">
                                            <ListChecks size={10} className="text-blue-400 mt-0.5 flex-shrink-0" />
                                            <span>{activity}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        );
                    }

                    // Fallback for user without sector or unmapped activities
                    return (
                        <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-3 mb-3 animate-in fade-in slide-in-from-top-2 duration-500 flex items-center justify-center">
                            <p className="text-[10px] font-medium text-amber-600/80 italic flex items-center gap-2">
                                <ShieldAlert size={12} />
                                Colaborador sem setor. Funções não encontradas.
                            </p>
                        </div>
                    );
                })()}

                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Objetivo (Meta)</label>
                        <div className="flex gap-2">
                            <input
                                name="objective"
                                type="text"
                                required
                                className="flex-1 bg-white/70 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
                                placeholder="Descreva a meta..."
                                defaultValue={editingGoal?.objective}
                                key={`obj-${editingGoal?.id || 'new'}`}
                            />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Data Limite</label>
                        <input
                            name="deadline"
                            type="date"
                            className="w-full bg-white/70 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] [color-scheme:light]"
                            defaultValue={editingGoal?.deadline}
                            key={`deadline-${editingGoal?.id || 'new'}`}
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading || !isTypeValid}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? <RefreshCw size={14} className="animate-spin" /> : (editingGoal ? <Save size={14} /> : <Plus size={14} />)}
                    {editingGoal ? 'Salvar Alterações' : 'Adicionar Meta'}
                </button>
            </form >

            {/* View Goals Section (Always Visible) */}
            < div className="flex-1 flex flex-col min-h-0" >
                <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-white/50 rounded-t-2xl">
                    <p className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                        <Target size={12} className="text-purple-500" />
                        Lista de Metas ({goals.length})
                    </p>
                    <button
                        onClick={() => setIsExpanded(true)}
                        className="p-1 px-2 hover:bg-slate-100 text-slate-400 hover:text-blue-600 rounded-lg transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] flex items-center gap-1.5 active:scale-95 group/expand"
                        title="Expandir visualização"
                    >
                        <span className="text-[9px] font-bold uppercase opacity-0 group-hover/expand:opacity-100 transition-opacity duration-500">Expandir</span>
                        <Maximize2 size={13} className="group-hover/expand:scale-110 transition-transform duration-500" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-3 custom-scrollbar space-y-3 bg-slate-50/50 rounded-b-2xl border-x border-b border-slate-100">
                    {goals.map((goal, idx) => {
                        const colors = [
                            'from-purple-500 to-purple-600',
                            'from-blue-500 to-blue-600',
                            'from-indigo-500 to-indigo-600',
                            'from-pink-500 to-pink-600'
                        ];
                        const color = colors[idx % colors.length];

                        return (
                            <div key={goal.id} className="group relative bg-white/50 backdrop-blur-sm p-3 rounded-2xl border border-white hover:border-slate-200 transition-all shadow-sm">
                                <div className="flex justify-between items-center gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div
                                            onClick={() => toggleGoalStatus(goal.id, goal.isCompleted)}
                                            className={`w-8 h-8 rounded-xl bg-gradient-to-br ${goal.isCompleted ? 'from-emerald-400 to-emerald-600' : color} flex items-center justify-center text-white shadow-sm transition-all flex-shrink-0 cursor-pointer`}
                                        >
                                            {goal.isCompleted ? <CheckCircle2 size={14} /> : <User size={14} />}
                                        </div>
                                        <div className="min-w-0">
                                            <p className={`text-[11px] font-bold tracking-tight truncate ${goal.isCompleted ? 'text-emerald-700/60 line-through' : 'text-slate-800'}`}>
                                                {goal.objective}
                                            </p>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <span className="text-[9px] font-medium text-slate-400">{goal.type}</span>
                                                <span className="w-0.5 h-0.5 rounded-full bg-slate-300" />
                                                <span className="text-[9px] font-bold text-slate-400 uppercase truncate max-w-[60px]">{goal.collaboratorName}</span>
                                                {goal.deadline && (
                                                    <>
                                                        <span className="w-0.5 h-0.5 rounded-full bg-slate-300" />
                                                        <span className="text-[9px] font-semibold text-orange-500">
                                                            ⏰ {new Date(goal.deadline).toLocaleDateString('pt-BR')}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 flex-shrink-0">
                                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] translate-x-2 group-hover:translate-x-0">
                                            <button
                                                onClick={() => {
                                                    setEditingGoal(goal);
                                                }}
                                                className="p-1 hover:bg-blue-50 text-slate-400 hover:text-blue-500 rounded-lg transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
                                            >
                                                <Edit2 size={12} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(goal.id)}
                                                className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {goals.length === 0 && (
                        <div className="text-center py-6 text-slate-300">
                            <Target size={24} className="mx-auto mb-1 opacity-20" />
                            <p className="text-[9px] font-bold uppercase tracking-wider">Nenhuma meta encontrada</p>
                        </div>
                    )}
                </div>
            </div >

            {/* Modal de Visualização Expandida (Portal) */}
            {
                isExpanded && createPortal(
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-1000">
                        <div
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-all duration-1000"
                            onClick={() => setIsExpanded(false)}
                        />
                        <div className="relative w-full max-w-5xl bg-white/90 backdrop-blur-3xl rounded-[40px] shadow-[0_32px_128px_-12px_rgba(0,0,0,0.3)] border border-white/50 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]">
                            {/* Modal Header */}
                            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white/40 backdrop-blur-xl">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 rounded-2xl bg-purple-100 text-purple-600">
                                        <Target size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-800">Visualização de Metas</h3>
                                        <p className="text-xs text-slate-500 font-medium">{goals.length} meta(s) registradas</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsExpanded(false)}
                                    className="p-3 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-2xl transition-all duration-500"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar grid grid-cols-1 md:grid-cols-2 gap-4">
                                {goals.map((goal, idx) => {
                                    const colors = [
                                        'from-purple-500 to-purple-600',
                                        'from-blue-500 to-blue-600',
                                        'from-indigo-500 to-indigo-600',
                                        'from-pink-500 to-pink-600'
                                    ];
                                    const color = colors[idx % colors.length];

                                    return (
                                        <div key={goal.id} className="group relative bg-white border border-slate-100 p-4 rounded-3xl hover:border-purple-200 hover:shadow-xl hover:shadow-purple-100/50 transition-all duration-500">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex items-start gap-4 flex-1">
                                                    <div
                                                        onClick={() => toggleGoalStatus(goal.id, goal.isCompleted)}
                                                        className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${goal.isCompleted ? 'from-emerald-400 to-emerald-600' : color} flex items-center justify-center text-white shadow-lg transition-all flex-shrink-0 cursor-pointer hover:scale-110 active:scale-95`}
                                                    >
                                                        {goal.isCompleted ? <CheckCircle2 size={24} /> : <User size={24} />}
                                                    </div>
                                                    <div className="min-w-0 pt-0.5">
                                                        <p className={`text-sm font-bold leading-tight ${goal.isCompleted ? 'text-emerald-700/60 line-through' : 'text-slate-800'}`}>
                                                            {goal.objective}
                                                        </p>
                                                        <div className="flex flex-wrap items-center gap-2 mt-2">
                                                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">{goal.type}</span>
                                                            <span className="px-2 py-0.5 rounded-full bg-purple-50 text-[10px] font-bold text-purple-600 uppercase tracking-wider">{goal.collaboratorName}</span>
                                                            {goal.created_at && (
                                                                <span className="text-[10px] font-medium text-slate-400 italic">
                                                                    Criado em: {new Date(goal.created_at).toLocaleDateString('pt-BR')}
                                                                </span>
                                                            )}
                                                            {goal.deadline && (
                                                                <span className="px-2 py-0.5 rounded-full bg-orange-50 text-[10px] font-bold text-orange-600 flex items-center gap-1">
                                                                    ⏰ {new Date(goal.deadline).toLocaleDateString('pt-BR')}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setEditingGoal(goal);
                                                            setIsExpanded(false);
                                                        }}
                                                        className="p-2 hover:bg-blue-50 text-slate-400 hover:text-blue-500 rounded-xl transition-all duration-500"
                                                        title="Editar"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(goal.id)}
                                                        className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-xl transition-all duration-500"
                                                        title="Excluir"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>,
                    document.body
                )
            }

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #cbd5e1;
                }
            `}</style>
        </div >
    );
};
