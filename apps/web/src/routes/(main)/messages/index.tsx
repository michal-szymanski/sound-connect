import { useMutualFollowers, userQueryOptions, useEnvs } from '@/web/lib/react-query';
import { useWebSocket } from '@/web/providers/websocket-provider';
import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/web/components/ui/avatar';
import { Input } from '@/web/components/ui/input';
import { Card } from '@/web/components/ui/card';
import { Button } from '@/web/components/ui/button';
import { ChatMessage } from '@sound-connect/api/types';
import { getChatHistory } from '@/web/server-functions/models';
import { UserDTO } from '@/web/types/auth';
import consts from '@/web/lib/consts';
import clsx from 'clsx';

export const Route = createFileRoute('/(main)/messages/')({
    component: RouteComponent
});

function RouteComponent() {
    const { send, lastMessage, status, setPeerId } = useWebSocket();
    const { data: user } = useSuspenseQuery(userQueryOptions(null));
    const { data: users } = useMutualFollowers(user);
    const [selectedPeer, setSelectedPeer] = useState<UserDTO | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { data: envs } = useEnvs();

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

    const handleSend = () => {
        if (input.trim() && selectedPeer && user) {
            const newMessage: ChatMessage = { type: 'chat', text: input, receiverId: selectedPeer.id, senderId: user.id };
            send(newMessage);
            setMessages((prev) => [...prev, newMessage]);
            setInput('');
        }
    };

    return (
        <div className="mx-auto flex h-[80vh] w-full max-w-4xl overflow-hidden rounded-lg border shadow">
            <div className="bg-muted flex w-1/4 flex-col border-r">
                <div className="border-b p-4 font-semibold">Chats</div>
                <div className="flex-1 overflow-y-auto">
                    {users?.map((u) => (
                        <button
                            key={u.id}
                            className={`hover:bg-accent flex w-full items-center gap-2 p-3 transition ${selectedPeer?.id === u.id ? 'bg-accent' : ''}`}
                            onClick={() => setSelectedPeer(u)}
                        >
                            <Avatar>
                                <AvatarImage src={u.image ?? consts.SHADCN_DEFAULT_AVATAR} />
                                <AvatarFallback>{u.name}</AvatarFallback>
                            </Avatar>
                            <span className="truncate">{u.name}</span>
                        </button>
                    ))}
                </div>
            </div>
            <div className="flex flex-1 flex-col">
                <div className="flex items-center gap-2 border-b p-4 font-semibold">
                    {selectedPeer && (
                        <>
                            <Avatar>
                                <AvatarImage src={selectedPeer.image ?? consts.SHADCN_DEFAULT_AVATAR} />
                                <AvatarFallback>{selectedPeer.name}</AvatarFallback>
                            </Avatar>
                            <span>{selectedPeer.name}</span>
                        </>
                    )}
                </div>
                <div className="bg-background flex-1 space-y-2 overflow-y-auto p-4">
                    {messages.map((msg, i) => (
                        <div
                            key={i}
                            className={clsx('flex justify-end', {
                                'justify-start': msg.senderId !== user?.id
                            })}
                        >
                            <Card
                                className={clsx(`bg-primary text-primary-foreground max-w-xs px-4 py-2`, {
                                    'bg-muted text-card-foreground': msg.senderId !== user?.id
                                })}
                            >
                                {msg.text}
                            </Card>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
                <form
                    className="bg-background flex gap-2 border-t p-4"
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSend();
                    }}
                >
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1"
                        disabled={status !== 'open' || !selectedPeer}
                    />
                    <Button type="submit" disabled={status !== 'open' || !input.trim() || !selectedPeer}>
                        Send
                    </Button>
                </form>
            </div>
        </div>
    );
}
