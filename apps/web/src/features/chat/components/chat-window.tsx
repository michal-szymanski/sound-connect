import { zodResolver } from '@hookform/resolvers/zod';
import { CHAT_MESSAGE_MAX_LENGTH } from '@/common/constants';
import { getRoomId } from '@/common/helpers';
import { ChatMessage, UserDTO } from '@/common/types/models';
import clsx from 'clsx';
import { X, Minus, Send } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { useAuth } from '@/shared/lib/react-query';
import { useWebSocket } from '@/shared/components/providers/websocket-provider';

type Props = {
    user: UserDTO;
    onClose: () => void;
    isMinimized: boolean;
    onToggleMinimize: () => void;
    position: number;
};

const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
};

const BASE_BOTTOM_OFFSET = 24;

export const ChatWindow = ({ user, onClose, isMinimized, onToggleMinimize, position }: Props) => {
    const { data: auth } = useAuth();
    const { subscribeToRoom, unsubscribeFromRoom, sendMessage, loadRoomHistory, roomMessages } = useWebSocket();

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [roomId, setRoomId] = useState<string | null>(null);
    const [isHovered, setIsHovered] = useState(false);
    const [animationKey, setAnimationKey] = useState(0);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const prevMinimizedRef = useRef(isMinimized);

    const formSchema = z.object({
        text: z.string().max(CHAT_MESSAGE_MAX_LENGTH)
    });

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            text: ''
        }
    });

    const rightOffset = 24 + position * 360;
    const bottomOffset = BASE_BOTTOM_OFFSET + position * 56;

    useEffect(() => {
        if (auth?.user && user) {
            const newRoomId = getRoomId(auth.user.id, user.id);
            setRoomId(newRoomId);

            const initializeRoom = async () => {
                try {
                    await loadRoomHistory(newRoomId);
                } catch (error) {
                    console.error('Failed to load room history:', error);
                }

                subscribeToRoom(newRoomId);
            };

            initializeRoom();

            return () => {
                unsubscribeFromRoom(newRoomId);
            };
        }
    }, [auth, user, subscribeToRoom, unsubscribeFromRoom, loadRoomHistory]);

    useEffect(() => {
        if (roomId) {
            const roomMsgs = roomMessages.get(roomId) || [];
            setMessages(roomMsgs);
        }
    }, [roomMessages, roomId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (prevMinimizedRef.current && !isMinimized) {
            setAnimationKey((prev) => prev + 1);
        }
        prevMinimizedRef.current = isMinimized;
    }, [isMinimized]);

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        if (!values.text.trim() || !roomId || !auth?.user) return;

        sendMessage(roomId, values.text.trim());

        form.reset();
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            form.handleSubmit(onSubmit)();
        }
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
                        <Avatar className="h-12 w-12">
                            <AvatarImage src={user.image || '/placeholder.svg'} alt={user.name} />
                            <AvatarFallback className="bg-primary text-primary-foreground">{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
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
        <div
            key={animationKey}
            className="bg-card border-border z-dialog animate-in slide-in-from-bottom-4 fixed bottom-0 w-[340px] overflow-hidden rounded-t-lg border shadow-2xl duration-300"
            style={{ right: `${rightOffset}px` }}
        >
            <div className="bg-primary text-primary-foreground flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                    <Avatar className="border-primary-foreground/20 h-8 w-8 border-2">
                        <AvatarImage src={user.image || '/placeholder.svg'} alt={user.name} />
                        <AvatarFallback className="bg-primary-foreground text-primary text-xs">{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{user.name}</span>
                </div>

                <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10 h-8 w-8" onClick={onToggleMinimize}>
                        <Minus className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10 h-8 w-8" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <ScrollArea className="bg-background h-[320px]">
                <div className="space-y-3 p-4">
                    {messages.length === 0 ? (
                        <div className="text-muted-foreground py-8 text-center text-sm">Start a conversation with {user.name}</div>
                    ) : (
                        messages.map((msg) => (
                            <div key={msg.id} className={clsx('flex flex-col', msg.senderId === currentUser.id ? 'items-end' : 'items-start')}>
                                <div
                                    className={clsx(
                                        'max-w-[75%] rounded-2xl px-4 py-2 text-sm',
                                        msg.senderId === currentUser.id
                                            ? 'bg-primary text-primary-foreground rounded-br-sm'
                                            : 'bg-muted text-foreground rounded-bl-sm'
                                    )}
                                >
                                    {msg.content}
                                </div>
                                <span className="text-muted-foreground mt-1 px-1 text-xs">{formatTimestamp(msg.timestamp)}</span>
                            </div>
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </ScrollArea>

            <div className="bg-card border-border border-t p-3">
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <div className="flex items-center gap-2">
                        <Input
                            {...form.register('text')}
                            placeholder="Enter Message"
                            onKeyPress={handleKeyPress}
                            className="bg-background border-border flex-1"
                            maxLength={CHAT_MESSAGE_MAX_LENGTH}
                            autoComplete="off"
                        />
                        {/* eslint-disable-next-line react-hooks/incompatible-library */}
                        <Button type="submit" size="icon" disabled={!form.watch('text')?.trim()} className="shrink-0">
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
