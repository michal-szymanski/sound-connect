import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { ChatWindow } from './chat-window';
import { UserDTO } from '@sound-connect/common/types/models';
import { APP_NAME_NORMALIZED } from '@sound-connect/common/constants';

type ChatWindowState = {
    user: UserDTO;
    isMinimized: boolean;
};

type ChatWindowContext = {
    openChatWindow: (user: UserDTO) => void;
    closeChatWindow: (userId: string) => void;
    toggleMinimize: (userId: string) => void;
};

const Context = createContext<ChatWindowContext | undefined>(undefined);

export const useChatWindows = () => {
    const context = useContext(Context);

    if (!context) {
        throw new Error('useChatWindows must be used within a ChatWindowProvider');
    }

    return context;
};

type Props = React.PropsWithChildren;

const STORAGE_KEY = `${APP_NAME_NORMALIZED}:chat-windows-state`;

type StoredChatState = {
    user: UserDTO;
    isMinimized: boolean;
};

const loadFromStorage = (): Map<string, ChatWindowState> => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return new Map();

        const parsed: StoredChatState[] = JSON.parse(stored);
        const result = new Map<string, ChatWindowState>();

        parsed.forEach((state) => {
            result.set(state.user.id, {
                user: state.user,
                isMinimized: state.isMinimized
            });
        });

        return result;
    } catch (error) {
        console.error('Failed to load chat windows from localStorage:', error);
        return new Map();
    }
};

const saveToStorage = (windows: Map<string, ChatWindowState>) => {
    try {
        const array: StoredChatState[] = Array.from(windows.entries()).map(([userId, state]) => ({
            user: state.user,
            isMinimized: state.isMinimized
        }));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(array));
    } catch (error) {
        console.error('Failed to save chat windows to localStorage:', error);
    }
};

export const ChatWindowProvider = ({ children }: Props) => {
    const [openWindows, setOpenWindows] = useState<Map<string, ChatWindowState>>(new Map());

    const openChatWindow = useCallback((user: UserDTO) => {
        setOpenWindows((prev) => {
            const newWindows = new Map(prev);

            if (newWindows.has(user.id)) {
                const existingWindow = newWindows.get(user.id)!;
                newWindows.delete(user.id);
                newWindows.set(user.id, { ...existingWindow, isMinimized: false });
            } else {
                newWindows.set(user.id, { user, isMinimized: false });
            }

            return newWindows;
        });
    }, []);

    const closeChatWindow = useCallback((userId: string) => {
        setOpenWindows((prev) => {
            const newWindows = new Map(prev);
            newWindows.delete(userId);
            return newWindows;
        });
    }, []);

    const toggleMinimize = useCallback((userId: string) => {
        setOpenWindows((prev) => {
            const newWindows = new Map(prev);
            const window = newWindows.get(userId);
            if (window) {
                newWindows.set(userId, { ...window, isMinimized: !window.isMinimized });
            }
            return newWindows;
        });
    }, []);

    const contextValue: ChatWindowContext = {
        openChatWindow,
        closeChatWindow,
        toggleMinimize
    };

    const windowsArray = Array.from(openWindows.entries());

    useEffect(() => {
        const storedWindows = loadFromStorage();
        setOpenWindows(storedWindows);
    }, []);

    useEffect(() => {
        saveToStorage(openWindows);
    }, [openWindows]);

    return (
        <Context.Provider value={contextValue}>
            {children}
            {windowsArray.map(([userId, windowState], index) => (
                <ChatWindow
                    key={userId}
                    user={windowState.user}
                    isMinimized={windowState.isMinimized}
                    position={index}
                    onClose={() => closeChatWindow(userId)}
                    onToggleMinimize={() => toggleMinimize(userId)}
                />
            ))}
        </Context.Provider>
    );
};
