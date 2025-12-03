import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import type { UserDTO } from '@/common/types/models';
import type { BandWithMembers } from '@sound-connect/common/types/bands';

type MessagingStore = {
    selectedPeer: UserDTO | null;
    selectedBand: BandWithMembers | null;
    setSelectedPeer: (peer: UserDTO | null) => void;
    setSelectedBand: (band: BandWithMembers | null) => void;
};

export const useMessagingStore = create<MessagingStore>()(
    devtools(
        (set) => ({
            selectedPeer: null,
            selectedBand: null,
            setSelectedPeer: (peer) =>
                set((state) => {
                    if (peer && state.selectedBand) {
                        return { selectedPeer: peer, selectedBand: null };
                    }
                    return { selectedPeer: peer };
                }),
            setSelectedBand: (band) =>
                set((state) => {
                    if (band && state.selectedPeer) {
                        return { selectedBand: band, selectedPeer: null };
                    }
                    return { selectedBand: band };
                })
        }),
        { name: 'MessagingStore' }
    )
);

export const useMessaging = () =>
    useMessagingStore(
        useShallow((state) => ({
            selectedPeer: state.selectedPeer,
            selectedBand: state.selectedBand,
            setSelectedPeer: state.setSelectedPeer,
            setSelectedBand: state.setSelectedBand
        }))
    );
