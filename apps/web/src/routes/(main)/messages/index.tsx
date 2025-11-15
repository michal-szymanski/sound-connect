import { zodResolver } from '@hookform/resolvers/zod';
import { CHAT_MESSAGE_MAX_LENGTH } from '@/common/constants';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { MessageCircle, Send, Smile } from 'lucide-react';
import { z } from 'zod';
import { toast } from 'sonner';
import UserAvatar from '@/shared/components/common/user-avatar';
import { Button } from '@/shared/components/ui/button';
import { Textarea } from '@/shared/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover';
import { Avatar, AvatarImage, AvatarFallback } from '@/shared/components/ui/avatar';
import { useAuth } from '@/shared/lib/react-query';
import { useChat } from '@/shared/components/providers/chat-provider';
import { EmojiPickerContent } from '@/web/components/emoji-picker-content';
import { VirtualizedMessageList } from '@/features/chat/components/virtualized-message-list';
import { MessageStatusIndicator } from '@/features/chat/components/message-status-indicator';
import { useChatMessages, useGetRoomId, useSendMessage } from '@/features/chat/hooks/use-chat-queries';
import { useMessagingContext } from './context';
import { useDelayedLoading } from '@/web/hooks/use-delayed-loading';
import { formatTimestamp } from '@/features/chat/utils/format-timestamp';
import { messageFormSchema, type MessageFormValues } from '@/features/chat/schemas/message-form';
import { getUser } from '@/shared/server-functions/users';
import { getBand } from '@/features/bands/server-functions/bands';

const messagesSearchSchema = z.object({
    room: z.string().optional()
});

export const Route = createFileRoute('/(main)/messages/')({
    component: RouteComponent,
    validateSearch: messagesSearchSchema
});

function RouteComponent() {
    const { subscribeToRoom, unsubscribeFromRoom, sendMessage } = useChat();
    const { data: auth } = useAuth();
    const { room } = Route.useSearch();
    const { selectedPeer, setSelectedPeer, selectedBand, setSelectedBand } = useMessagingContext();

    const dmRoomId = useGetRoomId(auth?.user?.id || '', selectedPeer?.id || '');
    const roomId = selectedPeer ? dmRoomId : selectedBand ? `band:${selectedBand.id}` : '';
    const { data: messages = [], isInitialLoading } = useChatMessages({ conversationId: roomId, enabled: !!(selectedPeer || selectedBand) });
    const { mutate: sendMessageMutate, messageStatuses, retryMessage } = useSendMessage(sendMessage);
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
        const loadFromRoom = async () => {
            if (!room || !auth?.user?.id) return;

            if (room.startsWith('dm:')) {
                const [, identifier] = room.split(':');
                if (!identifier) return;

                const userIds = identifier.split('-');
                if (userIds.length !== 2) return;

                const [userId1, userId2] = userIds;
                const peerUserId = userId1 === auth.user.id ? userId2 : userId2 === auth.user.id ? userId1 : null;

                if (!peerUserId || peerUserId === auth.user.id) return;
                if (selectedPeer?.id === peerUserId) return;

                try {
                    const result = await getUser({ data: { userId: peerUserId } });
                    if (result.success) {
                        setSelectedPeer(result.body);
                    } else {
                        toast.error('User not found');
                    }
                } catch {
                    toast.error('Failed to load user');
                }
            } else if (room.startsWith('band:')) {
                const [, bandIdStr] = room.split(':');
                if (!bandIdStr) return;

                const bandId = parseInt(bandIdStr, 10);
                if (!bandId || isNaN(bandId)) return;
                if (selectedBand?.id === bandId) return;

                try {
                    const result = await getBand({ data: { bandId } });
                    if (result.success) {
                        setSelectedBand(result.body);
                    } else {
                        toast.error('Band not found');
                    }
                } catch {
                    toast.error('Failed to load band');
                }
            }
        };

        loadFromRoom();
    }, [room, auth?.user?.id, setSelectedPeer, selectedPeer?.id, setSelectedBand, selectedBand?.id]);

    useEffect(() => {
        if (roomId && auth?.user?.id && (selectedPeer?.id || selectedBand?.id) && (roomId.startsWith('dm:') || roomId.startsWith('band:'))) {
            subscribeToRoom(roomId);

            return () => {
                unsubscribeFromRoom(roomId);
            };
        }
    }, [roomId, subscribeToRoom, unsubscribeFromRoom, auth?.user?.id, selectedPeer?.id, selectedBand?.id]);

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
                        <UserAvatar user={selectedPeer} className="h-10 w-10" />
                        <div>
                            <div className="font-semibold">{selectedPeer.name}</div>
                        </div>
                    </Link>
                ) : selectedBand ? (
                    <Link to="/bands/$id" params={{ id: selectedBand.id.toString() }} className="flex items-center gap-3 transition-opacity hover:opacity-80">
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={selectedBand.profileImageUrl || undefined} />
                            <AvatarFallback>{selectedBand.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <div className="font-semibold">{selectedBand.name}</div>
                        </div>
                    </Link>
                ) : null}
            </header>

            <div className="bg-muted/30 flex-1">
                {shouldShowLoading ? (
                    <div className="flex h-full items-center justify-center">
                        <div className="text-muted-foreground text-sm">Loading messages...</div>
                    </div>
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
                        maxLength={CHAT_MESSAGE_MAX_LENGTH}
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
