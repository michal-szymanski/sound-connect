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

export const Route = createFileRoute('/(main)/messages/')({
    component: RouteComponent
});

function RouteComponent() {
    const { send, lastMessage, status, setPeerId } = useWebSocket();
    const { data: user } = useSuspenseQuery(userQueryOptions(null));
    const { data: users } = useMutualFollowers(user);
    const [selectedUser, setSelectedUser] = useState(users?.[0] || null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { data: envs } = useEnvs();

    // Set peerId in WebSocketProvider when selectedUser changes
    useEffect(() => {
        if (selectedUser) {
            setPeerId(selectedUser.id);
        }
    }, [selectedUser, setPeerId]);

    // Fetch chat history when selectedUser changes
    useEffect(() => {
        if (envs && user && selectedUser) {
            setPeerId(selectedUser.id);
            // const roomId = [user.id, selectedUser.id].sort().join(':');
            // fetch(`${envs.API_URL}/ws/${roomId}/history`, {
            //     headers: {
            //         'Content-Type': 'application/json'
            //     }
            // })
            //     .then((res) => res.json())
            //     .then((history) => {
            //         if (Array.isArray(history)) {
            //             setMessages(history);
            //         } else {
            //             setMessages([]);
            //         }
            //     });
            getChatHistory({ data: { senderId: user.id, receiverId: selectedUser.id } }).then((res) => {
                if (res.success) {
                    setMessages(res.body);
                } else {
                    console.error('[App] Error fetching chat history:', res.body);
                }
            });
        }
    }, [selectedUser, setPeerId, envs, user]);

    useEffect(() => {
        if (!lastMessage) return;

        setMessages((prev) => [...prev, lastMessage]);
    }, [lastMessage, user]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = () => {
        if (input.trim() && selectedUser && user && envs) {
            const newMessage: ChatMessage = { type: 'chat', text: input, receiverId: selectedUser.id, senderId: user.id };
            send(newMessage);
            setMessages((prev) => [...prev, newMessage]);
            setInput('');
            // Refetch history after sending
            const roomId = [user.id, selectedUser.id].sort().join(':');
            fetch(`${envs.API_URL}/ws/${roomId}/history`)
                .then((res) => res.json())
                .then((history) => {
                    if (Array.isArray(history)) {
                        setMessages(history);
                    }
                });
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
                            className={`hover:bg-accent flex w-full items-center gap-2 p-3 transition ${selectedUser?.id === u.id ? 'bg-accent' : ''}`}
                            onClick={() => setSelectedUser(u)}
                        >
                            <Avatar>
                                <AvatarImage src={u.image ?? undefined} />
                                <AvatarFallback>{u.name?.[0]}</AvatarFallback>
                            </Avatar>
                            <span className="truncate">{u.name}</span>
                        </button>
                    ))}
                </div>
            </div>
            {/* Chat area */}
            <div className="flex flex-1 flex-col">
                <div className="flex items-center gap-2 border-b p-4 font-semibold">
                    {selectedUser && (
                        <>
                            <Avatar>
                                <AvatarImage src={selectedUser.image ?? undefined} />
                                <AvatarFallback>{selectedUser.name?.[0]}</AvatarFallback>
                            </Avatar>
                            <span>{selectedUser.name}</span>
                        </>
                    )}
                </div>
                <div className="bg-background flex-1 space-y-2 overflow-y-auto p-4">
                    {messages.map((msg, i) => (
                        <div key={i} className={`flex ${user && msg?.senderId === user.id ? 'justify-end' : 'justify-start'}`}>
                            <Card className={`max-w-xs px-4 py-2 ${user && msg?.senderId === user.id ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
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
                        disabled={status !== 'open' || !selectedUser}
                    />
                    <Button type="submit" disabled={status !== 'open' || !input.trim() || !selectedUser}>
                        Send
                    </Button>
                </form>
            </div>
        </div>
    );
}
