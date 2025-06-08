import { useState, useEffect, useRef } from 'react';
import { X, Minus, Send } from 'lucide-react';
import { Button } from '@/web/components/ui/button';
import { Input } from '@/web/components/ui/input';
import { Card, CardContent, CardHeader } from '@/web/components/ui/card';
import StatusAvatar from '@/web/components/small/status-avatar';
import { UserDTO, ChatMessage } from '@sound-connect/common/types/models';
import { useUnifiedWebSocket } from '@/web/providers/unified-websocket-provider';
import { useUser } from '@/web/lib/react-query';
import { getRoomId } from '@sound-connect/common/helpers';
import clsx from 'clsx';

interface ChatWindowProps {
    user: UserDTO;
    onClose: () => void;
    isMinimized: boolean;
    onToggleMinimize: () => void;
    position: number; // 0-based index for positioning multiple windows
}

export const ChatWindow = ({ user, onClose, isMinimized, onToggleMinimize, position }: ChatWindowProps) => {
    const { data: currentUser } = useUser();
    const { subscribeToRoom, unsubscribeFromRoom, sendMessage, loadRoomHistory, roomMessages } = useUnifiedWebSocket();

    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<(ChatMessage & { roomId?: string; senderId?: string; timestamp?: number })[]>([]);
    const [roomId, setRoomId] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Calculate position from right
    const rightOffset = 20 + position * 320; // 300px width + 20px gap

    useEffect(() => {
        if (currentUser && user) {
            const newRoomId = getRoomId(currentUser.id, user.id);
            setRoomId(newRoomId);

            // Subscribe to the room and load history
            const initializeRoom = async () => {
                subscribeToRoom(newRoomId);
                await loadRoomHistory(newRoomId);
            };

            initializeRoom();

            return () => {
                // Unsubscribe when component unmounts
                unsubscribeFromRoom(newRoomId);
            };
        }
    }, [currentUser, user, subscribeToRoom, unsubscribeFromRoom, loadRoomHistory]);

    // Sync messages from the unified provider to local state
    useEffect(() => {
        if (roomId) {
            const roomMsgs = roomMessages.get(roomId) || [];
            setMessages(roomMsgs);
        }
    }, [roomMessages, roomId]);

    useEffect(() => {
        // Scroll to bottom when messages change
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim() || !roomId || !currentUser) return;

        // Send message through WebSocket
        sendMessage(roomId, message.trim());

        // Don't add optimistic update here - let the WebSocket handle it
        // This prevents duplicates since the message will come back through WebSocket
        setMessage('');
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage(e);
        }
    };

    return (
        <Card
            className={clsx(
                'fixed bottom-0 z-[60] w-80 border-b-0 border-l border-r border-t shadow-lg transition-all duration-200 ease-in-out',
                isMinimized ? 'h-12' : 'h-96'
            )}
            style={{ right: `${rightOffset}px` }}
        >
            <CardHeader className="cursor-pointer border-b p-3" onClick={onToggleMinimize}>
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

            {!isMinimized && (
                <CardContent className="flex h-80 flex-col p-0">
                    {/* Messages Area */}
                    <div className="flex-1 space-y-2 overflow-y-auto p-3">
                        {messages.length === 0 ? (
                            <div className="text-muted-foreground py-8 text-center text-sm">Start a conversation with {user.name}</div>
                        ) : (
                            messages.map((msg, index) => (
                                <div key={index} className={clsx('flex', msg.senderId === currentUser?.id ? 'justify-end' : 'justify-start')}>
                                    <div
                                        className={clsx(
                                            'max-w-[70%] rounded-lg px-3 py-2 text-sm',
                                            msg.senderId === currentUser?.id ? 'bg-primary text-primary-foreground' : 'bg-muted'
                                        )}
                                    >
                                        {msg.text}
                                    </div>
                                </div>
                            ))
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <form onSubmit={handleSendMessage} className="border-t p-3">
                        <div className="flex gap-2">
                            <Input
                                ref={inputRef}
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder={`Message ${user.name}...`}
                                className="flex-1 text-sm"
                            />
                            <Button type="submit" size="sm" disabled={!message.trim()} className="px-3">
                                <Send className="h-3 w-3" />
                            </Button>
                        </div>
                    </form>
                </CardContent>
            )}
        </Card>
    );
};
