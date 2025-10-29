import { zodResolver } from '@hookform/resolvers/zod';
import { AuthError } from '@/common/types/auth';
import { createFileRoute, Link, useRouter } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import SubmitButton from '@/web/components/small/submit-button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/web/components/ui/form';
import { Input } from '@/web/components/ui/input';
import { signIn } from '@/web/server-functions/auth';

export const Route = createFileRoute('/(auth)/sign-in/')({
    component: RouteComponent
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

    const handleServerError = ({ code, message: error }: AuthError) => {
        switch (code) {
            case 'INVALID_EMAIL_OR_PASSWORD':
                form.setError('email', { message: error });
                form.setError('password', { message: error });
                break;
            case 'INVALID_EMAIL':
            case 'USER_EMAIL_NOT_FOUND':
            case 'EMAIL_NOT_VERIFIED':
                form.setError('email', { message: error });
                break;
            case 'PROVIDER_NOT_FOUND':
            case 'ID_TOKEN_NOT_SUPPORTED':
            case 'FAILED_TO_GET_USER_INFO':
                break;
            default:
                toast.error('Could not sign in', {
                    description: error
                });
                break;
        }
    };

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            const result = await signIn({ data: { ...values, rememberMe: true } });

            if (result.success) {
                router.navigate({ to: '/' });
            } else if (result.body) {
                handleServerError(result.body);
            }
        } catch (_error) {
            toast.error('Could not sign in', {
                description: 'Unknown error occurred'
            });
        }
    };

    const isSpinner = form.formState.isSubmitting || form.formState.isSubmitSuccessful;

    return (
        <div className="relative container hidden h-full flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
            <div className="bg-muted relative hidden h-full flex-col p-10 text-white lg:flex dark:border-r">
                <div className="absolute inset-0 bg-zinc-900" />
            </div>
            <div className="lg:p-8">
                <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
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
                                            <FormLabel>Password</FormLabel>
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
            </div>
        </div>
    );
}
