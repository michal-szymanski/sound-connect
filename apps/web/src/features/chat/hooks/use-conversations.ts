import { useQuery } from '@tanstack/react-query';
import { getConversations } from '@/features/chat/server-functions/chat';

export function useConversations() {
    return useQuery({
        queryKey: ['chat', 'conversations'],
        queryFn: async () => {
            const result = await getConversations({
                data: { limit: 100, offset: 0 }
            });
            if (!result.success) {
                throw new Error('Failed to load conversations');
            }
            return result.body;
        },
        staleTime: 30 * 1000,
        refetchOnWindowFocus: true
    });
}
