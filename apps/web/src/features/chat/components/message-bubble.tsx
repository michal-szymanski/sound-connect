import { ChatMessage } from '@/common/types/models';
import clsx from 'clsx';

type Props = {
    message: ChatMessage;
    isCurrentUser: boolean;
    formatTimestamp: (timestamp: number) => string;
};

export function MessageBubble({ message, isCurrentUser, formatTimestamp }: Props) {
    return (
        <div className={clsx('flex flex-col', isCurrentUser ? 'items-end' : 'items-start')}>
            <div
                className={clsx(
                    'max-w-[75%] rounded-2xl px-4 py-2 text-sm',
                    isCurrentUser ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-muted text-foreground rounded-bl-sm'
                )}
            >
                {message.content}
            </div>
            <span className="text-muted-foreground mt-1 px-1 text-xs">{formatTimestamp(message.timestamp)}</span>
        </div>
    );
}
