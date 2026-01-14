import React from 'react';
import { X, FileText, Image as ImageIcon } from 'lucide-react';

export interface Justification {
    id: number;
    usuario: string; // Changed from user_id as per request
    tipo: string;
    texto: string;
    img?: string; // URL or base64
    aprovada: boolean | null;
    created_at?: string;
}

interface JustificationDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    justification: Justification | null | undefined;
    onApprove: (id: number) => Promise<void>;
    onReject: (id: number) => Promise<void>;
}

export const JustificationDetailsModal: React.FC<JustificationDetailsModalProps> = ({
    isOpen,
    onClose,
    justification,
    applicantName,
    onApprove,
    onReject
}) => {
    const [loading, setLoading] = React.useState(false);

    if (!isOpen || !justification) return null;

    const handleAction = async (action: 'approve' | 'reject') => {
        setLoading(true);
        try {
            if (action === 'approve') {
                await onApprove(justification.id);
            } else {
                await onReject(justification.id);
            }
            onClose();
        } catch (error) {
            console.error("Error processing justification:", error);
            alert("Erro ao processar a justificativa. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="p-5 border-b border-slate-100 bg-amber-50 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-amber-100 p-2 rounded-xl text-amber-600">
                            <FileText size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800">Justificativa Pendente</h3>
                            {applicantName && <p className="text-xs text-slate-500">De: {applicantName}</p>}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="p-2 hover:bg-black/5 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Type Badge */}
                    <div>
                        <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border border-slate-200">
                            {justification.tipo}
                        </span>
                    </div>

                    {/* text */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase">Motivo / Descrição</label>
                        <p className="text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm leading-relaxed">
                            {justification.texto || "Sem descrição."}
                        </p>
                    </div>

                    {/* Image Attachment */}
                    {justification.img && (
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                                <ImageIcon size={14} />
                                Anexo
                            </label>
                            <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                                <img
                                    src={justification.img}
                                    alt="Comprovante"
                                    className="w-full h-auto max-h-64 object-contain"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between gap-3">
                    <button
                        onClick={() => handleAction('reject')}
                        disabled={loading}
                        className="flex-1 px-4 py-2.5 bg-red-100 text-red-700 font-bold rounded-xl hover:bg-red-200 transition-colors shadow-sm disabled:opacity-50"
                    >
                        {loading ? 'Processando...' : 'Recusar'}
                    </button>
                    <button
                        onClick={() => handleAction('approve')}
                        disabled={loading}
                        className="flex-1 px-4 py-2.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50 shadow-green-600/20"
                    >
                        {loading ? 'Processando...' : 'Aceitar'}
                    </button>
                </div>

            </div>
        </div>
    );
};
