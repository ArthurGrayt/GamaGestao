import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useNavigate } from 'react-router-dom';
import { X, AlertTriangle, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { useNotifications } from '../contexts/NotificationContext';

interface Notification {
    id: string; // Composite key: clientId_unityId_docType
    clientId: string;
    clientName: string;
    docType: string;
    date: string;
    unityId: number;
}

// Global Audio Context & Buffer
let audioCtx: AudioContext | null = null;
let notificationBuffer: AudioBuffer | null = null;

// Initialize Audio Context and Load Sound
const initAudio = async () => {
    // 1. Create Context if missing
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    // 2. Resume if suspended (browser protection)
    if (audioCtx.state === 'suspended') {
        try {
            await audioCtx.resume();
        } catch (e) {
            console.warn('Audio resume failed:', e);
        }
    }

    // 3. Fetch and Decode MP3 if missing
    if (!notificationBuffer && audioCtx) {
        try {
            const response = await fetch('/notify.mp3');
            const arrayBuffer = await response.arrayBuffer();
            notificationBuffer = await audioCtx.decodeAudioData(arrayBuffer);
            console.log('✅ Notification sound loaded (/notify.mp3)');
        } catch (e) {
            console.error('❌ Failed to load /notify.mp3:', e);
        }
    }
};

const playNotificationSound = async () => {
    try {
        // Ensure everything is ready
        if (!audioCtx || !notificationBuffer) {
            await initAudio();
        }

        if (!audioCtx || !notificationBuffer) return;

        // Force resume again just in case
        if (audioCtx.state === 'suspended') {
            audioCtx.resume().catch(() => { });
        }

        // Create Source
        const source = audioCtx.createBufferSource();
        source.buffer = notificationBuffer;

        // Create Gain (Volume)
        const gainNode = audioCtx.createGain();
        gainNode.gain.value = 0.5;

        // Connect and Play
        source.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        source.start(0);

    } catch (e) {
        console.error('Audio play error:', e);
    }
};

const ToastSystemImpl: React.FC<{ notifications: any[], markClientAsRead: (id: string) => void }> = ({ notifications, markClientAsRead }) => {
    const [queue, setQueue] = useState<any[]>([]);
    const [current, setCurrent] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(false);
    const processedRef = React.useRef<Set<string>>(new Set());
    const navigate = useNavigate();

    // Sync state with props
    useEffect(() => {
        // Group by Client
        const grouped = notifications.reduce((acc, curr) => {
            if (!acc[curr.clientId]) {
                acc[curr.clientId] = {
                    clientId: curr.clientId,
                    clientName: curr.clientName,
                    docs: [],
                    date: curr.date,
                    unityId: curr.unityId
                };
            }
            if (!acc[curr.clientId].docs.includes(curr.docType)) {
                acc[curr.clientId].docs.push(curr.docType);
            }
            return acc;
        }, {} as Record<string, any>);

        const candidates = Object.values(grouped);
        const newItems = candidates.filter((c: any) => !processedRef.current.has(c.clientId));

        if (newItems.length > 0) {
            newItems.forEach((c: any) => processedRef.current.add(c.clientId));
            setQueue(prev => [...prev, ...newItems]);
        }
    }, [notifications]);

    useEffect(() => {
        if (!current && queue.length > 0) {
            const next = queue[0];
            const remaining = queue.slice(1);
            setQueue(remaining);
            setCurrent(next);

            // Play sound and wait for it to be ready (mostly context resume) before showing
            // This prevents "toast first, sound later" delay
            playNotificationSound().finally(() => {
                setTimeout(() => setIsVisible(true), 50); // Reduced delay since we already awaited sound
            });
        }
    }, [current, queue]);

    // 4. Auto Dismiss
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (isVisible && current) {
            timer = setTimeout(() => {
                handleDismiss();
            }, 6000);
        }
        return () => clearTimeout(timer);
    }, [isVisible, current]);

    const handleDismiss = () => {
        setIsVisible(false);
        setTimeout(() => {
            setCurrent(null);
        }, 1500);
    };

    const handleMarkAsRead = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!current) return;
        markClientAsRead(current.clientId); // Marks ALL docs for this client as read
        handleDismiss();
    };

    const handleClick = () => {
        if (!current) return;
        navigate('/clientes', {
            state: {
                openClientId: current.clientId,
                openTab: 'docs',
                targetUnitId: current.unityId
            }
        });
        handleDismiss();
    };

    if (!current) return null;

    const docText = current.docs.join(', ');
    const isMultiple = current.docs.length > 1;

    return (
        <div
            className={`fixed bottom-6 right-6 z-[100] max-w-sm transform transition-all duration-500 ease-in-out cursor-pointer
                ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
            `}
            onClick={handleClick}
        >
            <div className="bg-white border-l-4 border-amber-500 rounded-lg shadow-2xl p-4 flex items-start gap-3 relative overflow-hidden group">

                {/* Progress Bar */}
                <div className={`absolute bottom-0 left-0 h-1 bg-amber-100 w-full`}>
                    <div className={`h-full bg-amber-500 transition-all duration-[6000ms] ease-linear w-0 ${isVisible ? 'w-full' : ''}`}></div>
                </div>

                <div className="bg-amber-100 p-2 rounded-full text-amber-600 shrink-0">
                    <AlertTriangle size={20} />
                </div>

                <div className="flex-1 pr-6">
                    <h4 className="font-bold text-slate-800 text-sm">{current.clientName}</h4>
                    <p className="text-xs text-slate-600 mt-1">
                        {isMultiple ? 'Os documentos' : 'O documento'} <span className="font-semibold text-amber-600">{docText}</span> {isMultiple ? 'estão vencendo' : 'está vencendo'} dia {current.date}.
                    </p>
                    <div className="mt-2 flex items-center gap-3 text-[10px] font-medium">
                        <span className="text-blue-600 flex items-center gap-1">
                            Ver documentação <ExternalLink size={10} />
                        </span>
                        <button
                            onClick={handleMarkAsRead}
                            className="text-slate-400 hover:text-slate-600 hover:underline flex items-center gap-1 transition-colors z-10"
                        >
                            Marcar como Lida
                        </button>
                    </div>
                </div>

                <button
                    onClick={handleMarkAsRead}
                    className="absolute top-2 right-2 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                >
                    <X size={14} />
                </button>
            </div>
        </div>
    );
};

// Export Main Component (Wrapper)
export const ToastSystem: React.FC = () => {
    // Audio Init triggers
    useEffect(() => {
        const unlock = () => {
            initAudio();
            if (audioCtx?.state === 'running' && notificationBuffer) {
                document.removeEventListener('click', unlock);
                document.removeEventListener('keydown', unlock);
            }
        };
        document.addEventListener('click', unlock);
        document.addEventListener('keydown', unlock);
        return () => {
            document.removeEventListener('click', unlock);
            document.removeEventListener('keydown', unlock);
        };
    }, []);

    const { notifications, markClientAsRead } = useNotifications();
    return <ToastSystemImpl notifications={notifications} markClientAsRead={markClientAsRead} />;
};
