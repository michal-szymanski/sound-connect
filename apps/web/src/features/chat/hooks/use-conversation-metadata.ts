import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getUser } from '@/shared/server-functions/users';
import { getBand } from '@/features/bands/server-functions/bands';
import type { UserDTO } from '@/common/types/models';
import type { BandWithMembers } from '@sound-connect/common/types/bands';

type ConversationMetadata = { type: 'user'; data: UserDTO } | { type: 'band'; data: BandWithMembers } | { type: 'none'; data: null };

type ParsedRoom = { type: 'dm'; userId: string } | { type: 'band'; bandId: number } | { type: 'invalid' };

export function parseRoomId(roomId: string, currentUserId: string): ParsedRoom {
    if (roomId.startsWith('dm:')) {
        const [, identifier] = roomId.split(':');
        if (!identifier) return { type: 'invalid' };

        const userIds = identifier.split('-');
        if (userIds.length !== 2) return { type: 'invalid' };

        const [userId1, userId2] = userIds;
        const peerUserId = userId1 === currentUserId ? userId2 : userId2 === currentUserId ? userId1 : null;

        if (!peerUserId || peerUserId === currentUserId) return { type: 'invalid' };

        return { type: 'dm', userId: peerUserId };
    }

    if (roomId.startsWith('band:')) {
        const [, bandIdStr] = roomId.split(':');
        if (!bandIdStr) return { type: 'invalid' };

        const bandId = parseInt(bandIdStr, 10);
        if (!bandId || isNaN(bandId)) return { type: 'invalid' };

        return { type: 'band', bandId };
    }

    return { type: 'invalid' };
}

export async function fetchConversationMetadata({ roomId, currentUserId }: { roomId: string; currentUserId: string }): Promise<ConversationMetadata> {
    const parsed = parseRoomId(roomId, currentUserId);

    if (parsed.type === 'invalid') {
        return { type: 'none', data: null };
    }

    if (parsed.type === 'dm') {
        const result = await getUser({ data: { userId: parsed.userId } });
        if (!result.success) {
            throw new Error('User not found');
        }
        return { type: 'user', data: result.body };
    }

    if (parsed.type === 'band') {
        const result = await getBand({ data: { bandId: parsed.bandId } });
        if (!result.success) {
            throw new Error('Band not found');
        }
        return { type: 'band', data: result.body };
    }

    return { type: 'none', data: null };
}

type Props = {
    roomId: string;
    currentUserId: string;
    enabled?: boolean;
};

export function useConversationMetadata({ roomId, currentUserId, enabled = true }: Props) {
    return useQuery({
        queryKey: ['chat', 'conversation-metadata', roomId, currentUserId],
        queryFn: () => fetchConversationMetadata({ roomId, currentUserId }),
        enabled: enabled && !!roomId && !!currentUserId,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000
    });
}

export function usePrefillConversationMetadata() {
    const queryClient = useQueryClient();

    return {
        prefillUser: (roomId: string, currentUserId: string, user: UserDTO) => {
            queryClient.setQueryData(['chat', 'conversation-metadata', roomId, currentUserId], {
                type: 'user',
                data: user
            } satisfies ConversationMetadata);
        },
        prefillBand: (roomId: string, currentUserId: string, band: BandWithMembers) => {
            queryClient.setQueryData(['chat', 'conversation-metadata', roomId, currentUserId], {
                type: 'band',
                data: band
            } satisfies ConversationMetadata);
        }
    };
}
