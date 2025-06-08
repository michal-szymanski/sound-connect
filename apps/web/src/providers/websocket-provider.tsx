import { useEnvs } from '@/web/lib/react-query';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { chatMessageSchema, ChatMessage } from '@sound-connect/common/types/models';

export type WSStatus = 'connecting' | 'open' | 'error' | 'closed';

export type Context = {
    send: (data: ChatMessage) => void;
    lastMessage: ChatMessage | null;
    status: WSStatus;
    setPeerId: (id: string) => void;
};

const WebSocketContext = createContext<Context | undefined>(undefined);

type Props = React.PropsWithChildren<{}>;

export const WebSocketProvider: React.FC<Props> = ({ children }) => {
    const ws = useRef<WebSocket | null>(null);
    const { data: envs } = useEnvs();

    const [status, setStatus] = useState<WSStatus>('connecting');
    const [lastMessage, setLastMessage] = useState<ChatMessage | null>(null);
    const [peerId, setPeerId] = useState<string | null>(null);

    useEffect(() => {
        if (!envs || !peerId) return;

        const { API_URL } = envs;

        ws.current = new WebSocket(`${API_URL}/ws/chat/${peerId}`);

        const handleOpen = () => {
            setStatus('open');
        };

        const handleError = () => {
            setStatus('error');
        };

        const handleClose = () => {
            setStatus('closed');
        };

        const handleMessage = (e: MessageEvent<any>) => {
            try {
                const json = JSON.parse(e.data);
                const message = chatMessageSchema.parse(json);
                setLastMessage(message);
            } catch (error) {
                // Error parsing WebSocket message - ignore malformed messages
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
    }, [envs, peerId]);

    const send = (message: ChatMessage) => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify(message));
        }
    };

    return <WebSocketContext.Provider value={{ send, lastMessage, status, setPeerId }}>{children}</WebSocketContext.Provider>;
};

export const useWebSocket = (): Context => {
    const context = useContext(WebSocketContext);

    if (!context) {
        throw new Error('useWebSocket must be used within a WebSocketProvider');
    }

    return context;
};
