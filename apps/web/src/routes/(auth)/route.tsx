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
                className={`flex items-center gap-2 transition-opacity hover:opacity-80 ${
                    animate ? 'animate-in fade-in slide-in-from-top-2 delay-200 duration-400' : ''
                }`}
            >
                <div className="bg-primary/20 rounded-full p-2 backdrop-blur-sm">
                    <Music className="text-primary h-5 w-5" aria-hidden="true" />
                </div>
                <span className="text-xl font-bold tracking-tight">{APP_NAME}</span>
            </div>

            <div className="space-y-3">
                <h2
                    className={`text-4xl font-bold tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] ${animate ? 'animate-in fade-in slide-in-from-bottom-4 delay-500 duration-600' : ''}`}
                >
                    Find your next bandmate
                </h2>
                <p
                    className={`max-w-md text-xl leading-relaxed text-white/95 drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)] ${animate ? 'animate-in fade-in slide-in-from-bottom-4 delay-650 duration-600' : ''}`}
                >
                    Connect with musicians. Collaborate. Create.
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
