import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabase';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import {
    Plus, Search, FileText, BarChart2, Link as LinkIcon,
    MoreVertical, Edit2, Trash2, X, Check, Copy, ExternalLink,
    ChevronUp, ChevronDown, List, Type, MessageSquare, Star,
    User, Users, Calendar, Clock, ArrowLeft, ChevronRight, Split, Layout, Minimize2, AlignJustify, GripVertical,
    Building2, MapPin, Briefcase, Filter, Download, Play, Pause, Settings, Save, CheckCircle, AlertCircle, Send, Hash
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Form, FormQuestion, FormAnswer, HSEDimension, QuestionType } from '../types';



/* --- Internal UI Components --- */

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
    if (className.includes('btn-icon-only')) sizeClass = "p-2.5";
    return <button className={`${baseClass} ${variantClass} ${sizeClass} ${className}`} {...props}>{children}</button>;
};

const Input = ({ icon: Icon, className = '', ...props }: any) => (
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

const Card = ({ children, className = '', onClick, ...props }: any) => (
    <div
        className={`bg-white rounded-2xl border border-slate-200 p-4 transition-all ${onClick ? 'cursor-pointer hover:shadow-md hover:border-blue-200' : ''} ${className}`}
        onClick={onClick}
        {...props}
    >
        {children}
    </div>
);

const Badge = ({ status }: { status: boolean }) => (
    <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${status ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
        {status ? 'Ativo' : 'Inativo'}
    </span>
);

const Modal = ({ isOpen, onClose, title, children }: any) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
                    <h2 className="text-xl font-bold text-slate-800">{title}</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-red-500 transition-colors">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
                    {children}
                </div>
            </div>
        </div>
    );
};

const ReviewItem = React.memo(({ label, value }: { label: string, value: string }) => (
    <div className="flex justify-between py-2 border-b border-slate-100 last:border-0">
        <span className="text-slate-500">{label}</span>
        <span className="font-medium text-slate-800">{value}</span>
    </div>
));

// Searchable Select Component
const SearchableSelect = ({ options, value, onChange, placeholder, disabled, icon: Icon }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: any) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    const filteredOptions = options.filter((opt: any) =>
        String(opt.label || '').toLowerCase().includes(search.toLowerCase())
    );

    const selectedLabel = options.find((opt: any) => opt.value === value)?.label || '';

    return (
        <div className="relative" ref={wrapperRef}>
            {Icon && <Icon size={16} className="absolute left-3 top-3 text-slate-400 pointer-events-none z-10" />}
            <div
                className={`w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 cursor-pointer flex justify-between items-center ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => !disabled && setIsOpen(!isOpen)}
            >
                <span className={selectedLabel ? 'text-slate-800' : 'text-slate-400 truncate'}>
                    {selectedLabel || placeholder}
                </span>
                <ChevronDown size={14} className="text-slate-400" />
            </div>

            {isOpen && !disabled && (
                <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 max-h-60 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100">
                    <div className="p-2 border-b border-slate-100 sticky top-0 bg-white">
                        <div className="relative">
                            <Search size={14} className="absolute left-2 top-2.5 text-slate-400" />
                            <input
                                autoFocus
                                type="text"
                                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                                placeholder="Buscar..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    </div>
                    <div className="overflow-y-auto flex-1">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((opt: any) => (
                                <div
                                    key={opt.value}
                                    className={`px-4 py-2 text-sm cursor-pointer hover:bg-blue-50 hover:text-blue-600 transition-colors ${opt.value === value ? 'bg-blue-50 text-blue-600 font-medium' : 'text-slate-600'}`}
                                    onClick={() => {
                                        onChange(opt.value);
                                        setIsOpen(false);
                                        setSearch('');
                                    }}
                                >
                                    {opt.label}
                                </div>
                            ))
                        ) : (
                            <div className="px-4 py-3 text-sm text-slate-400 text-center">
                                Nenhum resultado
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const QuestionEditorItem = React.memo(({
    q,
    idx,
    updateQuestion,
    removeQuestion,
    duplicateQuestion,
    moveQuestion,
    addSectionBreakAfter,
    isCompact,
    draggableProps,
    dragHandleProps,
    innerRef,
    isDragging
}: {
    q: Partial<FormQuestion>,
    idx: number,
    updateQuestion: (i: number, f: string, v: any) => void,
    removeQuestion: (i: number) => void,
    duplicateQuestion: (i: number) => void,
    moveQuestion: (i: number, d: 'up' | 'down') => void,
    addSectionBreakAfter: (i: number) => void,
    isCompact: boolean,
    draggableProps?: any,
    dragHandleProps?: any,
    innerRef?: any,
    isDragging?: boolean
}) => {
    // Local state buffering to prevent re-renders on every keystroke
    const [label, setLabel] = useState(q.label || '');
    const [options, setOptions] = useState<Record<string, string>>({
        option_1: q.option_1 || '',
        option_2: q.option_2 || '',
        option_3: q.option_3 || '',
        option_4: q.option_4 || '',
        option_5: q.option_5 || '',
    });
    const [minValue, setMinValue] = useState(q.min_value || 1);
    const [maxValue, setMaxValue] = useState(q.max_value || 5);
    const [isExpanded, setIsExpanded] = useState(false);

    const textareaRef = React.useRef<HTMLTextAreaElement>(null);

    // Sync local state when props change
    useEffect(() => {
        setLabel(q.label || '');
    }, [q.label]);

    useEffect(() => {
        setOptions({
            option_1: q.option_1 || '',
            option_2: q.option_2 || '',
            option_3: q.option_3 || '',
            option_4: q.option_4 || '',
            option_5: q.option_5 || '',
        });
    }, [q.option_1, q.option_2, q.option_3, q.option_4, q.option_5]);

    useEffect(() => {
        setMinValue(q.min_value || 1);
    }, [q.min_value]);

    useEffect(() => {
        setMaxValue(q.max_value || 5);
    }, [q.max_value]);

    // Optimize Textarea Auto-Resize
    React.useLayoutEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'; // Reset to shrink if needed
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [label, isExpanded, isCompact]); // Re-run on expansion/mode switch

    // Handlers
    const handleLabelBlur = () => {
        if (label !== q.label) {
            updateQuestion(idx, 'label', label);
        }
    };

    const handleOptionBlur = (key: string) => {
        if (options[key] !== (q as any)[key]) {
            updateQuestion(idx, key, options[key]);
        }
    };

    const handleMinBlur = () => {
        if (minValue !== q.min_value) updateQuestion(idx, 'min_value', minValue);
    };

    const handleMaxBlur = () => {
        if (maxValue !== q.max_value) updateQuestion(idx, 'max_value', maxValue);
    };

    // Compact View Render
    if (isCompact && !isExpanded) {
        return (
            <div
                ref={innerRef}
                {...draggableProps}
                {...dragHandleProps}
                className={`bg-white border rounded-lg p-3 flex items-center gap-4 group hover:border-blue-300 transition-all cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md ${isDragging ? 'shadow-lg ring-2 ring-blue-400 border-blue-400 rotate-1 z-50' : 'border-slate-200'}`}
                onClick={() => setIsExpanded(true)}
                style={draggableProps?.style}
            >
                {/* Drag Handle & Type Icon */}
                <div className="flex items-center gap-3 text-slate-400">
                    <div className={`p-1.5 rounded-md border text-slate-500 ${q.question_type === 'section_break' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}>
                        {q.question_type === 'short_text' && <Type size={14} />}
                        {q.question_type === 'long_text' && <MessageSquare size={14} />}
                        {q.question_type === 'choice' && <List size={14} />}
                        {q.question_type === 'select' && <ChevronDown size={14} />}
                        {q.question_type === 'rating' && <Star size={14} />}
                        {q.question_type === 'section_break' && <ArrowLeft className="rotate-[-90deg]" size={14} />}
                    </div>
                </div>

                {/* Label Summary */}
                <div className="flex-1 font-medium text-slate-700 select-none truncate">
                    {q.question_type === 'section_break' ? (
                        <span className="uppercase text-xs font-bold tracking-wider text-slate-500">NOVA SEÇÃO: <span className="text-slate-800">{q.label || '(Sem Título)'}</span></span>
                    ) : (
                        <span>{idx + 1}. {q.label || <span className="text-slate-400 italic font-normal">Digite a pergunta...</span>}</span>
                    )}
                </div>

                {/* Quick Actions */}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {q.question_type !== 'section_break' && (
                        <button onClick={(e) => { e.stopPropagation(); addSectionBreakAfter(idx); }} className="p-1.5 hover:bg-purple-50 text-slate-400 hover:text-purple-600 rounded transition-colors" title="Inserir Quebra de Seção Abaixo"><Split size={14} /></button>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); duplicateQuestion(idx); }} className="p-1.5 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded transition-colors" title="Duplicar"><Copy size={14} /></button>
                    <button onClick={(e) => { e.stopPropagation(); removeQuestion(idx); }} className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded transition-colors" title="Excluir"><Trash2 size={14} /></button>
                </div>
            </div>
        )
    }

    return (
        <div
            ref={innerRef}
            {...draggableProps}
            className={`bg-slate-50 border border-slate-200 rounded-xl p-4 relative group animate-in fade-in duration-200 ${isDragging ? 'shadow-xl ring-2 ring-blue-500 z-50' : ''}`}
            style={draggableProps?.style}
        >


            {!isCompact && (
                <div
                    {...dragHandleProps}
                    className="absolute left-1/2 -translate-x-1/2 top-2 p-1 text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <GripVertical size={16} />
                </div>
            )}



            <div className="flex items-start gap-3 mb-3">
                <div className="flex items-center gap-2 mt-1">
                    {isCompact && (
                        <button
                            onClick={() => setIsExpanded(false)}
                            className="p-2 rounded-lg border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:bg-slate-50 transition-all"
                            title="Recolher"
                        >
                            <ChevronUp size={18} />
                        </button>
                    )}

                </div>

                <div className="flex-1 pt-1">
                    {q.question_type === 'section_break' && <span className="text-xs font-bold text-slate-400 uppercase block mb-1">Nova Seção (Quebra de Página)</span>}
                    <textarea
                        ref={textareaRef}
                        className={`bg-transparent font-medium w-full focus:outline-none border-b border-transparent focus:border-blue-300 px-1 resize-none overflow-hidden ${q.question_type === 'section_break' ? 'text-lg text-slate-800 font-bold placeholder:text-slate-300' : 'text-slate-700 placeholder:text-slate-400'}`}
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                        onBlur={handleLabelBlur}
                        rows={1}
                        placeholder={q.question_type === 'section_break' ? "Título da Seção (Opcional)" : "Digite a pergunta..."}
                    />
                </div>

                <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => duplicateQuestion(idx)} className="p-1.5 hover:bg-blue-100 text-blue-600 rounded" title="Duplicar"><Copy size={16} /></button>
                    {q.question_type !== 'section_break' && (
                        <button onClick={() => addSectionBreakAfter(idx)} className="p-1.5 hover:bg-purple-100 text-purple-600 rounded" title="Inserir Quebra de Seção Abaixo"><Split size={16} /></button>
                    )}
                    <button onClick={() => removeQuestion(idx)} className="p-1.5 hover:bg-red-100 text-red-500 rounded" title="Excluir"><Trash2 size={16} /></button>
                </div>
            </div>
            {q.question_type !== 'section_break' && (
                <div className="pl-12 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={q.required}
                            onChange={(e) => updateQuestion(idx, 'required', e.target.checked)}
                        />
                        <span className="text-sm text-slate-500">Obrigatória</span>
                    </div>

                    {(q.question_type === 'choice' || q.question_type === 'select') && (
                        <div className="col-span-2 space-y-2">
                            <p className="text-xs font-bold text-slate-400 uppercase">Opções {q.question_type === 'select' && '(Dropdown)'}</p>
                            {[1, 2, 3, 4, 5].map(optNum => (
                                <input
                                    key={optNum}
                                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm"
                                    placeholder={`Opção ${optNum}`}
                                    value={options[`option_${optNum}`]}
                                    onChange={(e) => setOptions(prev => ({ ...prev, [`option_${optNum}`]: e.target.value }))}
                                    onBlur={() => handleOptionBlur(`option_${optNum}`)}
                                />
                            ))}
                        </div>
                    )}

                    {q.question_type === 'rating' && (
                        <div className="col-span-2 grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-slate-500">Mínimo</label>
                                <input
                                    type="number"
                                    className="w-full bg-white border rounded px-2 py-1"
                                    value={minValue}
                                    onChange={e => setMinValue(parseInt(e.target.value) || 0)}
                                    onBlur={handleMinBlur}
                                />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500">Máximo</label>
                                <input
                                    type="number"
                                    className="w-full bg-white border rounded px-2 py-1"
                                    value={maxValue}
                                    onChange={e => setMaxValue(parseInt(e.target.value) || 0)}
                                    onBlur={handleMaxBlur}
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}); // Removed custom comparator to allow safe shallow comparison including isCompact prop

/* --- Main Component --- */

export const Formularios: React.FC = () => {
    const [forms, setForms] = useState<Form[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editingForm, setEditingForm] = useState<Partial<Form> & { questions?: Partial<FormQuestion>[] } | null>(null);
    const [deletedQuestionIds, setDeletedQuestionIds] = useState<number[]>([]);
    const [isPsicosocial, setIsPsicosocial] = useState(false);

    // Association State
    const [companies, setCompanies] = useState<any[]>([]); // Clientes
    const [units, setUnits] = useState<any[]>([]); // Unidades
    const [sectors, setSectors] = useState<any[]>([]); // Setores
    const [colabsCount, setColabsCount] = useState<number>(0);
    const [requireSector, setRequireSector] = useState(false);

    // HSE Config State
    const [hseModalOpen, setHseModalOpen] = useState(false);
    const [currentHseForm, setCurrentHseForm] = useState<Form | null>(null);
    const [hseDimensions, setHseDimensions] = useState<HSEDimension[]>([]);
    const [hseQuestions, setHseQuestions] = useState<FormQuestion[]>([]);
    const [loadingHse, setLoadingHse] = useState(false);
    const [expandedDimensions, setExpandedDimensions] = useState<Set<number>>(new Set());

    const toggleDimensionExpanded = (id: number) => {
        const newSet = new Set(expandedDimensions);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setExpandedDimensions(newSet);
    };

    // HSE Handlers
    const handleOpenHSEConfig = async (form: Form) => {
        if (!form.hse_id) return;
        setCurrentHseForm(form);
        setLoadingHse(true);
        setHseModalOpen(true);

        try {
            // Fetch ALL Dimensions (Schema is global/dictionary based, no hse_id)
            const { data: dims, error: dimError } = await supabase
                .from('form_hse_dimensions')
                .select('*')
                .order('id', { ascending: true });

            if (dimError) throw dimError;
            setHseDimensions(dims || []);

            // Fetch Questions for this form
            const { data: qs, error: qError } = await supabase
                .from('form_questions')
                .select('*')
                .eq('form_id', form.id)
                .order('question_order', { ascending: true });

            if (qError) throw qError;
            setHseQuestions(qs || []);

        } catch (err) {
            console.error("Error loading HSE config:", err);
            alert("Erro ao carregar configurações HSE.");
        } finally {
            setLoadingHse(false);
        }
    };

    const handleCreateDimension = async () => {
        const name = prompt("Nome da nova dimensão:");
        if (!name) return;

        try {
            const { data, error } = await supabase
                .from('form_hse_dimensions')
                .insert({
                    name: name,
                    is_positive: true, // Default
                    risk_label: 'Risco Padrão' // Default
                })
                .select()
                .single();

            if (error) throw error;
            setHseDimensions([...hseDimensions, data]);
        } catch (err) {
            console.error(err);
            alert("Erro ao criar dimensão.");
        }
    };

    const handleUpdateDimension = async (id: number, updates: Partial<HSEDimension>) => {
        try {
            const { error } = await supabase
                .from('form_hse_dimensions')
                .update(updates)
                .eq('id', id);

            if (error) throw error;
            setHseDimensions(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
        } catch (err) {
            console.error(err);
            alert("Erro ao atualizar dimensão.");
        }
    };

    const handleDeleteDimension = async (id: number) => {
        if (!confirm("Excluir esta dimensão?")) return;
        try {
            const { error } = await supabase.from('form_hse_dimensions').delete().eq('id', id);
            if (error) throw error;
            setHseDimensions(prev => prev.filter(d => d.id !== id));
            setHseQuestions(prev => prev.map(q => q.hse_dimension_id === id ? { ...q, hse_dimension_id: undefined } : q));
        } catch (err) {
            console.error(err);
            alert("Erro ao excluir dimensão.");
        }
    };

    const handleAssociateQuestion = async (questionId: number, dimensionId: number | null, numberInDim?: number) => {
        try {
            const updates: any = { hse_dimension_id: dimensionId };
            if (numberInDim !== undefined) updates.hse_question_number = numberInDim;

            const { error } = await supabase
                .from('form_questions')
                .update(updates)
                .eq('id', questionId);

            if (error) throw error;

            setHseQuestions(prev => prev.map(q => q.id === questionId ? { ...q, ...updates } : q));
        } catch (err) {
            console.error(err);
            alert("Erro ao associar questão.");
        }
    };

    useEffect(() => {
        fetchForms();

        // Fetch Dictionary Data
        const fetchDictionaries = async () => {
            const { data: clientsData } = await supabase.from('clientes').select('id, nome_fantasia, razao_social').order('nome_fantasia');
            if (clientsData) setCompanies(clientsData);

            const { data: sectorsData } = await supabase.from('setor').select('id, nome').order('nome');
            if (sectorsData) setSectors(sectorsData);
        };
        fetchDictionaries();
    }, []);

    // Association Logic: Fetch Units and Count Colabs when Company Changes
    useEffect(() => {
        const loadCompanyData = async () => {
            // Debug log
            console.log('Loading company data for:', editingForm?.empresa);

            if (!editingForm?.empresa) {
                setUnits([]);
                setColabsCount(0);
                return;
            }

            // 1. Fetch Units
            const { data: unitsData, error: unitError } = await supabase
                .from('unidades')
                .select('id, nome_unidade')
                .eq('empresaid', editingForm.empresa) // Ensure the column name in 'unidades' table is exactly 'empresaid'
                .order('nome_unidade');

            if (unitError) console.error('Error fetching units:', unitError);
            if (unitsData) {
                console.log('Units loaded:', unitsData);
                setUnits(unitsData);
            }

            // 2. Count Collaborators for this Company
            // Get all unit IDs first (from the just fetched data or via query)
            if (unitsData && unitsData.length > 0) {
                const unitIds = unitsData.map(u => u.id);
                const { count, error } = await supabase
                    .from('colaboradores')
                    .select('*', { count: 'exact', head: true })
                    .in('unidade', unitIds);

                const total = count || 0;
                setColabsCount(total);
                setRequireSector(total > 20);
            } else {
                setColabsCount(0);
                setRequireSector(false);
            }
        };

        if (editingForm) {
            loadCompanyData();
        }
    }, [editingForm?.empresa]);

    // Update Title/Slug when Sector Changes (if required)
    // "ao selecionar um setor ele deve constar no link do formulario e no nome dele"
    // We should implement this in the onChange handler to avoid infinite loops, not useEffect.

    const fetchForms = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('forms')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) console.error('Error fetching forms:', error);
        else setForms(data || []);

        setLoading(false);
    };

    const handleCreateNew = () => {
        setEditingForm({
            title: '',
            description: '',
            slug: '',
            active: true,
            questions: []
        });
        setDeletedQuestionIds([]);
        setIsPsicosocial(false);
        setIsEditorOpen(true);
    };

    const handleEdit = async (form: Form) => {
        // Fetch questions for this form
        const { data: questions } = await supabase
            .from('form_questions')
            .select('*')
            .eq('form_id', form.id)
            .order('question_order', { ascending: true });

        // Ensure every question has a temp_id for stable keys
        const questionsWithTempId = (questions || []).map(q => ({
            ...q,
            temp_id: `q_${q.id || 'new'}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }));

        // If editing an existing form, we need to fetch the company ID from the unit
        let empresaId = form.empresa;
        if (!empresaId && form.unidade_id) {
            const { data: unitData } = await supabase
                .from('unidades')
                .select('empresaid')
                .eq('id', form.unidade_id)
                .single();
            if (unitData) empresaId = unitData.empresaid;
        }

        setEditingForm({
            ...form,
            empresa: empresaId,
            questions: questionsWithTempId
        });
        setDeletedQuestionIds([]);
        setIsPsicosocial(!!form.hse_id);
        setIsEditorOpen(true);
    };

    const handleDeleteForm = async (id: number) => {
        if (!confirm('Tem certeza que deseja excluir este formulário? Todas as respostas serão perdidas.')) return;

        try {
            const { error } = await supabase.from('forms').delete().eq('id', id);
            if (error) throw error;
            fetchForms();
        } catch (error) {
            console.error('Error deleting form:', error);
            alert('Erro ao excluir formulário');
        }
    };


    // Feature: Duplicate Form
    const handleDuplicateForm = async (form: Form) => {
        if (!confirm(`Deseja duplicar o formulário "${form.title}"?`)) return;

        try {
            const user = (await supabase.auth.getUser()).data.user;

            // 1. Create Form Copy
            const newSlug = `${form.slug}-copy-${Date.now()}`;
            const { data: newForm, error: formError } = await supabase
                .from('forms')
                .insert({
                    title: `${form.title} (Cópia)`,
                    description: form.description,
                    slug: newSlug,
                    active: false, // Default to inactive
                    // No empresa column in forms
                    unidade_id: form.unidade_id,
                    setor: form.setor
                })
                .select()
                .single();

            if (formError) throw formError;

            // 2. Fetch Original Questions
            const { data: originalQuestions, error: qError } = await supabase
                .from('form_questions')
                .select('*')
                .eq('form_id', form.id)
                .order('question_order', { ascending: true });

            if (qError) throw qError;

            // 3. Insert Questions for New Form
            if (originalQuestions && originalQuestions.length > 0) {
                const newQuestionsData = originalQuestions.map(q => {
                    const { id, form_id, created_at, ...rest } = q;
                    return {
                        ...rest,
                        form_id: newForm.id
                    };
                });

                const { error: qsInsertError } = await supabase
                    .from('form_questions')
                    .insert(newQuestionsData);

                if (qsInsertError) throw qsInsertError;
            }

            alert('Formulário duplicado com sucesso!');
            fetchForms();
        } catch (error) {
            console.error('Error duplicating form:', error);
            alert('Erro ao duplicar formulário');
        }
    };


    const handleSaveForm = async () => {
        if (!editingForm?.title || !editingForm?.slug) {
            alert('Título e Slug são obrigatórios');
            return;
        }

        if (requireSector && !editingForm.setor) {
            alert('A empresa selecionada possui mais de 20 colaboradores. Por favor, selecione um setor.');
            return;
        }

        // 1. Save Form (Insert or Update)
        let formId = editingForm.id;

        const formData: Partial<Form> = {
            title: editingForm.title,
            description: editingForm.description,
            slug: editingForm.slug,
            active: editingForm.active,
            // empresa: Not saved to DB
            unidade_id: editingForm.unidade_id,
            setor: editingForm.setor,
            hse_id: editingForm.hse_id
        };

        // Handle HSE Report Creation if Psicosocial is checked
        if (isPsicosocial && !formData.hse_id) {
            try {
                const { data: hseData, error: hseError } = await supabase
                    .from('form_hse_reports')
                    .insert({ status: 'aberto' }) // defaults will handle the rest
                    .select()
                    .single();

                if (hseError) throw hseError;
                if (hseData) formData.hse_id = hseData.id;
            } catch (err) {
                console.error("Error creating HSE report:", err);
                alert("Erro ao criar relatório Psicosocial. O formulário será salvo sem ele.");
            }
        } else if (!isPsicosocial && formData.hse_id) {
            // Optional: Remove HSE link if unchecked? 
            // For now, we just keep it or set null if desired. user didn't specify.
            // Leaving as is to avoid data loss.
        }

        if (formId) {
            // Update
            const { error: updateError } = await supabase
                .from('forms')
                .update(formData)
                .eq('id', formId);

            if (updateError) {
                console.error('Error updating form:', updateError);
                alert('Erro ao atualizar formulário');
                return;
            }
        } else {
            // Insert
            const { data: savedForm, error: insertError } = await supabase
                .from('forms')
                .insert(formData)
                .select()
                .single();

            if (insertError) {
                console.error('Error creating form:', insertError);
                alert('Erro ao criar formulário');
                return;
            }
            formId = savedForm.id;
        }

        // 2. Handle Deleted Questions
        if (deletedQuestionIds.length > 0) {
            await supabase
                .from('form_questions')
                .delete()
                .in('id', deletedQuestionIds);
        }

        // 3. Save Questions (Iterate to separate Insert/Update)
        if (editingForm.questions && editingForm.questions.length > 0) {
            for (let i = 0; i < editingForm.questions.length; i++) {
                const q = editingForm.questions[i];
                // Remove temp_id before sending to DB to avoid errors if strict
                const { temp_id, ...qDataRaw } = q;
                const qData = {
                    form_id: formId,
                    question_order: i,
                    label: q.label || 'Nova Pergunta',
                    question_type: q.question_type || 'short_text',
                    required: q.required ?? false,
                    option_1: q.option_1,
                    option_2: q.option_2,
                    option_3: q.option_3,
                    option_4: q.option_4,
                    option_5: q.option_5,
                    min_value: q.min_value,
                    max_value: q.max_value
                };

                if (q.id) {
                    // Update existing question
                    const { error: qUpdateError } = await supabase
                        .from('form_questions')
                        .update(qData)
                        .eq('id', q.id);

                    if (qUpdateError) console.error('Error updating question:', qUpdateError);
                } else {
                    // Insert new question
                    const { error: qInsertError } = await supabase
                        .from('form_questions')
                        .insert(qData);

                    if (qInsertError) console.error('Error inserting question:', qInsertError);
                }
            }
        }

        // 4. Reload Form Data ensuring IDs are synced
        const { data: reloadedForm, error: reloadError } = await supabase
            .from('forms')
            .select('*')
            .eq('id', formId)
            .single();

        const { data: reloadedQuestions, error: qReloadError } = await supabase
            .from('form_questions')
            .select('*')
            .eq('form_id', formId)
            .order('question_order', { ascending: true });

        if (!reloadError && !qReloadError && reloadedForm) {
            // Update local state with DB IDs to prevent duplication on next save
            const syncedForm = { ...reloadedForm, questions: reloadedQuestions || [] };
            setEditingForm(syncedForm);
            setDeletedQuestionIds([]); // Reset deletion queue

            alert('Formulário salvo com sucesso!');

            // Update list without full refetch if possible, or just fetch
            fetchForms();
        } else {
            alert('Formulário salvo, mas erro ao recarregar dados. Por favor, reabra o editor.');
            setIsEditorOpen(false);
            fetchForms();
        }
    };

    const [viewMode, setViewMode] = useState<'list' | 'analytics'>('list');
    const [analyticsForm, setAnalyticsForm] = useState<Form | null>(null);
    const [answers, setAnswers] = useState<FormAnswer[]>([]);
    const [questions, setQuestions] = useState<FormQuestion[]>([]);
    const [loadingStats, setLoadingStats] = useState(false);

    // New Analytics State
    const [analyticsTab, setAnalyticsTab] = useState<'overview' | 'individual'>('overview');
    const [selectedRespondent, setSelectedRespondent] = useState<string | null>(null); // Groups by responder_identifier + timestamp key
    // isCompactMode state removed - enforced to true by default props passing



    const handleViewStats = async (form: Form) => {
        setAnalyticsForm(form);
        setViewMode('analytics');
        setLoadingStats(true);

        // Fetch Questions
        const { data: qData } = await supabase
            .from('form_questions')
            .select('*')
            .eq('form_id', form.id)
            .order('question_order');
        setQuestions(qData || []);

        // Fetch Answers
        const { data: aData } = await supabase
            .from('form_answers')
            .select('*')
            .eq('form_id', form.id)
            .order('created_at', { ascending: false });
        setAnswers(aData || []);

        setLoadingStats(false);
    };

    // Analytics Helpers
    const getTotalResponses = () => {
        // Estimate based on distinct timestamps (rough approx)
        const timestamps = new Set(answers.map(a => a.created_at));
        return timestamps.size;
    };

    const getAverageRating = (questionId: number) => {
        const qAnswers = answers.filter(a => a.question_id === questionId && a.answer_number !== null);
        if (qAnswers.length === 0) return 0;
        const sum = qAnswers.reduce((acc, curr) => acc + (curr.answer_number || 0), 0);
        return (sum / qAnswers.length).toFixed(1);
    };

    const getChoiceDistribution = (questionId: number) => {
        const qAnswers = answers.filter(a => a.question_id === questionId && a.answer_text);
        const distribution: Record<string, number> = {};
        qAnswers.forEach(a => {
            const val = a.answer_text!;
            distribution[val] = (distribution[val] || 0) + 1;
        });
        return distribution;
    };

    const getRespondents = () => {
        // Group answers by responder_identifier + created_at
        // If identifier is missing, use 'Anônimo'
        const groups: Record<string, {
            id: string; // key
            identifier: string;
            name: string;
            date: string;
            answerCount: number;
        }> = {};

        answers.forEach(a => {
            // Create a unique key for the submission. 
            // In a real app we'd use a submission_id. Here we assume created_at is unique per submission.
            const key = `${a.responder_identifier || 'anon'}_${a.created_at}`;

            if (!groups[key]) {
                groups[key] = {
                    id: key,
                    identifier: a.responder_identifier || 'Anônimo',
                    name: a.responder_name || 'Sem nome',
                    date: a.created_at,
                    answerCount: 0
                };
            }
            groups[key].answerCount++;
        });

        return Object.values(groups).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    };

    const getRespondentAnswers = (key: string) => {
        // Reverse engineer the key or just filter
        const [identifierPrefix, dateSuffix] = key.split('_20'); // Simple split attempt? No, let's just filter by exact match derived from key construction
        // Actually, just iterating is safer since we built the key from fields
        return answers.filter(a => `${a.responder_identifier || 'anon'}_${a.created_at}` === key);
    };

    // Question Editor Helpers
    const addQuestion = (type: QuestionType) => {
        setEditingForm(prev => ({
            ...prev!,
            questions: [...(prev?.questions || []), {
                label: '',
                question_type: type,
                required: false,
                question_order: (prev?.questions?.length || 0),
                temp_id: `new_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            }]
        }));
    };

    const updateQuestion = React.useCallback((index: number, field: string, value: any) => {
        setEditingForm(prev => {
            if (!prev || !prev.questions) return prev;
            const newQuestions = [...prev.questions];
            newQuestions[index] = { ...newQuestions[index], [field]: value };
            return { ...prev, questions: newQuestions };
        });
    }, []);

    const removeQuestion = React.useCallback((index: number) => {
        setEditingForm(prev => {
            if (!prev?.questions) return prev;
            const q = prev.questions[index];
            if (q.id) {
                setDeletedQuestionIds(ids => [...ids, q.id!]);
            }
            return {
                ...prev,
                questions: prev.questions.filter((_, i) => i !== index)
            };
        });
    }, []);

    const moveQuestion = React.useCallback((index: number, direction: 'up' | 'down') => {
        setEditingForm(prev => {
            if (!prev?.questions) return prev;
            const newQuestions = [...prev.questions];
            if (direction === 'up' && index > 0) {
                [newQuestions[index], newQuestions[index - 1]] = [newQuestions[index - 1], newQuestions[index]];
            } else if (direction === 'down' && index < newQuestions.length - 1) {
                [newQuestions[index], newQuestions[index + 1]] = [newQuestions[index + 1], newQuestions[index]];
            }
            return { ...prev, questions: newQuestions };
        });
    }, []);

    const duplicateQuestion = React.useCallback((index: number) => {
        setEditingForm(prev => {
            if (!prev?.questions) return prev;
            const questionToClone = prev.questions[index];
            const newQuestion = {
                ...questionToClone,
                id: undefined, // ensure it's treated as a new question
                label: `${questionToClone.label} (Cópia)`,
                temp_id: `copy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            };

            const newQuestions = [...prev.questions];
            newQuestions.splice(index + 1, 0, newQuestion);

            const reindexed = newQuestions.map((q, i) => ({ ...q, question_order: i }));

            return { ...prev, questions: reindexed };
        });
    }, []);

    const addSectionBreakAfter = React.useCallback((index: number) => {
        setEditingForm(prev => {
            if (!prev?.questions) return prev;
            const newQuestion = {
                label: '',
                question_type: 'section_break' as QuestionType,
                required: false,
                temp_id: `section_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            };
            const newQuestions = [...prev.questions];
            newQuestions.splice(index + 1, 0, newQuestion);

            const reindexed = newQuestions.map((q, i) => ({ ...q, question_order: i }));
            return { ...prev, questions: reindexed };
        });
    }, []);

    const copyToClipboard = (slug: string) => {
        const url = `${window.location.origin}/#/form/${slug}`;
        navigator.clipboard.writeText(url);
        alert('Link copiado para área de transferência!');
    };

    const filteredForms = forms.filter(f =>
        f.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (viewMode === 'analytics' && analyticsForm) {
        // Prepare Colors for Charts
        const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1'];

        const renderOverview = () => (
            <div className="space-y-8 animate-in fade-in duration-300">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 relative overflow-hidden group">
                        <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                            <BarChart2 size={80} className="text-blue-600" />
                        </div>
                        <h4 className="text-blue-600 font-bold text-sm uppercase tracking-wider mb-2">Total de Respostas</h4>
                        <p className="text-4xl font-bold text-slate-800">{getTotalResponses()}</p>
                    </div>
                    <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 relative overflow-hidden group">
                        <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                            <Check size={80} className="text-emerald-600" />
                        </div>
                        <h4 className="text-emerald-600 font-bold text-sm uppercase tracking-wider mb-2">Perguntas Ativas</h4>
                        <p className="text-4xl font-bold text-slate-800">{questions.length}</p>
                    </div>
                    <div className="bg-purple-50 p-6 rounded-2xl border border-purple-100 relative overflow-hidden group">
                        <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                            <Clock size={80} className="text-purple-600" />
                        </div>
                        <h4 className="text-purple-600 font-bold text-sm uppercase tracking-wider mb-2">Última Resposta</h4>
                        <p className="text-lg font-bold text-slate-800">
                            {answers.length > 0 ? new Date(answers[0].created_at).toLocaleDateString() : '-'}
                        </p>
                    </div>
                </div>

                {/* Detailed Analysis */}
                <div className="space-y-6">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <BarChart2 className="text-slate-400" size={20} />
                        Análise por Pergunta
                    </h3>

                    {questions.map((q) => (
                        <Card key={q.id} className="p-6">
                            <div className="flex items-start gap-4 mb-6 border-b border-slate-100 pb-4">
                                <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                                    {q.question_type === 'rating' && <Star size={20} />}
                                    {(q.question_type === 'choice' || q.question_type === 'select') && <List size={20} />}
                                    {(q.question_type === 'short_text' || q.question_type === 'long_text') && <MessageSquare size={20} />}
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-700 text-lg flex items-center gap-2 flex-wrap">
                                        {q.label}
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-normal ${q.required ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
                                            {q.required ? 'Obrigatória' : 'Opcional'}
                                        </span>
                                    </h4>
                                    <span className="text-xs font-medium bg-slate-100 text-slate-500 px-2 py-1 rounded mt-1 inline-block">
                                        {q.question_type === 'rating' ? 'Escala/Nota' : q.question_type === 'choice' ? 'Múltipla Escolha' : q.question_type === 'select' ? 'Dropdown' : 'Texto'}
                                    </span>
                                </div>
                            </div>

                            <div className="pl-0 md:pl-14">
                                {/* RATING ANALYSIS */}
                                {q.question_type === 'rating' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                                        <div className="bg-slate-50 rounded-2xl p-6 flex flex-col items-center justify-center">
                                            <span className="text-6xl font-black text-blue-600">{getAverageRating(q.id)}</span>
                                            <div className="flex gap-1 my-2">
                                                {Array.from({ length: 5 }).map((_, i) => (
                                                    <Star key={i} size={16} className={`${i < Math.round(Number(getAverageRating(q.id))) ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`} />
                                                ))}
                                            </div>
                                            <span className="text-slate-400 font-medium">Média Geral (Max {q.max_value})</span>
                                        </div>
                                        <div>
                                            {/* Simple histogram could go here, but for now just summary */}
                                            <div className="space-y-2">
                                                <p className="text-sm font-medium text-slate-600">Distribuição de notas:</p>
                                                {/* We could map 1-5 and show bars, but reusing choice logic is better if we had time. Keeping it simple. */}
                                                <div className="p-4 bg-slate-50 rounded-xl text-center text-slate-500 text-sm">
                                                    Visualize a média calculada à esquerda com base em {answers.filter(a => a.question_id === q.id).length} respostas.
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* CHOICE / SELECT ANALYSIS (PIE CHART) */}
                                {(q.question_type === 'choice' || q.question_type === 'select') && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="h-64 relative">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={Object.entries(getChoiceDistribution(q.id)).map(([name, value]) => ({ name, value }))}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={60}
                                                        outerRadius={80}
                                                        paddingAngle={5}
                                                        dataKey="value"
                                                    >
                                                        {Object.entries(getChoiceDistribution(q.id)).map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                        ))}
                                                    </Pie>
                                                    <RechartsTooltip formatter={(value: number) => [`${value} votos`, 'Quantidade']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div className="space-y-3 flex flex-col justify-center">
                                            {Object.entries(getChoiceDistribution(q.id))
                                                .sort(([, a], [, b]) => b - a)
                                                .map(([option, count], idx) => (
                                                    <div key={option} className="group">
                                                        <div className="flex justify-between text-sm mb-1">
                                                            <span className="font-medium text-slate-700 flex items-center gap-2">
                                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                                                                {option}
                                                            </span>
                                                            <span className="text-slate-500 font-mono bg-slate-50 px-2 rounded">{count} ({Math.round(count / getTotalResponses() * 100)}%)</span>
                                                        </div>
                                                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                                            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(count / getTotalResponses()) * 100}%`, backgroundColor: COLORS[idx % COLORS.length] }}></div>
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                )}

                                {/* TEXT ANALYSIS */}
                                {(q.question_type === 'short_text' || q.question_type === 'long_text') && (
                                    <div className="bg-slate-50 rounded-xl p-0 overflow-hidden border border-slate-100">
                                        <div className="p-3 bg-slate-100 border-b border-slate-200 flex justify-between items-center">
                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Respostas Recentes</span>
                                            <span className="text-xs text-slate-400">{answers.filter(a => a.question_id === q.id).length} textos</span>
                                        </div>
                                        <div className="max-h-64 overflow-y-auto p-2">
                                            <ul className="space-y-2">
                                                {answers
                                                    .filter(a => a.question_id === q.id && a.answer_text)
                                                    .slice(0, 10) // Show last 10
                                                    .map((a, i) => (
                                                        <li key={i} className="text-sm text-slate-600 bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                                                            <p className="italic">"{a.answer_text}"</p>
                                                            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-50">
                                                                <User size={12} className="text-slate-400" />
                                                                <span className="text-xs text-slate-400">{a.responder_identifier || 'Anônimo'}</span>
                                                                <span className="text-slate-300">•</span>
                                                                <span className="text-xs text-slate-400">{new Date(a.created_at).toLocaleDateString()}</span>
                                                            </div>
                                                        </li>
                                                    ))}
                                            </ul>
                                            {answers.filter(a => a.question_id === q.id).length === 0 && (
                                                <div className="p-8 text-center text-slate-400 text-sm">Nenhuma resposta de texto ainda.</div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        );

        const renderIndividual = () => {
            const respondents = getRespondents();

            // DETAIL VIEW (Selected Respondent)
            if (selectedRespondent) {
                const respondentAnswers = getRespondentAnswers(selectedRespondent);
                // Try to find metadata from the first answer
                const meta = respondentAnswers[0];
                const respondentName = meta?.responder_name || 'Participante';
                const respondentId = meta?.responder_identifier || 'Anônimo';
                const date = meta ? new Date(meta.created_at).toLocaleString() : '-';

                return (
                    <div className="animate-in slide-in-from-right duration-300">
                        <div className="flex items-center gap-4 mb-6">
                            <Button variant="outline" onClick={() => setSelectedRespondent(null)} className="px-3 gap-2">
                                <ArrowLeft size={16} />
                                Voltar para lista
                            </Button>
                            <div className="flex-1">
                                <div className="flex items-baseline gap-3">
                                    <h2 className="text-xl font-bold text-slate-800">{respondentName}</h2>
                                    <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-mono">{respondentId}</span>
                                </div>
                                <p className="text-slate-500 text-sm flex items-center gap-1 mt-1">
                                    <Calendar size={14} />
                                    Enviado em {date}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-6 max-w-3xl mx-auto">
                            {questions.map((q, idx) => {
                                const ans = respondentAnswers.find(a => a.question_id === q.id);
                                return (
                                    <div key={q.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-slate-200"></div>
                                        <span className="text-xs font-bold text-slate-400 uppercase mb-2 block tracking-wider">Pergunta {idx + 1}</span>
                                        <h3 className="text-lg font-medium text-slate-800 mb-4 flex items-center gap-2 flex-wrap">
                                            {q.label}
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-normal ${q.required ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
                                                {q.required ? 'Obrigatória' : 'Opcional'}
                                            </span>
                                        </h3>

                                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                            {ans ? (
                                                <>
                                                    {(q.question_type === 'short_text' || q.question_type === 'long_text') && (
                                                        <p className="text-slate-700 whitespace-pre-wrap">{ans.answer_text}</p>
                                                    )}
                                                    {(q.question_type === 'choice' || q.question_type === 'select') && (
                                                        <div className="flex items-center gap-2">
                                                            <Check className="text-emerald-500" size={18} />
                                                            <span className="font-medium text-slate-800">{ans.answer_text}</span>
                                                        </div>
                                                    )}
                                                    {q.question_type === 'rating' && (
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex">
                                                                {Array.from({ length: 5 }).map((_, i) => (
                                                                    <Star key={i} size={18} className={`${i < (ans.answer_number || 0) ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`} />
                                                                ))}
                                                            </div>
                                                            <span className="font-bold text-slate-700 ml-2">{ans.answer_number} / {q.max_value}</span>
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <span className="text-slate-400 italic">Não respondido</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            }

            // LIST VIEW
            return (
                <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-slate-800">Participantes ({respondents.length})</h3>
                        {/* Could add download CSV here */}
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        {respondents.length === 0 ? (
                            <div className="p-12 text-center text-slate-400">
                                Nenhuma resposta registrada ainda.
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {respondents.map((r) => (
                                    <div
                                        key={r.id}
                                        className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer group"
                                        onClick={() => setSelectedRespondent(r.id)}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg">
                                                {r.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-700">{r.name}</h4>
                                                <span className="text-xs text-slate-400 font-mono">{r.identifier}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <span className="block text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                                                    Running ID: {r.id.split('_')[1]?.slice(-4) || '...'}
                                                </span>
                                                <span className="text-xs text-slate-400">
                                                    {new Date(r.date).toLocaleDateString()} às {new Date(r.date).toLocaleTimeString().slice(0, 5)}
                                                </span>
                                            </div>
                                            <div className="p-2 rounded-full text-slate-300 group-hover:text-blue-500 group-hover:bg-blue-50 transition-colors">
                                                <ChevronRight size={20} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            );
        };

        return (
            <div className="h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
                <header className="mb-8">
                    <div className="flex items-center gap-4 mb-6">
                        <Button variant="outline" onClick={() => setViewMode('list')} className="px-3">
                            <ChevronUp className="rotate-[-90deg]" size={20} />
                            Voltar
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800">Relatório: {analyticsForm.title}</h1>

                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex p-1 bg-slate-100 rounded-xl w-fit">
                        <button
                            onClick={() => { setAnalyticsTab('overview'); setSelectedRespondent(null); }}
                            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${analyticsTab === 'overview' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Visão Geral
                        </button>
                        <button
                            onClick={() => setAnalyticsTab('individual')}
                            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${analyticsTab === 'individual' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Respostas Individuais
                        </button>
                    </div>
                </header>

                {loadingStats ? (
                    <div className="flex-1 flex justify-center items-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
                ) : (
                    <div className="overflow-y-auto pb-20">
                        {analyticsTab === 'overview' ? renderOverview() : renderIndividual()}
                    </div>
                )}
            </div>
        );
    }

    // LIST VIEW (Default)
    return (
        <div className="h-full flex flex-col animate-in fade-in duration-500">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Formulários</h1>
                    <p className="text-slate-500 text-sm mt-1">Gerencie seus formulários de pesquisa e coleta de dados</p>
                </div>
                <Button onClick={handleCreateNew}>
                    <Plus size={18} />
                    Novo Formulário
                </Button>
            </header>

            <div className="flex gap-4 mb-6">
                <div className="w-96">
                    <Input
                        icon={Search}
                        placeholder="Buscar formulários..."
                        value={searchTerm}
                        onChange={(e: any) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12 text-slate-400">Carregando...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredForms.map(form => (
                        <Card key={form.id} className="relative group hover:border-blue-300">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                                    <FileText size={24} />
                                </div>
                                <div className="flex gap-2">
                                    <Badge status={form.active} />
                                    <button
                                        onClick={() => handleDuplicateForm(form)}
                                        className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                        title="Duplicar"
                                    >
                                        <Copy size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleEdit(form)}
                                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        title="Editar"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteForm(form.id)}
                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Excluir"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <h3 className="text-lg font-bold text-slate-800 mb-2">{form.title}</h3>
                            <p className="text-sm text-slate-500 line-clamp-2 mb-4 h-10">
                                {form.description || 'Sem descrição'}
                            </p>

                            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1"
                                    onClick={() => copyToClipboard(form.slug)}
                                >
                                    <LinkIcon size={14} />
                                    Link
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1"
                                    onClick={() => window.open(`${window.location.origin}/#/form/${form.slug}`, '_blank')}
                                >
                                    <ExternalLink size={14} />
                                    Abrir
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-slate-400 hover:text-blue-600"
                                    onClick={() => handleViewStats(form)}
                                    title="Ver Relatórios"
                                >
                                    <BarChart2 size={16} />
                                </Button>
                                {form.hse_id && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-slate-400 hover:text-slate-700"
                                        onClick={() => handleOpenHSEConfig(form)}
                                        title="Configurar Dimensões HSE"
                                    >
                                        <Settings size={16} />
                                    </Button>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Create/Edit Modal */}
            <Modal
                isOpen={isEditorOpen}
                onClose={() => setIsEditorOpen(false)}
                title={editingForm?.id ? 'Editar Formulário' : 'Novo Formulário'}
            >
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Título</label>
                            <Input
                                value={editingForm?.title || ''}
                                onChange={(e: any) => {
                                    const title = e.target.value;
                                    const slug = title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
                                    setEditingForm(prev => ({ ...prev!, title, slug: prev?.id ? prev.slug : slug }));
                                }}
                                placeholder="Ex: Pesquisa de Satisfação"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Slug (URL)</label>
                            <Input
                                value={editingForm?.slug || ''}
                                onChange={(e: any) => setEditingForm(prev => ({ ...prev!, slug: e.target.value }))}
                                placeholder="pesquisa-satisfacao"
                            />
                        </div>

                        <div className="md:col-span-2 bg-purple-50 p-4 rounded-xl border border-purple-100 flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="is_psicosocial"
                                className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                                checked={isPsicosocial}
                                onChange={(e) => setIsPsicosocial(e.target.checked)}
                            />
                            <div className="flex-1">
                                <label htmlFor="is_psicosocial" className="font-bold text-purple-900 block cursor-pointer">
                                    Psicosocial
                                </label>
                                <p className="text-xs text-purple-700">
                                    Habilitar relatório HSE (Health & Safety Executive) para este formulário.
                                </p>
                            </div>
                        </div>

                        {/* Associations */}
                        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 border-y border-slate-100 py-4 my-2">
                            {/* Company */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Empresa</label>
                                <SearchableSelect
                                    icon={Building2}
                                    placeholder="Selecione uma empresa..."
                                    options={companies.map(c => ({ value: c.id, label: c.nome_fantasia || c.razao_social }))}
                                    value={editingForm?.empresa}
                                    onChange={(val: any) => setEditingForm(prev => ({ ...prev!, empresa: val, unidade_id: undefined, setor: undefined }))}
                                />
                            </div>

                            {/* Unit */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Unidade</label>
                                <SearchableSelect
                                    icon={MapPin}
                                    placeholder="Selecione uma unidade..."
                                    options={units.map(u => ({ value: u.id, label: u.nome_unidade }))}
                                    value={editingForm?.unidade_id}
                                    onChange={(val: any) => setEditingForm(prev => ({ ...prev!, unidade_id: Number(val) }))}
                                    disabled={!editingForm?.empresa}
                                />
                            </div>

                            {/* Colabs Indicator */}
                            {editingForm?.empresa && (
                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                    <Users size={16} />
                                    <span>Total Colaboradores: <b>{colabsCount}</b></span>
                                    {colabsCount > 20 && <span className="text-amber-600 text-xs font-bold bg-amber-50 px-2 py-0.5 rounded ml-2">Setor Obrigatório</span>}
                                </div>
                            )}

                            {/* Sector (Conditional) */}
                            {requireSector && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Setor <span className="text-red-500">*</span></label>
                                    <select
                                        className="w-full px-4 py-2.5 bg-amber-50/50 border border-amber-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                                        value={editingForm?.setor || ''}
                                        onChange={(e) => {
                                            const sectorId = Number(e.target.value);
                                            const sector = sectors.find(s => s.id === sectorId);

                                            setEditingForm(prev => {
                                                if (!prev) return null;
                                                let newTitle = prev.title;
                                                let newSlug = prev.slug;

                                                // Append sector to title/slug
                                                if (sector) {
                                                    if (!newTitle.includes(sector.nome)) newTitle += ` - ${sector.nome}`;
                                                    const sectorSlug = sector.nome.toLowerCase().replace(/\s+/g, '-');
                                                    if (!newSlug.includes(sectorSlug)) newSlug += `-${sectorSlug}`;
                                                }

                                                return { ...prev, setor: sectorId, title: newTitle, slug: newSlug };
                                            });
                                        }}
                                    >
                                        <option value="">Selecione um setor...</option>
                                        {sectors.map(s => (
                                            <option key={s.id} value={s.id}>{s.nome}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
                                <textarea
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10"
                                    rows={3}
                                    value={editingForm?.description || ''}
                                    onChange={(e) => setEditingForm(prev => ({ ...prev!, description: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="active"
                                checked={editingForm?.active ?? true}
                                onChange={(e) => setEditingForm(prev => ({ ...prev!, active: e.target.checked }))}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <label htmlFor="active" className="text-sm font-medium text-slate-700">Formulário Ativo</label>
                        </div>
                    </div>

                    <div className="border-t border-slate-200 pt-6">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-3">
                                <h3 className="text-lg font-bold text-slate-800">Perguntas</h3>
                            </div>
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => addQuestion('short_text')}>+ Texto Curto</Button>
                                <Button size="sm" variant="outline" onClick={() => addQuestion('long_text')}>+ Texto Longo</Button>
                                <Button size="sm" variant="outline" onClick={() => addQuestion('choice')}>+ Opções</Button>
                                <Button size="sm" variant="outline" onClick={() => addQuestion('select')}>+ Lista</Button>
                                <Button size="sm" variant="outline" onClick={() => addQuestion('rating')}>+ Nota</Button>
                                <Button size="sm" variant="outline" onClick={() => addQuestion('section_break')} className="border-slate-800 text-slate-800 hover:bg-slate-100">+ Nova Seção</Button>
                            </div>
                        </div>

                        <DragDropContext onDragEnd={(result: DropResult) => {
                            if (!result.destination) return;
                            const items = Array.from(editingForm?.questions || []);
                            const [reorderedItem] = items.splice(result.source.index, 1);
                            items.splice(result.destination.index, 0, reorderedItem);
                            setEditingForm(prev => prev ? { ...prev, questions: items } : null);
                        }}>
                            <Droppable droppableId="questions-list">
                                {(provided) => (
                                    <div
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                        className="space-y-4"
                                    >
                                        {editingForm?.questions?.map((q, idx) => (
                                            <Draggable
                                                // @ts-ignore
                                                key={q.id || q.temp_id || `temp_${idx}`}
                                                draggableId={String(q.id || q.temp_id || `temp_${idx}`)}
                                                index={idx}
                                            >
                                                {(provided, snapshot) => (
                                                    <QuestionEditorItem
                                                        innerRef={provided.innerRef}
                                                        draggableProps={provided.draggableProps}
                                                        dragHandleProps={provided.dragHandleProps}
                                                        isDragging={snapshot.isDragging}
                                                        q={q}
                                                        idx={idx}
                                                        updateQuestion={updateQuestion}
                                                        removeQuestion={removeQuestion}
                                                        duplicateQuestion={duplicateQuestion}
                                                        moveQuestion={moveQuestion}
                                                        addSectionBreakAfter={addSectionBreakAfter}
                                                        isCompact={true} // Enforced Compact Mode
                                                    />
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </DragDropContext>      {(!editingForm?.questions || editingForm.questions.length === 0) && (
                            <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl text-slate-400">
                                Nenhuma pergunta adicionada.
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end pt-6 border-t border-slate-100">
                        <Button onClick={handleSaveForm}>
                            <Check size={18} />
                            Salvar Formulário
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* HSE Configuration Modal */}
            <Modal
                isOpen={hseModalOpen}
                onClose={() => setHseModalOpen(false)}
                title={`Configuração HSE - ${currentHseForm?.title}`}
                maxWidth="max-w-6xl"
            >
                <div className="h-[70vh] flex flex-col overflow-hidden">
                    {/* Toolbar */}
                    <div className="flex justify-between items-center mb-4 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                        <div className="flex items-center gap-2">
                            <Settings className="text-slate-400" size={20} />
                            <span className="font-bold text-slate-700">Dimensões e Associação</span>
                        </div>
                        <Button size="sm" onClick={handleCreateDimension}>
                            <Plus size={16} /> Nova Dimensão
                        </Button>
                    </div>

                    {loadingHse ? (
                        <div className="flex-1 flex justify-center items-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : (
                        <DragDropContext onDragEnd={(result) => {
                            if (!result.destination) return;
                            const { source, destination, draggableId } = result;
                            if (source.droppableId === destination.droppableId) return;

                            const questionId = parseInt(draggableId);
                            let newDimId: number | null = null;

                            if (destination.droppableId !== 'unassigned') {
                                newDimId = parseInt(destination.droppableId.replace('dim_', ''));
                            }

                            // Heuristic for question number: auto-assign next number if creating
                            const currentMax = hseQuestions
                                .filter(q => q.hse_dimension_id === newDimId)
                                .reduce((max, q) => Math.max(max, q.hse_question_number || 0), 0);

                            handleAssociateQuestion(questionId, newDimId, newDimId ? currentMax + 1 : undefined);
                        }}>
                            <div className="flex-1 flex gap-6 overflow-hidden">
                                {/* Left Column: Unassigned Questions */}
                                <div className="w-1/3 flex flex-col bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                                    <div className="p-3 bg-white border-b border-slate-200 font-bold text-slate-700 flex justify-between items-center">
                                        <span>Não Associadas</span>
                                        <span className="bg-slate-100 px-2 py-0.5 rounded text-xs text-slate-500">
                                            {hseQuestions.filter(q => !q.hse_dimension_id).length}
                                        </span>
                                    </div>
                                    <Droppable droppableId="unassigned">
                                        {(provided, snapshot) => (
                                            <div
                                                {...provided.droppableProps}
                                                ref={provided.innerRef}
                                                className={`flex-1 overflow-y-auto p-3 space-y-2 ${snapshot.isDraggingOver ? 'bg-blue-50/50' : ''}`}
                                            >
                                                {hseQuestions.filter(q => !q.hse_dimension_id).map((q, index) => (
                                                    // @ts-ignore
                                                    <Draggable key={q.id} draggableId={String(q.id)} index={index}>
                                                        {(provided, snapshot) => (
                                                            <div
                                                                ref={provided.innerRef}
                                                                {...provided.draggableProps}
                                                                {...provided.dragHandleProps}
                                                                className={`bg-white p-3 rounded-lg border shadow-sm text-sm hover:border-blue-300 transition-all ${snapshot.isDragging ? 'shadow-lg ring-2 ring-blue-400 rotate-1 z-50' : 'border-slate-200'}`}
                                                            >
                                                                <div className="flex gap-2">
                                                                    <span className="font-mono text-slate-400 text-xs mt-0.5">#{q.id}</span>
                                                                    <div className="flex-1">
                                                                        <p className="font-medium text-slate-700 line-clamp-2">{q.label}</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </Draggable>
                                                ))}
                                                {provided.placeholder}
                                            </div>
                                        )}
                                    </Droppable>
                                </div>

                                {/* Right Column: Dimensions */}
                                <div
                                    className="w-2/3 h-full overflow-y-auto flex flex-col gap-4 pr-1 [&::-webkit-scrollbar]:hidden"
                                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                                >
                                    {hseDimensions.length === 0 && (
                                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                                            <p>Nenhuma dimensão criada.</p>
                                            <Button variant="ghost" size="sm" onClick={handleCreateDimension}>Criar Dimensão</Button>
                                        </div>
                                    )}
                                    {hseDimensions.map(dim => {
                                        const isExpanded = expandedDimensions.has(dim.id);
                                        const dimQuestions = hseQuestions.filter(q => q.hse_dimension_id === dim.id).sort((a, b) => (a.hse_question_number || 0) - (b.hse_question_number || 0));

                                        return (
                                            <div key={dim.id} className="bg-white border border-slate-200 rounded-xl shadow-sm transition-all">
                                                {/* Dimension Header (Always Visible) */}
                                                <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center cursor-pointer hover:bg-slate-100 transition-colors"
                                                    onClick={() => toggleDimensionExpanded(dim.id)}>
                                                    <div className="flex-1 pr-4">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <span className="font-bold text-slate-700 text-lg">{dim.name}</span>
                                                            <span className="text-xs font-bold text-slate-400 bg-white border border-slate-200 px-2 py-0.5 rounded">
                                                                {dimQuestions.length} questões
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleDeleteDimension(dim.id); }}
                                                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                        {isExpanded ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                                                    </div>
                                                </div>

                                                {/* Expandable Body */}
                                                {isExpanded && (
                                                    <div className="p-4 bg-white animate-in slide-in-from-top-2 duration-200 max-h-[60vh] overflow-y-auto custom-scrollbar">
                                                        {/* Config Inputs */}
                                                        <div className="mb-4 pb-4 border-b border-slate-100 flex flex-col gap-4">
                                                            <div>
                                                                <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Nome da Dimensão</label>
                                                                <input
                                                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                                    value={dim.name}
                                                                    onChange={(e) => handleUpdateDimension(dim.id, { name: e.target.value })}
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Cálculo do Score</label>
                                                                <div className="flex gap-4">
                                                                    <label className={`flex-1 flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${!dim.is_positive ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                                                                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${!dim.is_positive ? 'border-blue-600' : 'border-slate-300'}`}>
                                                                            {!dim.is_positive && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                                                                        </div>
                                                                        <div className="flex flex-col">
                                                                            <span className={`text-sm font-bold ${!dim.is_positive ? 'text-blue-700' : 'text-slate-700'}`}>Quanto MENOR, melhor</span>
                                                                            <span className="text-xs text-slate-500">Menor valor = Menor Risco</span>
                                                                        </div>
                                                                        <input type="radio" className="hidden" checked={!dim.is_positive} onChange={() => handleUpdateDimension(dim.id, { is_positive: false })} />
                                                                    </label>

                                                                    <label className={`flex-1 flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${dim.is_positive ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                                                                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${dim.is_positive ? 'border-blue-600' : 'border-slate-300'}`}>
                                                                            {dim.is_positive && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                                                                        </div>
                                                                        <div className="flex flex-col">
                                                                            <span className={`text-sm font-bold ${dim.is_positive ? 'text-blue-700' : 'text-slate-700'}`}>Quanto MAIOR, melhor</span>
                                                                            <span className="text-xs text-slate-500">Maior valor = Melhor resultado</span>
                                                                        </div>
                                                                        <input type="radio" className="hidden" checked={dim.is_positive} onChange={() => handleUpdateDimension(dim.id, { is_positive: true })} />
                                                                    </label>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Droppable Zone */}
                                                        <Droppable droppableId={`dim_${dim.id}`}>
                                                            {(provided, snapshot) => (
                                                                <div
                                                                    {...provided.droppableProps}
                                                                    ref={provided.innerRef}
                                                                    className={`p-4 min-h-[100px] rounded-xl border-2 border-dashed transition-colors ${snapshot.isDraggingOver ? 'bg-blue-50 border-blue-300' : 'bg-slate-50 border-slate-200'}`}
                                                                >
                                                                    {dimQuestions.length === 0 && (
                                                                        <div className="text-center text-slate-400 text-sm py-8">
                                                                            <p className="font-medium">Nenhuma questão associada</p>
                                                                            <p className="text-xs mt-1">Arraste questões da lista lateral para cá</p>
                                                                        </div>
                                                                    )}
                                                                    <div className="space-y-2">
                                                                        {dimQuestions.map((q, index) => (
                                                                            // @ts-ignore
                                                                            <Draggable key={q.id} draggableId={String(q.id)} index={index}>
                                                                                {(provided, snapshot) => (
                                                                                    <div
                                                                                        ref={provided.innerRef}
                                                                                        {...provided.draggableProps}
                                                                                        {...provided.dragHandleProps}
                                                                                        className="flex items-center gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-sm group hover:border-blue-300"
                                                                                    >
                                                                                        <div className="flex flex-col items-center cursor-grab active:cursor-grabbing">
                                                                                            <GripVertical size={14} className="text-slate-300" />
                                                                                        </div>
                                                                                        <div className="flex-1">
                                                                                            <p className="text-sm font-medium text-slate-700">{q.label}</p>
                                                                                        </div>
                                                                                        <div className="flex items-center gap-2 border-l border-slate-100 pl-3">
                                                                                            <span className="text-xs text-slate-400 font-bold">Nº</span>
                                                                                            <input
                                                                                                type="number"
                                                                                                className="w-12 text-center bg-slate-50 border border-slate-200 rounded text-sm py-0.5"
                                                                                                value={q.hse_question_number || ''}
                                                                                                onChange={(e) => handleAssociateQuestion(q.id, dim.id, parseInt(e.target.value))}
                                                                                                placeholder="#"
                                                                                            />
                                                                                        </div>
                                                                                        <button
                                                                                            onClick={() => handleAssociateQuestion(q.id, null)}
                                                                                            className="p-1.5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                                            title="Remover da Dimensão"
                                                                                        >
                                                                                            <X size={14} />
                                                                                        </button>
                                                                                    </div>
                                                                                )}
                                                                            </Draggable>
                                                                        ))}
                                                                    </div>
                                                                    {provided.placeholder}
                                                                </div>
                                                            )}
                                                        </Droppable>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </DragDropContext>
                    )}
                </div>
            </Modal>
        </div>
    );
};
