import { useEnvs } from '@/web/lib/react-query';
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';

export type WSStatus = 'connecting' | 'open' | 'error' | 'closed';

// Define the shape of the context
interface UserStatusesContextType {
    statuses: Map<string, string>; // Map of userId -> status (e.g., "online", "offline", "idle")
    subscribe: (userIds: string[]) => void; // Function to subscribe to user statuses
    unsubscribe: (userIds: string[]) => void; // Function to unsubscribe from user statuses
    changeStatus: (status: string) => void; // Function to change the current user's status
    status: WSStatus;
    isSubscribed: boolean;
}

// Create the context
const UserStatusesContext = createContext<UserStatusesContextType | undefined>(undefined);

// Provider component
interface UserStatusesProviderProps {
    children: React.ReactNode;
}

export const UserStatusesProvider: React.FC<UserStatusesProviderProps> = ({ children }) => {
    const [statuses, setStatuses] = useState<Map<string, string>>(new Map());
    const wsRef = useRef<WebSocket | null>(null);
    const [status, setStatus] = useState<WSStatus>('connecting');
    const { data: envs } = useEnvs();
    const [isSubscribed, setIsSubscribed] = useState(false);

    // Function to subscribe to user statuses
    const subscribe = (userIds: string[]) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            console.log('subscribing on frontend', userIds);
            wsRef.current.send(JSON.stringify({ type: 'subscribe', userIds }));
        }
    };

    // Function to unsubscribe from user statuses
    const unsubscribe = (userIds: string[]) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'unsubscribe', userIds }));
        }
    };

    // Function to change the current user's status
    const changeStatus = (newStatus: string) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'change-status', status: newStatus }));
            console.log(`Sent status update: ${newStatus}`);
        } else {
            console.warn('WebSocket is not open. Cannot send status update.');
        }
    };

    // Initialize the WebSocket connection
    useEffect(() => {
        if (!envs) return;

        const { API_URL } = envs;
        const ws = new WebSocket(`${API_URL}/ws/user`);
        wsRef.current = ws;

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log('[Provider] Received WebSocket message:', data);

            if (data.type === 'status-update') {
                if (data.subscriptions) {
                    // Handle subscriptions update
                    const subscriptions = new Map(data.subscriptions); // Convert array of [userId, status] back to Map
                    setStatuses((prevStatuses) => {
                        const updatedStatuses = new Map(prevStatuses); // Clone the previous Map
                        subscriptions.forEach((status, userId) => {
                            updatedStatuses.set(userId as string, status as string); // Update the status for each user
                        });
                        return updatedStatuses; // Return the updated Map
                    });
                } else if (data.status && data.userId) {
                    // Handle single status update
                    setStatuses((prevStatuses) => {
                        const updatedStatuses = new Map(prevStatuses); // Clone the previous Map
                        updatedStatuses.set(data.userId as string, data.status as string); // Update the status for the specific user
                        return updatedStatuses; // Return the updated Map
                    });
                }
            }

            if (data.type === 'subscribed') {
                console.log(`SUBSCRIBED TO`, JSON.parse(event.data).subscribers);
                setIsSubscribed(true);
            }
        };

        ws.onopen = () => {
            setStatus('open');
            console.log('[Provider] WebSocket connection established');
        };

        ws.onclose = () => {
            setStatus('closed');
            console.log('[Provider] WebSocket connection closed');
        };

        ws.onerror = (error) => {
            setStatus('error');
            console.error('[Provider] WebSocket error:', error);
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
        changeStatus, // Add the changeStatus function to the context
        status,
        isSubscribed
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
