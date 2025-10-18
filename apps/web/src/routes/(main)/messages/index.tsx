import { zodResolver } from '@hookform/resolvers/zod';
import { CHAT_MESSAGE_MAX_LENGTH } from '@sound-connect/common/constants';
import { getRoomId } from '@sound-connect/common/helpers';
import { ChatMessage, UserDTO } from '@sound-connect/common/types/models';
import { createFileRoute, Link } from '@tanstack/react-router';
import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useSelector } from 'react-redux';
import { z } from 'zod';
import UserAvatar from '@/web/components/small/user-avatar';
import { Button } from '@/web/components/ui/button';
import { Card } from '@/web/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/web/components/ui/form';
import { Input } from '@/web/components/ui/input';
import { ScrollArea } from '@/web/components/ui/scroll-area';
import useContacts from '@/web/hooks/use-contacts';
import { useUser } from '@/web/lib/react-query';
import { useWebSocket } from '@/web/providers/websocket-provider';
import { RootState } from '@/web/redux/store';

export const Route = createFileRoute('/(main)/messages/')({
    component: RouteComponent
});

function RouteComponent() {
    const { subscribeToRoom, unsubscribeFromRoom, sendMessage, loadRoomHistory, status, roomMessages } = useWebSocket();
    const { data: user } = useUser();
    const { users } = useContacts();
    const { isSidebarCollapsed } = useSelector((state: RootState) => state.ui);

    const [selectedPeer, setSelectedPeer] = useState<UserDTO | null>(null);
    const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [leftPosition, setLeftPosition] = useState('64px');
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

    useEffect(() => {
        const updatePosition = () => {
            if (isSidebarCollapsed) {
                setLeftPosition('64px');
            } else {
                setLeftPosition(window.innerWidth >= 1280 ? '256px' : '64px');
            }
        };

        updatePosition();
        window.addEventListener('resize', updatePosition);
        return () => window.removeEventListener('resize', updatePosition);
    }, [isSidebarCollapsed]);

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        if (!selectedPeer || !user || !values.text || !currentRoomId) return;

        sendMessage(currentRoomId, values.text);

        form.reset();
    };

    useEffect(() => {
        if (selectedPeer && user) {
            const roomId = getRoomId(user.id, selectedPeer.id);
            setCurrentRoomId(roomId);

            const initializeRoom = async () => {
                try {
                    await loadRoomHistory(roomId);
                } catch (error) {}

                subscribeToRoom(roomId);
            };

            initializeRoom();

            return () => {
                unsubscribeFromRoom(roomId);
            };
        }
    }, [selectedPeer, user, subscribeToRoom, unsubscribeFromRoom, loadRoomHistory]);

    useEffect(() => {
        if (currentRoomId) {
            const roomMsgs = roomMessages.get(currentRoomId) || [];
            setMessages(roomMsgs);
        }
    }, [roomMessages, currentRoomId]);

    useEffect(() => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 50);
    }, [messages]);

    const renderPeers = () => {
        if (!users || users.length === 0) {
            return <div className="text-muted-foreground px-7 py-5 text-sm">No contacts found</div>;
        }

        return users.map((u) => (
            <div
                key={u.id}
                className={clsx('hover:bg-muted/50 cursor-pointer px-7 py-5 text-sm', selectedPeer?.id === u.id && 'bg-muted/50')}
                onClick={() => setSelectedPeer(u)}
            >
                <div className="inline-flex w-full items-center gap-3">
                    <UserAvatar user={u} />
                    <div>
                        <span className="font-medium">{u.name}</span>
                    </div>
                </div>
            </div>
        ));
    };

    const renderHeader = () => {
        if (!selectedPeer) return null;

        return (
            <Button variant="link" asChild>
                <Link to="/users/$id" params={{ id: selectedPeer.id }}>
                    <UserAvatar user={selectedPeer} />
                    <span>{selectedPeer.name}</span>
                </Link>
            </Button>
        );
    };

    const renderMessages = () => {
        if (!user) return null;

        return messages.map((msg, index) => (
            <div
                key={msg.id || `${msg.timestamp}-${index}`}
                className={clsx('flex justify-end', {
                    'justify-start': msg.senderId !== user.id
                })}
            >
                <Card
                    className={clsx(`bg-primary text-primary-foreground max-w-xs px-4 py-2`, {
                        'bg-muted text-card-foreground': msg.senderId !== user.id
                    })}
                >
                    {msg.content}
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
                                        autoComplete="off"
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
        <div className="flex h-full w-full flex-col overflow-hidden">
            <div className="bg-background absolute top-0 z-[60] flex h-screen w-80 flex-col border-r" style={{ left: leftPosition }}>
                <div className="flex flex-col gap-1.5 p-4">
                    <h2 className="text-foreground text-2xl font-semibold">Contacts</h2>
                </div>
                <div className="min-h-0 flex-1 overflow-hidden">
                    <ScrollArea className="h-full">{renderPeers()}</ScrollArea>
                </div>
            </div>
            <div className="flex flex-1 flex-col" style={{ marginLeft: `calc(${leftPosition} + 320px)` }}>
                <div className="bg-background flex items-center gap-2 border-b p-4 font-semibold">{renderHeader()}</div>
                <div className="bg-background min-h-0 flex-1">
                    <ScrollArea className="h-full p-4">
                        <div className="space-y-2">
                            {renderMessages()}
                            <div ref={messagesEndRef} />
                        </div>
                    </ScrollArea>
                </div>
                {renderForm()}
            </div>
        </div>
    );
}
