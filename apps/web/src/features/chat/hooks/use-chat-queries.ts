import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ChatMessage } from '@/common/types/models';
import { getChatHistory } from '@/features/chat/server-functions/chat';
import { toast } from 'sonner';
import { getRoomId } from '@/common/helpers';
import { useState } from 'react';

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
    const [messageStatuses, setMessageStatuses] = useState<Map<string, 'sending' | 'sent' | 'error'>>(new Map());

    const mutation = useMutation({
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

            setMessageStatuses((prev) => {
                const next = new Map(prev);
                next.set(tempId, 'sending');
                return next;
            });

            return { previousMessages, tempId };
        },
        onSuccess: (_data, { conversationId }, context) => {
            if (context?.tempId) {
                setMessageStatuses((prev) => {
                    const next = new Map(prev);
                    next.set(context.tempId, 'sent');
                    return next;
                });

                setTimeout(() => {
                    setMessageStatuses((prev) => {
                        const next = new Map(prev);
                        next.delete(context.tempId);
                        return next;
                    });
                }, 5000);

                setTimeout(() => {
                    queryClient.invalidateQueries({ queryKey: ['chat', 'messages', conversationId] });
                }, 5200);
            }
        },
        onError: (_error, { conversationId }, context) => {
            if (context?.tempId) {
                setMessageStatuses((prev) => {
                    const next = new Map(prev);
                    next.set(context.tempId, 'error');
                    return next;
                });
            }

            if (context?.previousMessages) {
                queryClient.setQueryData(['chat', 'messages', conversationId], context.previousMessages);
            }
            toast.error('Failed to send message');
        }
    });

    const retryMessage = (messageId: string, conversationId: string, content: string, senderId: string) => {
        setMessageStatuses((prev) => {
            const next = new Map(prev);
            next.delete(messageId);
            return next;
        });

        mutation.mutate({ conversationId, content, senderId });
    };

    return {
        ...mutation,
        messageStatuses,
        retryMessage
    };
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
