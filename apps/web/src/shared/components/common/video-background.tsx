import { useEffect, useState } from 'react';

type Props = {
    videoSrc: string;
    posterSrc: string;
    fallbackSrc: string;
    className?: string;
    children?: React.ReactNode;
};

const getInitialVideoState = () => {
    if (typeof window === 'undefined') {
        return false;
    }
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isDesktop = window.matchMedia('(min-width: 1024px)').matches;
    return isDesktop && !prefersReducedMotion;
};

export function VideoBackground({ videoSrc, posterSrc, fallbackSrc, className = '', children }: Props) {
    const [shouldShowVideo, setShouldShowVideo] = useState(getInitialVideoState);

    useEffect(() => {
        const mediaQueryList = window.matchMedia('(min-width: 1024px)');
        const motionQueryList = window.matchMedia('(prefers-reduced-motion: reduce)');

        const updateShouldShowVideo = () => {
            const currentPrefersReducedMotion = motionQueryList.matches;
            const currentIsDesktop = mediaQueryList.matches;
            setShouldShowVideo(currentIsDesktop && !currentPrefersReducedMotion);
        };

        mediaQueryList.addEventListener('change', updateShouldShowVideo);
        motionQueryList.addEventListener('change', updateShouldShowVideo);

        return () => {
            mediaQueryList.removeEventListener('change', updateShouldShowVideo);
            motionQueryList.removeEventListener('change', updateShouldShowVideo);
        };
    }, []);

    return (
        <div className={`relative overflow-hidden ${className}`}>
            {shouldShowVideo ? (
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="metadata"
                    poster={posterSrc}
                    aria-hidden="true"
                    className="absolute inset-0 h-full w-full object-cover"
                >
                    <source src={videoSrc} type="video/mp4" />
                </video>
            ) : (
                <img src={fallbackSrc} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
            <div className="relative z-10">{children}</div>
        </div>
    );
}
