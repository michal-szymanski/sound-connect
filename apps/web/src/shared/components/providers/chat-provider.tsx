import { ONLINE_STATUS_INTERVAL } from '@/common/constants';
import {
    OnlineStatus,
    webSocketMessageSchema,
    ChatMessage,
    newChatMessageSchema,
    chatMessageSchema,
    subscribeMessageSchema,
    unsubscribeMessageSchema
} from '@/common/types/models';
import React, { createContext, useContext, useEffect, useEffectEvent, useRef, useState, useCallback } from 'react';
import z from 'zod';
import { getChatHistory } from '@/features/chat/server-functions/chat';
import type { User } from '@/common/types/drizzle';

export type ChatStatus = 'connecting' | 'open' | 'error' | 'closed';

type ChatContext = {
    subscribeToRoom: (roomId: string) => void;
    unsubscribeFromRoom: (roomId: string) => void;
    sendMessage: (roomId: string, content: string) => void;
    loadRoomHistory: (roomId: string) => Promise<void>;

    lastMessage: ChatMessage | null;
    roomMessages: Map<string, ChatMessage[]>;

    status: ChatStatus;

    statuses: Map<string, OnlineStatus>;
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

    const [status, setStatus] = useState<ChatStatus>('connecting');
    const [lastMessage, setLastMessage] = useState<ChatMessage | null>(null);
    const [roomMessages, setRoomMessages] = useState<Map<string, ChatMessage[]>>(new Map());

    const [statuses, setStatuses] = useState<Map<string, OnlineStatus>>(new Map());

    const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

    useEffect(() => {
        userIdRef.current = auth.user.id;
    }, [auth.user.id]);

    const clearTimeouts = useCallback(() => {
        for (const timeout of timeoutsRef.current) {
            clearTimeout(timeout);
        }
        timeoutsRef.current = [];
    }, []);

    const subscribeToRoom = useCallback((roomId: string) => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            const message = subscribeMessageSchema.parse({ type: 'subscribe', roomId });
            ws.current.send(JSON.stringify(message));
        }
    }, []);

    const unsubscribeFromRoom = useCallback((roomId: string) => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            const message = unsubscribeMessageSchema.parse({ type: 'unsubscribe', roomId });
            ws.current.send(JSON.stringify(message));
        }
    }, []);

    const sendMessage = useCallback((roomId: string, content: string) => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            const message = newChatMessageSchema.parse({ type: 'chat', content, roomId });
            ws.current.send(JSON.stringify(message));
        }
    }, []);

    const loadRoomHistory = useCallback(async (roomId: string) => {
        const currentUserId = userIdRef.current;

        try {
            const roomParticipants = roomId.split(':');
            const peerId = roomParticipants.find((id) => id !== currentUserId);

            if (!peerId) {
                console.error(`[Chat] Could not determine peer ID from room ${roomId}`);
                return;
            }

            const result = await getChatHistory({ data: { peerId } });

            if (result.success) {
                const history = result.body;
                const validMessages = z.array(chatMessageSchema).parse(history);

                setRoomMessages((prev) => {
                    const newMessages = new Map(prev);
                    newMessages.set(roomId, validMessages);
                    return newMessages;
                });
            } else {
                console.error(`[Chat] Failed to load room history for ${roomId}: Server function returned failure`);
            }
        } catch (error) {
            console.error(`[Chat] Error loading room history for ${roomId}:`, error);
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
        };

        const handleError = (event: Event) => {
            setStatus('error');
            console.error('[Chat Provider] Connection error', event);
        };

        const handleClose = () => {
            setStatus('closed');
            clearTimeouts();
            setRoomMessages(new Map());
            setStatuses(new Map());
            setLastMessage(null);
        };

        const handleMessage = (event: MessageEvent) => {
            try {
                const json = JSON.parse(event.data);
                const message = webSocketMessageSchema.parse(json);

                switch (message.type) {
                    case 'chat': {
                        const chatMessage = chatMessageSchema.parse(message);
                        setLastMessage(chatMessage);

                        setRoomMessages((prev) => {
                            const newMessages = new Map(prev);
                            const roomMsgs = newMessages.get(chatMessage.roomId) || [];

                            const isDuplicate = roomMsgs.some((existing) => existing.id === chatMessage.id);

                            if (!isDuplicate) {
                                const updatedMsgs = [...roomMsgs, chatMessage];
                                newMessages.set(chatMessage.roomId, updatedMsgs);
                            }

                            return newMessages;
                        });
                        break;
                    }

                    case 'online-status': {
                        clearTimeouts();

                        setStatuses((prevStatuses) => {
                            const newStatuses = new Map(prevStatuses);
                            newStatuses.set(message.userId, message.status);
                            return newStatuses;
                        });

                        const timeout = setTimeout(() => {
                            setStatuses((prev) => {
                                const newStatuses = new Map(prev);
                                newStatuses.set(message.userId, 'offline');
                                return newStatuses;
                            });
                        }, ONLINE_STATUS_INTERVAL + 5000);

                        timeoutsRef.current.push(timeout);
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
            clearTimeouts();
            setRoomMessages(new Map());
            setStatuses(new Map());
            setLastMessage(null);
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
        loadRoomHistory,
        lastMessage,
        roomMessages,
        status,
        statuses
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
