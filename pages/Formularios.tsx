import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabase';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import {
    Plus, Search, FileText, BarChart2, Link as LinkIcon,
    MoreVertical, Edit2, Trash2, X, Check, Copy, ExternalLink,
    ChevronUp, ChevronDown, List, Type, MessageSquare, Star,
    User, Users, Calendar, Clock, ArrowLeft, ChevronRight, Split, Layout, Minimize2, AlignJustify, GripVertical,
    Building2, MapPin, Briefcase, Filter, Download, Play, Pause, Settings, Save, CheckCircle, AlertCircle, Send, Hash, Info, ThumbsUp, ThumbsDown, PieChart as PieChartIcon, Eye
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Form, FormQuestion, FormAnswer, HSEDimension, QuestionType, HSERule, HSEDiagnosticItem } from '../types';



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

/* --- Scroll To Top Data --- */
/* --- Scroll To Top Data --- */
const ScrollToTopButton = () => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            const reportContainer = document.getElementById('report-scroll-container');
            const containerScroll = reportContainer ? reportContainer.scrollTop : 0;
            const windowScroll = window.scrollY;

            // Check if either is scrolling. Sometimes one is 0 while other moves.
            setVisible(containerScroll > 100 || windowScroll > 100);
        };

        const reportContainer = document.getElementById('report-scroll-container');
        if (reportContainer) {
            reportContainer.addEventListener('scroll', handleScroll);
        }
        window.addEventListener('scroll', handleScroll);

        // Initial check
        handleScroll();

        return () => {
            if (reportContainer) reportContainer.removeEventListener('scroll', handleScroll);
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    const scrollToTop = () => {
        const reportContainer = document.getElementById('report-scroll-container');
        if (reportContainer) {
            reportContainer.scrollTo({ top: 0, behavior: 'smooth' });
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (!visible) return null;

    return (
        <button
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 p-2 text-slate-600 hover:text-indigo-600 hover:-translate-y-1 transition-all duration-300 z-[99999] group animate-in fade-in slide-in-from-bottom-4 cursor-pointer"
            title="Voltar ao topo"
            type="button"
        >
            <ChevronUp size={36} className="stroke-[3px] drop-shadow-sm filter" />
        </button>
    );
};

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
    const [hseRules, setHseRules] = useState<HSERule[]>([]);
    const [hseActiveTab, setHseActiveTab] = useState<'associations' | 'rules'>('associations');
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



            // Fetch Rules
            const { data: rules, error: rulesError } = await supabase
                .from('form_hse_rules')
                .select('*')
                .order('min_val', { ascending: true }); // Default ordering

            if (rulesError) throw rulesError;
            setHseRules(rules || []);

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

    const handleAssociateQuestion = (questionId: number, dimensionId: number | null, numberInDim?: number) => {
        const updates: any = { hse_dimension_id: dimensionId };
        if (numberInDim !== undefined) updates.hse_question_number = numberInDim;
        if (dimensionId === null) updates.hse_question_number = null;

        setHseQuestions(prev => prev.map(q => q.id === questionId ? { ...q, ...updates } : q));
    };

    const handleAddRule = (dimId: number) => {
        const newRule: HSERule = {
            id: -1 * (Date.now() + Math.random()), // Temp negative ID
            dimension_id: dimId,
            min_val: 0,
            max_val: 0,
            texto_personalizado: ''
        };
        setHseRules([...hseRules, newRule]);
    };

    const handleUpdateRule = (ruleId: number, field: keyof HSERule, value: any) => {
        setHseRules(prev => prev.map(r => r.id === ruleId ? { ...r, [field]: value } : r));
    };

    const handleDeleteRule = async (ruleId: number) => {
        setHseRules(prev => prev.filter(r => r.id !== ruleId));
        if (ruleId > 0) {
            setDeletedRuleIds(prev => [...prev, ruleId]);
        }
    };

    const [deletedRuleIds, setDeletedRuleIds] = useState<number[]>([]);

    const handleSaveHSEConfig = async () => {
        if (!currentHseForm) return;
        setLoadingHse(true);
        try {
            // 1. Save Associations
            const updatePromises = hseQuestions.map(q =>
                supabase
                    .from('form_questions')
                    .update({
                        hse_dimension_id: q.hse_dimension_id,
                        hse_question_number: q.hse_question_number
                    })
                    .eq('id', q.id)
            );

            // 2. Save Rules
            // Handle Deletions
            if (deletedRuleIds.length > 0) {
                await supabase.from('form_hse_rules').delete().in('id', deletedRuleIds);
            }
            // Handle Upserts (New and Updated)
            // Separate New vs Existing
            const newRules = hseRules.filter(r => r.id < 0).map(({ id, ...rest }) => rest);
            const existingRules = hseRules.filter(r => r.id > 0);

            // Handle Inserts
            if (newRules.length > 0) {
                const { error: insertError } = await supabase
                    .from('form_hse_rules')
                    .insert(newRules);
                if (insertError) throw insertError;
            }

            // Handle Updates
            if (existingRules.length > 0) {
                const rulesUpdatePromises = existingRules.map(r =>
                    supabase
                        .from('form_hse_rules')
                        .update({
                            min_val: r.min_val,
                            max_val: r.max_val,
                            texto_personalizado: r.texto_personalizado
                        })
                        .eq('id', r.id)
                );
                await Promise.all(rulesUpdatePromises);
            }

            await Promise.all(updatePromises);

            alert("Configurações salvas com sucesso!");
            setDeletedRuleIds([]);
            setHseModalOpen(false);
        } catch (err) {
            console.error("Error saving HSE config:", err);
            alert("Erro ao salvar configurações.");
        } finally {
            setLoadingHse(false);
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
    const [analyticsTab, setAnalyticsTab] = useState<'overview' | 'individual' | 'diagnostic' | 'interpretative'>('diagnostic');
    const [infoPopoverId, setInfoPopoverId] = useState<number | null>(null);
    const [selectedRespondent, setSelectedRespondent] = useState<string | null>(null); // Groups by responder_identifier + timestamp key
    const [diagnosticData, setDiagnosticData] = useState<HSEDiagnosticItem[]>([]);
    const [interpretativeText, setInterpretativeText] = useState<string>('');
    const [expandedInterpretativeDims, setExpandedInterpretativeDims] = useState<Set<number>>(new Set());

    // Overview Search State
    const [overviewSearch, setOverviewSearch] = useState('');

    // Redesign Overview State
    const [totalEmployees, setTotalEmployees] = useState<number>(0);
    const [sectorStats, setSectorStats] = useState<{ name: string; count: number }[]>([]);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [respondentMetadata, setRespondentMetadata] = useState<Record<string, { setor: string }>>({});

    // Participation Modal State
    const [isParticipationModalOpen, setIsParticipationModalOpen] = useState(false);
    const [companyUsers, setCompanyUsers] = useState<any[]>([]); // Full list for participation tracking
    const [participationTab, setParticipationTab] = useState<'responded' | 'pending'>('responded');
    const [participationSearch, setParticipationSearch] = useState('');
    const [individualModalOpen, setIndividualModalOpen] = useState(false);
    const [selectedRespondentId, setSelectedRespondentId] = useState<string | null>(null);

    // HSE Report Modal State
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);

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

        // Fetch Diagnostic Data if HSE form
        if (form.hse_id) {
            console.log('Fetching diagnostic data for HSE Form ID:', form.id);

            // Fetch Dimensions metadata (for is_positive check)
            // Fetch Dimensions metadata (for is_positive check) from form-specific config
            const { data: dims } = await supabase
                .from('form_hse_dimensions')
                .select('*');

            if (dims) setHseDimensions(dims);

            const { data: rules } = await supabase
                .from('form_hse_rules')
                .select('*');

            if (dims) {
                // Map to match HSEDimension interface expectation (id = dimension_id)
                const mappedDims = dims.map((d: any) => ({
                    ...d,
                    id: d.id, // Strictly use PK as Rules reference form_hse_dimensions(id)
                    is_positive: d.is_positive
                }));
                setHseDimensions(mappedDims);

                // Fetch Rules for these dimensions
                const dimIds = mappedDims.map((d: any) => d.id);
                if (dimIds.length > 0) {
                    const { data: rules, error: rulesError } = await supabase
                        .from('form_hse_rules')
                        .select('*')
                        .in('dimension_id', dimIds);

                    if (rulesError) console.error('Error fetching HSE rules for stats:', rulesError);
                    setHseRules(rules || []);
                } else {
                    setHseRules([]);
                }
            }

            const { data: dd, error: ddError } = await supabase
                .from('view_hse_analise_itens')
                .select('*')
                .eq('form_id', form.id);

            if (ddError) {
                console.error('Error fetching diagnostic data:', ddError);
                setDiagnosticData([]);
            } else if (dd) {
                console.log('Diagnostic Data Loaded:', dd);
                setDiagnosticData(dd as HSEDiagnosticItem[]);
            } else {
                setDiagnosticData([]);
            }

            // Fetch Interpretative Text
            const { data: textData, error: textError } = await supabase
                .from('view_hse_texto_analise')
                .select('texto_final_pronto')
                .eq('form_id', form.id)
                .single();

            if (textError) {
                console.error('Error fetching interpretative text:', textError);
                setInterpretativeText('');
            } else if (textData) {
                setInterpretativeText(textData.texto_final_pronto);
            }
        } else {
            console.log('Not an HSE form (no hse_id)');
            setDiagnosticData([]);
            setInterpretativeText('');
        }

        // Fetch Answers
        const { data: aData } = await supabase
            .from('form_answers')
            .select('*')
            .eq('form_id', form.id)
            .order('created_at', { ascending: false });

        if (aData && aData.length > 0) {
            setAnswers(aData);
            const userIds = [...new Set(aData.map((a: any) => a.respondedor).filter(Boolean))];

            if (userIds.length > 0) {
                console.log('Fetching metadata for Responders (colaboradores table):', userIds);
                const { data: usersData, error: metaError } = await supabase
                    .from('colaboradores')
                    .select('id, nome, setor, cargo, cargos(nome)')
                    .in('id', userIds);

                console.log('Metadata Users Data:', usersData, 'Error:', metaError);

                if (usersData) {
                    const meta: Record<string, { nome: string; setor: string; cargo: string }> = {};
                    usersData.forEach((u: any) => {
                        // Handle nested cargo object if join works
                        const cargoName = u.cargos?.nome || (typeof u.cargos === 'object' ? u.cargos.nome : null) || (u.cargo ? `Cargo ${u.cargo}` : '-');
                        meta[u.id] = { nome: u.nome, setor: u.setor || '-', cargo: cargoName };
                    });
                    setRespondentMetadata(meta);
                }
            }
        } else {
            setAnswers([]);
        }

        // Fetch Employee Data for Comparison
        if (form.unidade_id) {
            try {
                // 1. Get Empresa ID from Unidade
                const { data: unitData } = await supabase
                    .from('unidades')
                    .select('empresaid')
                    .eq('id', form.unidade_id)
                    .single();

                // 2. Fetch All Employees for Participation Tracking
                console.log('Fetching collaborators for Unit ID:', form.unidade_id);
                const { data: allUsers, error: usersError } = await supabase
                    .from('colaboradores')
                    .select('id, nome, setor, cargo, unidade, cargos(nome)')
                    .eq('unidade', form.unidade_id); // Filter by specific Unit
                // .eq('active', true); // 'colaboradores' might not have active column, user requested 'real amount'

                console.log('Fetched Collaborators:', allUsers?.length, 'Error:', usersError);



                if (!usersError && allUsers) {
                    setCompanyUsers(allUsers);
                    setTotalEmployees(allUsers.length);

                    // 3. If > 20, calculate Sector Breakdown from full list
                    if (allUsers.length > 20) {
                        const stats: Record<string, number> = {};
                        allUsers.forEach((u: any) => {
                            const s = u.setor || 'Não Definido';
                            stats[s] = (stats[s] || 0) + 1;
                        });
                        setSectorStats(Object.entries(stats).map(([name, count]) => ({ name, count })));
                    } else {
                        setSectorStats([]);
                    }
                } else {
                    setTotalEmployees(0);
                }
            } catch (err) {
                console.error('Error fetching stats comparisons:', err);
            }
        }

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
            setor?: string;
            cargo?: any;
            respondedorId?: string;
        }> = {};

        answers.forEach(a => {
            // Create a unique key for the submission. 
            // In a real app we'd use a submission_id. Here we assume created_at is unique per submission.
            const key = `${a.responder_identifier || 'anon'}_${a.created_at}`;
            const respondedorId = a.respondedor;

            if (!groups[key]) {
                groups[key] = {
                    id: key,
                    identifier: a.responder_identifier || 'Anônimo',
                    name: (respondedorId ? respondentMetadata[respondedorId]?.nome : undefined) || a.responder_name || 'Sem nome',
                    date: a.created_at,
                    answerCount: 0,
                    respondedorId: respondedorId,
                    setor: respondedorId ? respondentMetadata[respondedorId]?.setor : undefined,
                    cargo: respondedorId ? respondentMetadata[respondedorId]?.cargo : undefined
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

        const renderOverview = () => {
            const totalResponses = getTotalResponses();
            const responseRate = totalEmployees > 0 ? (totalResponses / totalEmployees) * 100 : 0;
            const uniqueResponders = new Set(answers.map(a => a.responder_identifier)).size;

            return (
                <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-bold text-slate-700">Visão Geral</h2>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => setIsReportModalOpen(true)} className="gap-2">
                                <FileText size={14} /> Visualizar Relatório HSE
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setIsHistoryModalOpen(true)} className="gap-2">
                                <Clock size={14} /> Histórico de Respostas
                            </Button>
                        </div>
                    </div>

                    {/* Compact Summary Cards - GRID COLS 4 to accommodate removal */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total</span>
                                <BarChart2 size={16} className="text-blue-500" />
                            </div>
                            <div>
                                <span className="text-2xl font-bold text-slate-800">{totalResponses}</span>
                                <span className="text-xs text-slate-400 ml-1">respostas</span>
                            </div>
                        </div>

                        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Perguntas</span>
                                <Check size={16} className="text-emerald-500" />
                            </div>
                            <div>
                                <span className="text-2xl font-bold text-slate-800">{questions.length}</span>
                                <span className="text-xs text-slate-400 ml-1">ativas</span>
                            </div>
                        </div>

                        {/* Comparative Metrics */}
                        {totalEmployees > 0 && (
                            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all col-span-2">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Adesão ({totalResponses}/{totalEmployees})</span>
                                    <PieChartIcon size={16} className="text-orange-500" />
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-orange-500 rounded-full transition-all duration-500"
                                            style={{ width: `${Math.min(responseRate, 100)}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-lg font-bold text-slate-700">{responseRate.toFixed(1)}%</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sector Breakdown (Conditional) */}
                    {totalEmployees > 20 && sectorStats.length > 0 && (
                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                            <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                                <Users size={16} className="text-slate-400" />
                                Adesão por Setor
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {sectorStats.map((stat, idx) => (
                                    <div key={idx} className="flex justify-between items-center p-2 bg-slate-50 rounded-lg border border-slate-100">
                                        <span className="text-xs font-medium text-slate-600 truncate mr-2" title={stat.name}>{stat.name}</span>
                                        <span className="text-xs font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">{stat.count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Detailed Analysis - STACKED BARS + INDEX SIDEBAR */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mt-4">
                            <BarChart2 className="text-slate-400" size={18} />
                            Análise por Pergunta
                        </h3>

                        <div className="flex flex-col lg:flex-row gap-12 justify-center items-start relative">
                            {/* LEFT COLUMN: Questions List (Centered, constrained width) */}
                            <div className="flex-1 max-w-2xl space-y-6">
                                {questions.map((q, idx) => {
                                    // Find Dimension info if available
                                    const diagItem = diagnosticData.find(d => d.texto_pergunta === q.label);
                                    const dimName = diagItem?.dimensao;
                                    const dimObj = hseDimensions.find(d => d.name?.toLowerCase().trim() === dimName?.toLowerCase().trim());
                                    const isPositive = dimObj ? dimObj.is_positive : true; // Default to true if not found

                                    // Calculate Buckets for Rating 0-4
                                    // Assumption: answer_value is numeric 0-4 or 1-5. User mentioned "Option 0".
                                    // We will map numeric values to indices 0,1,2,3,4.
                                    const qAnswers = answers.filter(a => a.question_id === q.id);
                                    const totalQ = qAnswers.length || 1;
                                    const buckets = [0, 0, 0, 0, 0];

                                    qAnswers.forEach(a => {
                                        let idx = -1;
                                        const answerVal = a.answer_number !== undefined && a.answer_number !== null ? a.answer_number : a.answer_text;
                                        const val = Number(answerVal);

                                        // 1. Try Numeric Direct Match (0-4)
                                        if (!isNaN(val) && val >= 0 && val <= 4) {
                                            idx = val;
                                        }
                                        // 2. Try matching Text to Options (Question fields option_1..option_5)
                                        // 2. Try matching Text to Options or Standard Likert
                                        else {
                                            const cleanVal = String(answerVal || '').trim().toLowerCase();
                                            const opt1 = q.option_1?.trim().toLowerCase();
                                            const opt2 = q.option_2?.trim().toLowerCase();
                                            const opt3 = q.option_3?.trim().toLowerCase();
                                            const opt4 = q.option_4?.trim().toLowerCase();
                                            const opt5 = q.option_5?.trim().toLowerCase();

                                            if (opt1 && cleanVal === opt1) idx = 0;
                                            else if (opt2 && cleanVal === opt2) idx = 1;
                                            else if (opt3 && cleanVal === opt3) idx = 2;
                                            else if (opt4 && cleanVal === opt4) idx = 3;
                                            else if (opt5 && cleanVal === opt5) idx = 4;

                                            // Standard Fallback (Portuguese)
                                            else if (cleanVal === 'nunca') idx = 0;
                                            else if (cleanVal === 'raramente') idx = 1;
                                            else if (cleanVal === 'às vezes' || cleanVal === 'as vezes') idx = 2;
                                            else if (cleanVal === 'frequentemente') idx = 3;
                                            else if (cleanVal === 'sempre') idx = 4;

                                            console.log(`[DEBUG] Q: ${q.id} Val: "${answerVal}" -> Idx: ${idx}`);
                                        }

                                        if (idx !== -1) {
                                            buckets[idx]++;
                                        }
                                    });

                                    // Define Colors based on isPositive
                                    // Positive (High Score = Good): 0 (Bad/Red) -> 4 (Good/Green)
                                    const colorsPositive = ['#EF4444', '#F97316', '#EAB308', '#34D399', '#10B981'];
                                    // Negative (High Score = Bad): 0 (Good/Green) -> 4 (Bad/Red)
                                    const colorsNegative = ['#10B981', '#34D399', '#EAB308', '#F97316', '#EF4444'];
                                    const activeColors = isPositive ? colorsPositive : colorsNegative;
                                    const labels = ['Nunca', 'Raramente', 'Às vezes', 'Frequentemente', 'Sempre'];

                                    const avg = Number(getAverageRating(q.id));

                                    // Risk Label Logic
                                    let riskLabel = '';
                                    let riskColorClass = '';

                                    // Try finding rule from DB first
                                    const rule = hseRules.find(r => r.dimension_id === dimObj?.id && avg >= r.min_val && avg <= r.max_val);
                                    if (rule) {
                                        riskLabel = rule.texto_personalizado;
                                        // Determine color based on matching one of 4 buckets if name matches, or generic logic
                                        // Fallback text coloring based on score if we can't infer from text
                                    } else {
                                        // Fallback to static 4 levels if no rule found
                                        // User requested: baixo, médio, moderado, alto
                                        // 0-1, 1-2, 2-3, 3-4
                                        if (isPositive) {
                                            // Positive: High Avg = Low Risk
                                            if (avg >= 3) riskLabel = 'Baixo';
                                            else if (avg >= 2) riskLabel = 'Médio';
                                            else if (avg >= 1) riskLabel = 'Moderado';
                                            else riskLabel = 'Alto';
                                        } else {
                                            // Negative: Low Avg = Low Risk
                                            if (avg <= 1) riskLabel = 'Baixo';
                                            else if (avg <= 2) riskLabel = 'Médio';
                                            else if (avg <= 3) riskLabel = 'Moderado';
                                            else riskLabel = 'Alto';
                                        }
                                    }

                                    // Color Styling for Label (Independent of text, based on score severity)
                                    if (isPositive) {
                                        if (avg <= 1.0) riskColorClass = 'text-red-600 bg-red-50 border-red-100'; // Bad
                                        else if (avg <= 2.0) riskColorClass = 'text-orange-600 bg-orange-50 border-orange-100';
                                        else if (avg <= 3.0) riskColorClass = 'text-amber-600 bg-amber-50 border-amber-100';
                                        else riskColorClass = 'text-emerald-600 bg-emerald-50 border-emerald-100'; // Good
                                    } else {
                                        if (avg >= 3.0) riskColorClass = 'text-red-600 bg-red-50 border-red-100'; // Bad
                                        else if (avg >= 2.0) riskColorClass = 'text-orange-600 bg-orange-50 border-orange-100';
                                        else if (avg >= 1.0) riskColorClass = 'text-amber-600 bg-amber-50 border-amber-100';
                                        else riskColorClass = 'text-emerald-600 bg-emerald-50 border-emerald-100'; // Good
                                    }

                                    return (
                                        <Card
                                            key={q.id}
                                            id={`question-${q.id}`}
                                            className="p-5 overflow-hidden hover:shadow-md transition-shadow scroll-mt-24"
                                        >
                                            {/* Header */}
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex-1 pr-4">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h4 className="font-normal text-slate-700 text-sm leading-snug break-words">
                                                            <span className="font-bold mr-1 text-slate-400">#{idx + 1}</span>
                                                            {q.label}
                                                        </h4>
                                                        {dimName && (
                                                            <span className="shrink-0 text-[9px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 uppercase tracking-tight">
                                                                {dimName}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="shrink-0 text-right">
                                                    {(q.question_type === 'rating' || q.question_type === 'choice' || q.question_type === 'select') && (
                                                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold border ${riskColorClass}`}>
                                                            Média {avg.toFixed(1)} <span className="opacity-75 font-normal">({riskLabel})</span>
                                                        </span>
                                                    )}
                                                    <span className="block text-[10px] text-slate-400 mt-0.5 text-right">{qAnswers.length} resp.</span>
                                                </div>
                                            </div>

                                            {/* Visual - Stacked Bar (For Rating, Choice, Select) */}
                                            {(q.question_type === 'rating' || q.question_type === 'choice' || q.question_type === 'select') ? (
                                                <div className="w-full h-3 rounded-md overflow-hidden flex bg-slate-100">
                                                    {buckets.map((count, idx) => {
                                                        const perc = (count / totalQ) * 100;
                                                        if (perc === 0) return null;
                                                        return (
                                                            <div
                                                                key={idx}
                                                                className="h-full transition-all duration-500 relative group"
                                                                style={{ width: `${perc}%`, backgroundColor: activeColors[idx] }}
                                                                title={`Opção ${idx} (${labels[idx]}): ${count} votos (${Math.round(perc)}%)`}
                                                            >
                                                                {/* Tooltip via Group Hover - Custom if title isn't enough */}
                                                                {/* Browser native 'title' is requested, but we can enhance if needed. User asked for 'Tooltip simples'. Title is simplest. */}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                // Fallback for non-rating questions (Text/Choice) -> Keep compact or simplify
                                                <div className="text-xs text-slate-500 italic bg-slate-50 p-2 rounded">
                                                    Visualização disponível apenas para perguntas de escala.
                                                    {/* Could keep previous logic for Choice/Text but keeping it minimal for now as requested "Compact" */}
                                                </div>
                                            )}

                                        </Card>
                                    )
                                })}
                            </div>

                            {/* RIGHT COLUMN: Quick Index (Fixed width) */}
                            <div className="hidden lg:block w-72 shrink-0 sticky top-4 h-fit">
                                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 max-h-[calc(100vh-120px)] overflow-y-auto">
                                    <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2 sticky top-0 bg-white pb-2 border-b border-slate-100 z-10">
                                        <List size={16} className="text-blue-500" />
                                        Índice Rápido
                                    </h4>
                                    <ul className="space-y-1">
                                        {questions.map((q, idx) => (
                                            <li key={q.id}>
                                                <button
                                                    onClick={() => {
                                                        const el = document.getElementById(`question-${q.id}`);
                                                        if (el) {
                                                            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                            // Optional: Highlight effect
                                                            el.classList.add('ring-2', 'ring-blue-400');
                                                            setTimeout(() => el.classList.remove('ring-2', 'ring-blue-400'), 2000);
                                                        }
                                                    }}
                                                    className="w-full text-left p-2 rounded-lg text-xs text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-all flex gap-2 group"
                                                >
                                                    <span className="font-bold text-slate-300 group-hover:text-blue-400 w-5">#{idx + 1}</span>
                                                    <span className="truncate flex-1">{q.label}</span>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>


                        </div>
                    </div>

                    {/* History Modal */}
                    {isHistoryModalOpen && (
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[99999] p-4">
                            <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
                                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                        <Clock size={24} className="text-blue-600" />
                                        Histórico de Respostas
                                    </h3>
                                    <button onClick={() => setIsHistoryModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                        <X size={20} className="text-slate-400" />
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto p-0">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-slate-50 text-slate-500 font-medium sticky top-0 z-10">
                                            <tr>
                                                <th className="px-6 py-3">Data</th>
                                                <th className="px-6 py-3">ID Resposta</th>
                                                <th className="px-6 py-3 text-right">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {Array.from(new Set(answers.map(a => a.responder_identifier))).map((respondentId, idx) => {
                                                const respondentAnswers = answers.filter(a => a.responder_identifier === respondentId);
                                                const firstAnswer = respondentAnswers[0];
                                                if (!firstAnswer) return null;

                                                return (
                                                    <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                                                        <td className="px-6 py-4 text-slate-600">
                                                            {new Date(firstAnswer.created_at).toLocaleDateString()} <span className="text-slate-400 text-xs ml-1">{new Date(firstAnswer.created_at).toLocaleTimeString()}</span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded text-slate-500">
                                                                {(respondentId as string).split('_')[1]?.slice(-6) || '...'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => {
                                                                    setIsHistoryModalOpen(false);
                                                                    setAnalyticsTab('individual');
                                                                    setSelectedRespondent(respondentId);
                                                                }}
                                                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                                                            >
                                                                Ver Detalhes
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            );
        };

        const renderIndividual = () => {
            const respondents = getRespondents();

            // Filter Respondents by Search
            const filteredRespondents = respondents.filter(r =>
                r.name.toLowerCase().includes(overviewSearch.toLowerCase()) ||
                r.identifier.toLowerCase().includes(overviewSearch.toLowerCase())
            );

            const totalRespondents = respondents.length; // Keep total based on ALL, or filtered? Usually total is all, table is filtered.
            // Let's keep metrics based on ALL data for accurate KPIs 
            const totalQuestions = questions.length;

            const avgTime = 'N/A'; // Need duration data

            // Calculate Avg Time if possible (mocked for now as data isn't clear)
            // If we have started_at we could calc. For now assume N/A or derive from something else.

            // Check sector condition
            const showSector = totalEmployees > 20;

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
                            <Button variant="outline" onClick={() => {
                                setSelectedRespondent(null);
                                setAnalyticsTab('overview');
                            }} className="px-3 gap-2">
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

            return (
                <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="flex justify-between items-center">
                        <div />
                        <Button variant="outline" size="sm" onClick={() => setIsReportModalOpen(true)} className="gap-2 text-xs">
                            <FileText size={14} /> Visualizar Relatório HSE
                        </Button>
                    </div>

                    {/* KPIs */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div
                            onClick={() => setIsParticipationModalOpen(true)}
                            className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm cursor-pointer hover:border-blue-300 hover:shadow-md transition-all group"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-sm text-slate-500 font-medium group-hover:text-blue-600 transition-colors">Participação</p>
                                    <h4 className="text-2xl font-bold text-slate-800 mt-1">
                                        {totalRespondents}
                                        <span className="text-sm font-normal text-slate-400 ml-1">/ {totalEmployees || '?'}</span>
                                    </h4>
                                </div>
                                <div className="p-2 bg-blue-50 rounded-lg text-blue-600 group-hover:bg-blue-100 transition-colors">
                                    <Users size={20} />
                                </div>
                            </div>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-blue-500 rounded-full"
                                    style={{ width: `${totalEmployees > 0 ? (totalRespondents / totalEmployees) * 100 : 0}%` }}
                                ></div>
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-sm text-slate-500 font-medium">Total de Perguntas</p>
                                    <h4 className="text-2xl font-bold text-slate-800 mt-1">{totalQuestions}</h4>
                                </div>
                                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                                    <List size={20} />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-sm text-slate-500 font-medium">Tempo Médio</p>
                                    <h4 className="text-2xl font-bold text-slate-800 mt-1">-- min</h4>
                                </div>
                                <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                                    <Clock size={20} />
                                </div>
                            </div>
                            <p className="text-xs text-slate-400 mt-2">Estimativa baseada em conclusões</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Respostas Recentes (2/3 Width) */}
                        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                                <h4 className="font-bold text-slate-700">Respostas Recentes</h4>
                                <div className="relative w-full sm:w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Buscar colaborador..."
                                        value={overviewSearch}
                                        onChange={(e) => setOverviewSearch(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                                    />
                                </div>
                            </div>
                            {filteredRespondents.length === 0 ? (
                                <div className="p-12 text-center text-slate-400">
                                    <Users size={48} className="mx-auto mb-4 opacity-20" />
                                    <p>Nenhuma resposta encontrada.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-slate-50 text-slate-500 font-medium">
                                            <tr>
                                                <th className="px-6 py-3">Participante</th>
                                                {showSector && <th className="px-6 py-3">Setor</th>}
                                                <th className="px-6 py-3">Data Envio</th>
                                                <th className="px-6 py-3 text-right">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {filteredRespondents.map((r, idx) => (
                                                <tr key={idx} className="group hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-4 font-medium text-slate-800">
                                                        <div>
                                                            {r.name}
                                                            <span className="block text-xs text-slate-400 font-mono mt-0.5">{r.identifier}</span>
                                                        </div>
                                                    </td>
                                                    {showSector && (
                                                        <td className="px-6 py-4 text-slate-600">
                                                            {r.setor || '-'}
                                                        </td>
                                                    )}
                                                    <td className="px-6 py-4 text-slate-500">
                                                        {new Date(r.date).toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => {
                                                                setAnalyticsTab('individual');
                                                                setSelectedRespondent(r.id);
                                                            }}
                                                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            Ver Detalhes
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Sector Breakdown Sidebar (1/3 Width) */}
                        <div className="lg:col-span-1 space-y-6">
                            {totalEmployees > 20 && sectorStats.length > 0 ? (
                                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                    <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                                        <Users size={16} className="text-slate-400" />
                                        Adesão por Setor
                                    </h4>
                                    <div className="space-y-3">
                                        {sectorStats.map((stat, idx) => (
                                            <div key={idx} className="flex justify-between items-center p-2 bg-slate-50 rounded-lg border border-slate-100">
                                                <span className="text-xs font-medium text-slate-600 truncate mr-2" title={stat.name}>{stat.name}</span>
                                                <span className="text-xs font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">{stat.count}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 border-dashed text-center">
                                    <p className="text-sm text-slate-400">Sem dados de setor suficientes.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* HSE Report Modal */}
                    <Modal
                        isOpen={isReportModalOpen}
                        onClose={() => setIsReportModalOpen(false)}
                        title="Relatório de Avaliação Psicossocial (HSE-IT)"
                        className="max-w-4xl"
                    >
                        <div className="bg-white p-8 rounded shadow-sm border border-slate-100 font-sans text-slate-800 leading-relaxed print:shadow-none print:border-none">
                            {/* Header */}
                            <div className="border-b border-blue-500 pb-4 mb-8">
                                <h1 className="text-2xl font-bold text-slate-900 mb-2">Laudo de Levantamento dos Riscos Psicossociais</h1>
                                <p className="text-sm italic text-slate-600">Ferramenta: Health and Safety Executive Indicator Tool (HSE-IT)</p>
                            </div>

                            {/* 1. Introdução */}
                            <div className="mb-8">
                                <h2 className="text-lg font-bold text-blue-800 mb-3">1. Introdução</h2>
                                <p className="mb-4 text-justify">
                                    Este laudo apresenta os resultados da avaliação psicossocial realizada com base no questionário HSE Indicator Tool (HSE-IT), que contempla 35 itens distribuídos em 7 dimensões: Demandas, Controle, Apoio da Chefia, Apoio dos Colegas, Relacionamentos, Cargo e Comunicação/Mudanças.
                                </p>
                                <p className="text-justify">
                                    O objetivo é identificar os principais fatores de risco psicossocial que podem impactar o bem-estar, a saúde mental e a produtividade dos colaboradores, classificando os resultados em baixo, médio, moderado ou alto risco, de acordo com os parâmetros estabelecidos.
                                </p>
                            </div>

                            {/* 2. Metodologia */}
                            <div className="mb-8">
                                <h2 className="text-lg font-bold text-blue-800 mb-3">2. Metodologia</h2>

                                <div className="mb-6">
                                    <p className="font-bold mb-2">Escala de respostas utilizada:</p>
                                    <ul className="list-none space-y-1 pl-0">
                                        <li>- (0) Nunca</li>
                                        <li>- (1) Raramente</li>
                                        <li>- (2) Às vezes</li>
                                        <li>- (3) Frequentemente</li>
                                        <li>- (4) Sempre</li>
                                    </ul>
                                </div>

                                <div className="mb-6">
                                    <p className="font-bold mb-2">Critério de análise:</p>
                                    <ul className="list-none space-y-1 pl-0">
                                        <li>- Dimensões Demandas e Relacionamentos → médias mais altas indicam maior risco.</li>
                                        <li>- Demais dimensões (Controle, Apoio, Cargo, Comunicação/Mudanças) → médias mais baixas indicam maior risco.</li>
                                    </ul>
                                </div>

                                <div>
                                    <p className="font-bold mb-2">Classificação por média:</p>
                                    <ul className="list-none space-y-1 pl-0 font-medium">
                                        <li className="flex items-center gap-2">
                                            - 0 a 1: <span className="bg-emerald-400 text-black px-1">baixo</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            - &gt;1 a 2: <span className="bg-cyan-400 text-black px-1">médio</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            - &gt;2 a 3: <span className="bg-yellow-300 text-black px-1">moderado</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            - &gt;3 a 4: <span className="bg-red-600 text-white px-1">alto</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            {/* 3. Resultados por Item (diagnóstico detalhado) */}
                            <div className="mb-8">
                                <h2 className="text-lg font-bold text-blue-800 mb-3">3. Resultados por Item (diagnóstico detalhado)</h2>
                                <div className="space-y-6">
                                    {Object.entries(diagnosticData.reduce((acc, item) => {
                                        const dimId = item.dimensao_id;
                                        if (!acc[dimId]) acc[dimId] = [];
                                        acc[dimId].push(item);
                                        return acc;
                                    }, {} as Record<number, HSEDiagnosticItem[]>)).map(([dimId, items]) => {
                                        const typedItems = items as HSEDiagnosticItem[];
                                        const firstItem = typedItems[0];
                                        const dimName = firstItem.dimensao;
                                        const dimMeta = hseDimensions.find(d => d.id === Number(dimId));
                                        const isPositive = dimMeta ? dimMeta.is_positive : false;

                                        return (
                                            <div key={dimId} className="break-inside-avoid">
                                                <h3 className="font-bold text-slate-800 mb-2 border-b border-slate-200 pb-1">
                                                    Dimensão {dimName} <span className="text-sm font-normal text-slate-500">({isPositive ? 'quanto maior, melhor' : 'quanto menor, melhor'})</span>
                                                </h3>
                                                <ul className="list-none space-y-1 pl-0 text-sm">
                                                    {typedItems.map((item, idx) => {
                                                        const qIndex = questions.findIndex(q => q.label === item.texto_pergunta);
                                                        const qNum = qIndex !== -1 ? String(qIndex + 1).padStart(2, '0') : '??';

                                                        return (
                                                            <li key={idx} className="text-slate-700">
                                                                <span className="font-mono text-slate-500 mr-1">{qNum}.</span>
                                                                {item.texto_pergunta}: <span className="font-medium">{item.texto_risco_completo || 'N/A'}</span> <span className="text-slate-500">({Number(item.media_valor).toFixed(2)})</span>
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* 4. Resultados por Dimensão (diagnóstico consolidado) */}
                            <div className="mb-8">
                                <h2 className="text-lg font-bold text-blue-800 mb-3">4. Resultados por Dimensão (diagnóstico consolidado)</h2>
                                <table className="w-full text-sm border-collapse border border-slate-300">
                                    <thead>
                                        <tr className="bg-slate-100">
                                            <th className="border border-slate-300 p-2 text-left font-bold text-slate-700">Dimensão</th>
                                            <th className="border border-slate-300 p-2 text-left font-bold text-slate-700">Resultado</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.entries(diagnosticData.reduce((acc, item) => {
                                            const dimId = item.dimensao_id;
                                            if (!acc[dimId]) acc[dimId] = [];
                                            acc[dimId].push(item);
                                            return acc;
                                        }, {} as Record<number, HSEDiagnosticItem[]>)).map(([dimId, items]) => {
                                            const typedItems = items as HSEDiagnosticItem[];
                                            const firstItem = typedItems[0];
                                            const dimName = firstItem.dimensao;
                                            const dimMeta = hseDimensions.find(d => d.id === Number(dimId));
                                            const isPositive = dimMeta ? dimMeta.is_positive : false;
                                            const dimAverage = typedItems.reduce((sum, i) => sum + (Number(i.media_valor) || 0), 0) / typedItems.length;

                                            // Replicated Risk Logic for PDF Report
                                            let riskLabel = '';
                                            if (isPositive) {
                                                // INVERTED: Higher score = Lower Risk
                                                if (dimAverage >= 3) riskLabel = 'baixo risco de exposição';
                                                else if (dimAverage >= 2) riskLabel = 'médio risco de exposição';
                                                else if (dimAverage >= 1) riskLabel = 'moderado risco de exposição';
                                                else riskLabel = 'alto risco de exposição';
                                            } else {
                                                // STANDARD: Lower score = Lower Risk
                                                if (dimAverage <= 1) riskLabel = 'baixo risco de exposição';
                                                else if (dimAverage <= 2) riskLabel = 'médio risco de exposição';
                                                else if (dimAverage <= 3) riskLabel = 'moderado risco de exposição';
                                                else riskLabel = 'alto risco de exposição';
                                            }

                                            return (
                                                <tr key={dimId}>
                                                    <td className="border border-slate-300 p-2 text-slate-700 font-medium">{dimName}</td>
                                                    <td className="border border-slate-300 p-2 text-slate-700">
                                                        {riskLabel} ({dimAverage.toFixed(2)})
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* 5. Análise Interpretativa */}
                            <div className="mb-8">
                                <h2 className="text-lg font-bold text-blue-800 mb-2">5. Análise Interpretativa</h2>
                                <div className="text-slate-800 text-sm leading-relaxed text-justify">
                                    {interpretativeText ? (
                                        interpretativeText.split('\n').map((line, idx) => {
                                            // Strip HTML bold tags if present
                                            const cleanText = line.replace(/<\/?b>/gi, '').trim();
                                            if (!cleanText) return <br key={idx} />;

                                            // Bold headers logic (case insensitive check for safety)
                                            const lowerText = cleanText.toLowerCase();
                                            if (
                                                lowerText.startsWith('pontos fortes:') ||
                                                lowerText.startsWith('pontos de melhoria:') ||
                                                lowerText.startsWith('pontos de atenção:') ||
                                                cleanText.endsWith(':')
                                            ) {
                                                return <p key={idx} className="font-bold text-slate-900 mt-3 mb-1">{cleanText}</p>;
                                            }

                                            return <p key={idx} className="mb-1">{cleanText}</p>;
                                        })
                                    ) : (
                                        <p className="text-slate-400 italic">Nenhuma análise gerada ou disponível ainda.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Modal>

                    {/* Participation Modal */}
                    <Modal
                        isOpen={isParticipationModalOpen}
                        onClose={() => {
                            setIsParticipationModalOpen(false);
                            setParticipationSearch('');
                        }}
                        title="Detalhes de Participação"
                    >
                        <div className="space-y-6">
                            {/* Summary Cards acting as Tabs */}
                            <div className="grid grid-cols-2 gap-4">
                                <div
                                    onClick={() => setParticipationTab('responded')}
                                    className={`p-4 rounded-xl border cursor-pointer transition-all ${participationTab === 'responded'
                                        ? 'bg-emerald-50 border-emerald-200 ring-2 ring-emerald-500/20'
                                        : 'bg-white border-slate-200 hover:border-emerald-200 hover:bg-emerald-50/50'
                                        }`}
                                >
                                    <span className="text-emerald-600 font-medium text-sm">Participantes</span>
                                    <p className="text-2xl font-bold text-emerald-700">{totalRespondents}</p>
                                </div>
                                <div
                                    onClick={() => setParticipationTab('pending')}
                                    className={`p-4 rounded-xl border cursor-pointer transition-all ${participationTab === 'pending'
                                        ? 'bg-amber-50 border-amber-200 ring-2 ring-amber-500/20'
                                        : 'bg-white border-slate-200 hover:border-amber-200 hover:bg-amber-50/50'
                                        }`}
                                >
                                    <span className="text-amber-600 font-medium text-sm">Pendentes</span>
                                    <p className="text-2xl font-bold text-amber-700">{Math.max(0, totalEmployees - totalRespondents)}</p>
                                </div>
                            </div>

                            {/* Search and Tab Navigation */}
                            <div className="flex flex-col gap-4">
                                <div className="flex bg-slate-100 p-1 rounded-lg">
                                    <button
                                        onClick={() => setParticipationTab('responded')}
                                        className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${participationTab === 'responded'
                                            ? 'bg-white text-emerald-700 shadow-sm'
                                            : 'text-slate-500 hover:text-slate-700'
                                            }`}
                                    >
                                        Participantes
                                    </button>
                                    <button
                                        onClick={() => setParticipationTab('pending')}
                                        className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${participationTab === 'pending'
                                            ? 'bg-white text-amber-700 shadow-sm'
                                            : 'text-slate-500 hover:text-slate-700'
                                            }`}
                                    >
                                        Pendentes
                                    </button>
                                </div>

                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        type="text"
                                        placeholder={`Buscar em ${participationTab === 'responded' ? 'participantes' : 'pendentes'}...`}
                                        value={participationSearch}
                                        onChange={(e) => setParticipationSearch(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                                    />
                                </div>
                            </div>

                            {/* Conditional List Content */}
                            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden min-h-[300px] max-h-[400px] overflow-y-auto">
                                {participationTab === 'pending' ? (
                                    /* Pending List */
                                    (() => {
                                        const pendingUsers = companyUsers
                                            .filter(u => !respondents.some(r => r.respondedorId === u.id))
                                            .filter(u => (u.nome || '').toLowerCase().includes(participationSearch.toLowerCase()));

                                        if (pendingUsers.length === 0) {
                                            return (
                                                <div className="p-12 text-center text-slate-400">
                                                    <p>{participationSearch ? 'Nenhum colaborador encontrado.' : 'Todos os colaboradores já responderam! 🎉'}</p>
                                                </div>
                                            );
                                        }

                                        return (
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-slate-50 text-slate-500 sticky top-0 font-medium">
                                                    <tr>
                                                        <th className="px-4 py-3">Colaborador</th>
                                                        <th className="px-4 py-3">Setor</th>
                                                        <th className="px-4 py-3">Cargo</th>
                                                        <th className="px-4 py-3">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {pendingUsers.map((u, i) => (
                                                        <tr key={i} className="hover:bg-slate-50">
                                                            <td className="px-4 py-3 font-medium text-slate-700">{u.nome || 'Sem Nome'}</td>
                                                            <td className="px-4 py-3 text-slate-500">{u.setor || '-'}</td>
                                                            <td className="px-4 py-3 text-slate-500">
                                                                {/* @ts-ignore */}
                                                                {u.cargos?.nome || (u.cargo ? `Cargo ${u.cargo}` : '-')}
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <span className="text-xs text-slate-400 italic">Pendente</span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        );
                                    })()
                                ) : (
                                    /* Responded List */
                                    (() => {
                                        const respondedUsers = respondents
                                            .filter(r =>
                                                r.name.toLowerCase().includes(participationSearch.toLowerCase()) ||
                                                r.identifier.toLowerCase().includes(participationSearch.toLowerCase())
                                            );

                                        if (respondedUsers.length === 0) {
                                            return (
                                                <div className="p-12 text-center text-slate-400">
                                                    <p>{participationSearch ? 'Nenhum participante encontrado.' : 'Nenhuma resposta ainda.'}</p>
                                                </div>
                                            );
                                        }

                                        return (
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-slate-50 text-slate-500 sticky top-0 font-medium">
                                                    <tr>
                                                        <th className="px-4 py-3">Colaborador</th>
                                                        <th className="px-4 py-3">Setor</th>
                                                        <th className="px-4 py-3">Cargo</th>
                                                        <th className="px-4 py-3">Data</th>
                                                        <th className="px-4 py-3">Ações</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {respondedUsers.map((r, i) => (
                                                        <tr key={i} className="hover:bg-slate-50">
                                                            <td className="px-4 py-3 font-medium text-slate-700">{r.name}</td>
                                                            <td className="px-4 py-3 text-slate-500">{r.setor || '-'}</td>
                                                            <td className="px-4 py-3 text-slate-500">{r.cargo ? 'Cargo ' + r.cargo : '-'}</td>
                                                            <td className="px-4 py-3 text-slate-500 text-xs">{new Date(r.date).toLocaleDateString()}</td>
                                                            <td className="px-4 py-3">
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedRespondentId(r.respondedorId);
                                                                        setIndividualModalOpen(true);
                                                                    }}
                                                                    className="text-xs flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium border border-blue-200"
                                                                >
                                                                    <Eye size={14} />
                                                                    Ver detalhes
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        );
                                    })()
                                )}
                            </div>
                        </div>

                        {/* Individual Response Modal */}
                        {individualModalOpen && selectedRespondentId && (
                            <Modal
                                isOpen={individualModalOpen}
                                onClose={() => {
                                    setIndividualModalOpen(false);
                                    setSelectedRespondentId(null);
                                }}
                                title="Respostas do Colaborador"
                            >
                                <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
                                    <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100 mb-6">
                                        <div className="bg-white p-2 rounded-full shadow-sm">
                                            <User className="text-slate-500" size={24} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800 text-lg">
                                                {respondents.find(r => r.respondedorId === selectedRespondentId)?.name || 'Colaborador desconhecido'}
                                            </p>
                                            <p className="text-slate-500 text-sm">
                                                {respondents.find(r => r.respondedorId === selectedRespondentId)?.setor || 'Sem setor'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        {questions.map((q, qIndex) => {
                                            const answer = answers.find(a =>
                                                a.question_id === q.id &&
                                                a.respondedor === selectedRespondentId
                                            );
                                            const dimensionName = hseDimensions.find(d => d.id === q.hse_dimension_id)?.name;

                                            // Skip conditional questions that weren't shown/answered.
                                            if (!answer) return null;

                                            return (
                                                <div key={qIndex} className="p-5 bg-white border border-slate-100 rounded-xl shadow-sm hover:border-blue-100 transition-all">
                                                    <div className="flex justify-between items-start gap-4 mb-3">
                                                        <div className="flex gap-3">
                                                            <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-slate-100 text-slate-600 font-bold rounded-lg text-sm">
                                                                {qIndex + 1}
                                                            </div>
                                                            <p className="font-medium text-slate-800 pt-1 leading-relaxed">
                                                                {q.label}
                                                            </p>
                                                        </div>
                                                        {dimensionName && (
                                                            <span className="flex-shrink-0 inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100">
                                                                {dimensionName}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="pl-11">
                                                        {q.type === 'scale' || q.type === 'nps' ? (
                                                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg font-bold border border-blue-100">
                                                                <span className="text-xs font-normal text-blue-500 uppercase tracking-wider">Resposta:</span>
                                                                {answer.answer_value}
                                                            </div>
                                                        ) : (
                                                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-slate-700">
                                                                {answer.answer_text || answer.answer_value || '-'}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {questions.length === 0 && (
                                            <p className="text-center text-slate-400 py-8">Nenhuma pergunta encontrada.</p>
                                        )}
                                        {answers.filter(a => a.respondedor === selectedRespondentId).length === 0 && questions.length > 0 && (
                                            <p className="text-center text-slate-400 py-8">Nenhuma resposta encontrada para este colaborador.</p>
                                        )}
                                    </div>
                                </div>
                            </Modal>
                        )}
                    </Modal>
                </div>
            );
        };

        // RENDER DIAGNOSTIC
        const renderDiagnostic = () => {
            console.log('Rendering Diagnostic Tab. Data length:', diagnosticData?.length);
            if (!Array.isArray(diagnosticData)) return null;

            // Group by Dimensions (using dimensao_id)
            const grouped = diagnosticData.reduce((acc, item) => {
                const dimId = item.dimensao_id;
                if (!acc[dimId]) acc[dimId] = [];
                acc[dimId].push(item);
                return acc;
            }, {} as Record<number, HSEDiagnosticItem[]>);

            if (diagnosticData.length === 0) {
                return (
                    <div className="p-12 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                        <p className="font-medium text-lg">Sem dados de diagnóstico</p>
                        <p className="text-sm">Verifique se o formulário é HSE e se há respostas.</p>
                    </div>
                );
            }

            return (
                <div className="animate-in fade-in duration-300">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
                        {/* Sidebar Index */}
                        {/* Main Content */}
                        <div className="lg:col-span-3 space-y-6 order-first">
                            {Object.entries(grouped).map(([dimId, items]) => {
                                const typedItems = items as HSEDiagnosticItem[];
                                const firstItem = typedItems[0];
                                const dimName = firstItem.dimensao;

                                // Find dimension metadata for is_positive logic
                                const dimMeta = hseDimensions.find(d => d.id === Number(dimId));
                                const isPositive = dimMeta?.is_positive;

                                // Calculate Dimension Average
                                const dimAverage = typedItems.reduce((sum, i) => sum + (Number(i.media_valor) || 0), 0) / typedItems.length;

                                const getRiskAnalysis = (score: number, isPos: boolean | undefined) => {
                                    if (isPos) {
                                        // INVERTED: Higher score = Lower Risk
                                        if (score >= 3) return { label: 'baixo', color: 'text-green-700 bg-green-50 border-green-200' };
                                        if (score >= 2) return { label: 'médio', color: 'text-cyan-700 bg-cyan-50 border-cyan-200' };
                                        if (score >= 1) return { label: 'moderado', color: 'text-amber-700 bg-amber-50 border-amber-200' };
                                        return { label: 'alto', color: 'text-red-700 bg-red-50 border-red-200' };
                                    } else {
                                        // STANDARD: Lower score = Lower Risk
                                        if (score <= 1) return { label: 'baixo', color: 'text-green-700 bg-green-50 border-green-200' };
                                        if (score <= 2) return { label: 'médio', color: 'text-cyan-700 bg-cyan-50 border-cyan-200' };
                                        if (score <= 3) return { label: 'moderado', color: 'text-amber-700 bg-amber-50 border-amber-200' };
                                        return { label: 'alto', color: 'text-red-700 bg-red-50 border-red-200' };
                                    }
                                };

                                const analysis = getRiskAnalysis(dimAverage, isPositive);

                                return (
                                    <div id={`dim-${dimId}`} key={dimId} className="bg-white rounded-2xl border border-slate-200 shadow-sm scroll-mt-20 overflow-visible">
                                        <div className="p-5 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                                            <div>
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h3 className="text-lg font-bold text-slate-800">Dimensão {dimName}</h3>
                                                    <span className={`text-[11px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wide ${analysis.color}`}>
                                                        {analysis.label} risco de exposição ({dimAverage.toFixed(2)})
                                                    </span>
                                                </div>
                                                <p className={`text-xs font-semibold ${isPositive ? 'text-blue-600' : 'text-orange-600'}`}>
                                                    {isPositive ? 'Quanto MAIOR, melhor' : 'Quanto MENOR, melhor'}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <span className="block text-2xl font-bold text-slate-800">{dimAverage.toFixed(2)}</span>
                                                <span className="text-xs text-slate-400 font-medium uppercase">Média Geral</span>
                                            </div>
                                        </div>
                                        <div className="divide-y divide-slate-100">
                                            {typedItems.map((item, idx) => (
                                                <div key={idx} className="p-4 hover:bg-slate-50 transition-colors">
                                                    <div className="flex flex-col gap-1 pr-12 relative">
                                                        <p className="font-medium text-slate-700">
                                                            <span className="font-bold text-slate-400 mr-2">
                                                                #{questions.findIndex(q => q.label === item.texto_pergunta) + 1}
                                                            </span>
                                                            {item.texto_pergunta}
                                                        </p>
                                                        <p className="text-sm text-slate-600">
                                                            {item.texto_risco_completo}: <span className="font-bold">({Number(item.media_valor || 0).toFixed(2)})</span>
                                                        </p>

                                                        {/* Info Button & Popover */}
                                                        {(() => {
                                                            const qIndex = questions.findIndex(q => q.label === item.texto_pergunta);
                                                            const question = questions[qIndex];

                                                            if (!question) return null;

                                                            // Calculate Frequencies (Only if popover is open or for pre-calc optimization?)
                                                            // We do it here for simplicity, or only when rendering popover content.

                                                            return (
                                                                <div className="absolute right-0 top-1">
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setInfoPopoverId(infoPopoverId === question.id ? null : question.id);
                                                                        }}
                                                                        className={`p-1.5 rounded-full transition-colors ${infoPopoverId === question.id ? 'bg-blue-100 text-blue-600' : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'}`}
                                                                        title="Ver distribuição de respostas"
                                                                    >
                                                                        <Info size={18} />
                                                                    </button>

                                                                    {infoPopoverId === question.id && (
                                                                        <div
                                                                            className="absolute left-full ml-2 -top-5 z-50 w-72 bg-white rounded-xl shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200"
                                                                            onClick={(e) => e.stopPropagation()}
                                                                        >
                                                                            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
                                                                                <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider">Distribuição</h4>
                                                                                <button onClick={() => setInfoPopoverId(null)} className="text-slate-400 hover:text-slate-600">
                                                                                    <X size={14} />
                                                                                </button>
                                                                            </div>
                                                                            <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
                                                                                {(() => {
                                                                                    // Calculate Buckets
                                                                                    const qAnswers = answers.filter(a => a.question_id === question.id);
                                                                                    const total = qAnswers.length || 1;
                                                                                    const reportBuckets: { label: string, count: number, perc: number }[] = [];

                                                                                    if (question.question_type === 'rating' || question.question_type === 'choice' || question.question_type === 'select') {
                                                                                        // Assuming standard 5 options 0-4 or text match like in Overview
                                                                                        const counts = [0, 0, 0, 0, 0];
                                                                                        const labels = ['Nunca', 'Raramente', 'Às vezes', 'Frequentemente', 'Sempre'];

                                                                                        // Overwrite labels if custom options
                                                                                        if (question.option_1) labels[0] = question.option_1;
                                                                                        if (question.option_2) labels[1] = question.option_2;
                                                                                        if (question.option_3) labels[2] = question.option_3;
                                                                                        if (question.option_4) labels[3] = question.option_4;
                                                                                        if (question.option_5) labels[4] = question.option_5;

                                                                                        qAnswers.forEach(a => {
                                                                                            const val = Number(a.answer_number ?? -1);
                                                                                            // Text matching logic duplicated from Overview if needed or simple map for now
                                                                                            // Just relying on answer_number 0-4 for simplicity as established in Overview
                                                                                            let idx = -1;
                                                                                            if (!isNaN(val) && val >= 0 && val <= 4) idx = val;
                                                                                            else {
                                                                                                // Simple text fallback
                                                                                                const txt = (a.answer_text || '').toLowerCase().trim();
                                                                                                if (txt === labels[0]?.toLowerCase()) idx = 0;
                                                                                                else if (txt === labels[1]?.toLowerCase()) idx = 1;
                                                                                                else if (txt === labels[2]?.toLowerCase()) idx = 2;
                                                                                                else if (txt === labels[3]?.toLowerCase()) idx = 3;
                                                                                                else if (txt === labels[4]?.toLowerCase()) idx = 4;
                                                                                            }

                                                                                            if (idx !== -1) counts[idx]++;
                                                                                        });

                                                                                        counts.forEach((c, i) => {
                                                                                            if (labels[i]) {
                                                                                                reportBuckets.push({
                                                                                                    label: labels[i],
                                                                                                    count: c,
                                                                                                    perc: Math.round((c / total) * 100)
                                                                                                });
                                                                                            }
                                                                                        });
                                                                                    } else {
                                                                                        // Free Text or other?
                                                                                        reportBuckets.push({ label: 'Texto/Outros', count: qAnswers.length, perc: 100 });
                                                                                    }

                                                                                    return reportBuckets.map((b, bIdx) => (
                                                                                        <div key={bIdx} className="flex justify-between items-center text-sm">
                                                                                            <span className="text-slate-600 truncate max-w-[140px]" title={b.label}>{b.label}</span>
                                                                                            <div className="flex items-center gap-2">
                                                                                                <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                                                                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${b.perc}%` }}></div>
                                                                                                </div>
                                                                                                <span className="font-bold text-slate-700 text-xs w-8 text-right">{b.count}</span>
                                                                                            </div>
                                                                                        </div>
                                                                                    ));
                                                                                })()}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })()}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Sidebar Index */}
                        <div className="lg:col-span-1">
                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm sticky top-4 max-h-[calc(100vh-200px)] overflow-y-auto">
                                <h3 className="font-bold text-slate-700 text-sm uppercase mb-3 flex items-center gap-2">
                                    <List size={16} /> Índice Rápido
                                </h3>
                                <ul className="space-y-1">
                                    {Object.entries(grouped).map(([dimId, items]) => {
                                        const dimName = (items as HSEDiagnosticItem[])[0].dimensao;
                                        return (
                                            <li key={dimId}>
                                                <button
                                                    onClick={() => {
                                                        const el = document.getElementById(`dim-${dimId}`);
                                                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                    }}
                                                    className="w-full text-left px-3 py-2 text-xs font-medium text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition-colors truncate"
                                                >
                                                    {dimName}
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            );
        };





        const toggleInterpretativeDim = (dimId: number) => {
            const newSet = new Set(expandedInterpretativeDims);
            if (newSet.has(dimId)) {
                newSet.delete(dimId);
            } else {
                newSet.add(dimId);
            }
            setExpandedInterpretativeDims(newSet);
        };

        const handleSaveRuleField = async (ruleId: number, field: 'feedback_interpretativo' | 'plano_acao_sugerido', value: string) => {
            try {
                const { error } = await supabase
                    .from('form_hse_rules')
                    .update({ [field]: value })
                    .eq('id', ruleId);

                if (error) throw error;

                // Update local state
                setHseRules(prev => prev.map(r => r.id === ruleId ? { ...r, [field]: value } : r));
                alert('Salvo com sucesso!');
            } catch (err) {
                console.error(`Error saving ${field}:`, err);
                alert('Erro ao salvar.');
            }
        };



        // RENDER INTERPRETATIVE ANALYSIS
        const renderInterpretative = () => {
            if (!Array.isArray(diagnosticData) || diagnosticData.length === 0) return (
                <div className="p-12 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                    <p className="font-medium text-lg">Sem dados para análise</p>
                </div>
            );

            // Group by Dimension and Calculate Stats
            const dimStats = Object.entries(diagnosticData.reduce((acc, item) => {
                const dimId = item.dimensao_id;
                if (!acc[dimId]) acc[dimId] = [];
                acc[dimId].push(item);
                return acc;
            }, {} as Record<number, HSEDiagnosticItem[]>)).map(([dimId, items]) => {
                const typedItems = items as HSEDiagnosticItem[];
                const first = typedItems[0];
                const average = typedItems.reduce((sum, i) => sum + (Number(i.media_valor) || 0), 0) / typedItems.length;
                const dimMeta = hseDimensions.find(d => d.id === Number(dimId));
                const isPositive = dimMeta?.is_positive;

                // Calculate Performance (Higher is better for sorting)
                // If positive: 4.0 is better than 1.0
                // If negative: 1.0 is better than 4.0 (so invert: 5 - 1 = 4, 5 - 4 = 1)
                const performance = isPositive ? average : (5 - average);

                return {
                    id: dimId,
                    name: first.dimensao,
                    average,
                    isPositive,
                    performance
                };
            });

            // Sort by Performance Descending
            dimStats.sort((a, b) => b.performance - a.performance);

            // Filter into Strong (Low/Medium Risk) and Weak (Moderate/High Risk)
            // Logic: High Risk = Weakness. Low Risk = Strength.
            const strengths: typeof dimStats = [];
            const weaknesses: typeof dimStats = [];

            dimStats.forEach(dim => {
                const score = dim.average;
                const isPos = dim.isPositive;

                let isHighRisk = false;
                // Determine if it's High/Moderate Risk (Weakness) or Low/Medium Risk (Strength)
                // Using the specific HSE Scoring Logic:
                if (isPos) {
                    // Higher is Better. Low Score = High Risk.
                    // Risk: High (<1), Moderate (1-2), Medium (2-3), Low (>3)
                    // If Score < 3, it's significant risk?
                    // Let's stick to the prompt: "Alto risco ... pontos fracos".
                    // Standard HSE often classifies < 3 as needing improvement. 
                    // Let's use the threshold of 'Moderate' or worse as Weakness.
                    // Moderate is < 3ish usually? 
                    // Re-checking getRiskAnalysis logic from earlier:
                    /*
                    if (score >= 3) Low Risk (Green) -> Strength
                    if (score >= 2) Medium Risk (Blue) -> Strength? 
                    if (score >= 1) Moderate Risk (Yellow) -> Weakness?
                    else High Risk (Red) -> Weakness
                    */
                    // Let's assume Low/Medium = Strength, Moderate/High = Weakness.
                    if (score >= 2) isHighRisk = false;
                    else isHighRisk = true;
                } else {
                    // Lower is Better. High Score = High Risk.
                    /*
                    if (score <= 1) Low Risk (Green) -> Strength
                    if (score <= 2) Medium Risk (Blue) -> Strength
                    if (score <= 3) Moderate Risk (Yellow) -> Weakness?
                    else High Risk (Red) -> Weakness
                    */
                    if (score <= 2) isHighRisk = false;
                    else isHighRisk = true;
                }

                if (isHighRisk) weaknesses.push(dim);
                else strengths.push(dim);
            });

            return (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-500 relative">
                    {/* STRENGTHS */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                                <ThumbsUp size={24} />
                            </div>
                            <h2 className="text-xl font-bold text-slate-800">Pontos Fortes</h2>
                        </div>
                        {strengths.length === 0 && <p className="text-slate-400 italic">Nenhum ponto forte identificado.</p>}
                        <div className="space-y-3">
                            {strengths.map(dim => {
                                const isExpanded = expandedInterpretativeDims.has(Number(dim.id));
                                const dimRules = hseRules.filter(r => r.dimension_id === Number(dim.id)).sort((a, b) => a.min_val - b.min_val);

                                return (
                                    <div
                                        key={dim.id}
                                        className="bg-white rounded-xl border border-green-100 shadow-sm overflow-hidden transition-all group hover:shadow-md"
                                    >
                                        <div
                                            onClick={() => toggleInterpretativeDim(Number(dim.id))}
                                            className="p-4 flex justify-between items-center cursor-pointer hover:bg-green-50/50"
                                        >
                                            <div>
                                                <h3 className="font-bold text-slate-700 flex items-center gap-2">
                                                    {dim.name}
                                                    {isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                                                </h3>
                                                <p className="text-xs text-slate-500 capitalize">
                                                    {dim.isPositive ? 'Maior é melhor' : 'Menor é melhor'}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-lg font-black text-green-600">{dim.average.toFixed(2)}</span>
                                            </div>
                                        </div>

                                        {/* Inline Rules Editor */}
                                        {isExpanded && (
                                            <div className="p-4 bg-slate-50 border-t border-green-100 animate-in slide-in-from-top-2">
                                                <h4 className="text-xs font-bold uppercase text-slate-400 mb-3">Regras de Interpretação</h4>
                                                {dimRules.length === 0 ? (
                                                    <p className="text-sm text-slate-400 italic">Nenhuma regra configurada.</p>
                                                ) : (
                                                    <div className="space-y-6">
                                                        {dimRules.map(rule => (
                                                            <div key={rule.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
                                                                <div className="flex justify-between items-center mb-3">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-sm font-semibold text-slate-700">
                                                                            De {rule.min_val} a {rule.max_val}
                                                                        </span>
                                                                    </div>
                                                                    <span className="px-2 py-0.5 rounded-full bg-white text-slate-500 text-[10px] uppercase font-bold tracking-wide border border-slate-200 shadow-sm">
                                                                        {rule.texto_personalizado || 'Sem descrição'}
                                                                    </span>
                                                                </div>
                                                                <div className="space-y-3">
                                                                    <textarea
                                                                        id={`inline-feedback-${rule.id}`}
                                                                        className="w-full p-3 text-sm bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-slate-300 focus:border-slate-300 min-h-[80px] text-slate-600 placeholder:text-slate-400 resize-none transition-all shadow-sm"
                                                                        defaultValue={rule.feedback_interpretativo || ''}
                                                                        placeholder="Digite a análise interpretativa..."
                                                                    />
                                                                    <div className="flex justify-end">
                                                                        <Button
                                                                            size="sm"
                                                                            variant="outline"
                                                                            className="h-8 gap-2 text-xs font-semibold text-slate-600 hover:text-slate-800 border-slate-200 hover:bg-white hover:border-slate-300 transition-all"
                                                                            onClick={() => {
                                                                                const el = document.getElementById(`inline-feedback-${rule.id}`) as HTMLTextAreaElement;
                                                                                if (el) handleSaveRuleField(rule.id, 'feedback_interpretativo', el.value);
                                                                            }}
                                                                        >
                                                                            <Save size={14} />
                                                                            Salvar
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* WEAKNESSES */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                                <ThumbsDown size={24} />
                            </div>
                            <h2 className="text-xl font-bold text-slate-800">Pontos Fracos</h2>
                        </div>
                        {weaknesses.length === 0 && <p className="text-slate-400 italic">Nenhum ponto fraco identificado.</p>}
                        <div className="space-y-3">
                            {weaknesses.map(dim => {
                                const isExpanded = expandedInterpretativeDims.has(Number(dim.id));
                                const dimRules = hseRules.filter(r => r.dimension_id === Number(dim.id)).sort((a, b) => a.min_val - b.min_val);

                                return (
                                    <div
                                        key={dim.id}
                                        className="bg-white rounded-xl border border-red-100 shadow-sm overflow-hidden transition-all group hover:shadow-md"
                                    >
                                        <div
                                            onClick={() => toggleInterpretativeDim(Number(dim.id))}
                                            className="p-4 flex justify-between items-center cursor-pointer hover:bg-red-50/50"
                                        >
                                            <div>
                                                <h3 className="font-bold text-slate-700 flex items-center gap-2">
                                                    {dim.name}
                                                    {isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                                                </h3>
                                                <p className="text-xs text-slate-500 capitalize">
                                                    {dim.isPositive ? 'Maior é melhor' : 'Menor é melhor'}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-lg font-black text-red-600">{dim.average.toFixed(2)}</span>
                                            </div>
                                        </div>

                                        {/* Inline Rules Editor */}
                                        {isExpanded && (
                                            <div className="p-4 bg-slate-50 border-t border-red-100 animate-in slide-in-from-top-2">
                                                <h4 className="text-xs font-bold uppercase text-slate-400 mb-3">Regras de Interpretação</h4>
                                                {dimRules.length === 0 ? (
                                                    <p className="text-sm text-slate-400 italic">Nenhuma regra configurada.</p>
                                                ) : (
                                                    <div className="space-y-6">
                                                        {dimRules.map(rule => (
                                                            <div key={rule.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
                                                                <div className="flex justify-between items-center mb-3">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-sm font-semibold text-slate-700">
                                                                            De {rule.min_val} a {rule.max_val}
                                                                        </span>
                                                                    </div>
                                                                    <span className="px-2 py-0.5 rounded-full bg-white text-slate-500 text-[10px] uppercase font-bold tracking-wide border border-slate-200 shadow-sm">
                                                                        {rule.texto_personalizado || 'Sem descrição'}
                                                                    </span>
                                                                </div>
                                                                <div className="space-y-3">
                                                                    <textarea
                                                                        id={`inline-feedback-${rule.id}`}
                                                                        className="w-full p-3 text-sm bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-slate-300 focus:border-slate-300 min-h-[80px] text-slate-600 placeholder:text-slate-400 resize-none transition-all shadow-sm"
                                                                        defaultValue={rule.feedback_interpretativo || ''}
                                                                        placeholder="Digite a análise interpretativa..."
                                                                    />
                                                                    <div className="flex justify-end">
                                                                        <Button
                                                                            size="sm"
                                                                            variant="outline"
                                                                            className="h-8 gap-2 text-xs font-semibold text-slate-600 hover:text-slate-800 border-slate-200 hover:bg-white hover:border-slate-300 transition-all"
                                                                            onClick={() => {
                                                                                const el = document.getElementById(`inline-feedback-${rule.id}`) as HTMLTextAreaElement;
                                                                                if (el) handleSaveRuleField(rule.id, 'feedback_interpretativo', el.value);
                                                                            }}
                                                                        >
                                                                            <Save size={14} />
                                                                            Salvar
                                                                        </Button>
                                                                    </div>
                                                                </div>

                                                                {/* Action Plan Section - Only for Moderate/High Risk */}
                                                                {((dim.isPositive ? rule.max_val <= 2 : rule.min_val >= 2)) && (
                                                                    <div className="pt-4 border-t border-slate-100">
                                                                        <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">
                                                                            Plano de Ação Sugerido
                                                                        </label>
                                                                        <div className="space-y-3">
                                                                            <textarea
                                                                                id={`inline-action-${rule.id}`}
                                                                                className="w-full p-3 text-sm bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-slate-300 focus:border-slate-300 min-h-[80px] text-slate-600 placeholder:text-slate-400 resize-none transition-all shadow-sm"
                                                                                defaultValue={rule.plano_acao_sugerido || ''}
                                                                                placeholder="Descreva as ações recomendadas para este nível de risco..."
                                                                            />
                                                                            <div className="flex justify-end">
                                                                                <Button
                                                                                    size="sm"
                                                                                    variant="outline"
                                                                                    className="h-8 gap-2 text-xs font-semibold text-slate-600 hover:text-slate-800 border-slate-200 hover:bg-white hover:border-slate-300 transition-all"
                                                                                    onClick={() => {
                                                                                        const el = document.getElementById(`inline-action-${rule.id}`) as HTMLTextAreaElement;
                                                                                        if (el) handleSaveRuleField(rule.id, 'plano_acao_sugerido', el.value);
                                                                                    }}
                                                                                >
                                                                                    <Save size={14} />
                                                                                    Salvar Plano
                                                                                </Button>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
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
                        {/* Visão Geral Removed as per request */}
                        <button
                            onClick={() => setAnalyticsTab('individual')}
                            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${analyticsTab === 'individual' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Visão Geral
                        </button>
                        <button
                            onClick={() => setAnalyticsTab('diagnostic')}
                            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${analyticsTab === 'diagnostic' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Diagnóstico por dimensões
                        </button>
                        <button
                            onClick={() => setAnalyticsTab('interpretative')}
                            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${analyticsTab === 'interpretative' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Análise Interpretativa
                        </button>

                    </div>
                </header>

                {
                    loadingStats ? (
                        <div className="flex-1 flex justify-center items-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
                    ) : (
                        <div className="flex-1 relative overflow-hidden">
                            <div id="report-scroll-container" className="h-full overflow-y-auto pb-20 px-1">
                                {analyticsTab === 'overview' ? renderOverview() :
                                    analyticsTab === 'individual' ? renderIndividual() :
                                        analyticsTab === 'diagnostic' ? renderDiagnostic() :
                                            renderInterpretative()
                                }
                            </div>
                            <ScrollToTopButton />
                        </div>
                    )
                }
            </div >
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

                    <div className="px-4 mb-4 flex gap-2 border-b border-slate-200">
                        <button
                            onClick={() => setHseActiveTab('associations')}
                            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${hseActiveTab === 'associations' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                        >
                            Associações
                        </button>
                        <button
                            onClick={() => setHseActiveTab('rules')}
                            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${hseActiveTab === 'rules' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                        >
                            Personalização de textos
                        </button>
                    </div>

                    {loadingHse ? (
                        <div className="flex-1 flex justify-center items-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : hseActiveTab === 'associations' ? (
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
                    ) : (
                        // RULES TAB
                        <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
                            <div className="space-y-6 max-w-4xl mx-auto">
                                {hseDimensions.map(dim => {
                                    const dimRules = hseRules.filter(r => r.dimension_id === dim.id);
                                    return (
                                        <div key={dim.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                            <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
                                                <h3 className="text-lg font-bold text-slate-700">{dim.name}</h3>
                                                <Button size="sm" variant="outline" onClick={() => handleAddRule(dim.id)}>
                                                    <Plus size={14} /> Adicionar Regra
                                                </Button>
                                            </div>

                                            {dimRules.length === 0 ? (
                                                <p className="text-center text-slate-400 py-4 italic text-sm">Nenhuma regra definida para esta dimensão.</p>
                                            ) : (
                                                <div className="space-y-3">
                                                    {dimRules.map((rule, idx) => (
                                                        <div key={rule.id} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-slate-50 p-3 rounded-lg border border-slate-200">
                                                            <div className="flex items-center gap-2 text-sm text-slate-600 shrink-0">
                                                                <span>De</span>
                                                                <input
                                                                    type="number"
                                                                    className="w-20 px-2 py-1 border rounded bg-white text-center"
                                                                    value={rule.min_val}
                                                                    step="0.1"
                                                                    onChange={(e) => handleUpdateRule(rule.id, 'min_val', Number(e.target.value))}
                                                                />
                                                                <span>até</span>
                                                                <input
                                                                    type="number"
                                                                    className="w-20 px-2 py-1 border rounded bg-white text-center"
                                                                    value={rule.max_val}
                                                                    step="0.1"
                                                                    onChange={(e) => handleUpdateRule(rule.id, 'max_val', Number(e.target.value))}
                                                                />
                                                            </div>
                                                            <div className="flex-1 w-full">
                                                                <input
                                                                    type="text"
                                                                    className="w-full px-3 py-1.5 border rounded bg-white text-sm"
                                                                    placeholder="Texto a ser exibido..."
                                                                    value={rule.texto_personalizado}
                                                                    onChange={(e) => handleUpdateRule(rule.id, 'texto_personalizado', e.target.value)}
                                                                />
                                                            </div>
                                                            <button
                                                                onClick={() => handleDeleteRule(rule.id)}
                                                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors shrink-0"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
                <div className="flex justify-end pt-4 border-t border-slate-200 mt-4">
                    <Button onClick={handleSaveHSEConfig}>
                        <Save size={18} />
                        Salvar Alterações
                    </Button>
                </div>
            </Modal>
        </div>
    );
};
export default Formularios;




