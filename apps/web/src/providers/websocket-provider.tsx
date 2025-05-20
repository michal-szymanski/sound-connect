import { useEnvs } from '@/web/lib/react-query';
import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';

export type WSStatus = 'connecting' | 'open' | 'error' | 'closed';

export type WebSocketContextValue<T = any> = {
    send: (data: T) => void;
    lastMessage: T | null;
    status: WSStatus;
};

const WebSocketContext = createContext<WebSocketContextValue | undefined>(undefined);

type Props = React.PropsWithChildren<{}>;

export const WebSocketProvider: React.FC<Props> = ({ children }) => {
    const ws = useRef<WebSocket | null>(null);
    const [status, setStatus] = useState<WSStatus>('connecting');
    const [lastMessage, setLastMessage] = useState<any>(null);
    const { data: envs } = useEnvs();

    useEffect(() => {
        if (!envs) return;

        const { API_URL } = envs;

        ws.current = new WebSocket(`${API_URL}/ws`);

        ws.current.onopen = () => {
            setStatus('open');
            console.log('ws connected');
        };

        ws.current.onerror = () => setStatus('error');

        ws.current.onclose = () => {
            setStatus('closed');
            console.log('ws disconnected');
        };

        ws.current.onmessage = (evt) => {
            try {
                setLastMessage(JSON.parse(evt.data));
            } catch {
                setLastMessage(evt.data);
            }
        };

        return () => {
            ws.current?.close();
        };
    }, [envs]);

    const send = useCallback((data: any) => {
        if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify(data));
        } else {
            console.warn('WS not open yet:', ws.current?.readyState);
        }
    }, []);

    const value: WebSocketContextValue = { send, lastMessage, status };

    return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>;
};

export const useWebSocket = (): WebSocketContextValue => {
    const ctx = useContext(WebSocketContext);

    if (!ctx) {
        throw new Error('useWebSocket must be used within a WebSocketProvider');
    }

    return ctx;
};
