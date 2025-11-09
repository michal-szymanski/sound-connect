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

export const Route = createFileRoute('/(auth)/sign-up/')({
    component: RouteComponent,
    loader: async ({ context: { user } }) => {
        if (user) {
            throw redirect({ to: '/' });
        }
    }
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
                <div className="flex h-full flex-col justify-between">
                    <div className="flex items-center gap-2">
                        <Music className="h-6 w-6" aria-hidden="true" />
                        <span className="text-lg font-semibold">Sound Connect</span>
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-3xl font-bold tracking-tight drop-shadow-lg">Find your next bandmate</h2>
                        <p className="text-lg text-white/90 drop-shadow-md">Connect with musicians. Collaborate. Create.</p>
                    </div>
                </div>
            </VideoBackground>
            <div className="lg:p-8">
                <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
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
