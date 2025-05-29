import { useEnvs } from '@/web/lib/react-query';
import { ONLINE_STATUS_INTERVAL } from '@sound-connect/common/constants';
import {
    NotificationMessage,
    notificationMessageSchema,
    OnlineStatus,
    onlineStatusMessageSchema,
    WebSocketMessage,
    webSocketMessageSchema
} from '@sound-connect/common/types';
import React, { createContext, useContext, useEffect, useState } from 'react';

type Context = {
    statuses: Map<string, OnlineStatus>;
    notifications: Map<string, NotificationMessage>;
};

const UserStatusesContext = createContext<Context | undefined>(undefined);

type Props = {
    children: React.ReactNode;
};

export const UserStatusesProvider = ({ children }: Props) => {
    const { data: envs } = useEnvs();
    const [statuses, setStatuses] = useState<Map<string, OnlineStatus>>(new Map());
    const [notifications, setNotifications] = useState<Map<string, NotificationMessage>>(new Map());

    useEffect(() => {
        if (!envs) return;

        const { API_URL } = envs;
        const ws = new WebSocket(`${API_URL}/ws/user`);
        const timeouts: NodeJS.Timeout[] = [];

        const clearTimeouts = () => {
            for (const timeout of timeouts) {
                clearTimeout(timeout);
            }
        };

        ws.onmessage = (event) => {
            const json = JSON.parse(event.data);
            const { type } = webSocketMessageSchema.parse(json);

            if (type === 'online-status') {
                clearTimeouts();

                const onlineStatus = onlineStatusMessageSchema.parse(json);

                setStatuses((prevStatuses) => {
                    const newStatuses = new Map(prevStatuses);
                    newStatuses.set(onlineStatus.userId, onlineStatus.status);
                    return newStatuses;
                });

                const timeout = setTimeout(() => {
                    setStatuses((prev) => {
                        const newStatuses = new Map(prev);
                        newStatuses.set(onlineStatus.userId, 'offline');
                        return newStatuses;
                    });
                }, ONLINE_STATUS_INTERVAL + 5000);

                timeouts.push(timeout);
            }

            if (type === 'notification') {
                const notification = notificationMessageSchema.parse(json);

                setNotifications((prev) => {
                    const newNotifications = new Map(prev);
                    newNotifications.set(notification.id, notification);
                    return newNotifications;
                });
            }
        };

        ws.onopen = () => {
            const message: WebSocketMessage = { type: 'connect' };
            ws.send(JSON.stringify(message));
            console.log('[Provider] WebSocket connection established');
        };

        ws.onclose = () => {
            const message: WebSocketMessage = { type: 'disconnect' };
            ws.send(JSON.stringify(message));
            console.log('[Provider] WebSocket connection closed');
        };

        ws.onerror = (error) => {
            const message: WebSocketMessage = { type: 'disconnect' };
            ws.send(JSON.stringify(message));
            console.error('[Provider] WebSocket error:', error);
        };

        return () => {
            ws.close();
            clearTimeouts();
        };
    }, [envs]);

    return <UserStatusesContext.Provider value={{ statuses, notifications }}>{children}</UserStatusesContext.Provider>;
};

export const useUserStatuses = () => {
    const context = useContext(UserStatusesContext);

    if (!context) {
        throw new Error('useUserStatuses must be used within a UserStatusesProvider');
    }

    return context;
};
