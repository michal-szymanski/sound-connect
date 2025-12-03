import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import { wsNotificationInboundMessageSchema } from '@/common/types/notifications';
import type { Notification } from '@/common/types/drizzle';

export type WSStatus = 'connecting' | 'open' | 'error' | 'closed';

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

type NotificationsStore = {
    status: WSStatus;
    notifications: Notification[];
    ws: WebSocket | null;
    connect: (auth: Auth, envs: Envs) => void;
    disconnect: () => void;
    addNotification: (notification: Notification) => void;
    removeNotification: (notificationId: number) => void;
    markAsSeen: (notificationId: number) => void;
    markAllAsSeen: () => void;
};

export const useNotificationsStore = create<NotificationsStore>()(
    devtools(
        (set, get) => ({
            status: 'connecting',
            notifications: [],
            ws: null,
            connect: (auth, envs) => {
                const { ws: existingWs } = get();

                if (existingWs && existingWs.readyState !== WebSocket.CLOSED) {
                    existingWs.close();
                }

                const wsUrl = `${envs.API_URL.replace(/^http/, 'ws')}/api/ws/notifications`;
                const ws = new WebSocket(wsUrl, ['access_token', encodeURIComponent(auth.accessToken)]);

                const handleOpen = () => {
                    set({ status: 'open' });
                };

                const handleError = (event: Event) => {
                    set({ status: 'error' });
                    console.error('[NotificationsWS] Connection error', event);
                };

                const handleClose = () => {
                    set({ status: 'closed', notifications: [] });
                };

                const handleMessage = (event: MessageEvent) => {
                    try {
                        const parsedData = JSON.parse(event.data);
                        const message = wsNotificationInboundMessageSchema.parse(parsedData);

                        if (message.type === 'initial') {
                            set({ notifications: message.data });
                        } else if (message.type === 'notification') {
                            get().addNotification(message.data);
                        }
                    } catch (error) {
                        console.error('[NotificationsWS] Invalid message received:', error);
                    }
                };

                ws.addEventListener('open', handleOpen);
                ws.addEventListener('error', handleError);
                ws.addEventListener('close', handleClose);
                ws.addEventListener('message', handleMessage);

                set({ ws, status: 'connecting' });
            },
            disconnect: () => {
                const { ws } = get();
                if (ws && ws.readyState !== WebSocket.CLOSED) {
                    ws.close();
                }
                set({ ws: null, notifications: [], status: 'closed' });
            },
            addNotification: (notification) =>
                set((state) => ({
                    notifications: [notification, ...state.notifications]
                })),
            removeNotification: (notificationId) =>
                set((state) => ({
                    notifications: state.notifications.filter((n) => n.id !== notificationId)
                })),
            markAsSeen: (notificationId) =>
                set((state) => ({
                    notifications: state.notifications.map((n) => (n.id === notificationId ? { ...n, seen: true } : n))
                })),
            markAllAsSeen: () =>
                set((state) => ({
                    notifications: state.notifications.map((n) => ({ ...n, seen: true }))
                }))
        }),
        { name: 'NotificationsStore' }
    )
);

export const useNotificationsConnection = (auth: Auth, envs: Envs | null) => {
    const connect = useNotificationsStore((state) => state.connect);
    const disconnect = useNotificationsStore((state) => state.disconnect);

    if (envs && auth.accessToken) {
        connect(auth, envs);
        return () => disconnect();
    }
};

export const useNotifications = () =>
    useNotificationsStore(
        useShallow((state) => ({
            status: state.status,
            notifications: state.notifications,
            connect: state.connect,
            disconnect: state.disconnect,
            markAsSeen: state.markAsSeen,
            markAllAsSeen: state.markAllAsSeen,
            removeNotification: state.removeNotification
        }))
    );

export const useUnreadCount = () => {
    return useNotificationsStore((state) => state.notifications.filter((n) => !n.seen).length);
};
