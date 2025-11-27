import { zodResolver } from '@hookform/resolvers/zod';
import { appConfig } from '@sound-connect/common/app-config';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { MessageCircle, Send, Smile } from 'lucide-react';
import { z } from 'zod';
import { toast } from 'sonner';
import ProfileAvatar from '@/shared/components/common/profile-avatar';
import { Button } from '@/shared/components/ui/button';
import { Textarea } from '@/shared/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover';
import { useAuth } from '@/shared/lib/react-query';
import { useChat } from '@/shared/components/providers/chat-provider';
import { EmojiPickerContent } from '@/web/components/emoji-picker-content';
import { VirtualizedMessageList } from '@/features/chat/components/virtualized-message-list';
import { MessageStatusIndicator } from '@/features/chat/components/message-status-indicator';
import { MessageSkeleton } from '@/features/chat/components/message-skeleton';
import { useChatMessages, useGetRoomId, useSendMessage, useMarkMessagesAsRead } from '@/features/chat/hooks/use-chat-queries';
import { useMessagingContext } from './context';
import { useDelayedLoading } from '@/web/hooks/use-delayed-loading';
import { formatTimestamp } from '@/features/chat/utils/format-timestamp';
import { messageFormSchema, type MessageFormValues } from '@/features/chat/schemas/message-form';
import { useConversationMetadata, fetchConversationMetadata } from '@/features/chat/hooks/use-conversation-metadata';

const messagesSearchSchema = z.object({
    room: z.string().optional()
});

export const Route = createFileRoute('/(main)/messages/')({
    component: RouteComponent,
    validateSearch: messagesSearchSchema,
    async beforeLoad({ search, context }) {
        if (!search.room || !context.user?.id) {
            return;
        }

        const queryClient = context.queryClient;
        const roomId = search.room;
        const currentUserId = context.user.id;

        await queryClient.prefetchQuery({
            queryKey: ['chat', 'conversation-metadata', roomId, currentUserId],
            queryFn: () => fetchConversationMetadata({ roomId, currentUserId }),
            staleTime: 5 * 60 * 1000
        });
    }
});

function RouteComponent() {
    const { subscribeToRoom, unsubscribeFromRoom, sendMessage } = useChat();
    const { data: auth } = useAuth();
    const { room } = Route.useSearch();
    const { selectedPeer, setSelectedPeer, selectedBand, setSelectedBand } = useMessagingContext();

    const { data: conversationMetadata, error: conversationError } = useConversationMetadata({
        roomId: room || '',
        currentUserId: auth?.user?.id || '',
        enabled: !!room && !!auth?.user?.id
    });

    useEffect(() => {
        if (!conversationMetadata || conversationError) {
            if (conversationError) {
                toast.error('Failed to load conversation');
            }
            return;
        }

        if (conversationMetadata.type === 'user') {
            if (selectedPeer?.id !== conversationMetadata.data.id) {
                setSelectedPeer(conversationMetadata.data);
            }
        } else if (conversationMetadata.type === 'band') {
            if (selectedBand?.id !== conversationMetadata.data.id) {
                setSelectedBand(conversationMetadata.data);
            }
        }
    }, [conversationMetadata, conversationError, setSelectedPeer, setSelectedBand, selectedPeer?.id, selectedBand?.id]);

    const dmRoomId = useGetRoomId(auth?.user?.id || '', selectedPeer?.id || '');
    const roomId = selectedPeer ? dmRoomId : selectedBand ? `band:${selectedBand.id}` : '';
    const { data: messages = [], isInitialLoading } = useChatMessages({ conversationId: roomId, enabled: !!(selectedPeer || selectedBand) });
    const { mutate: sendMessageMutate, messageStatuses, retryMessage } = useSendMessage(sendMessage);
    const { mutate: markAsRead } = useMarkMessagesAsRead();
    const shouldShowLoading = useDelayedLoading({ isLoading: isInitialLoading });

    const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const form = useForm<MessageFormValues>({
        resolver: zodResolver(messageFormSchema),
        defaultValues: {
            text: ''
        }
    });

    const textValue = form.watch('text');

    const onSubmit = async (values: MessageFormValues) => {
        if ((!selectedPeer && !selectedBand) || !auth?.user || !values.text || !roomId) return;

        sendMessageMutate({
            conversationId: roomId,
            content: values.text,
            senderId: auth.user.id
        });

        form.reset();
    };

    const insertEmoji = (emoji: string) => {
        const textarea = textareaRef.current;
        const currentValue = form.getValues('text') || '';

        if (!textarea) {
            form.setValue('text', currentValue + emoji);
            setIsEmojiPickerOpen(false);
            return;
        }

        const cursorPos = textarea.selectionStart || currentValue.length;
        const newMessage = currentValue.slice(0, cursorPos) + emoji + currentValue.slice(cursorPos);

        form.setValue('text', newMessage);
        setIsEmojiPickerOpen(false);

        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(cursorPos + emoji.length, cursorPos + emoji.length);
        }, 0);
    };

    useEffect(() => {
        if (roomId && auth?.user?.id && (selectedPeer?.id || selectedBand?.id) && (roomId.startsWith('dm:') || roomId.startsWith('band:'))) {
            subscribeToRoom(roomId);

            return () => {
                unsubscribeFromRoom(roomId);
            };
        }
    }, [roomId, subscribeToRoom, unsubscribeFromRoom, auth?.user?.id, selectedPeer?.id, selectedBand?.id]);

    useEffect(() => {
        if (roomId && (selectedPeer || selectedBand) && auth?.user?.id) {
            markAsRead({ roomId, currentUserId: auth.user.id });
        }
    }, [roomId, selectedPeer, selectedBand, markAsRead, auth?.user?.id]);

    if (!selectedPeer && !selectedBand) {
        return (
            <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
                <div className="text-center">
                    <MessageCircle className="text-muted-foreground/50 mx-auto h-16 w-16" />
                    <h3 className="mt-4 text-lg font-semibold">No conversation selected</h3>
                    <p className="text-muted-foreground mt-2 text-sm">Select a contact from the list to start messaging</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-[calc(100vh-10rem)] flex-col overflow-hidden rounded-lg border">
            <header className="bg-background flex-none border-b px-6 py-4">
                {selectedPeer ? (
                    <Link to="/users/$id" params={{ id: selectedPeer.id }} className="flex items-center gap-3 transition-opacity hover:opacity-80">
                        <ProfileAvatar profile={selectedPeer} type="user" className="h-10 w-10" />
                        <div>
                            <div className="font-semibold">{selectedPeer.name}</div>
                        </div>
                    </Link>
                ) : selectedBand ? (
                    <Link to="/bands/$id" params={{ id: selectedBand.id.toString() }} className="flex items-center gap-3 transition-opacity hover:opacity-80">
                        <ProfileAvatar
                            profile={{ id: selectedBand.id.toString(), name: selectedBand.name, image: selectedBand.profileImageUrl }}
                            type="band"
                            className="h-10 w-10"
                        />
                        <div>
                            <div className="font-semibold">{selectedBand.name}</div>
                        </div>
                    </Link>
                ) : null}
            </header>

            <div className="bg-muted/30 flex-1">
                {shouldShowLoading ? (
                    <MessageSkeleton />
                ) : messages.length === 0 && !isInitialLoading ? (
                    <div className="flex h-full items-center justify-center">
                        <div className="text-muted-foreground text-sm">Start a conversation with {selectedPeer ? selectedPeer.name : selectedBand?.name}</div>
                    </div>
                ) : (
                    <VirtualizedMessageList
                        messages={messages}
                        currentUserId={auth?.user?.id || ''}
                        formatTimestamp={formatTimestamp}
                        statusIndicator={(() => {
                            const latestMessage = messages[messages.length - 1];
                            const status = latestMessage && messageStatuses.get(latestMessage.id);
                            const isCurrentUser = latestMessage?.senderId === auth?.user?.id;

                            if (!status || !isCurrentUser) {
                                return null;
                            }

                            return (
                                <MessageStatusIndicator
                                    key={latestMessage.id}
                                    status={status}
                                    onRetry={() => retryMessage(latestMessage.id, latestMessage.roomId, latestMessage.content, latestMessage.senderId)}
                                />
                            );
                        })()}
                    />
                )}
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="bg-background flex-none border-t px-6 py-4">
                <div className="flex items-center gap-2">
                    <Popover open={isEmojiPickerOpen} onOpenChange={setIsEmojiPickerOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground hover:text-foreground hover:bg-accent shrink-0"
                                aria-label="Open emoji picker"
                                aria-expanded={isEmojiPickerOpen}
                                aria-haspopup="dialog"
                            >
                                <Smile className="h-5 w-5" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent
                            className="z-popover w-full max-w-[352px] p-0"
                            style={{ width: '352px', height: '435px' }}
                            side="top"
                            align="start"
                            sideOffset={8}
                        >
                            <EmojiPickerContent onEmojiSelect={insertEmoji} onClose={() => setIsEmojiPickerOpen(false)} />
                        </PopoverContent>
                    </Popover>

                    <Textarea
                        {...form.register('text')}
                        ref={(e) => {
                            form.register('text').ref(e);
                            textareaRef.current = e;
                        }}
                        placeholder="Type a message..."
                        className="max-h-32 min-h-[44px] flex-1 resize-none"
                        disabled={(!selectedPeer && !selectedBand) || !roomId || !auth?.user}
                        maxLength={appConfig.chatMessageMaxLength}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                form.handleSubmit(onSubmit)();
                            }
                        }}
                    />

                    <Button type="submit" size="icon" disabled={!textValue?.trim()} className="shrink-0">
                        <Send className="h-4 w-4" />
                        <span className="sr-only">Send message</span>
                    </Button>
                </div>
            </form>
        </div>
    );
}
