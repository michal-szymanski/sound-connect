import { useVirtualizer } from '@tanstack/react-virtual';
import { clsx } from 'clsx';
import { useEffect, useRef, useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import type { ChatMessage } from '@/common/types/models';
import { DateDivider } from './date-divider';
import { MessageBubble } from './message-bubble';
import { ScrollToBottomButton } from './scroll-to-bottom-button';

type Props = {
    messages: ChatMessage[];
    currentUserId: string;
    formatTimestamp: (timestamp: number) => string;
    isInitialLoad?: boolean;
};

function isSameDay(timestamp1: number, timestamp2: number): boolean {
    const date1 = new Date(timestamp1);
    const date2 = new Date(timestamp2);
    return date1.getFullYear() === date2.getFullYear() && date1.getMonth() === date2.getMonth() && date1.getDate() === date2.getDate();
}

export function VirtualizedMessageList({ messages, currentUserId, formatTimestamp, isInitialLoad = false }: Props) {
    const parentRef = useRef<HTMLDivElement>(null);
    const scrolledToBottomRef = useRef(true);
    const prevMessageCountRef = useRef(messages.length);
    const [shouldScrollOnMount, setShouldScrollOnMount] = useState(isInitialLoad);
    const [isReady, setIsReady] = useState(!isInitialLoad);

    const [newMessageIds, setNewMessageIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (messages.length > 0 && !isReady) {
            setIsReady(true);
        }
    }, [messages.length, isReady]);
    const [showScrollButton, setShowScrollButton] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const virtualizer = useVirtualizer({
        count: messages.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 100,
        overscan: 5
    });

    const checkScrollPosition = useDebouncedCallback(() => {
        const parent = parentRef.current;
        if (!parent) return;

        const threshold = 100;
        const distanceFromBottom = Math.abs(parent.scrollHeight - parent.scrollTop - parent.clientHeight);
        const isAtBottom = distanceFromBottom < threshold;

        scrolledToBottomRef.current = isAtBottom;
        setShowScrollButton(distanceFromBottom > 150);

        if (isAtBottom) {
            setUnreadCount(0);
        }
    }, 100);

    useEffect(() => {
        if (!shouldScrollOnMount || messages.length === 0) return;

        setShouldScrollOnMount(false);

        virtualizer.scrollToIndex(messages.length - 1, {
            align: 'end',
            behavior: 'auto'
        });

        setTimeout(() => {
            const parent = parentRef.current;
            if (parent) {
                parent.scrollTop = parent.scrollHeight;
            }
            setIsReady(true);
        }, 100);
    }, [shouldScrollOnMount]);

    useEffect(() => {
        const parent = parentRef.current;
        if (!parent) return;

        const hasNewMessages = messages.length > prevMessageCountRef.current;

        if (hasNewMessages) {
            const newMessages = messages.slice(prevMessageCountRef.current);
            const newIds = new Set(newMessages.map((m) => m.id));
            setNewMessageIds(newIds);

            setTimeout(() => setNewMessageIds(new Set()), 350);

            const hasMessageFromCurrentUser = newMessages.some((m) => m.senderId === currentUserId);

            if (hasMessageFromCurrentUser || scrolledToBottomRef.current) {
                virtualizer.measure();
                requestAnimationFrame(() => {
                    parent.scrollTop = parent.scrollHeight;
                });
            } else {
                const hasMessageFromOthers = newMessages.some((m) => m.senderId !== currentUserId);
                if (hasMessageFromOthers) {
                    setUnreadCount((prev) => prev + newMessages.filter((m) => m.senderId !== currentUserId).length);
                }
            }
        }

        prevMessageCountRef.current = messages.length;
    }, [messages, currentUserId]);

    useEffect(() => {
        const parent = parentRef.current;
        if (!parent) return;

        parent.addEventListener('scroll', checkScrollPosition);
        return () => parent.removeEventListener('scroll', checkScrollPosition);
    }, [checkScrollPosition]);

    useEffect(() => {
        virtualizer.measure();
    }, [virtualizer]);

    const handleScrollToBottom = () => {
        const parent = parentRef.current;
        if (!parent) return;

        parent.scrollTop = parent.scrollHeight;
        setUnreadCount(0);
    };

    return (
        <div className="relative h-full w-full">
            <div
                ref={parentRef}
                className={clsx('h-full w-full overflow-auto transition-opacity duration-150', isReady ? 'opacity-100' : 'opacity-0')}
                style={{
                    contain: 'strict'
                }}
            >
                <div
                    style={{
                        height: `${virtualizer.getTotalSize() + 24}px`,
                        width: '100%',
                        position: 'relative'
                    }}
                >
                    {virtualizer.getVirtualItems().map((virtualItem) => {
                        const message = messages[virtualItem.index];
                        if (!message) return null;

                        const prevMessage = virtualItem.index > 0 ? messages[virtualItem.index - 1] : null;
                        const showDateDivider = !prevMessage || !isSameDay(message.timestamp, prevMessage.timestamp);

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
                                    transform: `translateY(${virtualItem.start}px)`,
                                    overflow: 'visible'
                                }}
                                className="px-4 py-2"
                            >
                                {showDateDivider ? <DateDivider timestamp={message.timestamp} /> : null}
                                <MessageBubble
                                    message={message}
                                    isCurrentUser={message.senderId === currentUserId}
                                    formatTimestamp={formatTimestamp}
                                    isNew={newMessageIds.has(message.id)}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>
            {showScrollButton ? <ScrollToBottomButton onClick={handleScrollToBottom} unreadCount={unreadCount} /> : null}
        </div>
    );
}
