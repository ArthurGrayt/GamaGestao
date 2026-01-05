import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, X, Calendar } from 'lucide-react';
import { supabase } from '../../services/supabase';

interface UserOption {
    user_id: string; // matches users.user_id (which maps to logs.user_uuid)
    username: string;
    img_url?: string | null;
}

interface LogFiltersProps {
    selectedUser: UserOption | null;
    onUserSelect: (user: UserOption | null) => void;
    selectedOperation: string | null;
    onOperationSelect: (op: string | null) => void;
    selectedApp: string | null;
    onAppSelect: (app: string | null) => void;
    searchText: string;
    onSearchTextChange: (text: string) => void;
    selectedDate: string;
    onDateSelect: (date: string) => void;
}

export const LogFilters: React.FC<LogFiltersProps> = ({
    selectedUser,
    onUserSelect,
    selectedOperation,
    onOperationSelect,
    selectedApp,
    onAppSelect,
    searchText,
    onSearchTextChange,
    selectedDate,
    onDateSelect
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [users, setUsers] = useState<UserOption[]>([]);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Fetch users for the dropdown
    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('users')
                .select('user_id, username, img_url')
                .order('username');

            if (!error && data) {
                setUsers(data as UserOption[]);
            }
            setLoading(false);
        };

        fetchUsers();
    }, []);

    // Handle click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredUsers = users.filter(user =>
        user.username?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const operations = [
        { value: 'LOGIN', label: 'Login' },
        { value: 'LOGOUT', label: 'Logout' },
        { value: 'CREATE', label: 'Criação' },
        { value: 'UPDATE', label: 'Edição' },
        { value: 'DELETE', label: 'Exclusão' },
        { value: 'EXPORT', label: 'Exportação' }
    ];
    const apps = ['Gama Hub', 'Gama Gestão', 'Gama Ponto'];

    return (
        <div className="flex flex-col xl:flex-row items-end gap-4 mb-6 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">

            {/* 1. User Filter */}
            <div className="relative w-full xl:w-64" ref={dropdownRef}>
                <label className="block text-xs font-medium text-slate-500 mb-1 ml-1">Pessoa</label>

                <div
                    className={`flex items-center justify-between w-full px-3 py-2 bg-slate-50 border rounded-lg cursor-pointer transition-all ${isOpen ? 'border-blue-500 ring-1 ring-blue-100' : 'border-slate-200 hover:border-slate-300'}`}
                    onClick={() => setIsOpen(!isOpen)}
                >
                    {selectedUser ? (
                        <div className="flex items-center gap-2 overflow-hidden">
                            {selectedUser.img_url ? (
                                <img src={selectedUser.img_url} alt="" className="w-5 h-5 rounded-full object-cover flex-shrink-0" />
                            ) : (
                                <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] text-slate-500 font-bold flex-shrink-0">
                                    {selectedUser.username?.charAt(0)}
                                </div>
                            )}
                            <span className="text-sm text-slate-700 font-medium truncate">{selectedUser.username}</span>
                        </div>
                    ) : (
                        <span className="text-sm text-slate-400">Todos os usuários</span>
                    )}

                    <div className="flex items-center gap-1">
                        {selectedUser && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onUserSelect(null);
                                }}
                                className="p-0.5 hover:bg-slate-200 rounded-full text-slate-400 hover:text-red-500 transition-colors"
                            >
                                <X size={14} />
                            </button>
                        )}
                        <ChevronDown size={14} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </div>
                </div>

                {isOpen && (
                    <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-20 animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-2 border-b border-slate-50">
                            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg">
                                <Search size={14} className="text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar usuário..."
                                    className="bg-transparent border-none outline-none text-sm w-full text-slate-600 placeholder:text-slate-400"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    autoFocus
                                />
                            </div>
                        </div>
                        <div className="max-h-60 overflow-y-auto p-1 custom-scrollbar">
                            {loading ? (
                                <div className="p-4 text-center text-xs text-slate-400">Carregando...</div>
                            ) : filteredUsers.length > 0 ? (
                                filteredUsers.map(user => (
                                    <div
                                        key={user.user_id}
                                        onClick={() => {
                                            onUserSelect(user);
                                            setIsOpen(false);
                                        }}
                                        className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors group"
                                    >
                                        {user.img_url ? (
                                            <img src={user.img_url} alt="" className="w-8 h-8 rounded-full object-cover border border-slate-100" />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs text-slate-500 font-bold border border-slate-100 group-hover:bg-white transition-colors">
                                                {user.username?.charAt(0)}
                                            </div>
                                        )}
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-slate-700 group-hover:text-blue-600 transition-colors">{user.username}</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-4 text-center text-xs text-slate-400">Nenhum usuário encontrado</div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* 2. Search Text */}
            <div className="w-full xl:w-64">
                <label className="block text-xs font-medium text-slate-500 mb-1 ml-1">Buscar no log</label>
                <div className="flex items-center px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-100 transition-all">
                    <Search size={16} className="text-slate-400 mr-2" />
                    <input
                        type="text"
                        placeholder="Ex: 'Erro ao salvar'..."
                        value={searchText}
                        onChange={(e) => onSearchTextChange(e.target.value)}
                        className="bg-transparent border-none outline-none text-sm w-full text-slate-600 placeholder:text-slate-400"
                    />
                    {searchText && (
                        <button
                            onClick={() => onSearchTextChange('')}
                            className="p-0.5 ml-1 text-slate-400 hover:text-red-500 hover:bg-slate-200 rounded-full transition-colors"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
            </div>

            {/* 3. Operation Filter */}
            <div className="w-full xl:w-40">
                <label className="block text-xs font-medium text-slate-500 mb-1 ml-1">Operação</label>
                <div className="relative">
                    <select
                        value={selectedOperation || ''}
                        onChange={(e) => onOperationSelect(e.target.value || null)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 appearance-none cursor-pointer"
                    >
                        <option value="">Todas</option>
                        {operations.map(op => (
                            <option key={op.value} value={op.value}>{op.label}</option>
                        ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
            </div>

            {/* 4. App Filter */}
            <div className="w-full xl:w-48">
                <label className="block text-xs font-medium text-slate-500 mb-1 ml-1">Aplicativo</label>
                <div className="relative">
                    <select
                        value={selectedApp || ''}
                        onChange={(e) => onAppSelect(e.target.value || null)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 appearance-none cursor-pointer"
                    >
                        <option value="">Todos</option>
                        {apps.map(app => (
                            <option key={app} value={app}>{app}</option>
                        ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
            </div>

            {/* 5. Date Filter */}
            <div className="w-full xl:w-40">
                <label className="block text-xs font-medium text-slate-500 mb-1 ml-1">Data</label>
                <div className="relative">
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => onDateSelect(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 appearance-none cursor-pointer"
                    />
                    {!selectedDate && (
                        <Calendar size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    )}
                </div>
            </div>

        </div>
    );
};
