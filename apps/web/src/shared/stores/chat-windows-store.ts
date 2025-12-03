import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import { appConfig } from '@sound-connect/common/app-config';
import type { UserDTO } from '@/common/types/models';

type ChatWindowState = {
    user: UserDTO;
    isMinimized: boolean;
};

type ChatWindowsStore = {
    windows: Map<string, ChatWindowState>;
    openChatWindow: (user: UserDTO) => void;
    closeChatWindow: (userId: string) => void;
    toggleMinimize: (userId: string) => void;
};

const STORAGE_KEY = `${appConfig.appNameNormalized}:chat-windows-state`;

type StorageState = {
    windows: [string, ChatWindowState][];
};

export const useChatWindowsStore = create<ChatWindowsStore>()(
    devtools(
        persist(
            (set) => ({
                windows: new Map(),
                openChatWindow: (user) =>
                    set((state) => {
                        const newWindows = new Map(state.windows);

                        if (newWindows.has(user.id)) {
                            const existingWindow = newWindows.get(user.id)!;
                            newWindows.delete(user.id);
                            newWindows.set(user.id, { ...existingWindow, isMinimized: false });
                        } else {
                            newWindows.set(user.id, { user, isMinimized: false });
                        }

                        return { windows: newWindows };
                    }),
                closeChatWindow: (userId) =>
                    set((state) => {
                        const newWindows = new Map(state.windows);
                        newWindows.delete(userId);
                        return { windows: newWindows };
                    }),
                toggleMinimize: (userId) =>
                    set((state) => {
                        const newWindows = new Map(state.windows);
                        const window = newWindows.get(userId);
                        if (window) {
                            const newMinimizedState = !window.isMinimized;

                            if (window.isMinimized && !newMinimizedState) {
                                newWindows.delete(userId);
                            }
                            newWindows.set(userId, { ...window, isMinimized: newMinimizedState });
                        }
                        return { windows: newWindows };
                    })
            }),
            {
                name: STORAGE_KEY,
                storage: {
                    getItem: (name) => {
                        const str = localStorage.getItem(name);
                        if (!str) return null;
                        const { state } = JSON.parse(str) as { state: StorageState };
                        return {
                            state: {
                                windows: new Map(state.windows)
                            }
                        };
                    },
                    setItem: (name, newValue) => {
                        const str = JSON.stringify({
                            state: {
                                windows: Array.from((newValue.state as ChatWindowsStore).windows.entries())
                            }
                        });
                        localStorage.setItem(name, str);
                    },
                    removeItem: (name) => localStorage.removeItem(name)
                }
            }
        ),
        { name: 'ChatWindowsStore' }
    )
);

export const useChatWindows = () =>
    useChatWindowsStore(
        useShallow((state) => ({
            windows: state.windows,
            openChatWindow: state.openChatWindow,
            closeChatWindow: state.closeChatWindow,
            toggleMinimize: state.toggleMinimize
        }))
    );
