import { useEnvs, useUser } from '@/web/lib/react-query';
import { ONLINE_STATUS_INTERVAL } from '@sound-connect/common/constants';
import {
    FollowRequestNotificationItem,
    FollowRequestAcceptedNotificationItem,
    OnlineStatus,
    webSocketMessageSchema,
    ChatMessage,
    newChatMessageSchema,
    chatMessageSchema,
    subscribeMessageSchema,
    unsubscribeMessageSchema
} from '@sound-connect/common/types/models';
import { getChatHistory } from '@/web/server-functions/models';
import { useQueryClient } from '@tanstack/react-query';
import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import z from 'zod';

export type WSStatus = 'connecting' | 'open' | 'error' | 'closed';

type WebSocketContext = {
    subscribeToRoom: (roomId: string) => void;
    unsubscribeFromRoom: (roomId: string) => void;
    sendMessage: (roomId: string, content: string) => void;
    loadRoomHistory: (roomId: string) => Promise<void>;

    lastMessage: ChatMessage | null;
    roomMessages: Map<string, ChatMessage[]>;

    status: WSStatus;

    statuses: Map<string, OnlineStatus>;
    followRequestNotifications: Map<string, FollowRequestNotificationItem>;
    followRequestAcceptedNotifications: Map<string, FollowRequestAcceptedNotificationItem>;
};

const Context = createContext<WebSocketContext | undefined>(undefined);

type Props = React.PropsWithChildren;

export const WebSocketProvider: React.FC<Props> = ({ children }) => {
    const ws = useRef<WebSocket | null>(null);
    const { data: envs } = useEnvs();
    const { data: user } = useUser();

    const [status, setStatus] = useState<WSStatus>('connecting');
    const [lastMessage, setLastMessage] = useState<ChatMessage | null>(null);
    const [roomMessages, setRoomMessages] = useState<Map<string, ChatMessage[]>>(new Map());

    const [statuses, setStatuses] = useState<Map<string, OnlineStatus>>(new Map());
    const [followRequestNotifications, setFollowRequestNotifications] = useState<Map<string, FollowRequestNotificationItem>>(new Map());
    const [followRequestAcceptedNotifications, setFollowRequestAcceptedNotifications] = useState<Map<string, FollowRequestAcceptedNotificationItem>>(new Map());

    const queryClient = useQueryClient();
    const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

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

    const loadRoomHistory = useCallback(
        async (roomId: string) => {
            if (!user) {
                return;
            }

            try {
                const roomParticipants = roomId.split(':');
                const peerId = roomParticipants.find((id) => id !== user.id);

                if (!peerId) {
                    console.error(`[UnifiedWS] Could not determine peer ID from room ${roomId}`);
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
                    console.error(`[UnifiedWS] Failed to load room history for ${roomId}: Server function returned failure`);
                }
            } catch (error) {
                console.error(`[UnifiedWS] Error loading room history for ${roomId}:`, error);
            }
        },
        [user]
    );

    useEffect(() => {
        if (!envs || !user) return;

        const { API_URL } = envs;
        ws.current = new WebSocket(`${API_URL}/ws/user`);

        const handleOpen = () => {
            setStatus('open');
        };

        const handleError = () => {
            setStatus('error');
            console.error('[UnifiedWS] Connection error');
        };

        const handleClose = () => {
            setStatus('closed');
            clearTimeouts();
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

                    case 'notification': {
                        if (message.kind === 'follow-request') {
                            setFollowRequestNotifications(() => {
                                const newNotifications = new Map();
                                message.items.forEach((item) => {
                                    newNotifications.set(item.id, item);
                                });
                                return newNotifications;
                            });

                            queryClient.invalidateQueries({ queryKey: ['followings', user.id] });
                        }

                        if (message.kind === 'follow-request-accepted') {
                            setFollowRequestAcceptedNotifications(() => {
                                const newNotifications = new Map();
                                message.items.forEach((item) => {
                                    newNotifications.set(item.id, item);
                                });
                                return newNotifications;
                            });

                            queryClient.invalidateQueries({ queryKey: ['followings', user.id] });
                            queryClient.invalidateQueries({ queryKey: ['followers', user.id] });
                            queryClient.invalidateQueries({ queryKey: ['follow-request-status'] });
                        }
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
                console.error('[UnifiedWS] Error parsing message:', error);
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
            clearTimeouts();
        };
    }, [envs, user, clearTimeouts, queryClient]);

    const contextValue: WebSocketContext = {
        subscribeToRoom,
        unsubscribeFromRoom,
        sendMessage,
        loadRoomHistory,
        lastMessage,
        roomMessages,
        status,
        statuses,
        followRequestNotifications,
        followRequestAcceptedNotifications
    };

    return <Context.Provider value={contextValue}>{children}</Context.Provider>;
};

export const useWebSocket = (): WebSocketContext => {
    const context = useContext(Context);

    if (!context) {
        throw new Error('useWebSocket must be used within a WebSocketProvider');
    }

    return context;
};
