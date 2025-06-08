import React, { createContext, useContext, useState, useCallback } from 'react';
import { ChatWindow } from './chat-window';
import { UserDTO } from '@sound-connect/common/types/models';

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
