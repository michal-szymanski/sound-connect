import React, { createContext, useContext, useState, useCallback } from 'react';
import { ChatWindow } from './chat-window';
import { UserDTO } from '@sound-connect/common/types/models';

interface ChatWindowState {
    user: UserDTO;
    isMinimized: boolean;
}

interface ChatWindowContextType {
    openChatWindow: (user: UserDTO) => void;
    closeChatWindow: (userId: string) => void;
    toggleMinimize: (userId: string) => void;
}

const ChatWindowContext = createContext<ChatWindowContextType | undefined>(undefined);

export const useChatWindows = () => {
    const context = useContext(ChatWindowContext);
    if (!context) {
        throw new Error('useChatWindows must be used within a ChatWindowProvider');
    }
    return context;
};

interface ChatWindowProviderProps {
    children: React.ReactNode;
}

export const ChatWindowProvider: React.FC<ChatWindowProviderProps> = ({ children }) => {
    const [openWindows, setOpenWindows] = useState<Map<string, ChatWindowState>>(new Map());

    const openChatWindow = useCallback((user: UserDTO) => {
        setOpenWindows((prev) => {
            const newWindows = new Map(prev);

            // If window is already open, just bring it to front and unminimize
            if (newWindows.has(user.id)) {
                const existingWindow = newWindows.get(user.id)!;
                newWindows.delete(user.id);
                newWindows.set(user.id, { ...existingWindow, isMinimized: false });
            } else {
                // Add new window
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

    const contextValue: ChatWindowContextType = {
        openChatWindow,
        closeChatWindow,
        toggleMinimize
    };

    // Convert Map to Array for rendering, maintaining insertion order
    const windowsArray = Array.from(openWindows.entries());

    return (
        <ChatWindowContext.Provider value={contextValue}>
            {children}
            {/* Render chat windows */}
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
        </ChatWindowContext.Provider>
    );
};
