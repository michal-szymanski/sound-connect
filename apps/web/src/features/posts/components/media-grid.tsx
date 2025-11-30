import type { Media } from '@sound-connect/common/types/drizzle';
import { VideoPlayer } from './video-player';
import { AudioPlayer } from './audio-player';

type Props = {
    media: Media[];
    onMediaClick: (mediaKey: string) => void;
};

export function MediaGrid({ media, onMediaClick }: Props) {
    if (media.length === 0) return null;

    if (media.length === 1) {
        const firstMedia = media[0];
        if (!firstMedia) return null;

        if (firstMedia.type === 'audio') {
            return <AudioPlayer src={`/media/${firstMedia.key}`} className="w-full" />;
        }

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
                    if (item.type === 'audio') {
                        return <AudioPlayer key={item.id} src={`/media/${item.key}`} className="col-span-2" />;
                    }

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
            <div className="grid grid-cols-2 gap-1">
                {firstMedia.type === 'audio' ? (
                    <AudioPlayer src={`/media/${firstMedia.key}`} className="col-span-2" />
                ) : firstMedia.type === 'video' ? (
                    <div className="bg-muted relative row-span-2 aspect-square overflow-hidden">
                        <VideoPlayer src={`/media/${firstMedia.key}`} aspectRatio="1/1" />
                    </div>
                ) : (
                    <div className="bg-muted relative row-span-2 aspect-square cursor-pointer overflow-hidden" onClick={() => onMediaClick(firstMedia.key)}>
                        <img src={`/media/${firstMedia.key}`} alt="Post media 1" className="h-full w-full object-cover" loading="lazy" />
                    </div>
                )}
                {media.slice(1, 3).map((item, index) => {
                    if (item.type === 'audio') {
                        return <AudioPlayer key={item.id} src={`/media/${item.key}`} className="col-span-2" />;
                    }

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

                if (item.type === 'audio') {
                    return (
                        <div key={item.id} className="relative col-span-2">
                            <AudioPlayer src={`/media/${item.key}`} className="w-full" />
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
