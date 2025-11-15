import { createContext, useContext, useState, type ReactNode } from 'react';
import type { UserDTO } from '@/common/types/models';
import type { BandWithMembers } from '@sound-connect/common/types/bands';

type MessagingContextType = {
    selectedPeer: UserDTO | null;
    setSelectedPeer: (peer: UserDTO | null) => void;
    selectedBand: BandWithMembers | null;
    setSelectedBand: (band: BandWithMembers | null) => void;
};

const MessagingContext = createContext<MessagingContextType | null>(null);

type Props = {
    children: ReactNode;
};

export function MessagingProvider({ children }: Props) {
    const [selectedPeer, setSelectedPeerState] = useState<UserDTO | null>(null);
    const [selectedBand, setSelectedBandState] = useState<BandWithMembers | null>(null);

    const setSelectedPeer = (peer: UserDTO | null) => {
        setSelectedPeerState(peer);
        if (peer) {
            setSelectedBandState(null);
        }
    };

    const setSelectedBand = (band: BandWithMembers | null) => {
        setSelectedBandState(band);
        if (band) {
            setSelectedPeerState(null);
        }
    };

    return <MessagingContext.Provider value={{ selectedPeer, setSelectedPeer, selectedBand, setSelectedBand }}>{children}</MessagingContext.Provider>;
}

export function useMessagingContext() {
    const context = useContext(MessagingContext);
    if (!context) {
        throw new Error('useMessagingContext must be used within MessagingProvider');
    }
    return context;
}
