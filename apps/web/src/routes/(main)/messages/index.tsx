import { zodResolver } from '@hookform/resolvers/zod';
import { CHAT_MESSAGE_MAX_LENGTH } from '@/common/constants';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { MessageCircle, Send, Smile } from 'lucide-react';
import UserAvatar from '@/shared/components/common/user-avatar';
import { Button } from '@/shared/components/ui/button';
import { Textarea } from '@/shared/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover';
import { useAuth } from '@/shared/lib/react-query';
import { useChat } from '@/shared/components/providers/chat-provider';
import { EmojiPickerContent } from '@/web/components/emoji-picker-content';
import { VirtualizedMessageList } from '@/features/chat/components/virtualized-message-list';
import { useChatMessages, useGetRoomId, useSendMessage } from '@/features/chat/hooks/use-chat-queries';
import { useMessagingContext } from './context';

export const Route = createFileRoute('/(main)/messages/')({
    component: RouteComponent
});

const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
};

function RouteComponent() {
    const { subscribeToRoom, unsubscribeFromRoom, sendMessage } = useChat();
    const { data: auth } = useAuth();
    const { selectedPeer } = useMessagingContext();

    const roomId = useGetRoomId(auth?.user?.id || '', selectedPeer?.id || '');
    const { data: messages = [], isLoading } = useChatMessages({ conversationId: roomId, enabled: !!selectedPeer });
    const sendMutation = useSendMessage(sendMessage);

    const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const formSchema = z.object({
        text: z.string().max(CHAT_MESSAGE_MAX_LENGTH)
    });

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            text: ''
        }
    });

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        if (!selectedPeer || !auth?.user || !values.text || !roomId) return;

        sendMutation.mutate({
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
        if (roomId && auth?.user?.id && selectedPeer?.id && !roomId.startsWith(':')) {
            subscribeToRoom(roomId);

            return () => {
                unsubscribeFromRoom(roomId);
            };
        }
    }, [roomId, subscribeToRoom, unsubscribeFromRoom, auth?.user?.id, selectedPeer?.id]);

    if (!selectedPeer) {
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
                <Link to="/users/$id" params={{ id: selectedPeer.id }} className="flex items-center gap-3 transition-opacity hover:opacity-80">
                    <UserAvatar user={selectedPeer} className="h-10 w-10" />
                    <div>
                        <div className="font-semibold">{selectedPeer.name}</div>
                    </div>
                </Link>
            </header>

            <div className="bg-muted/30 flex-1">
                {isLoading ? (
                    <div className="flex h-full items-center justify-center">
                        <div className="text-muted-foreground text-sm">Loading messages...</div>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex h-full items-center justify-center">
                        <div className="text-muted-foreground text-sm">Start a conversation with {selectedPeer.name}</div>
                    </div>
                ) : (
                    <VirtualizedMessageList messages={messages} currentUserId={auth?.user?.id || ''} formatTimestamp={formatTimestamp} />
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
                        disabled={!selectedPeer || !roomId || !auth?.user}
                        maxLength={CHAT_MESSAGE_MAX_LENGTH}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                form.handleSubmit(onSubmit)();
                            }
                        }}
                    />

                    <Button type="submit" size="icon" disabled={!form.getValues('text')?.trim()} className="shrink-0">
                        <Send className="h-4 w-4" />
                        <span className="sr-only">Send message</span>
                    </Button>
                </div>
            </form>
        </div>
    );
}
