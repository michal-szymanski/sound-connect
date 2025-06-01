import { Button } from '@/web/components/ui/button';

import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { Dialog, DialogContent, DialogDescription, DialogOverlay, DialogPortal, DialogTitle, DialogTrigger } from '@radix-ui/react-dialog';
import clsx from 'clsx';
import { Smile } from 'lucide-react';
import { useState } from 'react';
import { VisuallyHidden } from 'radix-ui';

type Props = {
    onEmojiSelect: (emoji: { native: string }) => void;
    containerRef: React.RefObject<Element | null>;
};

const EmojiPicker = ({ onEmojiSelect, containerRef }: Props) => {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen} modal={false}>
            <DialogTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    className={clsx("text-muted-foreground bg-auto p-0 has-[>svg]:px-0 dark:hover:bg-inherit [&_svg:not([class*='size-'])]:size-5", {
                        'text-inherit': open
                    })}
                >
                    <span className="sr-only">Open emoji picker</span>
                    <Smile />
                </Button>
            </DialogTrigger>
            <DialogPortal container={containerRef.current}>
                <DialogOverlay className="fixed" />
                <DialogContent className="z-60 fixed -left-5 top-0 -translate-x-full">
                    <VisuallyHidden.Root>
                        <DialogTitle>Add emoji dialog</DialogTitle>
                        <DialogDescription>Select an emoji to add to your post.</DialogDescription>
                    </VisuallyHidden.Root>
                    <Picker data={data} onEmojiSelect={onEmojiSelect} theme="dark" previewPosition="none" />
                </DialogContent>
            </DialogPortal>
        </Dialog>
    );
};
export default EmojiPicker;
