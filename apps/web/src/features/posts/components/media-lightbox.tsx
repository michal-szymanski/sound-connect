import type { Media } from '@sound-connect/common/types/drizzle';
import { Dialog, DialogContent } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { VideoPlayer } from './video-player';
import { AudioPlayer } from './audio-player';
import { useMediaPlayback } from '@/shared/contexts/media-playback-context';

type Props = {
    media: Media[];
    initialIndex: number;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export function MediaLightbox({ media, initialIndex, open, onOpenChange }: Props) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const { pauseAll } = useMediaPlayback();

    const handlePrevious = useCallback(() => {
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : media.length - 1));
    }, [media.length]);

    const handleNext = useCallback(() => {
        setCurrentIndex((prev) => (prev < media.length - 1 ? prev + 1 : 0));
    }, [media.length]);

    const handleClose = useCallback(
        (newOpen: boolean) => {
            if (!newOpen) {
                setCurrentIndex(initialIndex);
            }
            onOpenChange(newOpen);
        },
        [onOpenChange, initialIndex]
    );

    useEffect(() => {
        if (!open) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                handlePrevious();
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                handleNext();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                handleClose(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [open, handlePrevious, handleNext, handleClose]);

    useEffect(() => {
        if (open) {
            pauseAll();
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [open, pauseAll]);

    if (!open || media.length === 0) return null;

    const currentMedia = media[currentIndex];
    if (!currentMedia) return null;

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent
                className="z-dialog flex h-screen max-h-screen w-screen max-w-none flex-col items-center justify-center border-0 bg-black/95 p-0"
                showCloseButton={false}
            >
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleClose(false)}
                    className="absolute top-4 right-4 z-[101] h-10 w-10 rounded-full bg-black/50 text-white hover:bg-black/70 hover:text-white"
                    aria-label="Close lightbox"
                >
                    <X className="h-6 w-6" aria-hidden="true" />
                </Button>

                {media.length > 1 && (
                    <>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handlePrevious}
                            className="absolute top-1/2 left-4 z-[101] h-12 w-12 -translate-y-1/2 rounded-full bg-black/50 text-white hover:bg-black/70 hover:text-white"
                            aria-label="Previous media"
                        >
                            <ChevronLeft className="h-8 w-8" aria-hidden="true" />
                        </Button>

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleNext}
                            className="absolute top-1/2 right-4 z-[101] h-12 w-12 -translate-y-1/2 rounded-full bg-black/50 text-white hover:bg-black/70 hover:text-white"
                            aria-label="Next media"
                        >
                            <ChevronRight className="h-8 w-8" aria-hidden="true" />
                        </Button>

                        <div className="absolute bottom-4 left-1/2 z-[101] -translate-x-1/2 rounded-full bg-black/50 px-4 py-2 text-sm font-medium text-white">
                            {currentIndex + 1} / {media.length}
                        </div>
                    </>
                )}

                <div className="flex h-full w-full items-center justify-center p-12">
                    {currentMedia.type === 'audio' ? (
                        <div className="w-full max-w-2xl">
                            <AudioPlayer src={`/media/${currentMedia.key}`} context="lightbox" />
                        </div>
                    ) : currentMedia.type === 'video' ? (
                        <VideoPlayer src={`/media/${currentMedia.key}`} className="max-h-full max-w-full" autoPlay context="lightbox" />
                    ) : (
                        <img src={`/media/${currentMedia.key}`} alt={`Media ${currentIndex + 1}`} className="max-h-full max-w-full object-contain" />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
