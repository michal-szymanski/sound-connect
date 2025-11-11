import { createContext, useContext, useState, type ReactNode } from 'react';
import type { UserDTO } from '@/common/types/models';

type MessagingContextType = {
    selectedPeer: UserDTO | null;
    setSelectedPeer: (peer: UserDTO | null) => void;
};

const MessagingContext = createContext<MessagingContextType | null>(null);

type MessagingProviderProps = {
    children: ReactNode;
};

export function MessagingProvider({ children }: MessagingProviderProps) {
    const [selectedPeer, setSelectedPeer] = useState<UserDTO | null>(null);

    return <MessagingContext.Provider value={{ selectedPeer, setSelectedPeer }}>{children}</MessagingContext.Provider>;
}

export function useMessagingContext() {
    const context = useContext(MessagingContext);
    if (!context) {
        throw new Error('useMessagingContext must be used within MessagingProvider');
    }
    return context;
}
