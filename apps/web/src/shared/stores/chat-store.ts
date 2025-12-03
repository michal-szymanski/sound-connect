import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import type { QueryClient } from '@tanstack/react-query';
import { webSocketMessageSchema, chatMessageSchema, subscribeMessageSchema, unsubscribeMessageSchema, newChatMessageSchema } from '@/common/types/models';

export type ChatStatus = 'connecting' | 'open' | 'error' | 'closed';

type Auth = {
    user: {
        id: string;
    };
    accessToken: string;
};

type Envs = {
    API_URL: string;
    CLIENT_URL: string;
};

type ChatStore = {
    status: ChatStatus;
    ws: WebSocket | null;
    pendingSubscriptions: Set<string>;
    pendingUnsubscriptions: Set<string>;
    queryClient: QueryClient | null;
    connect: (auth: Auth, envs: Envs, queryClient: QueryClient) => void;
    disconnect: () => void;
    subscribeToRoom: (roomId: string) => void;
    unsubscribeFromRoom: (roomId: string) => void;
    sendMessage: (roomId: string, content: string) => void;
};

export const useChatStore = create<ChatStore>()(
    devtools(
        (set, get) => ({
            status: 'connecting',
            ws: null,
            pendingSubscriptions: new Set(),
            pendingUnsubscriptions: new Set(),
            queryClient: null,
            connect: (auth, envs, queryClient) => {
                const { ws: existingWs } = get();

                if (existingWs && existingWs.readyState !== WebSocket.CLOSED) {
                    existingWs.close();
                }

                const wsUrl = `${envs.API_URL.replace(/^http/, 'ws')}/api/ws/user`;
                const ws = new WebSocket(wsUrl, ['access_token', encodeURIComponent(auth.accessToken)]);

                const flushPendingSubscriptions = () => {
                    const { pendingSubscriptions, pendingUnsubscriptions } = get();

                    if (!ws || ws.readyState !== WebSocket.OPEN) {
                        return;
                    }

                    pendingSubscriptions.forEach((roomId) => {
                        const message = subscribeMessageSchema.parse({ type: 'subscribe', roomId });
                        ws.send(JSON.stringify(message));
                    });

                    pendingUnsubscriptions.forEach((roomId) => {
                        const message = unsubscribeMessageSchema.parse({ type: 'unsubscribe', roomId });
                        ws.send(JSON.stringify(message));
                    });

                    set({
                        pendingSubscriptions: new Set(),
                        pendingUnsubscriptions: new Set()
                    });
                };

                const handleOpen = () => {
                    set({ status: 'open' });
                    flushPendingSubscriptions();
                };

                const handleError = (event: Event) => {
                    set({ status: 'error' });
                    console.error('[Chat Provider] Connection error', event);
                };

                const handleClose = () => {
                    set({ status: 'closed' });
                };

                const handleMessage = (event: MessageEvent) => {
                    try {
                        const json = JSON.parse(event.data);
                        const message = webSocketMessageSchema.parse(json);

                        switch (message.type) {
                            case 'chat': {
                                const chatMessage = chatMessageSchema.parse(message);
                                const { queryClient: qc } = get();
                                if (qc) {
                                    qc.invalidateQueries({ queryKey: ['chat', 'messages', chatMessage.roomId] });
                                    qc.invalidateQueries({ queryKey: ['chat', 'conversations'] });
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
                        console.error('[Chat] Error parsing message:', error);
                    }
                };

                ws.addEventListener('open', handleOpen);
                ws.addEventListener('error', handleError);
                ws.addEventListener('close', handleClose);
                ws.addEventListener('message', handleMessage);

                set({ ws, queryClient, status: 'connecting' });
            },
            disconnect: () => {
                const { ws } = get();
                if (ws && ws.readyState !== WebSocket.CLOSED) {
                    ws.close();
                }
                set({ ws: null, status: 'closed', queryClient: null });
            },
            subscribeToRoom: (roomId) => {
                const { ws, pendingUnsubscriptions } = get();

                const newPendingUnsubscriptions = new Set(pendingUnsubscriptions);
                newPendingUnsubscriptions.delete(roomId);

                if (ws && ws.readyState === WebSocket.OPEN) {
                    const message = subscribeMessageSchema.parse({ type: 'subscribe', roomId });
                    ws.send(JSON.stringify(message));
                    set({ pendingUnsubscriptions: newPendingUnsubscriptions });
                } else {
                    const { pendingSubscriptions } = get();
                    const newPendingSubscriptions = new Set(pendingSubscriptions);
                    newPendingSubscriptions.add(roomId);
                    set({
                        pendingSubscriptions: newPendingSubscriptions,
                        pendingUnsubscriptions: newPendingUnsubscriptions
                    });
                }
            },
            unsubscribeFromRoom: (roomId) => {
                const { ws, pendingSubscriptions } = get();

                const newPendingSubscriptions = new Set(pendingSubscriptions);
                newPendingSubscriptions.delete(roomId);

                if (ws && ws.readyState === WebSocket.OPEN) {
                    const message = unsubscribeMessageSchema.parse({ type: 'unsubscribe', roomId });
                    ws.send(JSON.stringify(message));
                    set({ pendingSubscriptions: newPendingSubscriptions });
                } else {
                    const { pendingUnsubscriptions } = get();
                    const newPendingUnsubscriptions = new Set(pendingUnsubscriptions);
                    newPendingUnsubscriptions.add(roomId);
                    set({
                        pendingUnsubscriptions: newPendingUnsubscriptions,
                        pendingSubscriptions: newPendingSubscriptions
                    });
                }
            },
            sendMessage: (roomId, content) => {
                const { ws } = get();
                if (ws && ws.readyState === WebSocket.OPEN) {
                    const message = newChatMessageSchema.parse({ type: 'chat', content, roomId });
                    ws.send(JSON.stringify(message));
                }
            }
        }),
        { name: 'ChatStore' }
    )
);

export const useChat = () =>
    useChatStore(
        useShallow((state) => ({
            status: state.status,
            connect: state.connect,
            disconnect: state.disconnect,
            subscribeToRoom: state.subscribeToRoom,
            unsubscribeFromRoom: state.unsubscribeFromRoom,
            sendMessage: state.sendMessage
        }))
    );
