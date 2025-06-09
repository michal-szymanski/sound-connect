import { useState, useEffect, useRef } from 'react';
import { X, Minus, Send } from 'lucide-react';
import { Button } from '@/web/components/ui/button';
import { Input } from '@/web/components/ui/input';
import { Card, CardContent, CardHeader } from '@/web/components/ui/card';
import { ScrollArea } from '@/web/components/ui/scroll-area';
import { Form, FormControl, FormField, FormItem } from '@/web/components/ui/form';
import StatusAvatar from '@/web/components/small/status-avatar';
import { ChatMessage, UserDTO } from '@sound-connect/common/types/models';
import { CHAT_MESSAGE_MAX_LENGTH } from '@sound-connect/common/constants';
import { useWebSocket } from '@/web/providers/websocket-provider';
import { useUser } from '@/web/lib/react-query';
import { getRoomId } from '@sound-connect/common/helpers';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import clsx from 'clsx';

type Props = {
    user: UserDTO;
    onClose: () => void;
    isMinimized: boolean;
    onToggleMinimize: () => void;
    position: number;
};

export const ChatWindow = ({ user, onClose, isMinimized, onToggleMinimize, position }: Props) => {
    const { data: currentUser } = useUser();
    const { subscribeToRoom, unsubscribeFromRoom, sendMessage, loadRoomHistory, roomMessages } = useWebSocket();

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [roomId, setRoomId] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const formSchema = z.object({
        text: z.string().max(CHAT_MESSAGE_MAX_LENGTH)
    });

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            text: ''
        }
    });

    const rightOffset = 20 + position * 320;
    const bottomOffset = 20 + position * 60;

    useEffect(() => {
        if (currentUser && user) {
            const newRoomId = getRoomId(currentUser.id, user.id);
            setRoomId(newRoomId);

            const initializeRoom = async () => {
                try {
                    await loadRoomHistory(newRoomId);
                } catch (error) {}

                subscribeToRoom(newRoomId);
            };

            initializeRoom();

            return () => {
                unsubscribeFromRoom(newRoomId);
            };
        }
    }, [currentUser, user, subscribeToRoom, unsubscribeFromRoom, loadRoomHistory]);

    useEffect(() => {
        if (roomId) {
            const roomMsgs = roomMessages.get(roomId) || [];
            setMessages(roomMsgs);
        }
    }, [roomMessages, roomId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        if (!values.text.trim() || !roomId || !currentUser) return;

        sendMessage(roomId, values.text.trim());

        form.reset();
    };

    if (!currentUser) return null;

    if (isMinimized) {
        return (
            <div
                className="animate-in fade-in zoom-in group fixed right-5 z-50 flex h-12 w-12 items-center justify-center duration-300"
                style={{ bottom: `${bottomOffset}px` }}
            >
                <div
                    onClick={onToggleMinimize}
                    className="relative h-12 w-12 transform cursor-pointer rounded-full shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl"
                    title={`Chat with ${user.name}`}
                >
                    <div className="relative h-full w-full overflow-hidden rounded-full">
                        <StatusAvatar user={user} className="h-full w-full" />
                    </div>
                    <div
                        onClick={(e) => {
                            e.stopPropagation();
                            onClose();
                        }}
                        className="group/close absolute -right-1 -top-1 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full bg-gray-800 opacity-0 hover:bg-gray-200 group-hover:opacity-100"
                        title="Close chat"
                    >
                        <X className="h-3 w-3 text-white group-hover/close:text-gray-800" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <Card
            className="fixed bottom-0 z-[55] flex h-96 w-80 flex-col border-b-0 border-l border-r border-t shadow-lg transition-all duration-200 ease-in-out"
            style={{ right: `${rightOffset}px` }}
        >
            <CardHeader className="flex-shrink-0 cursor-pointer border-b p-3" onClick={onToggleMinimize}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <StatusAvatar user={user} />
                        <span className="truncate text-sm font-medium">{user.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleMinimize();
                            }}
                        >
                            <Minus className="h-3 w-3" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                                e.stopPropagation();
                                onClose();
                            }}
                        >
                            <X className="h-3 w-3" />
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="flex min-h-0 flex-1 flex-col p-0">
                <div className="min-h-0 flex-1">
                    <ScrollArea className="h-full p-3">
                        <div className="space-y-2">
                            {messages.length === 0 ? (
                                <div className="text-muted-foreground py-8 text-center text-sm">Start a conversation with {user.name}</div>
                            ) : (
                                messages.map((msg) => (
                                    <div key={msg.id} className={clsx('flex', msg.senderId === currentUser.id ? 'justify-end' : 'justify-start')}>
                                        <div
                                            className={clsx(
                                                'max-w-[70%] rounded-lg px-3 py-2 text-sm',
                                                msg.senderId === currentUser.id ? 'bg-primary text-primary-foreground' : 'bg-muted'
                                            )}
                                        >
                                            {msg.content}
                                        </div>
                                    </div>
                                ))
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    </ScrollArea>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="flex-shrink-0 border-t p-3">
                        <div className="flex gap-2">
                            <FormField
                                control={form.control}
                                name="text"
                                render={({ field }) => (
                                    <FormItem className="flex-1">
                                        <FormControl>
                                            <Input
                                                {...field}
                                                placeholder={`Message ${user.name}...`}
                                                className="text-sm"
                                                maxLength={CHAT_MESSAGE_MAX_LENGTH}
                                                autoComplete="off"
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" size="sm" disabled={!form.watch('text')?.trim()} className="px-3">
                                <Send className="h-3 w-3" />
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
};
