import { zodResolver } from '@hookform/resolvers/zod';
import { AuthError } from '@/shared/types';
import { createFileRoute, Link, redirect, useRouter } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import SubmitButton from '@/shared/components/common/submit-button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';
import { signUp } from '@/features/auth/server-functions/auth';
import { VideoBackground } from '@/shared/components/common/video-background';
import { Music } from 'lucide-react';
import { memo, useEffect, useState } from 'react';

export const Route = createFileRoute('/(auth)/sign-up/')({
    component: RouteComponent,
    loader: async ({ context: { user } }) => {
        if (user) {
            throw redirect({ to: '/' });
        }
    }
});

type WindowWithFlag = Window & { __loginHeroAnimated?: boolean };

const AnimatedHeroContent = memo(function AnimatedHeroContent() {
    const [animate] = useState(() => {
        if (typeof window === 'undefined') return false;
        return !(window as WindowWithFlag).__loginHeroAnimated;
    });

    useEffect(() => {
        if (!(window as WindowWithFlag).__loginHeroAnimated) {
            (window as WindowWithFlag).__loginHeroAnimated = true;
        }
    }, []);

    return (
        <div className="flex h-full flex-col justify-between">
            <div
                className={`flex items-center gap-2 transition-opacity hover:opacity-80 ${
                    animate ? 'animate-in fade-in slide-in-from-top-2 duration-500' : ''
                }`}
            >
                <div className="bg-primary/20 rounded-full p-2 backdrop-blur-sm">
                    <Music className="text-primary h-5 w-5" aria-hidden="true" />
                </div>
                <span className="text-xl font-bold tracking-tight">Sound Connect</span>
            </div>

            <div className={`space-y-3 ${animate ? 'animate-in fade-in slide-in-from-bottom-6 delay-150 duration-700' : ''}`}>
                <h2 className="text-4xl font-bold tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">Find your next bandmate</h2>
                <p className="max-w-md text-xl leading-relaxed text-white/95 drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]">
                    Connect with musicians. Collaborate. Create.
                </p>
            </div>
        </div>
    );
});

function RouteComponent() {
    const formSchema = z.object({
        name: z.string().min(1),
        email: z.string().email(),
        password: z.string().min(8).max(128)
    });

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            email: '',
            password: ''
        }
    });

    const router = useRouter();

    const handleServerError = ({ code, message: error }: AuthError) => {
        switch (code) {
            case 'USER_ALREADY_EXISTS':
            case 'INVALID_EMAIL':
            case 'FAILED_TO_CREATE_USER':
            case 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL':
                form.setError('email', { message: error });
                break;
            case 'PASSWORD_TOO_SHORT':
            case 'PASSWORD_TOO_LONG':
                form.setError('password', { message: error });
                break;
            default:
                toast.error('Could not sign up', {
                    description: error
                });
                break;
        }
    };

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            const result = await signUp({ data: values });

            if (result.success) {
                await router.invalidate();
            } else if (result.body) {
                handleServerError(result.body);
            }
        } catch {
            toast.error('Could not sign up', {
                description: 'Unknown error occurred'
            });
        }
    };

    const isSpinner = form.formState.isSubmitting || form.formState.isSubmitSuccessful;

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
                <div className="mx-auto flex w-full flex-col justify-center space-y-8 sm:w-[400px]">
                    <h1 className="text-center text-2xl font-semibold tracking-tight">Create an account</h1>
                    <div className="flex flex-col gap-6">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-3">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Name</FormLabel>
                                            <FormControl>
                                                <Input {...field} data-testid="sign-up-name" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email</FormLabel>
                                            <FormControl>
                                                <Input {...field} data-testid="sign-up-email" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Password</FormLabel>
                                            <FormControl>
                                                <Input {...field} type="password" data-testid="sign-up-password" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <SubmitButton isSpinner={isSpinner}>Sign up</SubmitButton>
                            </form>
                        </Form>
                        <div className="text-center text-sm">
                            Already have an account?{' '}
                            <Link to="/sign-in" className="underline underline-offset-4">
                                Sign In
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
