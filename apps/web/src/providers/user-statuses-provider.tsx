import { useEnvs } from '@/web/lib/react-query';
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';

export type WSStatus = 'connecting' | 'open' | 'error' | 'closed';

// Define the shape of the context
interface UserStatusesContextType {
    statuses: Record<string, string>; // Map of userId -> status (e.g., "online", "offline", "idle")
    subscribe: (userIds: string[]) => void; // Function to subscribe to user statuses
    unsubscribe: (userIds: string[]) => void; // Function to unsubscribe from user statuses
    changeStatus: (userId: string, status: string) => void; // Function to change a user's status,
    status: WSStatus;
}

// Create the context
const UserStatusesContext = createContext<UserStatusesContextType | undefined>(undefined);

// Provider component
interface UserStatusesProviderProps {
    children: React.ReactNode;
}

export const UserStatusesProvider: React.FC<UserStatusesProviderProps> = ({ children }) => {
    const [statuses, setStatuses] = useState<Record<string, string>>({});
    const wsRef = useRef<WebSocket | null>(null);
    const [status, setStatus] = useState<WSStatus>('connecting');
    const { data: envs } = useEnvs();

    // Function to subscribe to user statuses
    const subscribe = (userIds: string[]) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'subscribe', userIds }));
        }
    };

    // Function to unsubscribe from user statuses
    const unsubscribe = (userIds: string[]) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'unsubscribe', userIds }));
        }
    };

    // Function to change a user's status
    const changeStatus = (userId: string, status: string) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'changeStatus', userId, status }));
        }
    };

    // Initialize the WebSocket connection
    useEffect(() => {
        if (!envs) return;

        const { API_URL } = envs;
        const ws = new WebSocket(`${API_URL}/ws/user-statuses`);
        wsRef.current = ws;

        ws.onopen = () => {
            setStatus('open');
            console.log('WebSocket user-statuses connection established');
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'statusUpdate') {
                setStatuses((prevStatuses) => ({
                    ...prevStatuses,
                    [data.userId]: data.status // Update the status of the specific user
                }));
            }
        };

        ws.onclose = () => {
            setStatus('closed');
            console.log('WebSocket user-statuses connection closed');
        };

        ws.onerror = (error) => {
            setStatus('error');
            console.error('WebSocket user-statuses error:', error);
        };

        return () => {
            ws.close();
        };
    }, [envs]);

    // Provide the context value
    const value = {
        statuses,
        subscribe,
        unsubscribe,
        changeStatus,
        status
    };

    return <UserStatusesContext.Provider value={value}>{children}</UserStatusesContext.Provider>;
};

// Custom hook to use the context
export const useUserStatuses = () => {
    const context = useContext(UserStatusesContext);

    if (!context) {
        throw new Error('useUserStatuses must be used within a UserStatusesProvider');
    }

    return context;
};
