import { useEnvs, useUser } from '@/web/lib/react-query';
import { ONLINE_STATUS_INTERVAL } from '@sound-connect/common/constants';
import {
    ChatMessage,
    FollowRequestNotificationItem,
    OnlineStatus,
    onlineStatusMessageSchema,
    followRequestNotification,
    notificationKind,
    WebSocketMessage,
    webSocketMessageSchema
} from '@sound-connect/common/types/models';
import type { StoredChatMessage } from '../../../api/src/types/chat';
import { storedChatMessageSchema } from '../../../api/src/types/chat';
import { getChatHistory } from '@/web/server-functions/models';
import { useQueryClient } from '@tanstack/react-query';
import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import z from 'zod';

export type WSStatus = 'connecting' | 'open' | 'error' | 'closed';

export type UnifiedWSContext = {
    subscribeToRoom: (roomId: string) => void;
    unsubscribeFromRoom: (roomId: string) => void;
    sendMessage: (roomId: string, content: string) => void;
    loadRoomHistory: (roomId: string) => Promise<void>;

    lastMessage: StoredChatMessage | null;
    roomMessages: Map<string, StoredChatMessage[]>;

    status: WSStatus;

    statuses: Map<string, OnlineStatus>;
    followRequestNotifications: Map<string, FollowRequestNotificationItem>;
};

const UnifiedWebSocketContext = createContext<UnifiedWSContext | undefined>(undefined);

type Props = React.PropsWithChildren<{}>;

export const UnifiedWebSocketProvider: React.FC<Props> = ({ children }) => {
    const ws = useRef<WebSocket | null>(null);
    const { data: envs } = useEnvs();
    const { data: user } = useUser();

    const [status, setStatus] = useState<WSStatus>('connecting');
    const [lastMessage, setLastMessage] = useState<StoredChatMessage | null>(null);
    const [roomMessages, setRoomMessages] = useState<Map<string, StoredChatMessage[]>>(new Map());

    const [statuses, setStatuses] = useState<Map<string, OnlineStatus>>(new Map());
    const [followRequestNotifications, setFollowRequestNotifications] = useState<Map<string, FollowRequestNotificationItem>>(new Map());

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
            ws.current.send(JSON.stringify({ type: 'subscribe', roomId }));
        }
    }, []);

    const unsubscribeFromRoom = useCallback((roomId: string) => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({ type: 'unsubscribe', roomId }));
        }
    }, []);

    const sendMessage = useCallback((roomId: string, content: string) => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({ type: 'message', roomId, content }));
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
                    const validMessages = history.map((msg) => storedChatMessageSchema.parse(msg));

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

            if (ws.current) {
                const message: WebSocketMessage = { type: 'connect' };
                ws.current.send(JSON.stringify(message));
            }
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
                const { type } = webSocketMessageSchema.parse(json);

                switch (type) {
                    case 'chat':
                    case 'message': {
                        let message: StoredChatMessage;

                        try {
                            message = storedChatMessageSchema.parse(json);
                        } catch (error) {
                            console.error('[UnifiedWS] Invalid message format:', json, error);
                            break;
                        }

                        setLastMessage(message);

                        if (message.roomId) {
                            setRoomMessages((prev) => {
                                const newMessages = new Map(prev);
                                const roomMsgs = newMessages.get(message.roomId) || [];

                                const isDuplicate = roomMsgs.some(
                                    (existing) =>
                                        existing.timestamp === message.timestamp && existing.senderId === message.senderId && existing.text === message.text
                                );

                                if (!isDuplicate) {
                                    roomMsgs.push(message);
                                    newMessages.set(message.roomId, roomMsgs);
                                }

                                return newMessages;
                            });
                        }
                        break;
                    }

                    case 'online-status': {
                        clearTimeouts();
                        const onlineStatus = onlineStatusMessageSchema.parse(json);

                        setStatuses((prevStatuses) => {
                            const newStatuses = new Map(prevStatuses);
                            newStatuses.set(onlineStatus.userId, onlineStatus.status);
                            return newStatuses;
                        });

                        const timeout = setTimeout(() => {
                            setStatuses((prev) => {
                                const newStatuses = new Map(prev);
                                newStatuses.set(onlineStatus.userId, 'offline');
                                return newStatuses;
                            });
                        }, ONLINE_STATUS_INTERVAL + 5000);

                        timeoutsRef.current.push(timeout);
                        break;
                    }

                    case 'notification': {
                        const { kind } = z.object({ kind: notificationKind }).parse(json);

                        if (kind === 'follow-request') {
                            const notification = followRequestNotification.parse(json);

                            setFollowRequestNotifications(() => {
                                const newNotifications = new Map();
                                notification.items.forEach((item) => {
                                    newNotifications.set(item.id, item);
                                });
                                return newNotifications;
                            });

                            queryClient.invalidateQueries({ queryKey: ['followings'] });
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

    const contextValue: UnifiedWSContext = {
        subscribeToRoom,
        unsubscribeFromRoom,
        sendMessage,
        loadRoomHistory,
        lastMessage,
        roomMessages,
        status,
        statuses,
        followRequestNotifications
    };

    return <UnifiedWebSocketContext.Provider value={contextValue}>{children}</UnifiedWebSocketContext.Provider>;
};

export const useUnifiedWebSocket = (): UnifiedWSContext => {
    const context = useContext(UnifiedWebSocketContext);

    if (!context) {
        throw new Error('useUnifiedWebSocket must be used within a UnifiedWebSocketProvider');
    }

    return context;
};
