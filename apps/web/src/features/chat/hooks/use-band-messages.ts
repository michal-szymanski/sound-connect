import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBandChatHistory, sendBandMessage } from '@/features/chat/server-functions/band-messages';
import { toast } from 'sonner';
import type { Message } from '@sound-connect/common/types/drizzle';

type Props = {
    bandId: number;
    enabled?: boolean;
};

export function useBandMessages({ bandId, enabled = true }: Props) {
    return useQuery({
        queryKey: ['band-chat', 'messages', bandId],
        queryFn: async () => {
            const result = await getBandChatHistory({
                data: {
                    bandId,
                    limit: 100,
                    offset: 0
                }
            });

            if (!result.success) {
                throw new Error('Failed to load messages');
            }

            return result.body;
        },
        enabled,
        staleTime: 30 * 1000,
        refetchOnWindowFocus: true
    });
}

type SendBandMessageInput = {
    bandId: number;
    content: string;
    senderId: string;
};

export function useSendBandMessage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ bandId, content }: SendBandMessageInput) => {
            const result = await sendBandMessage({ data: { bandId, content } });

            if (!result.success) {
                throw new Error('Failed to send message');
            }

            return result.body;
        },
        onMutate: async ({ bandId, content, senderId }) => {
            await queryClient.cancelQueries({ queryKey: ['band-chat', 'messages', bandId] });

            const previousMessages = queryClient.getQueryData<Message[]>(['band-chat', 'messages', bandId]);

            const optimisticMessage: Message = {
                id: `temp-${Date.now()}`,
                chatRoomId: `band:${bandId}`,
                messageType: 'message',
                content,
                senderId,
                createdAt: new Date().toISOString()
            };

            queryClient.setQueryData<Message[]>(['band-chat', 'messages', bandId], (old = []) => [...old, optimisticMessage]);

            return { previousMessages };
        },
        onError: (_error, { bandId }, context) => {
            if (context?.previousMessages) {
                queryClient.setQueryData(['band-chat', 'messages', bandId], context.previousMessages);
            }
            toast.error('Failed to send message');
        },
        onSuccess: (_data, { bandId }) => {
            queryClient.invalidateQueries({ queryKey: ['band-chat', 'messages', bandId] });
            queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
        }
    });
}
