import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useEnvs, useUser } from '@/web/lib/react-query';

export type WSStatus = 'connecting' | 'open' | 'error' | 'closed';

type NotificationsContext = {
    notificationsStatus: WSStatus;
};

const Context = createContext<NotificationsContext | undefined>(undefined);

type Props = React.PropsWithChildren;

export const NotificationsProvider = ({ children }: Props) => {
    const notificationsWs = useRef<WebSocket | null>(null);
    const { data: envs } = useEnvs();
    const { data: user } = useUser();

    const [notificationsStatus, setNotificationsStatus] = useState<WSStatus>('connecting');

    useEffect(() => {
        if (!envs || !user) return;

        const { API_URL } = envs;
        notificationsWs.current = new WebSocket(`${API_URL}/ws/notifications`);

        const handleOpen = () => {
            setNotificationsStatus('open');
        };

        const handleError = () => {
            setNotificationsStatus('error');
            console.error('[NotificationsWS] Connection error');
        };

        const handleClose = () => {
            setNotificationsStatus('closed');
        };

        const handleMessage = (event: MessageEvent) => {
            try {
                const json = JSON.parse(event.data);
                console.log('[NotificationsWS] Received message:', json);
            } catch (error) {
                console.error('[NotificationsWS] Error parsing message:', error);
            }
        };

        notificationsWs.current.addEventListener('open', handleOpen);
        notificationsWs.current.addEventListener('error', handleError);
        notificationsWs.current.addEventListener('close', handleClose);
        notificationsWs.current.addEventListener('message', handleMessage);

        return () => {
            if (!notificationsWs.current) return;

            notificationsWs.current.removeEventListener('open', handleOpen);
            notificationsWs.current.removeEventListener('error', handleError);
            notificationsWs.current.removeEventListener('close', handleClose);
            notificationsWs.current.removeEventListener('message', handleMessage);

            notificationsWs.current.close();
        };
    }, [envs, user]);

    const contextValue: NotificationsContext = {
        notificationsStatus
    };

    return <Context.Provider value={contextValue}>{children}</Context.Provider>;
};

export const useNotifications = (): NotificationsContext => {
    const context = useContext(Context);

    if (!context) {
        throw new Error('useNotifications must be used within a NotificationsProvider');
    }

    return context;
};
