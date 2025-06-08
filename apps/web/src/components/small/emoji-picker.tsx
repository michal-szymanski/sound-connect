import { Button } from '@/web/components/ui/button';

import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import clsx from 'clsx';
import { Smile } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type Props = {
    onEmojiSelect: (emoji: { native: string }) => void;
    containerRef?: React.RefObject<Element | null>;
};

const EmojiPicker = ({ onEmojiSelect }: Props) => {
    const [open, setOpen] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const buttonRef = useRef<HTMLButtonElement>(null);
    const pickerRef = useRef<HTMLDivElement>(null);

    const handleEmojiSelect = (emoji: { native: string }) => {
        onEmojiSelect(emoji);
    };

    const handleToggle = () => {
        if (!open && buttonRef.current) {
            const dialogElement = document.querySelector('[data-slot="dialog-content"]') as HTMLElement;
            if (dialogElement) {
                const dialogRect = dialogElement.getBoundingClientRect();
                setPosition({
                    top: dialogRect.top + window.scrollY,
                    left: dialogRect.left - 352 - 16 + window.scrollX
                });
            } else {
                const rect = buttonRef.current.getBoundingClientRect();
                setPosition({
                    top: rect.top + window.scrollY,
                    left: rect.left - 352 + window.scrollX
                });
            }
        }
        setOpen(!open);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                pickerRef.current &&
                !pickerRef.current.contains(event.target as Node) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target as Node)
            ) {
                setOpen(false);
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setOpen(false);
            }
        };

        if (open) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleEscape);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [open]);

    return (
        <>
            <Button
                ref={buttonRef}
                type="button"
                variant="ghost"
                onClick={handleToggle}
                className={clsx("text-muted-foreground bg-auto p-0 has-[>svg]:px-0 dark:hover:bg-inherit [&_svg:not([class*='size-'])]:size-5", {
                    'text-inherit': open
                })}
            >
                <span className="sr-only">Open emoji picker</span>
                <Smile />
            </Button>
            {open &&
                createPortal(
                    <div
                        ref={pickerRef}
                        className="fixed z-[9999] rounded-lg border bg-white shadow-xl dark:bg-gray-800"
                        style={{
                            top: position.top,
                            left: position.left,
                            pointerEvents: 'auto',
                            touchAction: 'auto',
                            maxHeight: '400px',
                            overflow: 'hidden'
                        }}
                        onWheel={(e) => {
                            e.stopPropagation();
                        }}
                    >
                        <Picker data={data} onEmojiSelect={handleEmojiSelect} theme="dark" previewPosition="none" />
                    </div>,
                    document.body
                )}
        </>
    );
};
export default EmojiPicker;
