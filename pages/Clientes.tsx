import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabase';
import { Search, Filter, Plus, Building2, User, FileText, MoreVertical, CheckCircle, AlertCircle, ChevronRight, AlertTriangle, Trash2, X, ListChecks, Phone } from 'lucide-react';

/* --- Internal UI Components (Mocking User's UiComponents) --- */

const Button = ({ children, variant = 'primary', className = '', size = 'md', ...props }: any) => {
    let baseClass = "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none";
    let variantClass = "";

    switch (variant) {
        case 'primary': variantClass = "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20"; break;
        case 'outline': variantClass = "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"; break;
        case 'ghost': variantClass = "text-slate-500 hover:bg-slate-100 hover:text-slate-700"; break;
        case 'warning': variantClass = "bg-amber-50 border border-amber-200 text-amber-600 hover:bg-amber-100"; break;
        case 'danger': variantClass = "bg-red-50 border border-red-200 text-red-600 hover:bg-red-100"; break;
    }

    let sizeClass = "";
    switch (size) {
        case 'sm': sizeClass = "px-3 py-1.5 text-xs"; break;
        case 'md': sizeClass = "px-4 py-2.5 text-sm"; break;
        case 'icon': sizeClass = "p-2"; break;
    }

    if (className.includes('btn-icon-only')) sizeClass = "p-2.5"; // Override for icon-only buttons

    return <button className={`${baseClass} ${variantClass} ${sizeClass} ${className}`} {...props}>{children}</button>;
};

const Input = ({ icon: Icon, className = '', ...props }: any) => {
    return (
        <div className={`relative group ${className}`}>
            {Icon && (
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <Icon size={16} className="text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
            )}
            <input
                className={`w-full ${Icon ? 'pl-9' : 'pl-4'} pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all`}
                {...props}
            />
        </div>
    );
};

const Card = ({ children, className = '', ...props }: any) => {
    return (
        <div className={`bg-white rounded-2xl border border-slate-200 p-4 hover:shadow-md transition-all cursor-pointer ${className}`} {...props}>
            {children}
        </div>
    );
};

const Badge = ({ status, text }: any) => {
    let colorClass = "";
    switch (status) {
        case 'success': colorClass = "bg-emerald-50 text-emerald-600 border-emerald-100"; break;
        case 'warning': colorClass = "bg-amber-50 text-amber-600 border-amber-100"; break;
        case 'error': colorClass = "bg-red-50 text-red-600 border-red-100"; break;
        default: colorClass = "bg-slate-50 text-slate-600 border-slate-100";
    }
    return (
        <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${colorClass}`}>
            {text}
        </span>
    );
};

const Modal = ({ isOpen, onClose, title, children, tabs, activeTab, onTabChange }: any) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">{title}</h2>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-red-500 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {tabs && (
                    <div className="flex border-b border-slate-100 px-6 gap-6">
                        {tabs.map((tab: any) => (
                            <button
                                key={tab.id}
                                onClick={() => onTabChange(tab.id)}
                                className={`py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                )}

                <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
                    {children}
                </div>
            </div>
        </div>
    );
};

/* --- Main Component --- */

export const Clientes = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [clients, setClients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedClient, setSelectedClient] = useState<any>(null);
    const [activeTab, setActiveTab] = useState('details');

    // Selection Mode State
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<any>>(new Set());

    // Docs State
    const [clientDocs, setClientDocs] = useState<any>(null);
    const [loadingDocs, setLoadingDocs] = useState(false);

    const [formData, setFormData] = useState<any>({});
    const [hasChanges, setHasChanges] = useState(false);

    // Filter Refs
    const filterRef = useRef<HTMLDivElement>(null);
    const docFilterRef = useRef<HTMLDivElement>(null);

    const [showFilters, setShowFilters] = useState(false);
    const [showDocFilters, setShowDocFilters] = useState(false);
    const [showExpiredOnly, setShowExpiredOnly] = useState(false);

    const [filters, setFilters] = useState({
        orderBy: 'name_asc',
        status: 'all',
        minColabs: 0,
        colabsOperator: 'gte', // 'gte' (>=) or 'lt' (<)
        unitStatus: 'all' // 'all', 'with_units', 'no_units'
    });

    const [unitColabs, setUnitColabs] = useState<any[]>([]);
    const [loadingColabsList, setLoadingColabsList] = useState(false);

    // Fetch Collaborators when tab is active
    useEffect(() => {
        if (selectedClient && activeTab === 'colabs') {
            const fetchColabs = async () => {
                setLoadingColabsList(true);
                const { data, error } = await supabase
                    .from('colaboradores')
                    .select(`
                        id,
                        nome,
                        setor,
                        cargo,
                        cargos (
                            nome
                        )
                    `)
                    .eq('unidade', selectedClient.unit_id);

                if (error) {
                    console.error('Error fetching colabs:', error);
                } else {
                    setUnitColabs(data || []);
                }
                setLoadingColabsList(false);
            };
            fetchColabs();
        }
    }, [selectedClient, activeTab]);

    const [docFilters, setDocFilters] = useState({
        type: 'all', // 'esocial', 'pgr', 'pcmso', 'dir', 'procuracao'
        status: 'all', // 'all', 'expired', 'expiring'
        startDate: '',
        endDate: '',
        period: ''
    });

    // --- Mapped Logic from Request ---

    // Fetch Function (Adapted to use Supabase directly)
    const fetchClientsWithUnits = async () => {
        const { data, error } = await supabase
            .from('unidades')
            .select(`
                id,
                nome_unidade,
                empresaid,
                clientes:empresaid (
                     id,
                     razao_social,
                     nome_fantasia,
                     cnpj,
                     email,
                     telefone,
                     endereco,
                     status,
                     clientefrequente
                ),
                clientes_documentacoes ( * ),
                colaboradores (count)
            `)
            .order('nome_unidade', { ascending: true });

        if (error) {
            console.error(error);
            return [];
        }

        // Map to flat structure for the UI
        return data.map((u: any) => ({
            card_id: u.id, // Using Unit ID as Card ID
            unit_id: u.id,
            client_id: u.clientes?.id,
            is_unit_card: true,

            // Display Info
            nome_fantasia: u.clientes?.nome_fantasia || u.nome_unidade,
            razao_social: u.clientes?.razao_social,
            cnpj: u.clientes?.cnpj,
            email: u.clientes?.email,
            endereco: u.clientes?.endereco,
            telefone: u.clientes?.telefone,
            clientefrequente: u.clientes?.clientefrequente,

            // Docs (Attach the doc object directly)
            docs: u.clientes_documentacoes?.[0] || null, // Assuming 1-to-1 for simplicity in this view

            // Stats (Mock or Real)
            colabs_count: u.colaboradores?.[0]?.count || 0
        }));
    };

    // Fetch Docs for Modal (Already have them in list, but maybe refetch for details?)
    // For now, we use the ones we fetched if attached, or fetch specifically if deep linking.
    // The snippet implies a separate fetch. Let's rely on cached data for list, but we can refetch.

    useEffect(() => {
        const loadClients = async () => {
            setLoading(true);
            const data = await fetchClientsWithUnits();
            setClients(data);
            setLoading(false);
        };
        loadClients();
    }, []);

    // Set Selected Client Logic
    useEffect(() => {
        if (selectedClient) {
            setFormData(selectedClient);
            setHasChanges(false);
            setClientDocs(selectedClient.docs); // Use embedded docs
        }
    }, [selectedClient]);

    // Click Outside Listener
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
                setShowFilters(false);
            }
            if (docFilterRef.current && !docFilterRef.current.contains(event.target as Node)) {
                setShowDocFilters(false);
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setShowFilters(false);
                setShowDocFilters(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, []);

    const handleInputChange = (field: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, [field]: value }));
        setHasChanges(true);
    };

    const handleSave = async () => {
        // Optimistic Update / Save to Supabase
        console.log('Saving...', formData);

        const { card_id, unit_id, client_id, is_unit_card, docs, colabs_count, ...updateData } = formData;

        // Example Update
        const { error } = await supabase
            .from('clientes')
            .update(updateData)
            .eq('id', selectedClient.client_id);

        if (error) {
            console.error('Error updating client:', error);
            alert('Erro ao salvar!');
            return;
        }

        // Update local state to reflect changes immediately
        setClients(prev => prev.map(c =>
            c.card_id === selectedClient.card_id
                ? { ...c, ...formData }
                : c
        ));

        setHasChanges(false);
        alert('Salvo com sucesso!');
    };

    const toggleSelectionMode = () => {
        setIsSelectionMode(!isSelectionMode);
        setSelectedIds(new Set()); // Clear selection when toggling
    };

    const toggleFilters = () => {
        setShowFilters(!showFilters);
        setShowDocFilters(false);
    };

    const toggleDocFilters = () => {
        setShowDocFilters(!showDocFilters);
        setShowFilters(false);
    };

    const handleCardClick = (client: any) => {
        if (isSelectionMode) {
            const newSelected = new Set(selectedIds);
            if (newSelected.has(client.card_id)) {
                newSelected.delete(client.card_id);
            } else {
                newSelected.add(client.card_id);
            }
            setSelectedIds(newSelected);
        } else {
            setSelectedClient(client);
        }
    };

    const handleDeleteSelected = async () => {
        if (window.confirm(`Tem certeza que deseja excluir ${selectedIds.size} clientes?`)) {
            // Delete Logic
            const { error } = await supabase
                .from('unidades')
                .delete()
                .in('id', Array.from(selectedIds));

            if (!error) {
                setClients(prev => prev.filter(c => !selectedIds.has(c.card_id)));
                setIsSelectionMode(false);
                setSelectedIds(new Set());
            }
        }
    };

    const getClientStats = (client: any) => {
        return {
            colabs: client.colabs_count || 0,
            units: 1
        };
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '-';
        try {
            const date = new Date(dateString);
            return new Intl.DateTimeFormat('pt-BR').format(date);
        } catch (e) {
            return dateString;
        }
    };

    const checkExpired = (docs: any) => {
        if (!docs) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const datesToCheck = [
            docs.vencimento_pgr,
            docs.vencimento_pcmso,
            docs.vigencia_dir_aep
        ];

        return datesToCheck.some(dateStr => {
            if (!dateStr) return false;
            return new Date(dateStr) < today;
        });
    };

    const filteredClients = clients
        .filter(client => {
            // Search Text
            const matchesSearch =
                (client.nome_fantasia?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                (client.razao_social?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                (client.cnpj || '').includes(searchTerm);

            // Status Filter
            const matchesStatus =
                filters.status === 'all' ? true :
                    filters.status === 'frequent' ? client.clientefrequente === true :
                        filters.status === 'sporadic' ? client.clientefrequente === false : true;

            // Colabs Filter
            const stats = getClientStats(client);
            const matchesColabs = filters.colabsOperator === 'lt'
                ? stats.colabs < filters.minColabs
                : stats.colabs >= filters.minColabs;

            // Document Filter
            let matchesDocFilter = true;
            if (docFilters.type !== 'all' && client.docs) {
                const docType = docFilters.type; // 'esocial', 'pgr', 'pcmso', 'dir', 'procuracao'
                let dateField: any = null;
                let isBoolean = false;

                if (docType === 'pgr') dateField = 'vencimento_pgr';
                else if (docType === 'pcmso') dateField = 'vencimento_pcmso';
                else if (docType === 'dir') dateField = 'vigencia_dir_aep';
                else if (docType === 'esocial') isBoolean = true;
                else if (docType === 'procuracao') isBoolean = true; // mapped to docs.esocial_procuracao below

                if (dateField) {
                    const docDateStr = client.docs[dateField];
                    if (!docDateStr) {
                        matchesDocFilter = false;
                    } else {
                        const docDate = new Date(docDateStr);
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);

                        if (docFilters.status === 'expired') {
                            matchesDocFilter = docDate < today;
                        } else if (docFilters.status === 'expiring') {
                            if (docFilters.startDate && docFilters.endDate) {
                                const start = new Date(docFilters.startDate);
                                const end = new Date(docFilters.endDate);
                                end.setHours(23, 59, 59, 999);
                                matchesDocFilter = docDate >= start && docDate <= end;
                            } else {
                                matchesDocFilter = true;
                            }
                        }
                    }
                } else if (isBoolean) {
                    const val = docType === 'esocial' ? client.docs.esocial : client.docs.esocial_procuracao;
                    if (docFilters.status === 'expired') {
                        matchesDocFilter = !val; // Pendente / False
                    }
                }
            } else if (docFilters.type !== 'all') {
                matchesDocFilter = false;
            }

            // Quick Expired Filter
            let matchesExpiredOnly = true;
            if (showExpiredOnly) {
                matchesExpiredOnly = checkExpired(client.docs);
            }

            return matchesSearch && matchesStatus && matchesColabs && matchesDocFilter && matchesExpiredOnly;
        })
        .sort((a, b) => {
            if (filters.orderBy === 'name_asc') {
                return (a.nome_fantasia || '').localeCompare(b.nome_fantasia || '');
            } else {
                return (b.nome_fantasia || '').localeCompare(a.nome_fantasia || '');
            }
        });

    const modalTabs = [
        { id: 'details', label: 'Detalhes' },
        { id: 'docs', label: 'Documentos' },
        { id: 'colabs', label: 'Colaboradores' }
    ];

    return (
        <div className="h-full flex flex-col animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Clientes</h1>
                    <p className="text-slate-500 text-sm mt-1">
                        {filteredClients.length} {filteredClients.length === 1 ? 'empresa encontrada' : 'empresas encontradas'} (Total carregado: {clients.length})
                    </p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    {isSelectionMode ? (
                        /* Selection Mode Toolbar */
                        <div className="flex items-center gap-2 animate-in slide-in-from-right-4 duration-300">
                            <Button
                                variant="outline"
                                onClick={toggleSelectionMode}
                            >
                                <X size={18} />
                                <span>Cancelar Seleção</span>
                            </Button>

                            {selectedIds.size > 0 && (
                                <div className="flex items-center gap-2 animate-in zoom-in-95">
                                    <span className="bg-slate-100 px-3 py-1.5 rounded-lg text-sm font-bold text-slate-600 border border-slate-200">{selectedIds.size}</span>
                                    <Button
                                        variant="danger"
                                        onClick={handleDeleteSelected}
                                    >
                                        <Trash2 size={18} />
                                        <span>Excluir</span>
                                    </Button>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Default Toolbar */
                        <>
                            <div className="w-full md:w-72">
                                <Input
                                    icon={Search}
                                    type="text"
                                    placeholder="Buscar clientes..."
                                    value={searchTerm}
                                    onChange={(e: any) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <Button variant="outline" onClick={toggleSelectionMode} className="btn-icon-only" title="Seleção Múltipla">
                                    <ListChecks size={18} />
                                </Button>

                                <div className="relative" ref={docFilterRef}>
                                    <Button
                                        variant={showDocFilters ? 'warning' : 'outline'}
                                        className="btn-icon-only relative group"
                                        onClick={toggleDocFilters}
                                        title="Filtro de Documentos"
                                    >
                                        <FileText size={18} />
                                        <Filter size={10} className={`absolute bottom-1.5 right-1.5 stroke-[3] bg-white rounded-full p-[1px] ${showDocFilters ? 'text-amber-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                                    </Button>

                                    {showDocFilters && (
                                        <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 z-20 animate-in zoom-in-95 origin-top-right">
                                            <div className="mb-4">
                                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Documento</label>
                                                <select
                                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/10"
                                                    value={docFilters.type}
                                                    onChange={(e) => setDocFilters({ ...docFilters, type: e.target.value })}
                                                >
                                                    <option value="all">Selecione...</option>
                                                    <option value="esocial">eSocial</option>
                                                    <option value="pgr">PGR</option>
                                                    <option value="pcmso">PCMSO</option>
                                                    <option value="dir">DIR/AEP</option>
                                                    <option value="procuracao">Procuração eSocial</option>
                                                </select>
                                            </div>

                                            {docFilters.type !== 'all' && (
                                                <>
                                                    <div className="mb-4">
                                                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Condição</label>
                                                        <select
                                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/10"
                                                            value={docFilters.status}
                                                            onChange={(e) => setDocFilters({ ...docFilters, status: e.target.value })}
                                                        >
                                                            <option value="all">Selecione...</option>
                                                            <option value="expired">Vencido / Pendente</option>
                                                            {(docFilters.type !== 'esocial' && docFilters.type !== 'procuracao') && (
                                                                <option value="expiring">A Vencer</option>
                                                            )}
                                                        </select>
                                                    </div>

                                                    {docFilters.status === 'expiring' && (
                                                        <div>
                                                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Período</label>
                                                            <div className="grid gap-2">
                                                                {[
                                                                    { label: 'Próximos 30 dias', days: 30 },
                                                                    { label: 'Próximos 15 dias', days: 15 },
                                                                    { label: 'Próxima semana', days: 7 }
                                                                ].map(preset => (
                                                                    <button
                                                                        key={preset.days}
                                                                        className={`text-left px-3 py-2 rounded-lg text-sm border transition-all ${docFilters.period === preset.days.toString() ? 'bg-blue-50 border-blue-200 text-blue-600 font-medium' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                                                        onClick={() => {
                                                                            const start = new Date();
                                                                            const end = new Date();
                                                                            end.setDate(end.getDate() + preset.days);
                                                                            setDocFilters({
                                                                                ...docFilters,
                                                                                period: preset.days.toString(),
                                                                                startDate: start.toISOString().split('T')[0],
                                                                                endDate: end.toISOString().split('T')[0]
                                                                            });
                                                                        }}
                                                                    >
                                                                        📅 {preset.label}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="relative" ref={filterRef}>
                                    <Button
                                        variant={showFilters ? 'primary' : 'outline'}
                                        className="btn-icon-only"
                                        onClick={toggleFilters}
                                        title="Filtros Gerais"
                                    >
                                        <Filter size={18} />
                                    </Button>

                                    {showFilters && (
                                        <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 z-20 animate-in zoom-in-95 origin-top-right">
                                            <div className="mb-4">
                                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Ordenar por</label>
                                                <select
                                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/10"
                                                    value={filters.orderBy}
                                                    onChange={(e) => setFilters({ ...filters, orderBy: e.target.value })}
                                                >
                                                    <option value="name_asc">Nome (A-Z)</option>
                                                    <option value="name_desc">Nome (Z-A)</option>
                                                </select>
                                            </div>

                                            <div className="mb-4">
                                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Categoria</label>
                                                <select
                                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/10"
                                                    value={filters.status}
                                                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                                >
                                                    <option value="all">Todos</option>
                                                    <option value="frequent">Frequente</option>
                                                    <option value="sporadic">Esporádico</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Colaboradores</label>

                                                <div className="grid grid-cols-3 gap-2 mb-3">
                                                    {[
                                                        { label: '< 10', value: 9, operator: 'lt' },
                                                        { label: '10+', value: 10, operator: 'gte' },
                                                        { label: '50+', value: 50, operator: 'gte' },
                                                        { label: '100+', value: 100, operator: 'gte' },
                                                        { label: '500+', value: 500, operator: 'gte' },
                                                    ].map((preset) => (
                                                        <button
                                                            key={preset.label}
                                                            className={`px-2 py-1.5 rounded-lg text-xs font-medium border transition-colors ${filters.colabsOperator === preset.operator && filters.minColabs === preset.value
                                                                ? 'bg-blue-50 border-blue-200 text-blue-600'
                                                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                                                }`}
                                                            onClick={() => {
                                                                if (filters.colabsOperator === preset.operator && filters.minColabs === preset.value) {
                                                                    setFilters({ ...filters, minColabs: 0, colabsOperator: 'gte' });
                                                                } else {
                                                                    setFilters({
                                                                        ...filters,
                                                                        minColabs: preset.value,
                                                                        colabsOperator: preset.operator
                                                                    });
                                                                }
                                                            }}
                                                        >
                                                            {preset.label}
                                                        </button>
                                                    ))}
                                                </div>

                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/10 disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                        placeholder="Número específico..."
                                                        value={filters.minColabs || ''}
                                                        onChange={(e) => setFilters({
                                                            ...filters,
                                                            minColabs: Number(e.target.value),
                                                            colabsOperator: 'gte' // Default to >= for manual input
                                                        })}
                                                    />
                                                    <span className="absolute right-3 top-2 text-xs text-slate-400 pointer-events-none">
                                                        Mínimo
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <Button
                                    variant={showExpiredOnly ? 'warning' : 'outline'}
                                    className="btn-icon-only"
                                    onClick={() => setShowExpiredOnly(!showExpiredOnly)}
                                    title="Mostrar apenas documentos vencidos"
                                >
                                    <AlertTriangle size={18} />
                                </Button>
                            </div>

                            <Button className="ml-2 font-bold shadow-blue-500/25">
                                <Plus size={18} />
                                <span>Novo Cliente</span>
                            </Button>
                        </>
                    )}
                </div>
            </header>

            {loading ? (
                <div className="flex justify-center items-center h-48">
                    <p className="text-slate-400 font-medium animate-pulse">Carregando clientes...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 pb-20">
                    {filteredClients.map((client) => {
                        const isFrequent = client.clientefrequente === true;
                        const statusLabel = isFrequent ? 'FREQUENTE' : 'ESPORÁDICO';
                        const stats = getClientStats(client);
                        const isSelected = selectedIds.has(client.card_id);
                        const hasExpired = checkExpired(client.docs);

                        return (
                            <Card
                                key={client.card_id}
                                className={`relative group transition-all duration-300 border-2 ${isSelected ? 'border-blue-500 bg-blue-50/30' : 'border-transparent hover:border-blue-200'}`}
                                onClick={() => handleCardClick(client)}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`p-3 rounded-2xl transition-colors ${isSelected ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-500'}`}>
                                        {isSelectionMode && isSelected ? (
                                            <CheckCircle size={24} className="text-blue-600" />
                                        ) : (
                                            <Building2 size={24} strokeWidth={1.5} />
                                        )}
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider ${isFrequent ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                                        {statusLabel}
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-bold text-slate-800 text-lg truncate" title={client.nome_fantasia}>
                                            {client.nome_fantasia || 'Sem Nome'}
                                        </h3>
                                        {hasExpired && (
                                            <div title="Documentos vencidos!" className="animate-pulse">
                                                <AlertTriangle size={16} className="text-red-500" />
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-slate-500 text-sm mb-4 font-mono">{client.cnpj || 'CNPJ não informado'}</p>

                                    <div className="flex items-center gap-4 text-sm text-slate-400">
                                        <div className="flex items-center gap-1.5">
                                            <User size={14} />
                                            <span>{stats.colabs} colaboradores</span>
                                        </div>
                                        {client.telefone && (
                                            <div className="flex items-center gap-1.5" title="Telefone">
                                                <Phone size={14} />
                                                <span>{client.telefone}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end">
                                    <span className={`text-sm font-medium flex items-center gap-1 ${isSelected ? 'text-blue-600' : 'text-slate-400 group-hover:text-blue-500'}`}>
                                        {isSelectionMode ? (isSelected ? 'Selecionado' : 'Selecionar') : 'Ver detalhes'}
                                        {!isSelectionMode && <ChevronRight size={16} />}
                                    </span>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Modal de Detalhes */}
            <Modal
                isOpen={!!selectedClient}
                onClose={() => setSelectedClient(null)}
                title={selectedClient?.nome_fantasia || 'Detalhes do Cliente'}
                tabs={modalTabs}
                activeTab={activeTab}
                onTabChange={setActiveTab}
            >
                {selectedClient && activeTab === 'details' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2 col-span-2 md:col-span-1">
                                <label className="text-sm font-medium text-slate-600">Razão Social</label>
                                <Input
                                    value={formData.razao_social || ''}
                                    onChange={(e: any) => handleInputChange('razao_social', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2 col-span-2 md:col-span-1">
                                <label className="text-sm font-medium text-slate-600">CNPJ</label>
                                <Input
                                    value={formData.cnpj || ''}
                                    onChange={(e: any) => handleInputChange('cnpj', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2 col-span-2 md:col-span-1">
                                <label className="text-sm font-medium text-slate-600">Nome Fantasia</label>
                                <Input
                                    value={formData.nome_fantasia || ''}
                                    onChange={(e: any) => handleInputChange('nome_fantasia', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2 col-span-2 md:col-span-1">
                                <label className="text-sm font-medium text-slate-600">Email</label>
                                <Input
                                    value={formData.email || ''}
                                    onChange={(e: any) => handleInputChange('email', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2 col-span-2 md:col-span-1">
                                <label className="text-sm font-medium text-slate-600">Telefone</label>
                                <Input
                                    value={formData.telefone || ''}
                                    onChange={(e: any) => handleInputChange('telefone', e.target.value)}
                                />
                            </div>

                            {/* Fields from clientes_documentacoes */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-600">Parceria Comercial</label>
                                <Input
                                    value={clientDocs?.parceria_comercial || ''}
                                    readOnly
                                    className="bg-slate-100 text-slate-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-600">Responsável</label>
                                <Input
                                    value={clientDocs?.responsavel || ''}
                                    readOnly
                                    className="bg-slate-100 text-slate-500"
                                />
                            </div>
                            <div className="space-y-2 col-span-2">
                                <label className="text-sm font-medium text-slate-600">Observação Ação</label>
                                <Input
                                    value={clientDocs?.observacao_acao || ''}
                                    readOnly
                                    className="bg-slate-100 text-slate-500"
                                />
                            </div>
                            <div className="space-y-2 col-span-2">
                                <label className="text-sm font-medium text-slate-600">Endereço</label>
                                <Input
                                    value={formData.endereco || ''}
                                    onChange={(e: any) => handleInputChange('endereco', e.target.value)}
                                />
                            </div>
                        </div>
                        {hasChanges && (
                            <div className="mt-8 flex justify-end animate-in fade-in">
                                <Button onClick={handleSave}>
                                    <CheckCircle size={18} />
                                    <span>Salvar Alterações</span>
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {selectedClient && activeTab === 'docs' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2">
                        {clientDocs ? (
                            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
                                        <tr>
                                            <th className="p-4">Documento</th>
                                            <th className="p-4">Status/Vencimento</th>
                                            <th className="p-4 w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        <tr className="hover:bg-slate-50 transition-colors">
                                            <td className="p-4"><div className="flex items-center gap-2 font-medium text-slate-700"><FileText size={16} className="text-blue-500" /> eSocial</div></td>
                                            <td className="p-4">{clientDocs.esocial ? <Badge status="success" text="Enviado" /> : <Badge status="warning" text="Pendente" />}</td>
                                            <td className="p-4"><Button variant="ghost" size="icon"><MoreVertical size={16} /></Button></td>
                                        </tr>
                                        <tr className="hover:bg-slate-50 transition-colors">
                                            <td className="p-4"><div className="flex items-center gap-2 font-medium text-slate-700"><FileText size={16} className="text-blue-500" /> PGR</div></td>
                                            <td className="p-4">{formatDate(clientDocs.vencimento_pgr)}</td>
                                            <td className="p-4"><Button variant="ghost" size="icon"><MoreVertical size={16} /></Button></td>
                                        </tr>
                                        <tr className="hover:bg-slate-50 transition-colors">
                                            <td className="p-4"><div className="flex items-center gap-2 font-medium text-slate-700"><FileText size={16} className="text-blue-500" /> PCMSO</div></td>
                                            <td className="p-4">{formatDate(clientDocs.vencimento_pcmso)}</td>
                                            <td className="p-4"><Button variant="ghost" size="icon"><MoreVertical size={16} /></Button></td>
                                        </tr>
                                        <tr className="hover:bg-slate-50 transition-colors">
                                            <td className="p-4"><div className="flex items-center gap-2 font-medium text-slate-700"><FileText size={16} className="text-blue-500" /> DIR/AEP</div></td>
                                            <td className="p-4">{formatDate(clientDocs.vigencia_dir_aep)}</td>
                                            <td className="p-4"><Button variant="ghost" size="icon"><MoreVertical size={16} /></Button></td>
                                        </tr>
                                        <tr className="hover:bg-slate-50 transition-colors">
                                            <td className="p-4"><div className="flex items-center gap-2 font-medium text-slate-700"><FileText size={16} className="text-blue-500" /> Procuração eSocial</div></td>
                                            <td className="p-4">{clientDocs.esocial_procuracao ? <Badge status="success" text="Ativa" /> : <Badge status="warning" text="Pendente" />}</td>
                                            <td className="p-4"><Button variant="ghost" size="icon"><MoreVertical size={16} /></Button></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="p-8 text-center text-slate-400">
                                <FileText size={48} className="mx-auto mb-4 opacity-20" />
                                <p>Nenhuma documentação encontrada para esta unidade.</p>
                            </div>
                        )}
                    </div>
                )}

                {selectedClient && activeTab === 'colabs' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2">
                        {loadingColabsList ? (
                            <div className="flex justify-center p-8">
                                <p className="text-slate-400 animate-pulse">Carregando colaboradores...</p>
                            </div>
                        ) : unitColabs.length > 0 ? (
                            <div className="space-y-3">
                                {unitColabs.map((colab: any) => (
                                    <div key={colab.id} className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-100 hover:border-blue-200 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                                                {colab.nome ? colab.nome.substring(0, 2).toUpperCase() : '??'}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-800">{colab.nome || 'Sem Nome'}</div>
                                                <div className="text-xs text-slate-500">
                                                    {colab.cargos?.nome || 'Cargo não definido'} • {colab.setor || 'Setor não definido'}
                                                </div>
                                            </div>
                                        </div>
                                        <Badge status="success" text="Ativo" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center text-slate-400">
                                <User size={48} className="mx-auto mb-4 opacity-20" />
                                <p>Nenhum colaborador encontrado para esta unidade.</p>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
};