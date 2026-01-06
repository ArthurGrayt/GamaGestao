
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import {
    Plus, Search, FileText, BarChart2, Link as LinkIcon,
    MoreVertical, Edit2, Trash2, X, Check, Copy, ExternalLink,
    ChevronUp, ChevronDown, List, Type, MessageSquare, Star
} from 'lucide-react';
import { Form, FormQuestion, FormAnswer, QuestionType } from '../types';

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

/* --- Main Component --- */

export const Formularios: React.FC = () => {
    const [forms, setForms] = useState<Form[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editingForm, setEditingForm] = useState<Partial<Form> & { questions?: Partial<FormQuestion>[] } | null>(null);
    const [deletedQuestionIds, setDeletedQuestionIds] = useState<number[]>([]);

    useEffect(() => {
        fetchForms();
    }, []);

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
        setIsEditorOpen(true);
    };

    const handleEdit = async (form: Form) => {
        // Fetch questions for this form
        const { data: questions } = await supabase
            .from('form_questions')
            .select('*')
            .eq('form_id', form.id)
            .order('question_order', { ascending: true });

        setEditingForm({
            ...form,
            questions: questions || []
        });
        setDeletedQuestionIds([]);
        setIsEditorOpen(true);
    };

    const handleSaveForm = async () => {
        if (!editingForm?.title || !editingForm?.slug) {
            alert('Título e Slug são obrigatórios');
            return;
        }

        const user = (await supabase.auth.getUser()).data.user;

        // 1. Save Form (Insert or Update)
        let formId = editingForm.id;

        const formData = {
            title: editingForm.title,
            description: editingForm.description,
            slug: editingForm.slug,
            active: editingForm.active,
        };

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

        setIsEditorOpen(false);
        fetchForms();
    };

    const [viewMode, setViewMode] = useState<'list' | 'analytics'>('list');
    const [analyticsForm, setAnalyticsForm] = useState<Form | null>(null);
    const [answers, setAnswers] = useState<FormAnswer[]>([]);
    const [questions, setQuestions] = useState<FormQuestion[]>([]);
    const [loadingStats, setLoadingStats] = useState(false);

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

    // Question Editor Helpers
    const addQuestion = (type: QuestionType) => {
        setEditingForm(prev => ({
            ...prev!,
            questions: [...(prev?.questions || []), {
                label: '',
                question_type: type,
                required: false,
                question_order: (prev?.questions?.length || 0)
            }]
        }));
    };

    const updateQuestion = (index: number, field: string, value: any) => {
        setEditingForm(prev => {
            const newQuestions = [...(prev?.questions || [])];
            newQuestions[index] = { ...newQuestions[index], [field]: value };
            return { ...prev!, questions: newQuestions };
        });
    };

    const removeQuestion = (index: number) => {
        const question = editingForm?.questions?.[index];
        if (question?.id) {
            setDeletedQuestionIds(prev => [...prev, question.id!]);
        }
        setEditingForm(prev => ({
            ...prev!,
            questions: prev?.questions?.filter((_, i) => i !== index) || []
        }));
    };

    const moveQuestion = (index: number, direction: 'up' | 'down') => {
        if (!editingForm?.questions) return;
        const newQuestions = [...editingForm.questions];
        if (direction === 'up' && index > 0) {
            [newQuestions[index], newQuestions[index - 1]] = [newQuestions[index - 1], newQuestions[index]];
        } else if (direction === 'down' && index < newQuestions.length - 1) {
            [newQuestions[index], newQuestions[index + 1]] = [newQuestions[index + 1], newQuestions[index]];
        }
        setEditingForm(prev => ({ ...prev!, questions: newQuestions }));
    };

    const copyToClipboard = (slug: string) => {
        const url = `${window.location.origin}/#/form/${slug}`;
        navigator.clipboard.writeText(url);
        alert('Link copiado para área de transferência!');
    };

    const filteredForms = forms.filter(f =>
        f.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (viewMode === 'analytics' && analyticsForm) {
        return (
            <div className="h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
                <header className="flex items-center gap-4 mb-8">
                    <Button variant="outline" onClick={() => setViewMode('list')} className="px-3">
                        <ChevronUp className="rotate-[-90deg]" size={20} />
                        Voltar
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Relatório: {analyticsForm.title}</h1>
                        <p className="text-slate-500 text-sm mt-1">{getTotalResponses()} respostas totais até agora</p>
                    </div>
                </header>

                {loadingStats ? (
                    <div className="flex-1 flex justify-center items-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
                ) : (
                    <div className="overflow-y-auto pb-20 space-y-8">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                                <h4 className="text-blue-600 font-bold text-sm uppercase tracking-wider mb-2">Total de Respostas</h4>
                                <p className="text-4xl font-bold text-slate-800">{getTotalResponses()}</p>
                            </div>
                            <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
                                <h4 className="text-emerald-600 font-bold text-sm uppercase tracking-wider mb-2">Perguntas Ativas</h4>
                                <p className="text-4xl font-bold text-slate-800">{questions.length}</p>
                            </div>
                            <div className="bg-purple-50 p-6 rounded-2xl border border-purple-100">
                                <h4 className="text-purple-600 font-bold text-sm uppercase tracking-wider mb-2">Última Resposta</h4>
                                <p className="text-lg font-bold text-slate-800">
                                    {answers.length > 0 ? new Date(answers[0].created_at).toLocaleDateString() : '-'}
                                </p>
                            </div>
                        </div>

                        {/* Detailed Analysis */}
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold text-slate-800">Análise por Pergunta</h3>

                            {questions.map((q) => (
                                <Card key={q.id} className="p-6">
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                                            {q.question_type === 'rating' && <Star size={20} />}
                                            {(q.question_type === 'choice' || q.question_type === 'select') && <List size={20} />}
                                            {(q.question_type === 'short_text' || q.question_type === 'long_text') && <MessageSquare size={20} />}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-700 text-lg">{q.label}</h4>
                                            <span className="text-xs font-medium bg-slate-100 text-slate-500 px-2 py-1 rounded mt-1 inline-block">
                                                {q.question_type === 'rating' ? 'Escala/Nota' : q.question_type === 'choice' ? 'Múltipla Escolha' : q.question_type === 'select' ? 'Dropdown' : 'Texto'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="pl-14">
                                        {/* RATING ANALYSIS */}
                                        {q.question_type === 'rating' && (
                                            <div>
                                                <div className="flex items-end gap-2 mb-4">
                                                    <span className="text-5xl font-bold text-blue-600">{getAverageRating(q.id)}</span>
                                                    <span className="text-slate-400 font-medium mb-1">/ {q.max_value} (Média)</span>
                                                </div>
                                                <div className="h-4 bg-slate-100 rounded-full overflow-hidden w-full max-w-md">
                                                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(Number(getAverageRating(q.id)) / (q.max_value || 5)) * 100}%` }}></div>
                                                </div>
                                            </div>
                                        )}

                                        {/* CHOICE ANALYSIS */}
                                        {(q.question_type === 'choice' || q.question_type === 'select') && (
                                            <div className="space-y-3">
                                                {Object.entries(getChoiceDistribution(q.id)).map(([option, count]) => (
                                                    <div key={option}>
                                                        <div className="flex justify-between text-sm mb-1">
                                                            <span className="font-medium text-slate-700">{option}</span>
                                                            <span className="text-slate-500">{count} votos ({Math.round(count / getTotalResponses() * 100)}%)</span>
                                                        </div>
                                                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(count / getTotalResponses()) * 100}%` }}></div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* TEXT ANALYSIS */}
                                        {(q.question_type === 'short_text' || q.question_type === 'long_text') && (
                                            <div className="bg-slate-50 rounded-xl p-4 max-h-60 overflow-y-auto">
                                                <ul className="space-y-3">
                                                    {answers
                                                        .filter(a => a.question_id === q.id && a.answer_text)
                                                        .slice(0, 10) // Show last 10
                                                        .map((a, i) => (
                                                            <li key={i} className="text-sm text-slate-600 border-b border-slate-100 last:border-0 pb-2 last:pb-0">
                                                                <p>"{a.answer_text}"</p>
                                                                <span className="text-xs text-slate-400 mt-1 block">{new Date(a.created_at).toLocaleDateString()} - {a.responder_name}</span>
                                                            </li>
                                                        ))}
                                                </ul>
                                                {answers.filter(a => a.question_id === q.id).length > 10 && (
                                                    <p className="text-center text-xs text-slate-400 mt-3">Exibindo as 10 últimas de {answers.filter(a => a.question_id === q.id).length} respostas</p>
                                                )}
                                                {answers.filter(a => a.question_id === q.id).length === 0 && (
                                                    <p className="text-slate-400 text-sm text-center">Nenhuma resposta de texto ainda.</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            ))}
                        </div>
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
                                        onClick={() => handleEdit(form)}
                                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    >
                                        <Edit2 size={16} />
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
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
                            <textarea
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10"
                                rows={3}
                                value={editingForm?.description || ''}
                                onChange={(e) => setEditingForm(prev => ({ ...prev!, description: e.target.value }))}
                            />
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
                            <h3 className="text-lg font-bold text-slate-800">Perguntas</h3>
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => addQuestion('short_text')}>+ Texto Curto</Button>
                                <Button size="sm" variant="outline" onClick={() => addQuestion('long_text')}>+ Texto Longo</Button>
                                <Button size="sm" variant="outline" onClick={() => addQuestion('choice')}>+ Opções</Button>
                                <Button size="sm" variant="outline" onClick={() => addQuestion('select')}>+ Lista (Dropdown)</Button>
                                <Button size="sm" variant="outline" onClick={() => addQuestion('rating')}>+ Nota</Button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {editingForm?.questions?.map((q, idx) => (
                                <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-4 relative group">
                                    <div className="absolute right-4 top-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => moveQuestion(idx, 'up')} className="p-1 hover:bg-slate-200 rounded"><ChevronUp size={16} /></button>
                                        <button onClick={() => moveQuestion(idx, 'down')} className="p-1 hover:bg-slate-200 rounded"><ChevronDown size={16} /></button>
                                        <button onClick={() => removeQuestion(idx)} className="p-1 hover:bg-red-100 text-red-500 rounded"><Trash2 size={16} /></button>
                                    </div>

                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2 bg-white rounded-lg border border-slate-200 text-slate-400">
                                            {q.question_type === 'short_text' && <Type size={18} />}
                                            {q.question_type === 'long_text' && <MessageSquare size={18} />}
                                            {q.question_type === 'choice' && <List size={18} />}
                                            {q.question_type === 'select' && <ChevronDown size={18} />}
                                            {q.question_type === 'rating' && <Star size={18} />}
                                        </div>
                                        <input
                                            className="bg-transparent font-medium text-slate-700 w-full focus:outline-none border-b border-transparent focus:border-blue-300 px-1"
                                            value={q.label}
                                            onChange={(e) => updateQuestion(idx, 'label', e.target.value)}
                                            placeholder="Digite a pergunta..."
                                        />
                                    </div>

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
                                                        value={(q as any)[`option_${optNum}`] || ''}
                                                        onChange={(e) => updateQuestion(idx, `option_${optNum}`, e.target.value)}
                                                    />
                                                ))}
                                            </div>
                                        )}

                                        {q.question_type === 'rating' && (
                                            <div className="col-span-2 grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-xs text-slate-500">Mínimo</label>
                                                    <input type="number" className="w-full bg-white border rounded px-2 py-1" value={q.min_value || 1} onChange={e => updateQuestion(idx, 'min_value', parseInt(e.target.value))} />
                                                </div>
                                                <div>
                                                    <label className="text-xs text-slate-500">Máximo</label>
                                                    <input type="number" className="w-full bg-white border rounded px-2 py-1" value={q.max_value || 5} onChange={e => updateQuestion(idx, 'max_value', parseInt(e.target.value))} />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {(!editingForm?.questions || editingForm.questions.length === 0) && (
                                <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl text-slate-400">
                                    Nenhuma pergunta adicionada.
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end pt-6 border-t border-slate-100">
                        <Button onClick={handleSaveForm}>
                            <Check size={18} />
                            Salvar Formulário
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
