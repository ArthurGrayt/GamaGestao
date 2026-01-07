
import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { Form, FormQuestion } from '../types';
import { CheckCircle, Check, AlertCircle, ChevronRight, Send, Star, User, Hash, ChevronDown } from 'lucide-react';

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

export const FormularioPublico: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const [form, setForm] = useState<Form | null>(null);
    const [questions, setQuestions] = useState<FormQuestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);

    // Form State
    const [answers, setAnswers] = useState<Record<number, any>>({});
    const [respondentName, setRespondentName] = useState('');
    const [respondentCpf, setRespondentCpf] = useState('');
    const [respondentEmail, setRespondentEmail] = useState('');

    // Validation State
    const [isIdentityValid, setIsIdentityValid] = useState(false);
    const [step, setStep] = useState<'cover' | 'form'>('cover');
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

        // Filter out empty sections if they are not the first one (though user might want empty pages?)
        // Let's keep them, maybe they just have text (if we had text-only items).
        // Since we only have questions, empty sections are weird but valid.
        return list;
    }, [questions, form]);

    useEffect(() => {
        if (slug) fetchForm();
    }, [slug]);

    useEffect(() => {
        if (form?.title) {
            document.title = form.title;
        }
    }, [form]);

    useEffect(() => {
        const isValidName = respondentName.trim().split(' ').length >= 2; // At least 2 names
        const isValidCpf = validateCPF(respondentCpf);
        // Only validate identity if we are at the step where identity is shown or submitted
        // Identity is always shown at the top of the form view, so logic holds.
        setIsIdentityValid(isValidName && isValidCpf);
    }, [respondentName, respondentCpf]);

    const validateCPF = (cpf: string) => {
        cpf = cpf.replace(/[^\d]+/g, '');
        if (cpf === '') return false;
        // Elimina CPFs invalidos conhecidos
        if (cpf.length !== 11 ||
            cpf === "00000000000" ||
            cpf === "11111111111" ||
            cpf === "22222222222" ||
            cpf === "33333333333" ||
            cpf === "44444444444" ||
            cpf === "55555555555" ||
            cpf === "66666666666" ||
            cpf === "77777777777" ||
            cpf === "88888888888" ||
            cpf === "99999999999")
            return false;
        // Valida 1o digito
        let add = 0;
        for (let i = 0; i < 9; i++)
            add += parseInt(cpf.charAt(i)) * (10 - i);
        let rev = 11 - (add % 11);
        if (rev === 10 || rev === 11)
            rev = 0;
        if (rev !== parseInt(cpf.charAt(9)))
            return false;
        // Valida 2o digito
        add = 0;
        for (let i = 0; i < 10; i++)
            add += parseInt(cpf.charAt(i)) * (11 - i);
        rev = 11 - (add % 11);
        if (rev === 10 || rev === 11)
            rev = 0;
        if (rev !== parseInt(cpf.charAt(10)))
            return false;
        return true;
    };

    const fetchForm = async () => {
        setLoading(true);
        const minWaitPromise = new Promise(resolve => setTimeout(resolve, 3000));

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
        const { data: questionData, error: qError } = await supabase
            .from('form_questions')
            .select('*')
            .eq('form_id', formData.id)
            .order('question_order', { ascending: true });

        if (questionData) {
            setQuestions(questionData);
        }
        await minWaitPromise;
        setLoading(false);
    };

    const handleAnswerChange = (questionId: number, value: any) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: value
        }));
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

        // Validate Identity on first section
        if (currentSection === 0) {
            if (!isIdentityValid) {
                alert("Preencha seus dados de identificação corretamente antes de avançar.");
                return;
            }
        }

        if (validate(currentQs)) {
            setCurrentSection(prev => prev + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleBack = () => {
        if (currentSection > 0) {
            setCurrentSection(prev => prev - 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            setStep('cover');
        }
    };

    const handleSubmit = async () => {
        const currentQs = sections[currentSection].questions;
        if (!validate(currentQs)) return; // Validate last section
        if (!form) return;
        if (!isIdentityValid) {
            alert("Preencha seus dados corretamente antes de enviar.");
            return;
        }

        setLoading(true);

        const answersToInsert = questions.map(q => {
            if (q.question_type === 'section_break') return null;
            const val = answers[q.id];
            return {
                form_id: form.id,
                question_id: q.id,
                responder_name: respondentName,
                responder_identifier: `${respondentCpf} | ${respondentEmail}`,
                answer_text: (q.question_type !== 'rating') ? String(val) : null,
                answer_number: (q.question_type === 'rating') ? Number(val) : null,
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
            setSubmitted(true);
            setLoading(false);
        }
    };



    if (loading && !submitted) {
        return <LoadingScreen />;
    }

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

    // Identidade Visual Gama Gestão
    const FORM_WIDTH = "w-full max-w-[640px]";
    const ACCENT_BORDER = "border-t-[8px] border-t-[#35b6cf]";

    const currentQs = sections[currentSection] ? sections[currentSection].questions : [];
    const isLastSection = currentSection === sections.length - 1;

    return (
        <div className={`bg-slate-50 flex flex-col items-center font-sans px-3 sm:px-0 ${step === 'cover' ? 'h-screen overflow-hidden justify-center' : 'min-h-screen pt-4 sm:pt-8 pb-10 justify-start'}`}>
            {/* STEP 0: COVER PAGE */}
            {step === 'cover' && (
                <div className={`${FORM_WIDTH} h-full flex flex-col justify-center animate-in slide-in-from-bottom-4 duration-500`}>


                    <div className={`bg-white rounded-lg shadow-sm border border-slate-200 ${ACCENT_BORDER} p-5 sm:p-6 mb-3 flex flex-col max-h-[75vh]`}>
                        <h1 className="text-lg sm:text-2xl font-normal text-slate-900 mb-3 line-clamp-2">{form?.title}</h1>
                        <div className="overflow-y-auto pr-2 custom-scrollbar flex-1">
                            <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{form?.description}</p>
                        </div>

                        <div className="pt-4 flex justify-between items-center border-t border-slate-100 mt-4 shrink-0">

                            <div className="flex gap-3">

                                <button
                                    onClick={() => setStep('form')}
                                    className="bg-[#35b6cf] text-white px-5 py-1.5 rounded-md font-medium text-sm hover:bg-[#2ca1b7] transition-colors shadow-sm ring-offset-2 focus:ring-2 focus:ring-[#35b6cf]"
                                >
                                    Começar
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center justify-center gap-2 mt-4 opacity-70">
                        <img src="/favicon.png" alt="Logo" className="h-5 w-auto" />
                        <span className="text-xs text-slate-500 font-medium">Gama Center - 2025</span>
                    </div>
                </div>
            )}

            {/* STEP 1: FORM */}
            {step === 'form' && (
                <div className={`${FORM_WIDTH} mx-auto space-y-3 sm:space-y-4 animate-in slide-in-from-right-8 duration-500`}>
                    {/* Header Compacto */}
                    <div className={`bg-white rounded-lg shadow-sm border border-slate-200 ${ACCENT_BORDER} p-5 sm:p-6`}>
                        <h1 className="text-2xl font-normal text-slate-900">{form?.title}</h1>
                        {currentSection > 0 && sections[currentSection].title && (
                            <h2 className="text-lg font-medium text-[#35b6cf] mt-1">{sections[currentSection].title}</h2>
                        )}
                        <div className="text-xs text-slate-500 mt-2 flex items-center justify-between">
                            <span className="flex items-center gap-1"><span className="text-red-500">*</span> Indica pergunta obrigatória</span>
                            {sections.length > 1 && (
                                <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-400">Página {currentSection + 1} de {sections.length}</span>
                            )}
                        </div>
                    </div>

                    {/* Identification (Mandatory) - SHOW ONLY ON FIRST SECTION */}
                    {currentSection === 0 && (
                        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5 sm:p-6 animate-in fade-in duration-500">
                            <h3 className="text-base font-normal text-slate-800 mb-6 flex items-center gap-2">
                                Identificação
                                {isIdentityValid ? <CheckCircle size={16} className="text-[#35b6cf]" /> : <span className="text-red-500 text-xs">* Obrigatório</span>}
                            </h3>
                            <div className="space-y-6">
                                <div className="relative">
                                    <label className="text-sm font-medium text-slate-700 mb-2 block">Nome Completo <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        placeholder="Sua resposta"
                                        className={`w-full px-0 py-2 border-b focus:border-b-2 bg-transparent transition-all outline-none ${respondentName && respondentName.trim().split(' ').length < 2 ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:border-[#35b6cf]'}`}
                                        value={respondentName}
                                        onChange={(e) => setRespondentName(e.target.value)}
                                    />
                                    {respondentName && respondentName.trim().split(' ').length < 2 && <p className="text-xs text-red-500 mt-1">Informe nome e sobrenome</p>}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                    <div>
                                        <label className="text-sm font-medium text-slate-700 mb-2 block">CPF <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            placeholder="Sua resposta"
                                            maxLength={14}
                                            className={`w-full px-0 py-2 border-b focus:border-b-2 bg-transparent transition-all outline-none ${respondentCpf && !validateCPF(respondentCpf) ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:border-blue-600'}`}
                                            value={respondentCpf}
                                            onChange={(e) => {
                                                let v = e.target.value.replace(/\D/g, '');
                                                if (v.length > 11) v = v.slice(0, 11);
                                                setRespondentCpf(v);
                                            }}
                                        />
                                        {respondentCpf && !validateCPF(respondentCpf) && <span className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={12} /> CPF inválido</span>}
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-slate-700 mb-2 block">Email</label>
                                        <input
                                            type="email"
                                            placeholder="Sua resposta"
                                            className="w-full px-0 py-2 border-b border-slate-300 focus:border-b-2 focus:border-blue-600 bg-transparent transition-all outline-none"
                                            value={respondentEmail}
                                            onChange={(e) => setRespondentEmail(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Questions of Current Section */}
                    <div className={`space-y-4 transition-all duration-500 ${currentSection === 0 && !isIdentityValid ? 'opacity-50 pointer-events-none blur-[2px] select-none' : 'opacity-100'}`}>
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

                    {/* Submit Bar */}
                    <div className="flex justify-between items-center py-6">
                        <button
                            onClick={handleBack}
                            className="text-slate-500 hover:text-slate-800 hover:bg-slate-100 px-4 py-2 rounded transition-colors font-medium text-sm"
                        >
                            Voltar
                        </button>

                        <button
                            onClick={isLastSection ? handleSubmit : handleNext}
                            disabled={currentSection === 0 && !isIdentityValid}
                            className="bg-[#35b6cf] text-white px-6 py-2 rounded-md font-medium text-sm hover:bg-[#2ca1b7] transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ring-offset-2 focus:ring-2 focus:ring-[#35b6cf]"
                        >
                            {isLastSection ? 'Enviar' : 'Avançar'}
                        </button>
                    </div>
                    <div className="text-center text-xs text-slate-400 pb-8">
                        Gama Center - 2025
                    </div>
                </div>
            )}
        </div>
    );
};
