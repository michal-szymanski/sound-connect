import type { Media } from '@sound-connect/common/types/drizzle';
import { VideoPlayer } from './video-player';
import { AudioPlaylist } from './audio-playlist';

type Props = {
    media: Media[];
    onMediaClick: (mediaKey: string) => void;
};

export function MediaGrid({ media, onMediaClick }: Props) {
    if (media.length === 0) return null;

    const visualMedia = media.filter((m) => m.type !== 'audio');
    const audioMedia = media.filter((m) => m.type === 'audio');

    return (
        <div className="flex flex-col gap-2">
            {visualMedia.length > 0 && <VisualMediaGrid media={visualMedia} onMediaClick={onMediaClick} />}
            {audioMedia.length > 0 && <AudioPlaylist media={audioMedia} />}
        </div>
    );
}

type VisualMediaGridProps = {
    media: Media[];
    onMediaClick: (mediaKey: string) => void;
};

function VisualMediaGrid({ media, onMediaClick }: VisualMediaGridProps) {
    if (media.length === 0) return null;

    if (media.length === 1) {
        const firstMedia = media[0];
        if (!firstMedia) return null;

        if (firstMedia.type === 'video') {
            return (
                <div className="bg-muted relative w-full overflow-hidden">
                    <VideoPlayer src={`/media/${firstMedia.key}`} className="max-h-[500px]" />
                </div>
            );
        }

        return (
            <div className="bg-muted relative w-full cursor-pointer overflow-hidden" onClick={() => onMediaClick(firstMedia.key)}>
                <img src={`/media/${firstMedia.key}`} alt="Post media" className="h-auto max-h-[500px] w-full object-cover" loading="lazy" />
            </div>
        );
    }

    if (media.length === 2) {
        return (
            <div className="grid grid-cols-2 gap-1">
                {media.map((item, index) => {
                    if (item.type === 'video') {
                        return (
                            <div key={item.id} className="bg-muted relative aspect-square overflow-hidden">
                                <VideoPlayer src={`/media/${item.key}`} aspectRatio="1/1" />
                            </div>
                        );
                    }

                    return (
                        <div key={item.id} className="bg-muted relative aspect-square cursor-pointer overflow-hidden" onClick={() => onMediaClick(item.key)}>
                            <img src={`/media/${item.key}`} alt={`Post media ${index + 1}`} className="h-full w-full object-cover" loading="lazy" />
                        </div>
                    );
                })}
            </div>
        );
    }

    if (media.length === 3) {
        const firstMedia = media[0];
        if (!firstMedia) return null;

        return (
            <div className="grid grid-cols-2 grid-rows-2 gap-1">
                {firstMedia.type === 'video' ? (
                    <div className="bg-muted relative row-span-2 overflow-hidden">
                        <VideoPlayer src={`/media/${firstMedia.key}`} className="h-full w-full object-cover" />
                    </div>
                ) : (
                    <div className="bg-muted relative row-span-2 cursor-pointer overflow-hidden" onClick={() => onMediaClick(firstMedia.key)}>
                        <img src={`/media/${firstMedia.key}`} alt="Post media 1" className="h-full w-full object-cover" loading="lazy" />
                    </div>
                )}
                {media.slice(1, 3).map((item, index) => {
                    if (item.type === 'video') {
                        return (
                            <div key={item.id} className="bg-muted relative aspect-square overflow-hidden">
                                <VideoPlayer src={`/media/${item.key}`} aspectRatio="1/1" />
                            </div>
                        );
                    }

                    return (
                        <div key={item.id} className="bg-muted relative aspect-square cursor-pointer overflow-hidden" onClick={() => onMediaClick(item.key)}>
                            <img src={`/media/${item.key}`} alt={`Post media ${index + 2}`} className="h-full w-full object-cover" loading="lazy" />
                        </div>
                    );
                })}
            </div>
        );
    }

    const displayMedia = media.slice(0, 4);
    const remainingCount = media.length - 4;

    return (
        <div className="grid grid-cols-2 gap-1">
            {displayMedia.map((item, index) => {
                const hasMoreOverlay = index === 3 && remainingCount > 0;

                if (item.type === 'video') {
                    return (
                        <div key={item.id} className="bg-muted relative aspect-square overflow-hidden">
                            <VideoPlayer src={`/media/${item.key}`} aspectRatio="1/1" />
                            {hasMoreOverlay && (
                                <div
                                    className="absolute inset-0 flex items-center justify-center bg-black/60 cursor-pointer"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onMediaClick(item.key);
                                    }}
                                >
                                    <span className="text-3xl font-bold text-white">+{remainingCount}</span>
                                </div>
                            )}
                        </div>
                    );
                }

                return (
                    <div key={item.id} className="bg-muted relative aspect-square overflow-hidden">
                        <img
                            src={`/media/${item.key}`}
                            alt={`Post media ${index + 1}`}
                            className={`h-full w-full object-cover ${!hasMoreOverlay ? 'cursor-pointer' : ''}`}
                            loading="lazy"
                            onClick={!hasMoreOverlay ? () => onMediaClick(item.key) : undefined}
                        />
                        {hasMoreOverlay && (
                            <div
                                className="absolute inset-0 flex items-center justify-center bg-black/60 cursor-pointer"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onMediaClick(item.key);
                                }}
                            >
                                <span className="text-3xl font-bold text-white">+{remainingCount}</span>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
