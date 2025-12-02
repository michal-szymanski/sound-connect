import { useState, useRef, useCallback } from 'react';
import type { Media } from '@sound-connect/common/types/drizzle';
import { cn } from '@/shared/lib/utils';
import { AudioPlayer, type AudioPlayerHandle } from './audio-player';
import { AudioPlayButton } from '@/shared/components/audio-play-button';

type Props = {
    media: Media[];
    context?: string;
};

export function AudioPlaylist({ media, context = 'default' }: Props) {
    const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [switchingFromTrack, setSwitchingFromTrack] = useState<number | null>(null);
    const [pendingGrowAnimation, setPendingGrowAnimation] = useState(false);
    const audioPlayerRef = useRef<AudioPlayerHandle>(null);

    const handlePlayerReady = useCallback(() => {
        if (pendingGrowAnimation) {
            audioPlayerRef.current?.animateGrow();
            setPendingGrowAnimation(false);
            setSwitchingFromTrack(null);

            setTimeout(() => {
                audioPlayerRef.current?.play();
            }, 250);
        }
    }, [pendingGrowAnimation]);

    const handleTrackPlayPause = async (index: number) => {
        if (index === currentTrackIndex) {
            audioPlayerRef.current?.togglePlayPause();
            return;
        }

        setSwitchingFromTrack(currentTrackIndex);

        await audioPlayerRef.current?.animateFlatten();

        setPendingGrowAnimation(true);
        setCurrentTrackIndex(index);
    };

    const currentTrack = media[currentTrackIndex];

    if (media.length === 0 || !currentTrack) return null;

    const currentTrackTitle = currentTrack.title;

    return (
        <div className="flex flex-col gap-3">
            <AudioPlayer
                ref={audioPlayerRef}
                src={`/media/${currentTrack.key}`}
                context={context}
                title={currentTrackTitle}
                trackNumber={currentTrackIndex + 1}
                totalTracks={media.length}
                onPlayStateChange={setIsPlaying}
                onReady={handlePlayerReady}
            />

            <div className="sr-only" aria-live="polite" aria-atomic="true">
                {currentTrackTitle
                    ? `Track ${currentTrackIndex + 1} of ${media.length}: ${currentTrackTitle}`
                    : `Track ${currentTrackIndex + 1} of ${media.length}`}
            </div>

            {media.length > 1 && (
                <div className="overflow-hidden" role="list" aria-label="Audio tracks">
                    {media.map((track, index) => {
                        const isCurrentTrack = index === currentTrackIndex;
                        const isCurrentTrackPlaying = isCurrentTrack && isPlaying;
                        const isOldTrackDuringSwitch = switchingFromTrack === index;

                        let ariaLabel = '';
                        if (isCurrentTrackPlaying) {
                            ariaLabel = `Pause ${track.title || `Track ${index + 1}`}`;
                        } else if (isCurrentTrack) {
                            ariaLabel = `Resume ${track.title || `Track ${index + 1}`}`;
                        } else {
                            ariaLabel = `Play ${track.title || `Track ${index + 1}`}`;
                        }

                        return (
                            <div
                                key={track.id}
                                role="listitem"
                                aria-current={isCurrentTrack ? 'true' : undefined}
                                onClick={() => handleTrackPlayPause(index)}
                                className={cn(
                                    'group flex min-h-[44px] cursor-pointer items-center gap-3 rounded-md px-2 py-2 transition-colors',
                                    'hover:bg-muted/30'
                                )}
                            >
                                <div className="relative flex h-8 w-8 shrink-0 items-center justify-center">
                                    <span
                                        className={cn(
                                            'text-sm tabular-nums',
                                            !isOldTrackDuringSwitch && 'transition-opacity',
                                            isCurrentTrack ? 'text-primary font-medium' : 'text-muted-foreground',
                                            !isOldTrackDuringSwitch && 'group-hover:opacity-0',
                                            !isOldTrackDuringSwitch && isCurrentTrack && 'opacity-0'
                                        )}
                                    >
                                        {index + 1}
                                    </span>

                                    {!isOldTrackDuringSwitch && (
                                        <div
                                            className={cn(
                                                'absolute inset-0 flex items-center justify-center transition-opacity',
                                                isCurrentTrack ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                                            )}
                                        >
                                            <AudioPlayButton
                                                isPlaying={isCurrentTrackPlaying}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleTrackPlayPause(index);
                                                }}
                                                size="sm"
                                                variant="minimal"
                                                aria-label={ariaLabel}
                                            />
                                        </div>
                                    )}
                                </div>

                                <span className={cn('flex-1 truncate text-sm', isCurrentTrack ? 'text-primary font-medium' : 'text-foreground')}>
                                    {track.title || `Track ${index + 1}`}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
