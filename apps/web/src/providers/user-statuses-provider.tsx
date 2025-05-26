import { useEnvs } from '@/web/lib/react-query';
import { onlineStatusMessageSchema, WebSocketMessage, webSocketMessageSchema } from '@sound-connect/api/types';
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';

export type WSStatus = 'connecting' | 'open' | 'error' | 'closed';

interface UserStatusesContextType {}

const UserStatusesContext = createContext<UserStatusesContextType | undefined>(undefined);

interface UserStatusesProviderProps {
    children: React.ReactNode;
}

export const UserStatusesProvider: React.FC<UserStatusesProviderProps> = ({ children }) => {
    const wsRef = useRef<WebSocket | null>(null);
    const [status, setStatus] = useState<WSStatus>('connecting');
    const { data: envs } = useEnvs();

    useEffect(() => {
        if (!envs) return;

        const { API_URL } = envs;
        const ws = new WebSocket(`${API_URL}/ws/user`);
        wsRef.current = ws;

        ws.onmessage = (event) => {
            const json = JSON.parse(event.data);
            const { type } = webSocketMessageSchema.parse(json);

            if (type === 'online-status') {
                const data = onlineStatusMessageSchema.parse(json);
                console.log(data);
            }
        };

        ws.onopen = () => {
            setStatus('open');
            const message: WebSocketMessage = { type: 'connect' };
            ws.send(JSON.stringify(message));
            console.log('[Provider] WebSocket connection established');
        };

        ws.onclose = () => {
            setStatus('closed');
            const message: WebSocketMessage = { type: 'disconnect' };
            ws.send(JSON.stringify(message));
            console.log('[Provider] WebSocket connection closed');
        };

        ws.onerror = (error) => {
            setStatus('error');
            const message: WebSocketMessage = { type: 'disconnect' };
            ws.send(JSON.stringify(message));
            console.error('[Provider] WebSocket error:', error);
        };

        return () => {
            ws.close();
        };
    }, [envs]);

    return <UserStatusesContext.Provider value={{}}>{children}</UserStatusesContext.Provider>;
};

// Custom hook to use the context
export const useUserStatuses = () => {
    const context = useContext(UserStatusesContext);

    if (!context) {
        throw new Error('useUserStatuses must be used within a UserStatusesProvider');
    }

    return context;
};
