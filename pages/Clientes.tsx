import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { Search, MapPin, Mail, Phone, Building, User, X, Briefcase, ChevronRight, ArrowLeft, Calendar, CreditCard, Users, Edit2, Save, Trash2, CheckCircle2, Circle, Plus, ListChecks } from 'lucide-react';
import { format } from 'date-fns';

interface Cliente {
    id: string;
    razao_social: string;
    nome_fantasia: string;
    cnpj: string;
    email: string;
    telefone: string;
    endereco: string;
    status: string;
    img_url?: string;
}

interface Colaborador {
    id: string;
    nome: string;
    cpf?: string;
    data_nascimento?: string;
    sexo?: string;
    setor?: string;
    cargo_nome?: string;
    cargos?: { nome: string };
    unidades?: { nome_unidade: string };
}

export const Clientes: React.FC = () => {
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('Todos');

    // Selected Client for Details View
    const [selectedClient, setSelectedClient] = useState<Cliente | null>(null);
    const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
    const [loadingColab, setLoadingColab] = useState(false);

    // Drill-down state for Colaborador Details
    const [selectedColaborador, setSelectedColaborador] = useState<Colaborador | null>(null);

    // Edit Mode State
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<Partial<Cliente>>({});
    const [saving, setSaving] = useState(false);

    // Bulk Delete State
    const [selectedClients, setSelectedClients] = useState<string[]>([]);
    const [deleting, setDeleting] = useState(false);
    const [isSelectionMode, setIsSelectionMode] = useState(false);

    useEffect(() => {
        fetchClientes();
    }, []);

    useEffect(() => {
        if (selectedClient) {
            fetchColaboradores(selectedClient.id);
            setSelectedColaborador(null); // Reset drill-down when opening a new client
            setIsEditing(false); // Reset edit mode
            setEditForm({}); // Reset form
        }
    }, [selectedClient]);

    const fetchClientes = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('clientes')
                .select('*')
                .order('nome_fantasia', { ascending: true });

            if (error) throw error;
            setClientes(data || []);
        } catch (error) {
            console.error('Erro ao buscar clientes:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchColaboradores = async (clienteId: string) => {
        setLoadingColab(true);
        try {
            // Fetch collaborators linked to units that are linked to this company (cliente)
            const { data, error } = await supabase
                .from('colaboradores')
                .select(`
                id, 
                nome, 
                cpf,
                data_nascimento,
                sexo,
                setor,
                cargos (nome),
                unidades!inner (empresaid, nome_unidade)
            `)
                .eq('unidades.empresaid', clienteId);

            if (error) throw error;
            setColaboradores(data || []);
        } catch (error) {
            console.error('Erro ao buscar colaboradores:', error);
            setColaboradores([]);
        } finally {
            setLoadingColab(false);
        }
    };

    const handleClosePanel = () => {
        setSelectedClient(null);
        setSelectedColaborador(null);
        setIsEditing(false);
    };

    const handleEditClick = () => {
        if (selectedClient) {
            setEditForm(selectedClient);
            setIsEditing(true);
        }
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditForm({});
    };

    const handleSaveClient = async () => {
        if (!selectedClient || !editForm) return;
        setSaving(true);
        try {
            const { error } = await supabase
                .from('clientes')
                .update(editForm)
                .eq('id', selectedClient.id);

            if (error) throw error;

            // Update local state
            const updatedClient = { ...selectedClient, ...editForm } as Cliente;
            setSelectedClient(updatedClient);

            setClientes(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));

            setIsEditing(false);
            // Optional: Add success toast here
        } catch (error) {
            console.error('Erro ao atualizar cliente:', error);
            // Optional: Add error toast here
        } finally {
            setSaving(false);
        }
    };

    const toggleClientSelection = (id: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent opening details
        setSelectedClients(prev =>
            prev.includes(id)
                ? prev.filter(clientId => clientId !== id)
                : [...prev, id]
        );
    };

    const handleBulkDelete = async () => {
        if (selectedClients.length === 0) return;

        if (!window.confirm(`Tem certeza que deseja excluir ${selectedClients.length} cliente(s)? Esta ação não pode ser desfeita.`)) {
            return;
        }

        setDeleting(true);
        try {
            const { error } = await supabase
                .from('clientes')
                .delete()
                .in('id', selectedClients);

            if (error) throw error;

            // Update local state
            setClientes(prev => prev.filter(c => !selectedClients.includes(c.id)));
            setSelectedClients([]); // Clear selection

            // If the currently open client was deleted, close the panel
            if (selectedClient && selectedClients.includes(selectedClient.id)) {
                handleClosePanel();
            }

        } catch (error) {
            console.error('Erro ao excluir clientes:', error);
            alert('Erro ao excluir clientes. Verifique se existem registros vinculados.');
        } finally {
            setDeleting(false);
        }
    };

    const filteredClientes = clientes.filter(cliente => {
        const matchesSearch =
            (cliente.nome_fantasia?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (cliente.razao_social?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (cliente.cnpj || '').includes(searchTerm);

        const matchesStatus = statusFilter === 'Todos' ||
            (cliente.status?.toLowerCase() === statusFilter.toLowerCase());

        return matchesSearch && matchesStatus;
    });

    return (
        <div className="relative h-full flex flex-col">
            {/* Header & Filters */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Gestão de Clientes</h2>
                    <p className="text-slate-500 text-sm mt-1">{filteredClientes.length} empresas encontradas</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-center">
                    {/* Add Client Button */}
                    <button
                        onClick={() => alert("Funcionalidade de adicionar cliente em breve!")}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                    >
                        <Plus size={18} />
                        <span className="hidden sm:inline">Adicionar Cliente</span>
                    </button>

                    {/* Toggle Selection Mode Button */}
                    <button
                        onClick={() => {
                            setIsSelectionMode(!isSelectionMode);
                            if (isSelectionMode) setSelectedClients([]); // Clear selection when turning off
                        }}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all border ${isSelectionMode
                                ? 'bg-blue-50 border-blue-200 text-blue-700 font-bold'
                                : 'bg-white border-white/60 text-slate-600 hover:bg-white/80'
                            }`}
                        title={isSelectionMode ? "Cancelar Seleção" : "Selecionar Clientes"}
                    >
                        <ListChecks size={18} />
                        <span className="hidden sm:inline">{isSelectionMode ? 'Cancelar Seleção' : 'Selecionar'}</span>
                    </button>

                    {selectedClients.length > 0 ? (
                        <div className="flex items-center gap-3 animate-fadeIn bg-red-50 px-4 py-2 rounded-xl border border-red-100 ml-2">
                            <span className="text-sm font-bold text-red-700">{selectedClients.length}</span>
                            <button
                                onClick={handleBulkDelete}
                                disabled={deleting}
                                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                            >
                                <Trash2 size={14} />
                                {deleting ? '...' : 'Excluir'}
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Standard Filters (Search/Status) - Hide when in selection mode? Or keep? Keeping for now. */}
                            <div className="relative group ml-2">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                                <input
                                    type="text"
                                    placeholder="Buscar..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 pr-4 py-2.5 bg-white/60 border border-white/60 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-sm w-32 sm:w-48 backdrop-blur-sm shadow-sm"
                                />
                            </div>

                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-4 py-2.5 bg-white/60 border border-white/60 rounded-xl text-sm font-medium text-slate-700 outline-none cursor-pointer hover:bg-white/80 transition-all backdrop-blur-sm shadow-sm"
                            >
                                <option value="Todos">Status</option>
                                <option value="Ativo">Ativo</option>
                                <option value="Inativo">Inativo</option>
                                <option value="Pendente">Pendente</option>
                            </select>
                        </>
                    )}
                </div>
            </div>

            {/* Grid List */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
                {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-40 bg-white/40 rounded-3xl animate-pulse border border-white/50"></div>
                    ))
                ) : (
                    filteredClientes.map((cliente) => {
                        const isSelected = selectedClients.includes(cliente.id);
                        return (
                            <div
                                key={cliente.id}
                                className={`group bg-white/60 backdrop-blur-xl p-6 rounded-3xl border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden
                  ${isSelected ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-white/60 hover:shadow-blue-500/5'}
                `}
                            >
                                {/* Selection Checkbox - Only visible in Selection Mode */}
                                {isSelectionMode && (
                                    <div
                                        className="absolute top-4 right-4 z-20 cursor-pointer animate-fadeIn"
                                        onClick={(e) => toggleClientSelection(cliente.id, e)}
                                    >
                                        {isSelected ? (
                                            <CheckCircle2 className="text-blue-500 fill-blue-50" size={24} />
                                        ) : (
                                            <Circle className="text-slate-300 hover:text-blue-400 transition-colors" size={24} />
                                        )}
                                    </div>
                                )}

                                {/* Card Content - Click opens details */}
                                <div className="h-full flex flex-col justify-between cursor-pointer" onClick={() => setSelectedClient(cliente)}>

                                    {/* Decorative gradient blob */}
                                    <div className="absolute -right-10 -top-10 w-24 h-24 bg-blue-100/50 rounded-full blur-2xl group-hover:bg-blue-200/50 transition-colors"></div>

                                    <div className="flex items-start justify-between relative z-10 pr-8">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-100 to-white border border-white shadow-sm flex items-center justify-center text-slate-400">
                                                <Building size={20} />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-800 line-clamp-1">{cliente.nome_fantasia || 'Sem Nome'}</h3>
                                                <p className="text-xs text-slate-500">{cliente.cnpj || 'CNPJ não informado'}</p>
                                            </div>
                                        </div>
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${cliente.status?.toLowerCase() === 'ativo' ? 'bg-green-50 text-green-600 border-green-100' :
                                            cliente.status?.toLowerCase() === 'inativo' ? 'bg-red-50 text-red-600 border-red-100' :
                                                'bg-slate-50 text-slate-500 border-slate-100'
                                            }`}>
                                            {cliente.status || 'Indefinido'}
                                        </span>
                                    </div>

                                    <div className="mt-6 space-y-2 relative z-10">
                                        {cliente.email && (
                                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                                <Mail size={14} className="text-slate-400" />
                                                <span className="truncate">{cliente.email}</span>
                                            </div>
                                        )}
                                        {cliente.telefone && (
                                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                                <Phone size={14} className="text-slate-400" />
                                                <span>{cliente.telefone}</span>
                                            </div>
                                        )}
                                        {cliente.endereco && (
                                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                                <MapPin size={14} className="text-slate-400" />
                                                <span className="truncate">{cliente.endereco}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-white/50 flex justify-between items-center relative z-10">
                                        <span className="text-xs font-semibold text-blue-600 group-hover:underline decoration-blue-200 underline-offset-4">Ver detalhes</span>
                                        <div className="w-8 h-8 rounded-full bg-white/50 flex items-center justify-center text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-50 transition-colors">
                                            <ChevronRight size={16} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Details Slide-Over (Modal) */}
            {
                selectedClient && (
                    <div className="fixed inset-0 z-50 flex justify-end">
                        {/* Backdrop */}
                        <div
                            className="absolute inset-0 bg-slate-900/10 backdrop-blur-[2px] transition-opacity"
                            onClick={handleClosePanel}
                        ></div>

                        {/* Panel */}
                        <div className="relative w-full max-w-lg h-full bg-white/80 backdrop-blur-2xl shadow-2xl border-l border-white/60 transform transition-transform duration-300 ease-out animate-slideInRight flex flex-col">

                            {/* Header */}
                            <div className="p-6 border-b border-slate-200/50 flex justify-between items-center bg-white/40">
                                <div className="flex items-center gap-3">
                                    {selectedColaborador && (
                                        <button
                                            onClick={() => setSelectedColaborador(null)}
                                            className="p-2 -ml-2 hover:bg-white rounded-full text-slate-500 hover:text-blue-600 transition-colors"
                                        >
                                            <ArrowLeft size={20} />
                                        </button>
                                    )}
                                    <h2 className="text-xl font-bold text-slate-800">
                                        {selectedColaborador ? 'Detalhes do Colaborador' : 'Detalhes do Cliente'}
                                    </h2>
                                </div>

                                <div className="flex items-center gap-2">
                                    {!selectedColaborador && !isEditing && (
                                        <button
                                            onClick={handleEditClick}
                                            className="p-2 hover:bg-white rounded-full text-slate-500 hover:text-blue-600 transition-colors"
                                            title="Editar"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                    )}
                                    <button
                                        onClick={handleClosePanel}
                                        className="p-2 hover:bg-slate-200/50 rounded-full transition-colors text-slate-500"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-8">

                                {/* CONDITIONAL CONTENT: Either Client Details OR Collaborator Details */}
                                {selectedColaborador ? (
                                    <div className="space-y-6 animate-fadeIn">
                                        {/* Header Card */}
                                        <div className="bg-gradient-to-br from-indigo-50 to-white p-8 rounded-3xl border border-white shadow-sm flex flex-col items-center text-center">
                                            <div className="w-24 h-24 rounded-full bg-white shadow-md border-4 border-indigo-50 flex items-center justify-center text-indigo-400 mb-4">
                                                <User size={40} />
                                            </div>
                                            <h3 className="text-2xl font-bold text-slate-800">{selectedColaborador.nome}</h3>
                                            <p className="text-indigo-500 font-medium mt-1">{selectedColaborador.cargos?.nome || 'Cargo não informado'}</p>
                                            <span className="text-xs text-slate-400 mt-2 bg-white px-3 py-1 rounded-full border border-slate-100">
                                                {selectedColaborador.unidades?.nome_unidade}
                                            </span>
                                        </div>

                                        {/* Info Grid */}
                                        <div className="grid grid-cols-1 gap-4">
                                            <div className="bg-white/50 p-4 rounded-2xl border border-white shadow-sm flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500">
                                                    <CreditCard size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">CPF</p>
                                                    <p className="text-slate-700 font-mono">{selectedColaborador.cpf || 'Não cadastrado'}</p>
                                                </div>
                                            </div>

                                            <div className="bg-white/50 p-4 rounded-2xl border border-white shadow-sm flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500">
                                                    <Calendar size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Data de Nascimento</p>
                                                    <p className="text-slate-700">
                                                        {selectedColaborador.data_nascimento
                                                            ? format(new Date(selectedColaborador.data_nascimento), 'dd/MM/yyyy')
                                                            : 'Não cadastrada'}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="bg-white/50 p-4 rounded-2xl border border-white shadow-sm flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500">
                                                    <Users size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Sexo</p>
                                                    <p className="text-slate-700 capitalize">{selectedColaborador.sexo || 'Não informado'}</p>
                                                </div>
                                            </div>

                                            <div className="bg-white/50 p-4 rounded-2xl border border-white shadow-sm flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500">
                                                    <Briefcase size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Setor</p>
                                                    <p className="text-slate-700">{selectedColaborador.setor || 'Não informado'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    // Default View: Client Info + List of Collaborators
                                    <>
                                        <div className="bg-white/50 p-6 rounded-3xl border border-white shadow-sm">
                                            <div className="flex items-start gap-4 mb-6">
                                                <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
                                                    <Building size={32} />
                                                </div>
                                                <div className="flex-1 w-full">
                                                    {isEditing ? (
                                                        <div className="space-y-3">
                                                            <input
                                                                className="w-full text-lg font-bold text-slate-800 bg-white border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                                                placeholder="Nome Fantasia"
                                                                value={editForm.nome_fantasia || ''}
                                                                onChange={e => setEditForm({ ...editForm, nome_fantasia: e.target.value })}
                                                            />
                                                            <input
                                                                className="w-full text-sm text-slate-500 bg-white border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                                                placeholder="Razão Social"
                                                                value={editForm.razao_social || ''}
                                                                onChange={e => setEditForm({ ...editForm, razao_social: e.target.value })}
                                                            />
                                                            <select
                                                                className="w-full text-xs font-bold uppercase tracking-wide bg-white border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                                                value={editForm.status || ''}
                                                                onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                                                            >
                                                                <option value="Ativo">Ativo</option>
                                                                <option value="Inativo">Inativo</option>
                                                                <option value="Pendente">Pendente</option>
                                                            </select>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <h3 className="text-lg font-bold text-slate-800">{selectedClient.nome_fantasia}</h3>
                                                            <p className="text-sm text-slate-500">{selectedClient.razao_social}</p>
                                                            <span className={`mt-2 inline-block px-2 py-0.5 rounded text-xs font-bold border ${selectedClient.status?.toLowerCase() === 'ativo' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-slate-50 text-slate-500 border-slate-100'
                                                                }`}>
                                                                {selectedClient.status}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <div className="flex flex-col py-2 border-b border-dashed border-slate-200">
                                                    <span className="text-sm text-slate-400 mb-1">CNPJ</span>
                                                    {isEditing ? (
                                                        <input
                                                            className="w-full text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                                            value={editForm.cnpj || ''}
                                                            onChange={e => setEditForm({ ...editForm, cnpj: e.target.value })}
                                                        />
                                                    ) : (
                                                        <span className="text-sm font-medium text-slate-700">{selectedClient.cnpj || '-'}</span>
                                                    )}
                                                </div>
                                                <div className="flex flex-col py-2 border-b border-dashed border-slate-200">
                                                    <span className="text-sm text-slate-400 mb-1">Email</span>
                                                    {isEditing ? (
                                                        <input
                                                            className="w-full text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                                            value={editForm.email || ''}
                                                            onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                                                        />
                                                    ) : (
                                                        <span className="text-sm font-medium text-slate-700">{selectedClient.email || '-'}</span>
                                                    )}
                                                </div>
                                                <div className="flex flex-col py-2 border-b border-dashed border-slate-200">
                                                    <span className="text-sm text-slate-400 mb-1">Telefone</span>
                                                    {isEditing ? (
                                                        <input
                                                            className="w-full text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                                            value={editForm.telefone || ''}
                                                            onChange={e => setEditForm({ ...editForm, telefone: e.target.value })}
                                                        />
                                                    ) : (
                                                        <span className="text-sm font-medium text-slate-700">{selectedClient.telefone || '-'}</span>
                                                    )}
                                                </div>
                                                <div className="pt-2">
                                                    <span className="text-sm text-slate-400 block mb-1">Endereço</span>
                                                    {isEditing ? (
                                                        <textarea
                                                            className="w-full text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none h-20"
                                                            value={editForm.endereco || ''}
                                                            onChange={e => setEditForm({ ...editForm, endereco: e.target.value })}
                                                        />
                                                    ) : (
                                                        <span className="text-sm font-medium text-slate-700 block bg-slate-50 p-3 rounded-xl border border-slate-100">
                                                            {selectedClient.endereco || 'Endereço não cadastrado'}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Save/Cancel Actions */}
                                                {isEditing && (
                                                    <div className="flex gap-3 pt-4">
                                                        <button
                                                            onClick={handleSaveClient}
                                                            disabled={saving}
                                                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
                                                        >
                                                            {saving ? 'Salvando...' : <><Save size={18} /> Salvar Alterações</>}
                                                        </button>
                                                        <button
                                                            onClick={handleCancelEdit}
                                                            disabled={saving}
                                                            className="flex-1 bg-white hover:bg-slate-50 text-slate-700 font-medium py-2.5 rounded-xl border border-slate-200 transition-all"
                                                        >
                                                            Cancelar
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Collaborators List (Hide in Edit Mode? Or keep it? Keeping it for now but maybe disabled?) 
                            Let's keep it visible but maybe unclickable if we wanted perfect modal behavior, 
                            but for now just showing it is fine. 
                        */}
                                        {!isEditing && (
                                            <div>
                                                <h3 className="text-md font-bold text-slate-800 mb-4 flex items-center gap-2">
                                                    <User size={18} className="text-blue-500" />
                                                    Colaboradores Vinculados
                                                    <span className="bg-blue-100 text-blue-700 text-xs py-0.5 px-2 rounded-full ml-auto">
                                                        {colaboradores.length}
                                                    </span>
                                                </h3>

                                                {loadingColab ? (
                                                    <div className="text-center py-8 text-slate-400">Carregando colaboradores...</div>
                                                ) : colaboradores.length === 0 ? (
                                                    <div className="bg-slate-50/50 rounded-2xl p-6 text-center border border-dashed border-slate-200">
                                                        <p className="text-slate-500 text-sm">Nenhum colaborador encontrado para este cliente.</p>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-3">
                                                        {colaboradores.map(colab => (
                                                            <div
                                                                key={colab.id}
                                                                onClick={() => setSelectedColaborador(colab)}
                                                                className="bg-white/60 p-3 rounded-2xl border border-white/60 flex items-center gap-3 shadow-sm hover:shadow-md hover:bg-white hover:border-blue-200 cursor-pointer transition-all group"
                                                            >
                                                                <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 shrink-0 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                                                    <User size={16} />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm font-bold text-slate-800 truncate">{colab.nome}</p>
                                                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                                                        <span className="flex items-center gap-1 truncate">
                                                                            <Briefcase size={10} />
                                                                            {colab.cargos?.nome || 'Cargo n/a'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-500" />
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }
        </div>
    );
};