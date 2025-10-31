import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useEnvs, useUser } from '@/web/lib/react-query';
import type { Notification } from '@/common/types/drizzle';
import { getNotifications } from '@/web/server-functions/notifications';

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

type Props = React.PropsWithChildren;

export const NotificationsProvider = ({ children }: Props) => {
    const notificationsWs = useRef<WebSocket | null>(null);
    const { data: envs } = useEnvs();
    const { data: user } = useUser();

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

    useEffect(() => {
        if (!user) return;

        const loadNotifications = async () => {
            const result = await getNotifications();
            if (result.success && result.body) {
                setNotifications(result.body);
            } else {
                setNotifications([]);
            }
        };

        loadNotifications();
    }, [user]);

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
                const message = JSON.parse(event.data);

                if (message.type === 'notification') {
                    const notificationData = message.data;
                    const notification: Notification = {
                        id: Date.now(),
                        userId: notificationData.userId,
                        type: notificationData.type,
                        actorId: notificationData.actorId,
                        entityId: null,
                        entityType: null,
                        content: notificationData.content,
                        seen: false,
                        createdAt: new Date().toISOString()
                    };
                    addNotification(notification);
                }
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
    }, [envs, user, addNotification]);

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
