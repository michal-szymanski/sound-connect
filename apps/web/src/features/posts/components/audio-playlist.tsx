import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Media } from '@sound-connect/common/types/drizzle';
import { Button } from '@/shared/components/ui/button';
import { AudioPlayer } from './audio-player';

type Props = {
    media: Media[];
    context?: string;
};

export function AudioPlaylist({ media, context = 'default' }: Props) {
    const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
    const currentTrack = media[currentTrackIndex];

    if (media.length === 0 || !currentTrack) return null;

    const handlePrevious = () => {
        setCurrentTrackIndex((prev) => Math.max(0, prev - 1));
    };

    const handleNext = () => {
        setCurrentTrackIndex((prev) => Math.min(media.length - 1, prev + 1));
    };

    return (
        <div className="flex flex-col gap-2">
            <AudioPlayer src={`/media/${currentTrack.key}`} context={context} />

            {media.length > 1 && (
                <div className="flex items-center justify-between px-4 pb-2">
                    <span className="text-muted-foreground text-sm">
                        Track {currentTrackIndex + 1} of {media.length}
                    </span>
                    <div className="flex gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handlePrevious}
                            disabled={currentTrackIndex === 0}
                            aria-label="Previous track"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleNext}
                            disabled={currentTrackIndex === media.length - 1}
                            aria-label="Next track"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
