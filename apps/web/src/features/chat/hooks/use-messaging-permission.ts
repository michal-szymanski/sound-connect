import { useQuery } from '@tanstack/react-query';
import { checkMessagingPermission } from '@/features/chat/server-functions/messaging-permissions';

type Props = {
    targetUserId: string;
    enabled?: boolean;
};

export function useMessagingPermission({ targetUserId, enabled = true }: Props) {
    return useQuery({
        queryKey: ['messaging-permission', targetUserId],
        queryFn: async () => {
            const result = await checkMessagingPermission({ data: { targetUserId } });
            if (!result.success) {
                throw new Error('Failed to check messaging permission');
            }
            return result.body;
        },
        enabled,
        staleTime: 60 * 1000
    });
}
