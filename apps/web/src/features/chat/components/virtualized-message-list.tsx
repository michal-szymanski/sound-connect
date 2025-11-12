import { useVirtualizer } from '@tanstack/react-virtual';
import { useEffect, useRef } from 'react';
import type { ChatMessage } from '@/common/types/models';
import { MessageBubble } from './message-bubble';

type Props = {
    messages: ChatMessage[];
    currentUserId: string;
    formatTimestamp: (timestamp: number) => string;
};

export function VirtualizedMessageList({ messages, currentUserId, formatTimestamp }: Props) {
    const parentRef = useRef<HTMLDivElement>(null);
    const scrolledToBottomRef = useRef(true);

    const virtualizer = useVirtualizer({
        count: messages.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 80,
        overscan: 5
    });

    useEffect(() => {
        const parent = parentRef.current;
        if (!parent) return;

        const isScrolledToBottom = () => {
            const threshold = 100;
            return Math.abs(parent.scrollHeight - parent.scrollTop - parent.clientHeight) < threshold;
        };

        scrolledToBottomRef.current = isScrolledToBottom();
    }, [messages]);

    useEffect(() => {
        const parent = parentRef.current;
        if (!parent) return;

        if (scrolledToBottomRef.current) {
            setTimeout(() => {
                parent.scrollTo({
                    top: parent.scrollHeight,
                    behavior: 'smooth'
                });
            }, 0);
        }
    }, [messages]);

    return (
        <div
            ref={parentRef}
            className="h-full w-full overflow-auto"
            style={{
                contain: 'strict'
            }}
        >
            <div
                style={{
                    height: `${virtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative'
                }}
            >
                {virtualizer.getVirtualItems().map((virtualItem) => {
                    const message = messages[virtualItem.index];
                    if (!message) return null;

                    return (
                        <div
                            key={message.id}
                            data-index={virtualItem.index}
                            ref={virtualizer.measureElement}
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                transform: `translateY(${virtualItem.start}px)`
                            }}
                            className="px-4 py-2"
                        >
                            <MessageBubble message={message} isCurrentUser={message.senderId === currentUserId} formatTimestamp={formatTimestamp} />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
