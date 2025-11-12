import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getRoomId } from '@/common/helpers';
import type { ChatMessage } from '@/common/types/models';
import { getChatHistory } from '@/features/chat/server-functions/chat';
import { toast } from 'sonner';

type UseChatMessagesProps = {
    conversationId: string;
    enabled?: boolean;
};

export function useChatMessages({ conversationId, enabled = true }: UseChatMessagesProps) {
    return useQuery({
        queryKey: ['chat', 'messages', conversationId],
        queryFn: async () => {
            const roomParticipants = conversationId.split(':');
            const peerId = roomParticipants[1] || roomParticipants[0];

            if (!peerId) {
                throw new Error('Invalid conversation ID');
            }

            const result = await getChatHistory({ data: { peerId } });

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

type SendMessageInput = {
    conversationId: string;
    content: string;
    senderId: string;
};

export function useSendMessage(sendMessageFn: (roomId: string, content: string) => void) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ conversationId, content, senderId }: SendMessageInput) => {
            sendMessageFn(conversationId, content);

            const optimisticMessage: ChatMessage = {
                id: `temp-${Date.now()}`,
                content,
                senderId,
                roomId: conversationId,
                timestamp: Date.now(),
                type: 'chat'
            };

            return { conversationId, optimisticMessage };
        },
        onMutate: async ({ conversationId, content, senderId }) => {
            await queryClient.cancelQueries({ queryKey: ['chat', 'messages', conversationId] });

            const previousMessages = queryClient.getQueryData<ChatMessage[]>(['chat', 'messages', conversationId]);

            const optimisticMessage: ChatMessage = {
                id: `temp-${Date.now()}`,
                content,
                senderId,
                roomId: conversationId,
                timestamp: Date.now(),
                type: 'chat'
            };

            queryClient.setQueryData<ChatMessage[]>(['chat', 'messages', conversationId], (old = []) => [...old, optimisticMessage]);

            return { previousMessages, optimisticMessage };
        },
        onError: (error, variables, context) => {
            if (context?.previousMessages) {
                queryClient.setQueryData(['chat', 'messages', variables.conversationId], context.previousMessages);
            }
            toast.error('Failed to send message');
        }
    });
}

export function useInvalidateChatMessages() {
    const queryClient = useQueryClient();

    return (conversationId: string) => {
        queryClient.invalidateQueries({ queryKey: ['chat', 'messages', conversationId] });
    };
}

export function useGetRoomId(userId: string, peerId: string): string {
    return getRoomId(userId, peerId);
}
