import { useMutualFollowers, userQueryOptions, useEnvs } from '@/web/lib/react-query';
import { useWebSocket } from '@/web/providers/websocket-provider';
import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { Input } from '@/web/components/ui/input';
import { Card } from '@/web/components/ui/card';
import { Button } from '@/web/components/ui/button';
import { ChatMessage } from '@sound-connect/common/types';
import { getChatHistory } from '@/web/server-functions/models';
import { UserDTO } from '@/web/types/auth';
import { CHAT_MESSAGE_MAX_LENGTH } from '@sound-connect/common/constants';
import clsx from 'clsx';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/web/components/ui/form';
import StatusAvatar from '@/web/components/status-avatar';

export const Route = createFileRoute('/(main)/messages/')({
    component: RouteComponent
});

function RouteComponent() {
    const { send, lastMessage, status, setPeerId } = useWebSocket();
    const { data: user } = useSuspenseQuery(userQueryOptions(null));
    const { data: users } = useMutualFollowers(user);
    const [selectedPeer, setSelectedPeer] = useState<UserDTO | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { data: envs } = useEnvs();

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
        if (!selectedPeer || !user || !values.text) return;

        const newMessage: ChatMessage = { ...values, type: 'chat', peerId: selectedPeer.id };
        send(newMessage);
        setMessages((prev) => [...prev, newMessage]);
        form.reset();
    };

    useEffect(() => {
        if (selectedPeer) {
            setPeerId(selectedPeer.id);
        }
    }, [selectedPeer, setPeerId]);

    useEffect(() => {
        if (envs && user && selectedPeer) {
            setPeerId(selectedPeer.id);
            getChatHistory({ data: { peerId: selectedPeer.id } }).then((res) => {
                if (res.success) {
                    setMessages(res.body);
                } else {
                    console.error('[App] Error fetching chat history:', res.body);
                }
            });
        }
    }, [selectedPeer, setPeerId, envs, user]);

    useEffect(() => {
        if (!lastMessage) return;

        setMessages((prev) => [...prev, lastMessage]);
    }, [lastMessage, user]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const renderPeers = () => {
        if (!users) return null;

        return users.map((u) => (
            <Button key={u.id} variant="ghost" onClick={() => setSelectedPeer(u)}>
                <StatusAvatar user={u} />
                <span className="truncate">{u.name}</span>
            </Button>
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
                    'justify-start': msg.peerId === user.id
                })}
            >
                <Card
                    className={clsx(`bg-primary text-primary-foreground max-w-xs px-4 py-2`, {
                        'bg-muted text-card-foreground': msg.peerId === user.id
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
