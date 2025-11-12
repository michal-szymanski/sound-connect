import React, { createContext, useContext, useEffect, useEffectEvent, useRef, useState, useCallback } from 'react';
import type { Notification, User } from '@/common/types/drizzle';
import { wsNotificationInboundMessageSchema } from '@/common/types/notifications';

export type WSStatus = 'connecting' | 'open' | 'error' | 'closed';

type NotificationsContext = {
    notificationsStatus: WSStatus;
    notifications: Notification[];
    addNotification: (notification: Notification) => void;
    removeNotification: (notificationId: number) => void;
    markAsSeen: (notificationId: number) => void;
    markAllAsSeen: () => void;
    unreadCount: number;
};

const Context = createContext<NotificationsContext | undefined>(undefined);

type Props = React.PropsWithChildren<{
    auth: {
        user: User;
        accessToken: string;
    };
    envs: {
        API_URL: string;
        CLIENT_URL: string;
    } | null;
}>;

export const NotificationsProvider = ({ auth, envs, children }: Props) => {
    const notificationsWs = useRef<WebSocket | null>(null);

    const [notificationsStatus, setNotificationsStatus] = useState<WSStatus>('connecting');
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const addNotification = useCallback((notification: Notification) => {
        setNotifications((prev) => [notification, ...prev]);
    }, []);

    const removeNotification = useCallback((notificationId: number) => {
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    }, []);

    const markAsSeen = useCallback((notificationId: number) => {
        setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, seen: true } : n)));
    }, []);

    const markAllAsSeen = useCallback(() => {
        setNotifications((prev) => prev.map((n) => ({ ...n, seen: true })));
    }, []);

    const unreadCount = notifications.filter((n) => !n.seen).length;

    const getAuth = useEffectEvent(() => auth);

    useEffect(() => {
        if (!envs) {
            return;
        }

        const currentAuth = getAuth();
        const { API_URL } = envs;
        const wsUrl = `${API_URL.replace(/^http/, 'ws')}/api/ws/notifications`;

        notificationsWs.current = new WebSocket(wsUrl, ['access_token', encodeURIComponent(currentAuth.accessToken)]);

        const handleOpen = () => {
            setNotificationsStatus('open');
        };

        const handleError = (event: Event) => {
            setNotificationsStatus('error');
            console.error('[NotificationsWS] Connection error', event);
        };

        const handleClose = () => {
            setNotificationsStatus('closed');
            setNotifications([]);
        };

        const handleMessage = (event: MessageEvent) => {
            try {
                const parsedData = JSON.parse(event.data);
                const message = wsNotificationInboundMessageSchema.parse(parsedData);

                if (message.type === 'initial') {
                    setNotifications(message.data);
                } else if (message.type === 'notification') {
                    addNotification(message.data);
                }
            } catch (error) {
                console.error('[NotificationsWS] Invalid message received:', error);
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

            if (notificationsWs.current.readyState !== WebSocket.CLOSED) {
                notificationsWs.current.close();
            }

            notificationsWs.current = null;
            setNotifications([]);
        };
    }, [envs, addNotification]);

    const contextValue: NotificationsContext = {
        notificationsStatus,
        notifications,
        addNotification,
        removeNotification,
        markAsSeen,
        markAllAsSeen,
        unreadCount
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
