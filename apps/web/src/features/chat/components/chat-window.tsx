import { zodResolver } from '@hookform/resolvers/zod';
import { UserDTO } from '@/common/types/models';
import { X, Minus, Send, Smile, Loader2 } from 'lucide-react';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import ProfileAvatar from '@/shared/components/common/profile-avatar';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover';
import { useAuth } from '@/shared/lib/react-query';
import { useChat } from '@/shared/components/providers/chat-provider';
import { EmojiPickerContent } from '@/web/components/emoji-picker-content';
import { useChatMessages, useSendMessage, useMarkMessagesAsRead } from '@/features/chat/hooks/use-chat-queries';
import { getRoomId } from '@sound-connect/common/helpers';
import { VirtualizedMessageList } from './virtualized-message-list';
import { useDelayedLoading } from '@/web/hooks/use-delayed-loading';
import { MessageStatusIndicator } from './message-status-indicator';
import { formatTimestamp } from '@/features/chat/utils/format-timestamp';
import { messageFormSchema, type MessageFormValues } from '@/features/chat/schemas/message-form';
import { appConfig } from '@sound-connect/common/app-config';

type Props = {
    user: UserDTO;
    onClose: () => void;
    isMinimized: boolean;
    onToggleMinimize: () => void;
    position: number;
    minimizedCount: number;
};

const BASE_BOTTOM_OFFSET = 24;

export const ChatWindow = ({ user, onClose, isMinimized, onToggleMinimize, position, minimizedCount }: Props) => {
    const { data: auth } = useAuth();
    const { subscribeToRoom, unsubscribeFromRoom, sendMessage } = useChat();

    const roomId = useMemo(() => {
        if (!auth?.user?.id) return '';

        if (user.id.startsWith('band-')) {
            const bandId = user.id.replace('band-', '');
            return `band:${bandId}`;
        }

        return getRoomId(auth.user.id, user.id);
    }, [auth?.user?.id, user.id]);
    const { data: messages = [], isLoading } = useChatMessages({ conversationId: roomId, enabled: !!auth?.user });
    const { mutate: sendMessageMutate, messageStatuses, retryMessage } = useSendMessage(sendMessage);
    const { mutate: markAsRead } = useMarkMessagesAsRead();
    const shouldShowLoading = useDelayedLoading({ isLoading });

    const [isHovered, setIsHovered] = useState(false);
    const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
    const [announcement, setAnnouncement] = useState('');

    const inputRef = useRef<HTMLInputElement>(null);

    const form = useForm<MessageFormValues>({
        resolver: zodResolver(messageFormSchema),
        defaultValues: {
            text: ''
        }
    });

    const { ref: formInputRef, ...registerProps } = form.register('text', {
        setValueAs: (v) => v
    });

    const textValue = form.watch('text');

    const rightOffset = 24 + position * 360 + (isMinimized ? 0 : minimizedCount * 70);
    const bottomOffset = BASE_BOTTOM_OFFSET + position * 56;

    useEffect(() => {
        if (roomId && auth?.user?.id && (roomId.startsWith('dm:') || roomId.startsWith('band:'))) {
            subscribeToRoom(roomId);

            return () => {
                unsubscribeFromRoom(roomId);
            };
        }
    }, [roomId, subscribeToRoom, unsubscribeFromRoom, auth?.user?.id]);

    useEffect(() => {
        if (roomId && !isMinimized && messages.length > 0 && auth?.user?.id) {
            markAsRead({ roomId, currentUserId: auth.user.id });
        }
    }, [roomId, isMinimized, messages.length, markAsRead, auth?.user?.id]);

    useEffect(() => {
        if (!isMinimized) {
            inputRef.current?.focus();
        }
    }, [isMinimized]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !isMinimized) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose, isMinimized]);

    useEffect(() => {
        if (messages.length > 0 && !isMinimized) {
            const lastMessage = messages[messages.length - 1];
            if (lastMessage && lastMessage.senderId !== auth?.user?.id) {
                setAnnouncement(`New message from ${user.name}: ${lastMessage.content}`);
                setTimeout(() => setAnnouncement(''), 1000);
            }
        }
    }, [messages, auth?.user?.id, user.name, isMinimized]);

    const onSubmit = async (values: MessageFormValues) => {
        if (!values.text.trim() || !roomId || !auth?.user) return;

        sendMessageMutate({
            conversationId: roomId,
            content: values.text.trim(),
            senderId: auth.user.id
        });

        form.reset();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            form.handleSubmit(onSubmit)();
        }
    };

    const insertEmoji = (emoji: string) => {
        const input = inputRef.current;
        const currentValue = form.getValues('text') || '';

        if (!input) {
            form.setValue('text', currentValue + emoji);
            setIsEmojiPickerOpen(false);
            return;
        }

        const cursorPos = input.selectionStart || currentValue.length;
        const newMessage = currentValue.slice(0, cursorPos) + emoji + currentValue.slice(cursorPos);

        form.setValue('text', newMessage);
        setIsEmojiPickerOpen(false);

        setTimeout(() => {
            input.focus();
            input.setSelectionRange(cursorPos + emoji.length, cursorPos + emoji.length);
        }, 0);
    };

    if (!auth?.user) return null;

    const currentUser = auth.user;

    if (isMinimized) {
        return (
            <div
                className="z-dialog animate-in fade-in zoom-in fixed duration-300"
                style={{ bottom: `${bottomOffset}px`, right: `${rightOffset}px` }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <div className="relative">
                    <button
                        onClick={onToggleMinimize}
                        className="bg-card border-border focus-visible:ring-ring flex h-14 w-14 items-center justify-center rounded-full border-2 shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                        title={`Chat with ${user.name}`}
                        aria-label={`Open chat with ${user.name}`}
                        tabIndex={0}
                    >
                        <ProfileAvatar
                            profile={{ id: user.id, name: user.name, image: user.image }}
                            type={user.id.startsWith('band-') ? 'band' : 'user'}
                            className="h-12 w-12"
                        />
                    </button>

                    {isHovered && (
                        <Button
                            size="icon"
                            variant="destructive"
                            className="animate-in fade-in zoom-in absolute -top-2 -right-2 h-6 w-6 rounded-full shadow-md duration-150"
                            onClick={(e) => {
                                e.stopPropagation();
                                onClose();
                            }}
                        >
                            <X className="h-3 w-3" />
                        </Button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <>
            <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
                {announcement}
            </div>
            <div className="animate-in slide-in-from-bottom-4 fixed bottom-0 z-[105] w-[340px] duration-300" style={{ right: `${rightOffset}px` }}>
                <div className="bg-card border-border overflow-hidden rounded-t-lg border shadow-2xl">
                    <div className="bg-primary text-primary-foreground border-border/30 flex items-center justify-between border-b px-4 py-3 shadow-sm">
                        <div className="flex items-center gap-3">
                            <ProfileAvatar
                                profile={{ id: user.id, name: user.name, image: user.image }}
                                type={user.id.startsWith('band-') ? 'band' : 'user'}
                                className="h-8 w-8 border-2 border-white/50"
                                fallbackClassName="bg-primary text-primary-foreground text-xs"
                                linkToProfile
                            />
                            <span className="text-sm font-medium">{user.name}</span>
                        </div>

                        <div className="flex items-center gap-1">
                            <Button
                                size="icon"
                                variant="ghost"
                                className="text-primary-foreground hover:bg-primary-foreground/10 h-8 w-8"
                                onClick={onToggleMinimize}
                            >
                                <Minus className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10 h-8 w-8" onClick={onClose}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="bg-background relative h-[320px]" role="log" aria-label={`Conversation with ${user.name}`}>
                        {shouldShowLoading ? (
                            <div
                                className="animate-in fade-in flex h-full flex-col items-center justify-center gap-3 duration-200"
                                role="status"
                                aria-live="polite"
                                aria-label="Loading messages"
                            >
                                <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" aria-hidden="true" />
                                <span className="text-muted-foreground text-sm">Loading messages...</span>
                            </div>
                        ) : messages.length === 0 && !isLoading ? (
                            <div className="flex h-full items-center justify-center">
                                <div className="text-muted-foreground text-sm">Start a conversation with {user.name}</div>
                            </div>
                        ) : (
                            <VirtualizedMessageList
                                messages={messages}
                                currentUserId={currentUser.id}
                                formatTimestamp={formatTimestamp}
                                isInitialLoad={messages.length === 0}
                                statusIndicator={(() => {
                                    const latestMessage = messages[messages.length - 1];
                                    const status = latestMessage && messageStatuses.get(latestMessage.id);
                                    const isCurrentUser = latestMessage?.senderId === currentUser.id;

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

                    <div className="bg-card border-border border-t p-3">
                        <form onSubmit={form.handleSubmit(onSubmit)}>
                            <div className="flex items-center gap-2">
                                <Popover open={isEmojiPickerOpen} onOpenChange={setIsEmojiPickerOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="text-muted-foreground hover:text-foreground hover:bg-accent min-h-11 min-w-11 shrink-0 md:min-h-10 md:min-w-10"
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
                                <Input
                                    {...registerProps}
                                    ref={(e) => {
                                        formInputRef(e);
                                        inputRef.current = e;
                                    }}
                                    placeholder="Enter Message"
                                    onKeyDown={handleKeyDown}
                                    className="bg-background border-border flex-1 text-base md:text-sm"
                                    maxLength={appConfig.chatMessageMaxLength}
                                    autoComplete="off"
                                />
                                <Button type="submit" size="icon" disabled={!textValue?.trim()} className="shrink-0">
                                    <Send className="h-4 w-4" />
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
};
