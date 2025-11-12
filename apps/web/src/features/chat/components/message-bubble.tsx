import { ChatMessage } from '@/common/types/models';
import clsx from 'clsx';
import { memo, useState, useEffect } from 'react';

type Props = {
    message: ChatMessage;
    isCurrentUser: boolean;
    formatTimestamp: (timestamp: number) => string;
    isNew?: boolean;
    isSending?: boolean;
};

export const MessageBubble = memo(function MessageBubble({ message, isCurrentUser, formatTimestamp, isNew = false, isSending = false }: Props) {
    const [shouldAnimate, setShouldAnimate] = useState(isNew);

    useEffect(() => {
        if (isNew) {
            const timer = setTimeout(() => setShouldAnimate(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isNew]);

    return (
        <div
            className={clsx(
                'flex flex-col',
                isCurrentUser ? 'items-end' : 'items-start',
                shouldAnimate && 'animate-in slide-in-from-bottom-2 fade-in duration-300',
                isSending && 'opacity-60'
            )}
        >
            <div
                className={clsx(
                    'max-w-[75%] rounded-2xl px-4 py-2 text-sm',
                    isCurrentUser ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-muted text-foreground rounded-bl-sm'
                )}
            >
                {message.content}
            </div>
            <span className="text-muted-foreground mt-1 px-1 text-xs">{isSending ? 'Sending...' : formatTimestamp(message.timestamp)}</span>
        </div>
    );
});
