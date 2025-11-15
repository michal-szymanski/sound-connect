import { webSocketMessageSchema, chatMessageSchema, subscribeMessageSchema, unsubscribeMessageSchema, newChatMessageSchema } from '@/common/types/models';
import React, { createContext, useContext, useEffect, useEffectEvent, useRef, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { User } from '@/common/types/drizzle';

export type ChatStatus = 'connecting' | 'open' | 'error' | 'closed';

type ChatContext = {
    subscribeToRoom: (roomId: string) => void;
    unsubscribeFromRoom: (roomId: string) => void;
    sendMessage: (roomId: string, content: string) => void;

    status: ChatStatus;
};

const Context = createContext<ChatContext | undefined>(undefined);

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

export const ChatProvider = ({ children, auth, envs }: Props) => {
    const ws = useRef<WebSocket | null>(null);
    const userIdRef = useRef(auth.user.id);
    const queryClient = useQueryClient();
    const pendingSubscriptions = useRef<Set<string>>(new Set());
    const pendingUnsubscriptions = useRef<Set<string>>(new Set());

    const [status, setStatus] = useState<ChatStatus>('connecting');

    useEffect(() => {
        userIdRef.current = auth.user.id;
    }, [auth.user.id]);

    const flushPendingSubscriptions = useCallback(() => {
        if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
            return;
        }

        pendingSubscriptions.current.forEach((roomId) => {
            const message = subscribeMessageSchema.parse({ type: 'subscribe', roomId });
            ws.current!.send(JSON.stringify(message));
        });
        pendingSubscriptions.current.clear();

        pendingUnsubscriptions.current.forEach((roomId) => {
            const message = unsubscribeMessageSchema.parse({ type: 'unsubscribe', roomId });
            ws.current!.send(JSON.stringify(message));
        });
        pendingUnsubscriptions.current.clear();
    }, []);

    const subscribeToRoom = useCallback((roomId: string) => {
        pendingUnsubscriptions.current.delete(roomId);

        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            const message = subscribeMessageSchema.parse({ type: 'subscribe', roomId });
            ws.current.send(JSON.stringify(message));
        } else {
            pendingSubscriptions.current.add(roomId);
        }
    }, []);

    const unsubscribeFromRoom = useCallback((roomId: string) => {
        pendingSubscriptions.current.delete(roomId);

        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            const message = unsubscribeMessageSchema.parse({ type: 'unsubscribe', roomId });
            ws.current.send(JSON.stringify(message));
        } else {
            pendingUnsubscriptions.current.add(roomId);
        }
    }, []);

    const sendMessage = useCallback((roomId: string, content: string) => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            const message = newChatMessageSchema.parse({ type: 'chat', content, roomId });
            ws.current.send(JSON.stringify(message));
        }
    }, []);

    const setupChatWebSocket = useEffectEvent(() => {
        if (!envs || !auth.accessToken) {
            return null;
        }

        const wsUrl = `${envs.API_URL.replace(/^http/, 'ws')}/api/ws/user`;

        ws.current = new WebSocket(wsUrl, ['access_token', encodeURIComponent(auth.accessToken)]);

        const handleOpen = () => {
            setStatus('open');
            flushPendingSubscriptions();
        };

        const handleError = (event: Event) => {
            setStatus('error');
            console.error('[Chat Provider] Connection error', event);
        };

        const handleClose = () => {
            setStatus('closed');
        };

        const handleMessage = (event: MessageEvent) => {
            try {
                const json = JSON.parse(event.data);
                const message = webSocketMessageSchema.parse(json);

                switch (message.type) {
                    case 'chat': {
                        const chatMessage = chatMessageSchema.parse(message);
                        queryClient.invalidateQueries({ queryKey: ['chat', 'messages', chatMessage.roomId] });
                        queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
                        break;
                    }

                    case 'user-joined':
                    case 'user-left': {
                        break;
                    }

                    default:
                        break;
                }
            } catch (error) {
                console.error('[Chat] Error parsing message:', error);
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

            if (ws.current.readyState !== WebSocket.CLOSED) {
                ws.current.close();
            }

            ws.current = null;
        };
    });

    useEffect(() => {
        const cleanup = setupChatWebSocket();
        return cleanup || undefined;
    }, []);

    const contextValue: ChatContext = {
        subscribeToRoom,
        unsubscribeFromRoom,
        sendMessage,
        status
    };

    return <Context.Provider value={contextValue}>{children}</Context.Provider>;
};

export const useChat = (): ChatContext => {
    const context = useContext(Context);

    if (!context) {
        throw new Error('useChat must be used within a ChatProvider');
    }

    return context;
};
