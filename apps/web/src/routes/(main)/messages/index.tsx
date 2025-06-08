import { useEnvs, useUser } from '@/web/lib/react-query';
import { useUnifiedWebSocket } from '@/web/providers/unified-websocket-provider';
import { useChatWindows } from '@/web/components/chat/chat-window-manager';
import { getRoomId } from '@sound-connect/common/helpers';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { Input } from '@/web/components/ui/input';
import { Card } from '@/web/components/ui/card';
import { Button } from '@/web/components/ui/button';
import { ChatMessage, UserDTO } from '@sound-connect/common/types/models';
import { getChatHistory } from '@/web/server-functions/models';
import { CHAT_MESSAGE_MAX_LENGTH } from '@sound-connect/common/constants';
import clsx from 'clsx';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/web/components/ui/form';
import StatusAvatar from '@/web/components/small/status-avatar';
import useContacts from '@/web/hooks/use-contacts';

export const Route = createFileRoute('/(main)/messages/')({
    component: RouteComponent
});

function RouteComponent() {
    const { subscribeToRoom, unsubscribeFromRoom, sendMessage, loadRoomHistory, lastMessage, status, roomMessages } = useUnifiedWebSocket();
    const { openChatWindow } = useChatWindows();
    const { data: envs } = useEnvs();
    const { data: user } = useUser();
    const { users } = useContacts();

    const [selectedPeer, setSelectedPeer] = useState<UserDTO | null>(null);
    const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
    const [messages, setMessages] = useState<(ChatMessage & { roomId?: string; senderId?: string; timestamp?: number })[]>([]);
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

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        if (!selectedPeer || !user || !values.text || !currentRoomId) return;

        sendMessage(currentRoomId, values.text);

        // Don't add optimistic update here - let the WebSocket handle it
        // This prevents duplicates since the message will come back through WebSocket
        form.reset();
    };

    useEffect(() => {
        if (selectedPeer && user) {
            const roomId = getRoomId(user.id, selectedPeer.id);
            setCurrentRoomId(roomId);

            // Subscribe to the room and load history
            const initializeRoom = async () => {
                console.log(`[MessagesPage] Initializing room ${roomId} for ${selectedPeer.name}`);

                // Always load history first (it doesn't require WebSocket)
                try {
                    await loadRoomHistory(roomId);
                    console.log(`[MessagesPage] History loaded for room ${roomId}`);
                } catch (error) {
                    console.error(`[MessagesPage] Failed to load history for room ${roomId}:`, error);
                }

                // Subscribe to room for real-time updates
                subscribeToRoom(roomId);
            };

            initializeRoom();

            return () => {
                // Unsubscribe when changing rooms
                console.log(`[MessagesPage] Cleaning up room ${roomId}`);
                unsubscribeFromRoom(roomId);
            };
        }
    }, [selectedPeer, user, subscribeToRoom, unsubscribeFromRoom, loadRoomHistory]);

    // Sync messages from the unified provider to local state
    useEffect(() => {
        if (currentRoomId) {
            const roomMsgs = roomMessages.get(currentRoomId) || [];
            setMessages(roomMsgs);
        }
    }, [roomMessages, currentRoomId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const renderPeers = () => {
        if (!users) return null;

        return users.map((u) => (
            <div key={u.id} className="flex items-center gap-1">
                <Button variant="ghost" className="flex-1 justify-start" onClick={() => setSelectedPeer(u)}>
                    <StatusAvatar user={u} />
                    <span className="truncate">{u.name}</span>
                </Button>
                <Button variant="ghost" size="sm" onClick={() => openChatWindow(u)} className="px-2 text-xs" title="Open in chat window">
                    💬
                </Button>
            </div>
        ));
    };

    const renderHeader = () => {
        if (!selectedPeer) return null;

        return (
            <Button variant="link" asChild>
                <Link to={`/users/${selectedPeer.id}`}>
                    <StatusAvatar user={selectedPeer} />
                    <span>{selectedPeer.name}</span>
                </Link>
            </Button>
        );
    };

    const renderMessages = () => {
        if (!user) return null;

        return messages.map((msg, i) => (
            <div
                key={i}
                className={clsx('flex justify-end', {
                    'justify-start': msg.senderId !== user.id
                })}
            >
                <Card
                    className={clsx(`bg-primary text-primary-foreground max-w-xs px-4 py-2`, {
                        'bg-muted text-card-foreground': msg.senderId !== user.id
                    })}
                >
                    {msg.text}
                </Card>
            </div>
        ));
    };

    const renderForm = () => {
        return (
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="bg-background flex items-center gap-2 border-t p-4">
                    <FormField
                        control={form.control}
                        name="text"
                        render={({ field }) => (
                            <FormItem className="flex flex-1 items-center justify-center gap-2">
                                <FormLabel>
                                    <span className="sr-only">Message</span>
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        {...field}
                                        placeholder="Type a message..."
                                        disabled={status !== 'open' || !selectedPeer}
                                        maxLength={CHAT_MESSAGE_MAX_LENGTH}
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                    <Button type="submit" className="hidden" aria-hidden="true" tabIndex={-1}></Button>
                </form>
            </Form>
        );
    };

    return (
        <div className="mx-auto flex h-[80vh] w-full max-w-4xl overflow-hidden rounded-lg border shadow">
            <div className="bg-muted flex w-1/4 flex-col border-r">
                <div className="border-b p-4 font-semibold">Chats</div>
                <div className="flex-1 overflow-y-auto">{renderPeers()}</div>
            </div>
            <div className="flex flex-1 flex-col">
                <div className="flex items-center gap-2 border-b p-4 font-semibold">{renderHeader()}</div>
                <div className="bg-background flex-1 space-y-2 overflow-y-auto p-4">
                    {renderMessages()}
                    <div ref={messagesEndRef} />
                </div>
                {renderForm()}
            </div>
        </div>
    );
}
