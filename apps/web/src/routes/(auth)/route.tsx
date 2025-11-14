import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { VideoBackground } from '@/shared/components/common/video-background';
import { Music } from 'lucide-react';
import { memo } from 'react';
import { useAnimateOnce } from '@/features/auth/hooks/use-animate-once';
import { APP_NAME } from '@/common/constants';

export const Route = createFileRoute('/(auth)')({
    component: RouteComponent,
    beforeLoad: ({ context: { user } }) => {
        if (user) {
            const path = '/';

            throw redirect({
                to: path
            });
        }
    }
});

const AnimatedHeroContent = memo(function AnimatedHeroContent() {
    const animate = useAnimateOnce();

    return (
        <div className="flex h-full flex-col justify-between">
            <div
                className={
                    animate
                        ? 'opacity-0 animate-fade-in-zoom delay-[2000ms] flex items-center gap-2 transition-opacity hover:opacity-80'
                        : 'opacity-100 flex items-center gap-2 transition-opacity hover:opacity-80'
                }
            >
                <div className="bg-primary/20 rounded-full p-2 backdrop-blur-sm">
                    <Music className="text-primary h-5 w-5" aria-hidden="true" />
                </div>
                <span className="text-xl font-bold tracking-tight">{APP_NAME}</span>
            </div>

            <div className="space-y-3" aria-live="polite">
                <h1
                    className={
                        animate
                            ? 'opacity-0 animate-fade-in-slide delay-[3000ms] text-3xl font-bold tracking-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)] sm:text-4xl md:text-5xl'
                            : 'opacity-100 text-3xl font-bold tracking-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)] sm:text-4xl md:text-5xl'
                    }
                >
                    Find your next bandmate
                </h1>
                <p className="flex flex-wrap gap-x-2 text-2xl leading-relaxed text-white/95 drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]">
                    <span
                        className={
                            animate
                                ? 'opacity-0 animate-fade-in-slide delay-[3500ms]'
                                : 'opacity-100'
                        }
                    >
                        Connect with musicians.
                    </span>
                    <span
                        className={
                            animate
                                ? 'opacity-0 animate-fade-in-slide delay-[4500ms]'
                                : 'opacity-100'
                        }
                    >
                        Collaborate.
                    </span>
                    <span
                        className={
                            animate
                                ? 'opacity-0 animate-fade-in-slide delay-[6000ms]'
                                : 'opacity-100'
                        }
                    >
                        Create.
                    </span>
                </p>
            </div>
        </div>
    );
});

function RouteComponent() {
    return (
        <div className="relative container hidden h-full flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
            <VideoBackground
                videoSrc="/videos/login-hero.mp4"
                posterSrc="/images/login-hero-poster.jpg"
                fallbackSrc="/images/login-hero-fallback.jpg"
                className="bg-muted relative hidden h-full flex-col p-10 text-white lg:flex dark:border-r"
            >
                <AnimatedHeroContent />
            </VideoBackground>
            <div className="lg:p-12">
                <Outlet />
            </div>
        </div>
    );
}
