import { zodResolver } from '@hookform/resolvers/zod';
import { AuthError } from '@/shared/types';
import { createFileRoute, Link, redirect, useNavigate, useRouter } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import Spinner from '@/shared/components/common/spinner';
import SubmitButton from '@/shared/components/common/submit-button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';
import { signIn } from '@/features/auth/server-functions/auth';

const signInSearchSchema = z.object({
    redirect: z.string().optional()
});

export const Route = createFileRoute('/(auth)/sign-in/')({
    component: RouteComponent,
    validateSearch: signInSearchSchema,
    loaderDeps: ({ search }) => ({ redirectTo: search.redirect }),
    loader: async ({ context: { user }, deps: { redirectTo } }) => {
        if (user) {
            throw redirect({ to: redirectTo || '/' });
        }
    }
});

function RouteComponent() {
    const formSchema = z.object({
        email: z.string().email(),
        password: z.string().min(8).max(128)
    });

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: '',
            password: ''
        }
    });

    const router = useRouter();
    const navigate = useNavigate();
    const { redirect } = Route.useSearch();

    const handleServerError = ({ code, message }: AuthError) => {
        switch (code) {
            case 'INVALID_EMAIL_OR_PASSWORD':
                form.setError('email', { message });
                form.setError('password', { message });
                break;
            case 'INVALID_EMAIL':
            case 'USER_EMAIL_NOT_FOUND':
            case 'EMAIL_NOT_VERIFIED':
                form.setError('email', { message });
                break;
            case 'PROVIDER_NOT_FOUND':
            case 'ID_TOKEN_NOT_SUPPORTED':
            case 'FAILED_TO_GET_USER_INFO':
                break;
            default:
                toast.error('Could not sign in', {
                    description: message
                });
                break;
        }
    };

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            const result = await signIn({ data: { ...values, rememberMe: true } });

            if (result.success) {
                await router.invalidate();
                navigate({ to: redirect || '/', replace: true });
            } else if (result.body) {
                handleServerError(result.body);
            }
        } catch {
            toast.error('Could not sign in', {
                description: 'Unknown error occurred'
            });
        }
    };

    const isSpinner = form.formState.isSubmitting || form.formState.isSubmitSuccessful;

    if (form.formState.isSubmitSuccessful) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <Spinner className="text-primary h-8 w-8" />
                    <p className="text-muted-foreground text-sm">Signing you in...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto flex w-full flex-col justify-center space-y-8 sm:w-[400px]">
            <h1 className="text-center text-2xl font-semibold tracking-tight">Sign in</h1>
            <div className="flex flex-col gap-6">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-3">
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input {...field} data-testid="sign-in-email" />
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
                                    <div className="flex items-center justify-between">
                                        <FormLabel>Password</FormLabel>
                                        <Link to="/forgot-password" className="text-muted-foreground hover:text-primary text-sm underline underline-offset-4">
                                            Forgot password?
                                        </Link>
                                    </div>
                                    <FormControl>
                                        <Input {...field} type="password" data-testid="sign-in-password" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <SubmitButton isSpinner={isSpinner}>Sign in</SubmitButton>
                    </form>
                </Form>
                <div className="text-center text-sm">
                    Don&apos;t have an account?{' '}
                    <Link to="/sign-up" className="underline underline-offset-4">
                        Sign Up
                    </Link>
                </div>
            </div>
        </div>
    );
}
