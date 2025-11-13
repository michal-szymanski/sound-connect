import { ChatMessage } from '@/common/types/models';
import clsx from 'clsx';
import { memo } from 'react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/shared/components/ui/tooltip';

type Props = {
    message: ChatMessage;
    isCurrentUser: boolean;
    formatTimestamp: (timestamp: number) => string;
    isNew?: boolean;
};

export const MessageBubble = memo(function MessageBubble({ message, isCurrentUser, formatTimestamp, isNew = false }: Props) {
    return (
        <div className={clsx('flex flex-col', isCurrentUser ? 'items-end' : 'items-start', isNew && 'animate-in slide-in-from-bottom-4 fade-in duration-300')}>
            <Tooltip delayDuration={500}>
                <TooltipTrigger asChild>
                    <div
                        className={clsx(
                            'max-w-[75%] rounded-2xl px-4 py-2 text-sm break-words',
                            isCurrentUser ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-muted text-foreground rounded-bl-sm'
                        )}
                    >
                        {message.content}
                    </div>
                </TooltipTrigger>
                <TooltipContent side="left">{formatTimestamp(message.timestamp)}</TooltipContent>
            </Tooltip>
        </div>
    );
});
