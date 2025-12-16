import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { format } from 'date-fns';

export interface Notification {
    id: string; // Composite key: clientId_unityId_docType
    clientId: string;
    clientName: string;
    docType: string;
    date: string;
    unityId: number;
}

interface NotificationContextType {
    unreadCount: number;
    notifications: Notification[];
    markAsRead: (id: string) => void;
    markClientAsRead: (clientId: string) => void;
    refresh: () => void;
}

const NotificationContext = createContext<NotificationContextType>({
    unreadCount: 0,
    notifications: [],
    markAsRead: () => { },
    markClientAsRead: () => { },
    refresh: () => { },
});

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const fetchNotifications = async () => {
        try {
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

            const allNotifications: Notification[] = [];

            // Get read IDs from local storage
            const readNotifications = JSON.parse(localStorage.getItem('read_notifications') || '[]');

            data.forEach(cliente => {
                cliente.unidades?.forEach((unidade: any) => {
                    unidade.clientes_documentacoes?.forEach((doc: any) => {
                        const check = (dateStr: string | undefined, label: string) => {
                            if (!dateStr) return;
                            const date = new Date(dateStr);
                            if (date >= today && date <= thirtyDaysFromNow) {
                                const notifId = `${cliente.id}_${unidade.id}_${label}`;
                                if (!readNotifications.includes(notifId)) {
                                    allNotifications.push({
                                        id: notifId,
                                        clientId: cliente.id,
                                        clientName: cliente.nome_fantasia || 'Empresa Sem Nome',
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

            setNotifications(allNotifications);
        } catch (err) {
            console.error('Error fetching notifications:', err);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const markAsRead = (id: string) => {
        const readNotifications = JSON.parse(localStorage.getItem('read_notifications') || '[]');
        if (!readNotifications.includes(id)) {
            const updated = [...readNotifications, id];
            localStorage.setItem('read_notifications', JSON.stringify(updated));
            // Update state safely
            setNotifications(prev => prev.filter(n => n.id !== id));
        }
    };

    const markClientAsRead = (clientId: string) => {
        const readNotifications = JSON.parse(localStorage.getItem('read_notifications') || '[]');
        const toMark = notifications.filter(n => n.clientId === clientId).map(n => n.id);

        if (toMark.length > 0) {
            const updated = [...readNotifications, ...toMark];
            // Deduplicate just in case
            const unique = Array.from(new Set(updated));
            localStorage.setItem('read_notifications', JSON.stringify(unique));
            setNotifications(prev => prev.filter(n => n.clientId !== clientId));
        }
    };

    const uniqueClientsWithNotifications = new Set(notifications.map(n => n.clientId));

    return (
        <NotificationContext.Provider value={{
            unreadCount: uniqueClientsWithNotifications.size,
            notifications,
            markAsRead,
            markClientAsRead,
            refresh: fetchNotifications
        }}>
            {children}
        </NotificationContext.Provider>
    );
};
