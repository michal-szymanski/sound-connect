import { useEnvs, userQueryOptions } from '@/web/lib/react-query';
import { useSuspenseQuery } from '@tanstack/react-query';
import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { ChatMessage, chatMessageSchema } from '@sound-connect/types';

export type WSStatus = 'connecting' | 'open' | 'error' | 'closed';

export type WebSocketContextValue = {
    send: (data: ChatMessage) => void;
    lastMessage: ChatMessage | null;
    status: WSStatus;
    setPeerId: (id: string) => void;
};

const WebSocketContext = createContext<WebSocketContextValue | undefined>(undefined);

type Props = React.PropsWithChildren<{}>;

export const WebSocketProvider: React.FC<Props> = ({ children }) => {
    const ws = useRef<WebSocket | null>(null);
    const [status, setStatus] = useState<WSStatus>('connecting');
    const [lastMessage, setLastMessage] = useState<ChatMessage | null>(null);
    const { data: envs } = useEnvs();
    const { data: user } = useSuspenseQuery(userQueryOptions(null));
    const [peerId, setPeerId] = useState<string | null>(null);

    useEffect(() => {
        if (!envs || !user || !peerId) return;

        const { API_URL } = envs;

        ws.current = new WebSocket(`${API_URL}/ws?userId=${user.id}&peerId=${peerId}`);

        const handleOpen = () => {
            setStatus('open');
            console.log('ws connected');
        };

        const handleError = () => {
            setStatus('error');
        };

        const handleClose = () => {
            setStatus('closed');
            console.log('ws disconnected');
        };

        const handleMessage = (e: MessageEvent<any>) => {
            try {
                const json = JSON.parse(e.data);
                const message = chatMessageSchema.parse(json);
                setLastMessage(message);
            } catch (error) {
                console.error('[App] Error parsing WebSocket message:', error);
            }
        };

        ws.current.addEventListener('open', handleOpen);
        ws.current.addEventListener('error', handleError);
        ws.current.addEventListener('close', handleClose);
        ws.current.addEventListener('message', handleMessage);

        return () => {
            if (!ws.current) return;

            ws.current.removeEventListener('open', handleOpen);
            ws.current.removeEventListener('error', handleError);
            ws.current.removeEventListener('close', handleClose);
            ws.current.removeEventListener('message', handleMessage);

            ws.current.close();
        };
    }, [envs, user, peerId]);

    const send = (message: ChatMessage) => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify(message));
        }
    };

    const value: WebSocketContextValue = { send, lastMessage, status, setPeerId };

    return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>;
};

export const useWebSocket = (): WebSocketContextValue => {
    const context = useContext(WebSocketContext);

    if (!context) {
        throw new Error('useWebSocket must be used within a WebSocketProvider');
    }

    return context;
};
