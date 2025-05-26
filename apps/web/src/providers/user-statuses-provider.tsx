import { useEnvs } from '@/web/lib/react-query';
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
            const data = JSON.parse(event.data);
            console.log('[Provider] Received WebSocket message:', data);

            if (data.type === 'status-update') {
                console.log(data);
            }
        };

        ws.onopen = () => {
            setStatus('open');
            ws.send(JSON.stringify({ type: 'connect' }));
            console.log('[Provider] WebSocket connection established');
        };

        ws.onclose = () => {
            setStatus('closed');
            ws.send(JSON.stringify({ type: 'disconnect' }));
            console.log('[Provider] WebSocket connection closed');
        };

        ws.onerror = (error) => {
            setStatus('error');
            ws.send(JSON.stringify({ type: 'disconnect' }));
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
