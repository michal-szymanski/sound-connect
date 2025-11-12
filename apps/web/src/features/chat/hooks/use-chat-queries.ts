import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ChatMessage } from '@/common/types/models';
import { getChatHistory } from '@/features/chat/server-functions/chat';
import { toast } from 'sonner';
import { getRoomId } from '@/common/helpers';

type UseChatMessagesProps = {
    conversationId: string;
    enabled?: boolean;
};

export function useChatMessages({ conversationId, enabled = true }: UseChatMessagesProps) {
    return useQuery({
        queryKey: ['chat', 'messages', conversationId],
        queryFn: async () => {
            if (!conversationId) {
                throw new Error('Invalid conversation ID');
            }

            const result = await getChatHistory({ data: { roomId: conversationId } });

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

            return { conversationId, content, senderId, timestamp: Date.now() };
        },
        onMutate: async ({ conversationId, content, senderId }) => {
            await queryClient.cancelQueries({ queryKey: ['chat', 'messages', conversationId] });

            const previousMessages = queryClient.getQueryData<ChatMessage[]>(['chat', 'messages', conversationId]);

            const tempId = `temp-${Date.now()}`;
            const optimisticMessage: ChatMessage = {
                id: tempId,
                content,
                senderId,
                roomId: conversationId,
                timestamp: Date.now(),
                type: 'chat'
            };

            queryClient.setQueryData<ChatMessage[]>(['chat', 'messages', conversationId], (old = []) => [...old, optimisticMessage]);

            const timeoutId = setTimeout(() => {
                queryClient.invalidateQueries({ queryKey: ['chat', 'messages', conversationId] });
            }, 2000);

            return { previousMessages, tempId, timeoutId };
        },
        onError: (_error, { conversationId }, context) => {
            if (context?.timeoutId) {
                clearTimeout(context.timeoutId);
            }

            if (context?.previousMessages) {
                queryClient.setQueryData(['chat', 'messages', conversationId], context.previousMessages);
            }
            toast.error('Failed to send message');
        },
        onSettled: (_data, _error, _variables, context) => {
            if (context?.timeoutId) {
                clearTimeout(context.timeoutId);
            }
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
