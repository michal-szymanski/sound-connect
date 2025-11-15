import { APP_NAME_NORMALIZED } from '@/common/constants';
import { UserDTO } from '@/common/types/models';
import { useLocation } from '@tanstack/react-router';
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { ChatWindow } from './chat-window';
import { MinimizedChatButton } from './minimized-chat-button';
import { SummaryButton } from './summary-button';

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
const MAX_INDIVIDUAL_CHATS = 5;

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
        const array: StoredChatState[] = Array.from(windows.entries()).map(([_userId, state]) => ({
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
    const location = useLocation();

    const openChatWindow = useCallback((user: UserDTO) => {
        setOpenWindows((prev) => {
            const newWindows = new Map(prev);

            if (newWindows.has(user.id)) {
                const existingWindow = newWindows.get(user.id)!;
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
    const isOnMessagesPage = location.pathname === '/messages';

    useEffect(() => {
        const storedWindows = loadFromStorage();
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setOpenWindows(storedWindows);
    }, []);

    useEffect(() => {
        saveToStorage(openWindows);
    }, [openWindows]);

    const minimizedWindows = windowsArray.filter(([_, state]) => state.isMinimized);
    const visibleIndividualChats = minimizedWindows.slice(0, MAX_INDIVIDUAL_CHATS);
    const hiddenChats = minimizedWindows.slice(MAX_INDIVIDUAL_CHATS);
    const showSummaryButton = hiddenChats.length > 0;

    return (
        <Context.Provider value={contextValue}>
            {children}
            {!isOnMessagesPage && (
                <>
                    {windowsArray
                        .filter(([_, state]) => !state.isMinimized)
                        .map(([userId, windowState], index) => (
                            <ChatWindow
                                key={userId}
                                user={windowState.user}
                                isMinimized={windowState.isMinimized}
                                position={index}
                                onClose={() => closeChatWindow(userId)}
                                onToggleMinimize={() => toggleMinimize(userId)}
                            />
                        ))}

                    {visibleIndividualChats.map(([userId, windowState], index) => (
                        <MinimizedChatButton
                            key={userId}
                            user={windowState.user}
                            position={index}
                            onRestore={() => toggleMinimize(userId)}
                            onClose={() => closeChatWindow(userId)}
                        />
                    ))}

                    {showSummaryButton && (
                        <SummaryButton
                            hiddenCount={hiddenChats.length}
                            hiddenWindows={hiddenChats.map(([_, state]) => state)}
                            position={MAX_INDIVIDUAL_CHATS}
                            onRestoreChat={(userId) => toggleMinimize(userId)}
                            onCloseChat={(userId) => closeChatWindow(userId)}
                        />
                    )}
                </>
            )}
        </Context.Provider>
    );
};
