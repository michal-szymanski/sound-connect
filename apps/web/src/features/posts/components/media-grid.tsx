import type { Media } from '@sound-connect/common/types/drizzle';

type Props = {
    media: Media[];
    onMediaClick: (index: number) => void;
};

export function MediaGrid({ media, onMediaClick }: Props) {
    if (media.length === 0) return null;

    if (media.length === 1) {
        const firstMedia = media[0];
        if (!firstMedia) return null;

        return (
            <div className="bg-muted relative w-full cursor-pointer overflow-hidden" onClick={() => onMediaClick(0)}>
                {firstMedia.type === 'video' ? (
                    <video src={`/media/${firstMedia.key}`} className="h-auto max-h-[500px] w-full object-cover" controls />
                ) : (
                    <img src={`/media/${firstMedia.key}`} alt="Post media" className="h-auto max-h-[500px] w-full object-cover" loading="lazy" />
                )}
            </div>
        );
    }

    if (media.length === 2) {
        return (
            <div className="grid grid-cols-2 gap-1">
                {media.map((item, index) => (
                    <div key={item.id} className="bg-muted relative aspect-square cursor-pointer overflow-hidden" onClick={() => onMediaClick(index)}>
                        {item.type === 'video' ? (
                            <video src={`/media/${item.key}`} className="h-full w-full object-cover" />
                        ) : (
                            <img src={`/media/${item.key}`} alt={`Post media ${index + 1}`} className="h-full w-full object-cover" loading="lazy" />
                        )}
                    </div>
                ))}
            </div>
        );
    }

    if (media.length === 3) {
        const firstMedia = media[0];
        if (!firstMedia) return null;

        return (
            <div className="grid grid-cols-2 gap-1">
                <div className="bg-muted relative row-span-2 aspect-square cursor-pointer overflow-hidden" onClick={() => onMediaClick(0)}>
                    {firstMedia.type === 'video' ? (
                        <video src={`/media/${firstMedia.key}`} className="h-full w-full object-cover" />
                    ) : (
                        <img src={`/media/${firstMedia.key}`} alt="Post media 1" className="h-full w-full object-cover" loading="lazy" />
                    )}
                </div>
                {media.slice(1, 3).map((item, index) => (
                    <div key={item.id} className="bg-muted relative aspect-square cursor-pointer overflow-hidden" onClick={() => onMediaClick(index + 1)}>
                        {item.type === 'video' ? (
                            <video src={`/media/${item.key}`} className="h-full w-full object-cover" />
                        ) : (
                            <img src={`/media/${item.key}`} alt={`Post media ${index + 2}`} className="h-full w-full object-cover" loading="lazy" />
                        )}
                    </div>
                ))}
            </div>
        );
    }

    const displayMedia = media.slice(0, 4);
    const remainingCount = media.length - 4;

    return (
        <div className="grid grid-cols-2 gap-1">
            {displayMedia.map((item, index) => (
                <div key={item.id} className="bg-muted relative aspect-square cursor-pointer overflow-hidden" onClick={() => onMediaClick(index)}>
                    {item.type === 'video' ? (
                        <video src={`/media/${item.key}`} className="h-full w-full object-cover" />
                    ) : (
                        <img src={`/media/${item.key}`} alt={`Post media ${index + 1}`} className="h-full w-full object-cover" loading="lazy" />
                    )}
                    {index === 3 && remainingCount > 0 && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                            <span className="text-3xl font-bold text-white">+{remainingCount}</span>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
