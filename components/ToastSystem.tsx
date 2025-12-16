import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useNavigate } from 'react-router-dom';
import { X, AlertTriangle, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

interface Notification {
    id: string; // Composite key: clientId_unityId_docType
    clientId: string;
    clientName: string;
    docType: string;
    date: string;
    unityId: number;
}

const NOTIFICATION_SOUND = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjIwLjEwMAAAAAAAAAAAAAAA//uQZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWgAAAA0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABYaW5nAAAAEAAAAAEAAABXAAAIHwAGBgYGBgYKCgoKCgoODg4ODg4SEhISEhIWFhYWFhYaGhoaGhoeHh4eHh4iIiIiIiImJiYmJiYqKioqKiorKysrKysvLy8vLy8zMzMzMzM3Nzc3Nzc7Ozs7OztAQEBAQEBERERERERISEhISEhMTExMTExQUFBQUFBUVFRUVFRYWFhYWFhcXFxcXFxgYGBgYGBkZGRkZGRoaghoaGhwcHBwcHB0dHR0dHR4eHh4eHh8fHx8fHx/f39/f3+Dg4ODg4OHh4eHh4eLi4uLi4uPj4+Pj4+Tk5OTk5OXl5eXl5ebm5ubm5ufn5+fn5+jo6Ojo6OlpaWlpaWpqampqamtra2tra2xsbGxsbG1tbW1tbW5ubm5ubm9vb29vb3BwcHBwcHDw8PDw8PFxcXFxcXGxsbGxsbHx8fHx8fLy8vLy8vPz8/Pz8/T09PT09PU1NTU1NTY2NjY2Njc3Nzc3Nzg4ODg4ODk5OTk5OTp6enp6enr6+vr6+vv7+/v7+/z8/Pz8/P39/f39/f7+/v7+/v///8AAAA5AAAAAAAABgAAAABXAAAAAAAAAAAB//uQZAAABi0vS2w94AAAAADSDAAAAFuS9LbD3gAAAAANIMAAAAEAAAP8AAAAD/gAAA//uQZAAABi0vS2w94AAAAADSDAAAAFuS9LbD3gAAAAANIMAAAAEAAAP8AAAAD/gAAA//uQZAAABi0vS2w94AAAAADSDAAAAFuS9LbD3gAAAAANIMAAAAEAAAP8AAAAD/gAAA//uQZAAABi0vS2w94AAAAADSDAAAAFuS9LbD3gAAAAANIMAAAAEAAAP8AAAAD/gAAA';

// Global audio object to reuse and unlock
const audioPlayer = new Audio(NOTIFICATION_SOUND);
audioPlayer.volume = 0.5;

const playNotificationSound = () => {
    // Attempt play. If locked, it rejects.
    audioPlayer.currentTime = 0;
    audioPlayer.play().catch(e => {
        console.warn('Audio blocked, waiting for interaction...', e);
    });
};

export const ToastSystem: React.FC = () => {
    const [queue, setQueue] = useState<Notification[]>([]);
    const [currentNotification, setCurrentNotification] = useState<Notification | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const navigate = useNavigate();

    // Unlock Audio Context on first interaction
    useEffect(() => {
        const unlockAudio = () => {
            // Play silent/short and pause immediately to whitelist the element
            audioPlayer.play().then(() => {
                audioPlayer.pause();
                audioPlayer.currentTime = 0;
            }).catch(() => { });

            // Remove listeners once unlocked
            document.removeEventListener('click', unlockAudio);
            document.removeEventListener('keydown', unlockAudio);
        };

        document.addEventListener('click', unlockAudio);
        document.addEventListener('keydown', unlockAudio);

        return () => {
            document.removeEventListener('click', unlockAudio);
            document.removeEventListener('keydown', unlockAudio);
        };
    }, []);

    // Fetch notifications on mount
    useEffect(() => {
        const fetchExpiringDocs = async () => {
            try {
                // Fetch all clients with units and docs
                const { data, error } = await supabase
                    .from('clientes')
                    .select(`
                        id,
                        nome_fantasia,
                        unidades (
                            id,
                            clientes_documentacoes (
                                vencimento_pgr,
                                vencimento_pcmso,
                                vigencia_dir_aep,
                                esocial_procuracao
                            )
                        )
                    `);

                if (error || !data) return;

                const today = new Date();
                const thirtyDaysFromNow = new Date();
                thirtyDaysFromNow.setDate(today.getDate() + 30);

                const newNotifications: Notification[] = [];
                const readNotifications = JSON.parse(localStorage.getItem('read_notifications') || '[]');

                data.forEach(cliente => {
                    cliente.unidades?.forEach((unidade: any) => {
                        unidade.clientes_documentacoes?.forEach((doc: any) => {
                            const check = (dateStr: string | undefined, label: string) => {
                                if (!dateStr) return;
                                const date = new Date(dateStr);
                                if (date >= today && date <= thirtyDaysFromNow) {
                                    const notifId = `${cliente.id}_${unidade.id}_${label}`;
                                    // Only add if not read
                                    if (!readNotifications.includes(notifId)) {
                                        newNotifications.push({
                                            id: notifId,
                                            clientId: cliente.id,
                                            clientName: cliente.nome_fantasia,
                                            docType: label,
                                            date: format(date, 'dd/MM/yyyy'),
                                            unityId: unidade.id
                                        });
                                    }
                                }
                            };

                            check(doc.vencimento_pgr, 'PGR');
                            check(doc.vencimento_pcmso, 'PCMSO');
                            check(doc.vigencia_dir_aep, 'DIR/AEP');
                            check(doc.esocial_procuracao, 'Procuração eSocial');
                        });
                    });
                });

                if (newNotifications.length > 0) {
                    setQueue(newNotifications);
                }
            } catch (err) {
                console.error('Error fetching notifications:', err);
            }
        };

        fetchExpiringDocs();
    }, []);

    // Process Queue
    useEffect(() => {
        if (!currentNotification && queue.length > 0) {
            // Start next notification
            const next = queue[0];
            const remaining = queue.slice(1);

            setQueue(remaining);
            setCurrentNotification(next);

            // Small delay before showing to ensure animation triggers
            setTimeout(() => setIsVisible(true), 100);
        }
    }, [currentNotification, queue]);

    // Auto-dismiss logic
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (isVisible && currentNotification) {
            timer = setTimeout(() => {
                handleDismiss();
            }, 6000); // Show for 6 seconds
        }
        return () => clearTimeout(timer);
    }, [isVisible, currentNotification]);

    const handleDismiss = () => {
        setIsVisible(false);
        // Wait for fade out animation (500ms) + 1s delay as requested
        setTimeout(() => {
            setCurrentNotification(null);
        }, 1500);
    };

    const handleMarkAsRead = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!currentNotification) return;

        const readNotifications = JSON.parse(localStorage.getItem('read_notifications') || '[]');
        localStorage.setItem('read_notifications', JSON.stringify([...readNotifications, currentNotification.id]));

        handleDismiss();
    };

    const handleClick = () => {
        if (!currentNotification) return;
        navigate('/clientes', {
            state: {
                openClientId: currentNotification.clientId,
                openTab: 'docs',
                targetUnitId: currentNotification.unityId // Optional: could implement deep linking to unit too
            }
        });
        handleDismiss();
    };

    if (!currentNotification) return null;

    return (
        <div
            className={`fixed bottom-6 right-6 z-[100] max-w-sm transform transition-all duration-500 ease-in-out cursor-pointer
                ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
            `}
            onClick={handleClick}
        >
            <div className="bg-white border-l-4 border-amber-500 rounded-lg shadow-2xl p-4 flex items-start gap-3 relative overflow-hidden group">

                {/* Progress bar simulation (optional visual flare) */}
                <div className={`absolute bottom-0 left-0 h-1 bg-amber-100 w-full`}>
                    <div className={`h-full bg-amber-500 transition-all duration-[6000ms] ease-linear w-0 ${isVisible ? 'w-full' : ''}`}></div>
                </div>

                <div className="bg-amber-100 p-2 rounded-full text-amber-600 shrink-0">
                    <AlertTriangle size={20} />
                </div>

                <div className="flex-1 pr-6">
                    <h4 className="font-bold text-slate-800 text-sm">{currentNotification.clientName}</h4>
                    <p className="text-xs text-slate-600 mt-1">
                        O documento <span className="font-semibold text-amber-600">{currentNotification.docType}</span> está vencendo dia {currentNotification.date}.
                    </p>
                    <div className="mt-2 flex items-center gap-1 text-[10px] text-blue-600 font-medium">
                        Ver documentação <ExternalLink size={10} />
                    </div>
                </div>

                <button
                    onClick={handleMarkAsRead}
                    className="absolute top-2 right-2 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                    title="Marcar como lida"
                >
                    <X size={14} />
                </button>
            </div>
        </div>
    );
};
