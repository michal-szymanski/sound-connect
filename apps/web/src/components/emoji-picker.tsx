import { useState } from 'react';
import { Smile } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover';
import { Button } from '@/shared/components/ui/button';
import { EmojiPickerContent } from '@/web/components/emoji-picker-content';

type Props = {
    onEmojiSelect: (emoji: string) => void;
    popoverProps?: {
        side?: 'top' | 'bottom' | 'left' | 'right';
        sideOffset?: number;
        align?: 'start' | 'center' | 'end';
    };
};

export function EmojiPicker({ onEmojiSelect, popoverProps }: Props) {
    const [open, setOpen] = useState(false);

    const handleEmojiSelect = (emoji: string) => {
        onEmojiSelect(emoji);
        setOpen(false);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    className="text-muted-foreground bg-auto p-0 has-[>svg]:px-0 dark:hover:bg-inherit [&_svg:not([class*='size-'])]:size-5"
                    aria-label="Open emoji picker"
                >
                    <Smile />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="z-popover w-full max-w-[352px] p-0"
                style={{ width: '352px', height: '435px' }}
                align={popoverProps?.align || 'start'}
                side={popoverProps?.side}
                sideOffset={popoverProps?.sideOffset}
            >
                <EmojiPickerContent onEmojiSelect={handleEmojiSelect} onClose={() => setOpen(false)} />
            </PopoverContent>
        </Popover>
    );
}
