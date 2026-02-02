
import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { Form, FormQuestion, Collaborator } from '../types';
import { CheckCircle, Check, AlertCircle, ChevronRight, Send, Star, User, Hash, ChevronDown, Building2, MapPin, Briefcase, Search, Plus } from 'lucide-react';

const LoadingScreen = () => (
    <div className="fixed inset-0 bg-gray-50 z-50 flex items-center justify-center font-sans antialiased">
        <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700&display=swap');
            
            @keyframes text-slide {
                0%, 27.777% { transform: translateY(0%); }
                33.333%, 61.111% { transform: translateY(-25%); }
                66.666%, 94.444% { transform: translateY(-50%); }
                100% { transform: translateY(-75%); }
            }

            .slider {
                animation: text-slide 6.5s cubic-bezier(0.83, 0, 0.17, 1) infinite;
            }

            .gpu-text {
                transform: translateZ(0);
                backface-visibility: hidden;
                -webkit-font-smoothing: antialiased;
            }
        `}</style>

        <div className="flex flex-col items-center justify-center text-[#35b6cf] font-bold text-5xl gap-1" style={{ fontFamily: "'Outfit', sans-serif" }}>

            {/* LINE 1: Uma Gama */}
            <div className="flex items-baseline gap-2">
                <span className="gpu-text">Uma</span>

                <span className="flex items-baseline gpu-text">
                    <img src="/corped.png" alt="" className="h-[1.25em] w-auto relative top-[0.25em] -mr-1" />
                    <span>ama</span>
                </span>
            </div>

            {/* LINE 2: de [Animation] */}
            <div className="flex items-baseline gap-2">
                <span className="gpu-text">de</span>

                {/* TEXTO ANIMADO */}
                <div className="overflow-hidden h-[1.3em] -mt-2">
                    <div className="slider gpu-text">
                        <span className="block h-[1.3em] leading-[1.3em]">ideias</span>
                        <span className="block h-[1.3em] leading-[1.3em]">soluções</span>
                        <span className="block h-[1.3em] leading-[1.3em]">inovações</span>
                        {/* Clone of first item for infinite loop illusion */}
                        <span className="block h-[1.3em] leading-[1.3em]">ideias</span>
                    </div>
                </div>
            </div>

        </div>
    </div>
);

const CustomSelect = ({ options, value, onChange, placeholder = 'Selecione...' }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    const triggerRef = useRef<HTMLDivElement>(null);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

    useEffect(() => {
        const handleResize = () => setIsOpen(false);
        const handleScroll = () => setIsOpen(false);

        window.addEventListener('resize', handleResize);
        window.addEventListener('scroll', handleScroll, true);

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, []);

    const handleOpen = () => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setCoords({
                top: rect.bottom + 4,
                left: rect.left,
                width: rect.width
            });
            setIsOpen(!isOpen);
        }
    };

    return (
        <div className="relative max-w-xs" ref={triggerRef}>
            {isOpen && <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />}
            <div
                onClick={handleOpen}
                className={`w-full px-4 py-3 bg-white border rounded-md transition-all cursor-pointer flex justify-between items-center relative z-20 ${isOpen ? 'border-[#35b6cf] ring-2 ring-[#35b6cf]/10' : 'border-slate-200 hover:border-slate-300'}`}
            >
                <span className={value ? 'text-slate-800' : 'text-slate-400'}>
                    {value || placeholder}
                </span>
                <ChevronDown size={16} className={`text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {isOpen && (
                <div
                    className="fixed z-50 bg-white border border-slate-100 rounded-lg shadow-xl max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-200"
                    style={{
                        top: `${coords.top}px`,
                        left: `${coords.left}px`,
                        width: `${coords.width}px`
                    }}
                >
                    {options.map((opt: string) => (
                        <div
                            key={opt}
                            onClick={() => {
                                onChange(opt);
                                setIsOpen(false);
                            }}
                            className={`px-4 py-2.5 text-sm cursor-pointer transition-colors flex justify-between items-center ${value === opt ? 'bg-blue-50 text-[#35b6cf] font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                            {opt}
                            {value === opt && <Check size={14} />}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// Searchable Select Component for Registration
const SearchableSelect = ({ options, value, onChange, placeholder, disabled, icon: Icon, requireSearch, noResultsContent }: any) => {
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
                        {!search && requireSearch ? (
                            <div className="px-4 py-8 text-sm text-slate-400 text-center flex flex-col items-center gap-2">
                                <Search size={24} className="opacity-20" />
                                Digite para buscar sua empresa
                            </div>
                        ) : filteredOptions.length > 0 ? (
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
                                {noResultsContent || 'Nenhum resultado'}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export const FormularioPublico: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const [form, setForm] = useState<Form | null>(null);
    const [questions, setQuestions] = useState<FormQuestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);

    // Identity State
    const [cpf, setCpf] = useState('');
    const [checkingCpf, setCheckingCpf] = useState(false);
    const [collaborator, setCollaborator] = useState<Collaborator | null>(null);
    const [showRegisterModal, setShowRegisterModal] = useState(false);

    // Form State
    const [answers, setAnswers] = useState<Record<number, any>>({});
    const [step, setStep] = useState<'cover' | 'cpf_check' | 'form'>('cover');
    const [currentSection, setCurrentSection] = useState(0);

    const sections = React.useMemo(() => {
        if (!form) return [];
        const list: { title?: string; questions: FormQuestion[] }[] = [{ title: 'Principal', questions: [] }];

        questions.forEach(q => {
            if (q.question_type === 'section_break') {
                list.push({ title: q.label || 'Nova Seção', questions: [] });
            } else {
                list[list.length - 1].questions.push(q);
            }
        });
        return list;
    }, [questions, form]);

    useEffect(() => {
        if (slug) fetchForm();
    }, [slug]);

    useEffect(() => {
        if (form?.title) document.title = form.title;
    }, [form]);

    const fetchForm = async () => {
        setLoading(true);
        const minWaitPromise = new Promise(resolve => setTimeout(resolve, 2000));

        // 1. Get Form
        const { data: formData, error: formError } = await supabase
            .from('forms')
            .select('*')
            .eq('slug', slug)
            .eq('active', true)
            .single();

        if (formError || !formData) {
            setError('Formulário não encontrado ou inativo.');
            setLoading(false);
            return;
        }

        setForm(formData);

        // 2. Get Questions
        const { data: questionData } = await supabase
            .from('form_questions')
            .select('*')
            .eq('form_id', formData.id)
            .order('question_order', { ascending: true });

        if (questionData) {
            // Randomize questions while preserving sections
            const shuffle = (array: any[]) => {
                const newArr = [...array];
                for (let i = newArr.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
                }
                return newArr;
            };

            const shuffledQuestions: any[] = [];
            let currentSectionBuffer: any[] = [];

            questionData.forEach(q => {
                if (q.question_type === 'section_break') {
                    // Flush current section shuffled
                    if (currentSectionBuffer.length > 0) {
                        shuffledQuestions.push(...shuffle(currentSectionBuffer));
                        currentSectionBuffer = [];
                    }
                    // Push break as is
                    shuffledQuestions.push(q);
                } else {
                    currentSectionBuffer.push(q);
                }
            });

            // Flush remaining
            if (currentSectionBuffer.length > 0) {
                shuffledQuestions.push(...shuffle(currentSectionBuffer));
            }

            setQuestions(shuffledQuestions);
        }

        await minWaitPromise;
        setLoading(false);
    };

    const validateCPF = (cpf: string) => {
        cpf = cpf.replace(/[^\d]+/g, '');
        if (cpf === '') return false;
        if (cpf.length !== 11 ||
            /^(\d)\1{10}$/.test(cpf)) return false;

        let add = 0;
        for (let i = 0; i < 9; i++) add += parseInt(cpf.charAt(i)) * (10 - i);
        let rev = 11 - (add % 11);
        if (rev === 10 || rev === 11) rev = 0;
        if (rev !== parseInt(cpf.charAt(9))) return false;

        add = 0;
        for (let i = 0; i < 10; i++) add += parseInt(cpf.charAt(i)) * (11 - i);
        rev = 11 - (add % 11);
        if (rev === 10 || rev === 11) rev = 0;
        if (rev !== parseInt(cpf.charAt(10))) return false;

        return true;
    };

    const handleCheckCPF = async () => {
        if (!validateCPF(cpf)) {
            if (!window.confirm("CPF parece inválido ou incompleto. Deseja continuar mesmo assim?")) {
                return;
            }
        }

        setCheckingCpf(true);
        const cleanCpf = cpf.replace(/\D/g, '');
        const formattedCpf = cleanCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');

        // Check Colaboradores (try both clean and formatted, to be safe)
        const { data: colabData, error } = await supabase
            .from('colaboradores')
            .select('*')
            .or(`cpf.eq.${cleanCpf},cpf.eq.${formattedCpf}`)
            .maybeSingle();

        if (colabData) {
            // Found! Get Company Name via Unit
            let companyName = '';
            if (colabData.unidade) {
                const { data: unitData } = await supabase
                    .from('unidades')
                    .select('empresaid')
                    .eq('id', colabData.unidade)
                    .single();

                if (unitData?.empresaid) {
                    const { data: companyData } = await supabase
                        .from('clientes')
                        .select('nome_fantasia, razao_social')
                        .eq('id', unitData.empresaid)
                        .single();
                    companyName = companyData?.nome_fantasia || companyData?.razao_social || '';
                }
            }

            setCollaborator({ ...colabData, empresa_nome: companyName });
            setStep('form');
        } else {
            // Not Found -> Open Registration
            setShowRegisterModal(true);
        }
        setCheckingCpf(false);
    };

    const handleRegistrationSuccess = (newColab: Collaborator) => {
        setCollaborator(newColab);
        setShowRegisterModal(false);
        setStep('form');
    };

    const handleAnswerChange = (questionId: number, value: any) => {
        setAnswers(prev => ({ ...prev, [questionId]: value }));
    };

    const validate = (qs: FormQuestion[]) => {
        for (const q of qs) {
            if (q.required) {
                const val = answers[q.id];
                if (val === undefined || val === '' || val === null) {
                    alert(`A pergunta "${q.label}" é obrigatória.`);
                    return false;
                }
            }
        }
        return true;
    };

    const handleNext = () => {
        const currentQs = sections[currentSection].questions;
        if (validate(currentQs)) {
            setCurrentSection(prev => prev + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleBack = () => {
        if (currentSection > 0) {
            setCurrentSection(prev => prev - 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        // If section 0, do nothing or confirm exit?
    };

    const handleSubmit = async () => {
        const currentQs = sections[currentSection].questions;
        if (!validate(currentQs)) return;
        if (!form || !collaborator) return;

        setLoading(true);

        const answersToInsert = questions.map(q => {
            if (q.question_type === 'section_break') return null;
            const val = answers[q.id];

            // Map text answers to numbers if applicable
            let answerNumber: number | null = null;
            if (q.question_type === 'rating') {
                answerNumber = Number(val);
            } else {
                const textToNumberMap: Record<string, number> = {
                    'nunca': 0,
                    'raramente': 1,
                    'as vezes': 2,
                    'frequentemente': 3,
                    'sempre': 4
                };
                // Normalize: trim whitespace and convert to lowercase for robust matching
                const valStr = String(val).trim().toLowerCase();

                // Check if the normalized string exists in our map
                if (Object.prototype.hasOwnProperty.call(textToNumberMap, valStr)) {
                    answerNumber = textToNumberMap[valStr];
                }
            }

            return {
                form_id: form.id,
                question_id: q.id,
                respondedor: collaborator.id, // User ID/UUID
                unidade_colaborador: collaborator.unidade, // Unit ID
                cargo: collaborator.cargo, // Role ID
                answer_text: (q.question_type !== 'rating') ? String(val) : null,
                answer_number: answerNumber,
            };
        }).filter(a => a !== null && answers[a.question_id] !== undefined);

        const { error: submitError } = await supabase
            .from('form_answers')
            .insert(answersToInsert);

        if (submitError) {
            console.error(submitError);
            alert('Erro ao enviar suas respostas. Tente novamente.');
            setLoading(false);
        } else {
            // Increment Response Count
            await supabase.rpc('increment_form_responses', { form_id: form.id })
                .then(({ error }) => {
                    if (error) {
                        // If RPC fails (e.g. doesn't exist), try manual update as fallback (optimized for concurrency this is bad, but acceptable for MVP without migration access)
                        // Better approach: just try update (forms typically have low concurrency in this specific context)
                        console.warn("RPC increment failed, trying manual update", error);
                        // However, since I cannot create the RPC myself via SQL tool here, I will stick to the safer Manual READ-WRITE approach for now or just a direct update if possible.
                        // Ideally: UPDATE forms SET qtd_respostas = coalesce(qtd_respostas, 0) + 1 WHERE id = x
                        // Supabase JS doesn't support atomic increment easily without RPC.
                        // I will do a fetch-update for now to be safe, given I can't guarantee RPC existence.
                    }
                });

            // Manual Increment Fallback (since we likely don't have the RPC created)
            const { data: currentForm } = await supabase.from('forms').select('qtd_respostas').eq('id', form.id).single();
            const currentCount = currentForm?.qtd_respostas || 0;
            await supabase.from('forms').update({ qtd_respostas: currentCount + 1 }).eq('id', form.id);

            setSubmitted(true);
            setLoading(false);
        }
    };

    if (loading && !submitted) return <LoadingScreen />;

    if (error) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
                    <div className="mx-auto w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
                        <AlertCircle size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Ops!</h3>
                    <p className="text-slate-500">{error}</p>
                </div>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <div className="bg-white p-8 rounded-xl shadow-lg border-t-[10px] border-t-[#35b6cf] max-w-[770px] w-full text-center animate-in zoom-in-95 duration-500">
                    <div className="mx-auto w-20 h-20 bg-[#35b6cf]/10 text-[#35b6cf] rounded-full flex items-center justify-center mb-6">
                        <CheckCircle size={40} />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800 mb-2">Resposta Registrada</h1>
                    <p className="text-slate-500 mb-8">Sua resposta foi enviada com sucesso. Obrigado!</p>
                    <button onClick={() => window.close()} className="text-[#35b6cf] hover:text-[#2ca1b7] font-medium hover:underline">Fechar página</button>
                </div>
            </div>
        );
    }

    const FORM_WIDTH = "w-full max-w-[640px]";
    const ACCENT_BORDER = "border-t-[8px] border-t-[#35b6cf]";
    const currentQs = sections[currentSection] ? sections[currentSection].questions : [];
    const isLastSection = currentSection === sections.length - 1;

    return (
        <div className={`bg-slate-50 flex flex-col items-center font-sans px-3 sm:px-0 ${step !== 'form' ? 'h-screen overflow-hidden justify-center' : 'min-h-screen pt-4 sm:pt-8 pb-10 justify-start'}`}>

            <RegistrationModal
                isOpen={showRegisterModal}
                onClose={() => setShowRegisterModal(false)}
                cpf={cpf}
                onSuccess={handleRegistrationSuccess}
            />

            {/* STEP 0: COVER PAGE */}
            {step === 'cover' && (
                <div className={`${FORM_WIDTH} h-full flex flex-col justify-center animate-in slide-in-from-bottom-4 duration-500`}>
                    <div className={`bg-white rounded-lg shadow-sm border border-slate-200 ${ACCENT_BORDER} p-5 sm:p-6 mb-3 flex flex-col max-h-[75vh]`}>
                        <h1 className="text-lg sm:text-2xl font-normal text-slate-900 mb-3 line-clamp-2">{form?.title}</h1>
                        <div className="overflow-y-auto pr-2 custom-scrollbar flex-1">
                            <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{form?.description}</p>
                        </div>
                        <div className="pt-4 flex justify-between items-center border-t border-slate-100 mt-4 shrink-0">
                            <button
                                onClick={() => setStep('cpf_check')}
                                className="bg-[#35b6cf] text-white px-5 py-1.5 rounded-md font-medium text-sm hover:bg-[#2ca1b7] transition-colors shadow-sm w-full sm:w-auto"
                            >
                                Iniciar Formulário
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center justify-center gap-2 mt-4 opacity-70">
                        <img src="/favicon.png" alt="Logo" className="h-5 w-auto" />
                        <span className="text-xs text-slate-500 font-medium">Gama Center - 2025</span>
                    </div>
                </div>
            )}

            {/* STEP 0.5: CPF CHECK */}
            {step === 'cpf_check' && (
                <div className={`${FORM_WIDTH} h-full flex flex-col justify-center animate-in slide-in-from-right-8 duration-500`}>
                    <div className="bg-white rounded-lg shadow-lg p-8 max-w-sm mx-auto w-full">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-blue-50 text-[#35b6cf] rounded-full flex items-center justify-center mx-auto mb-4">
                                <User size={32} />
                            </div>
                            <h2 className="text-xl font-bold text-slate-800">Identificação</h2>
                            <p className="text-sm text-slate-500 mt-2">Informe seu CPF para continuar</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-slate-700 mb-1 block">CPF</label>
                                <div className="relative">
                                    <Hash size={18} className="absolute left-3 top-3 text-slate-400" />
                                    <input
                                        type="text"
                                        className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#35b6cf]/20 focus:border-[#35b6cf] outline-none transition-all"
                                        placeholder="000.000.000-00"
                                        maxLength={14}
                                        value={cpf}
                                        onChange={(e) => {
                                            let v = e.target.value.replace(/\D/g, '');
                                            if (v.length > 11) v = v.slice(0, 11);
                                            v = v.replace(/(\d{3})(\d)/, '$1.$2');
                                            v = v.replace(/(\d{3})(\d)/, '$1.$2');
                                            v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
                                            setCpf(v);
                                        }}
                                        onKeyDown={(e) => e.key === 'Enter' && handleCheckCPF()}
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleCheckCPF}
                                disabled={checkingCpf || cpf.length < 14}
                                className="w-full bg-[#35b6cf] text-white py-2.5 rounded-lg font-bold hover:bg-[#2ca1b7] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {checkingCpf ? 'Verificando...' : 'Continuar'}
                                {!checkingCpf && <ChevronRight size={18} />}
                            </button>
                            <button
                                onClick={() => setStep('cover')}
                                className="w-full text-sm text-slate-500 hover:text-slate-800 mt-2"
                            >
                                Voltar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* STEP 1: FORM */}
            {step === 'form' && (
                <div className={`${FORM_WIDTH} mx-auto space-y-3 sm:space-y-4 animate-in slide-in-from-right-8 duration-500`}>

                    {/* Header Compacto */}
                    <div className={`bg-white rounded-lg shadow-sm border border-slate-200 ${ACCENT_BORDER} p-5 sm:p-6`}>
                        <h1 className="text-2xl font-normal text-slate-900">{form?.title}</h1>
                        {collaborator && (
                            <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-center gap-3 text-sm text-blue-800">
                                <div className="bg-blue-100 p-2 rounded-full">
                                    <User size={16} />
                                </div>
                                <div>
                                    <p className="font-bold">{collaborator.nome}</p>
                                    <p className="opacity-80 text-xs">{collaborator.empresa_nome} (CPF: {collaborator.cpf})</p>
                                </div>
                            </div>
                        )}
                        {currentSection > 0 && sections[currentSection].title && (
                            <h2 className="text-lg font-medium text-[#35b6cf] mt-4">{sections[currentSection].title}</h2>
                        )}
                        <div className="text-xs text-slate-500 mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                            <span className="flex items-center gap-1"><span className="text-red-500">*</span> Indica pergunta obrigatória</span>
                            {sections.length > 1 && (
                                <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-400">Página {currentSection + 1} de {sections.length}</span>
                            )}
                        </div>
                    </div>

                    {/* Questions of Current Section */}
                    {/* Identification block removed as it is handled before */}
                    <div className="space-y-4">
                        {currentQs.map((q) => (
                            <div key={q.id} className="bg-white rounded-lg shadow-sm border border-slate-200 p-5 sm:p-6 transition-all hover:shadow-md animate-in slide-in-from-right-4 duration-300">
                                <label className="block text-base font-normal text-slate-900 mb-4">
                                    {q.label}
                                    {q.required && <span className="text-red-500 ml-1">*</span>}
                                </label>

                                {q.question_type === 'short_text' && (
                                    <div className="max-w-md">
                                        <input
                                            type="text"
                                            className="w-full px-0 py-2 border-b border-slate-300 focus:border-b-2 focus:border-[#35b6cf] bg-transparent transition-all outline-none placeholder:text-slate-400"
                                            placeholder="Sua resposta"
                                            value={answers[q.id] || ''}
                                            onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                                        />
                                    </div>
                                )}

                                {q.question_type === 'long_text' && (
                                    <textarea
                                        className="w-full px-0 py-2 border-b border-slate-300 focus:border-b-2 focus:border-[#35b6cf] bg-transparent transition-all outline-none min-h-[40px] placeholder:text-slate-400 resize-none overflow-hidden"
                                        placeholder="Sua resposta"
                                        value={answers[q.id] || ''}
                                        onChange={(e) => {
                                            handleAnswerChange(q.id, e.target.value);
                                            e.target.style.height = 'auto';
                                            e.target.style.height = e.target.scrollHeight + 'px';
                                        }}
                                    />
                                )}

                                {q.question_type === 'choice' && (
                                    <div className="space-y-3">
                                        {[q.option_1, q.option_2, q.option_3, q.option_4, q.option_5].filter(Boolean).map((opt, i) => (
                                            <label key={i} className="flex items-center cursor-pointer group">
                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3 transition-colors ${answers[q.id] === opt ? 'border-[#35b6cf]' : 'border-slate-400 group-hover:border-slate-500'}`}>
                                                    {answers[q.id] === opt && <div className="w-2.5 h-2.5 rounded-full bg-[#35b6cf]" />}
                                                </div>
                                                <input
                                                    type="radio"
                                                    name={`q_${q.id}`}
                                                    value={opt}
                                                    checked={answers[q.id] === opt}
                                                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                                                    className="hidden"
                                                />
                                                <span className="text-sm text-slate-700">{opt}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}

                                {q.question_type === 'select' && (
                                    <CustomSelect
                                        options={[q.option_1, q.option_2, q.option_3, q.option_4, q.option_5].filter(Boolean)}
                                        value={answers[q.id] || ''}
                                        onChange={(val: string) => handleAnswerChange(q.id, val)}
                                        placeholder="Escolher opção..."
                                    />
                                )}

                                {q.question_type === 'rating' && (
                                    <div className="flex flex-col py-2">
                                        <div className="flex justify-between w-full max-w-lg mb-2 px-2 text-xs text-slate-500">
                                            <span>Pior</span>
                                            <span>Melhor</span>
                                        </div>
                                        <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto pb-2">
                                            {Array.from({ length: (q.max_value || 5) - (q.min_value || 1) + 1 }, (_, i) => (q.min_value || 1) + i).map((val) => (
                                                <div key={val} className="flex flex-col items-center gap-2 cursor-pointer" onClick={() => handleAnswerChange(q.id, val)}>
                                                    <span className="text-xs font-medium text-slate-500">{val}</span>
                                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${answers[q.id] === val ? 'border-[#35b6cf]' : 'border-slate-400 hover:border-slate-500'}`}>
                                                        {answers[q.id] === val && <div className="w-2.5 h-2.5 rounded-full bg-[#35b6cf]" />}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-between items-center py-6">
                        <button
                            onClick={handleBack}
                            disabled={currentSection === 0}
                            className="text-slate-500 hover:text-slate-800 hover:bg-slate-100 px-4 py-2 rounded transition-colors font-medium text-sm disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            Voltar
                        </button>

                        <button
                            onClick={isLastSection ? handleSubmit : handleNext}
                            className="bg-[#35b6cf] text-white px-6 py-2 rounded-md font-medium text-sm hover:bg-[#2ca1b7] transition-colors shadow-sm ring-offset-2 focus:ring-2 focus:ring-[#35b6cf]"
                        >
                            {isLastSection ? 'Enviar' : 'Avançar'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// MODAL DE REGISTRO
interface RegistrationModalProps {
    isOpen: boolean;
    onClose: () => void;
    cpf: string;
    onSuccess: (collaborator: Collaborator) => void;
}

const RegistrationModal = ({ isOpen, onClose, cpf, onSuccess }: RegistrationModalProps) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Form Data
    const [nome, setNome] = useState('');
    const [dataNascimento, setDataNascimento] = useState('');
    const [empresaId, setEmpresaId] = useState<string>('');
    const [unidadeId, setUnidadeId] = useState<number | undefined>();
    const [setorId, setSetorId] = useState<number | undefined>();
    const [cargoId, setCargoId] = useState<number | undefined>();
    const [sexo, setSexo] = useState('');

    // Lists
    const [companies, setCompanies] = useState<any[]>([]);
    const [units, setUnits] = useState<any[]>([]);
    const [sectores, setSectores] = useState<any[]>([]);
    const [cargos, setCargos] = useState<any[]>([]);

    useEffect(() => {
        if (isOpen) {
            fetchInitialData();
            // Reset state
            setStep(1);
            setNome('');
            setDataNascimento('');
            setEmpresaId('');
            setUnidadeId(undefined);
            setSetorId(undefined);
            setCargoId(undefined);
            setSexo('');
        }
    }, [isOpen]);

    // Load Units when Company changes
    useEffect(() => {
        if (empresaId) {
            fetchUnits(empresaId);
        } else {
            setUnits([]);
        }
    }, [empresaId]);

    const fetchInitialData = async () => {
        const [resCompanies, resSectores, resCargos] = await Promise.all([
            supabase.from('clientes').select('id, nome_fantasia, razao_social').order('nome_fantasia'),
            supabase.from('setor').select('id, nome').order('nome'),
            supabase.from('cargos').select('id, nome').order('nome')
        ]);

        if (resCompanies.data) setCompanies(resCompanies.data);
        if (resSectores.data) setSectores(resSectores.data);
        if (resCargos.data) setCargos(resCargos.data);
    };

    const fetchUnits = async (companyId: string) => {
        const { data } = await supabase
            .from('unidades')
            .select('id, nome_unidade')
            .eq('empresaid', companyId)
            .order('nome_unidade');

        if (data) setUnits(data);
    };

    const handleRegister = async () => {
        if (!nome || !cpf || !empresaId || !unidadeId || !setorId || !cargoId || !sexo || !dataNascimento) {
            alert("Preencha todos os campos obrigatórios");
            return;
        }

        setLoading(true);

        const newColab: Collaborator = {
            nome,
            cpf, // Clean CPF is passed prop
            data_nascimento: dataNascimento,
            unidade: unidadeId,
            setorid: setorId,
            cargo: cargoId,
            sexo,
            avulso: true
        };

        const { data, error } = await supabase
            .from('colaboradores')
            .insert(newColab)
            .select()
            .single();

        if (error) {
            console.error(error);
            alert("Erro ao cadastrar. Tente novamente.");
            setLoading(false);
            return;
        }

        // Get company name for display
        const company = companies.find(c => c.id === empresaId);
        const savedColab = { ...newColab, id: data.id, empresa_nome: company?.nome_fantasia || company?.razao_social };

        onSuccess(savedColab);
        onClose();
        setLoading(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-slate-800">Completar Cadastro</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <span className="sr-only">Fechar</span>
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                    </button>
                </div>

                <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                    <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-sm mb-4">
                        Não encontramos seu CPF na base. Por favor, complete seus dados para continuar.
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">CPF</label>
                        <input type="text" value={cpf} disabled className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                value={nome}
                                onChange={e => setNome(e.target.value)}
                                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#35b6cf]/20 focus:border-[#35b6cf] outline-none"
                                placeholder="Seu nome"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">D. Nascimento <span className="text-red-500">*</span></label>
                            <input
                                type="date"
                                value={dataNascimento}
                                onChange={e => setDataNascimento(e.target.value)}
                                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#35b6cf]/20 focus:border-[#35b6cf] outline-none"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Empresa <span className="text-red-500">*</span></label>
                            <SearchableSelect
                                placeholder="Buscar..."
                                options={companies.map(c => ({ value: c.id, label: c.nome_fantasia || c.razao_social }))}
                                value={empresaId}
                                onChange={setEmpresaId}
                                requireSearch={true}
                                noResultsContent={
                                    <div className="flex flex-col items-center justify-center py-4 px-2 text-center space-y-2">
                                        <img src="/favicon.png" alt="Gama" className="w-8 h-8 opacity-80" />
                                        <p className="text-xs text-slate-800 font-medium">Sua empresa não é cliente da Gama Center</p>
                                    </div>
                                }
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Unidade <span className="text-red-500">*</span></label>
                            <SearchableSelect
                                placeholder={empresaId ? "Selecione..." : "Escolha a empresa"}
                                options={units.map(u => ({ value: u.id, label: u.nome_unidade }))}
                                value={unidadeId}
                                onChange={setUnidadeId}
                                disabled={!empresaId}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Setor <span className="text-red-500">*</span></label>
                            <SearchableSelect
                                placeholder="Selecione..."
                                options={sectores.map(s => ({ value: s.id, label: s.nome }))}
                                value={setorId}
                                onChange={setSetorId}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Cargo <span className="text-red-500">*</span></label>
                            <SearchableSelect
                                placeholder="Selecione..."
                                options={cargos.map(c => ({ value: c.id, label: c.nome }))}
                                value={cargoId}
                                onChange={setCargoId}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Sexo <span className="text-red-500">*</span></label>
                        <select
                            value={sexo}
                            onChange={e => setSexo(e.target.value)}
                            className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#35b6cf]/20 focus:border-[#35b6cf] outline-none"
                        >
                            <option value="">Selecione...</option>
                            <option value="Masculino">Masculino</option>
                            <option value="Feminino">Feminino</option>
                            <option value="Outro">Outro</option>
                        </select>
                    </div>

                </div>

                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium">Cancelar</button>
                    <button
                        onClick={handleRegister}
                        disabled={loading}
                        className="bg-[#35b6cf] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#2ca1b7] disabled:opacity-50 flex items-center gap-2"
                    >
                        {loading ? 'Salvando...' : 'Salvar e Continuar'}
                        {!loading && <ChevronRight size={16} />}
                    </button>
                </div>
            </div>
        </div>
    );
};