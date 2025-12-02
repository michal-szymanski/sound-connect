import { zodResolver } from '@hookform/resolvers/zod';
import { AuthError } from '@/shared/types';
import { createFileRoute, Link, redirect } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { useState, useEffect, useRef } from 'react';
import { CheckCircle2, Loader2, Mail } from 'lucide-react';
import SubmitButton from '@/shared/components/common/submit-button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Button } from '@/shared/components/ui/button';
import { signUp, resendVerificationEmail } from '@/features/auth/server-functions/auth';

export const Route = createFileRoute('/(auth)/sign-up/')({
    component: RouteComponent,
    loader: async ({ context: { user } }) => {
        if (user) {
            throw redirect({ to: '/' });
        }
    }
});

function RouteComponent() {
    const [signUpEmail, setSignUpEmail] = useState<string | null>(null);
    const [isResending, setIsResending] = useState(false);
    const [lastResent, setLastResent] = useState<number | null>(null);
    const [countdown, setCountdown] = useState(0);
    const resendButtonRef = useRef<HTMLButtonElement>(null);

    const formSchema = z.object({
        name: z.string().min(1),
        email: z.string().email(),
        password: z.string().min(1).max(128)
    });

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            email: '',
            password: ''
        }
    });

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
                setSignUpEmail(values.email);
            } else if (result.body) {
                handleServerError(result.body);
            } else {
                toast.error('Could not sign up', {
                    description: 'Please try again'
                });
            }
        } catch {
            toast.error('Could not sign up', {
                description: 'Unknown error occurred'
            });
        }
    };

    const handleResend = async () => {
        if (isResending || !signUpEmail) return;
        setIsResending(true);
        try {
            const result = await resendVerificationEmail({ data: { email: signUpEmail } });
            if (result.success) {
                toast.success('Verification email sent');
                setLastResent(Date.now());
            } else {
                toast.error('Failed to resend email');
            }
        } finally {
            setIsResending(false);
        }
    };

    useEffect(() => {
        if (lastResent) {
            const interval = setInterval(() => {
                const elapsed = Date.now() - lastResent;
                const remaining = Math.max(0, Math.ceil((60000 - elapsed) / 1000));
                setCountdown(remaining);
                if (remaining === 0) {
                    clearInterval(interval);
                }
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [lastResent]);

    useEffect(() => {
        if (signUpEmail && resendButtonRef.current) {
            resendButtonRef.current.focus();
        }
    }, [signUpEmail]);

    const isSpinner = form.formState.isSubmitting;

    if (signUpEmail) {
        return (
            <div className="mx-auto flex w-full flex-col justify-center space-y-8 sm:w-[400px]">
                <div className="flex justify-center">
                    <div className="rounded-full bg-green-500/10 p-4">
                        <Mail className="h-12 w-12 text-green-500" />
                    </div>
                </div>
                <h1 className="text-center text-2xl font-semibold tracking-tight">Check Your Email</h1>
                <Alert className="border-green-500/30 bg-green-500/10">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <AlertDescription className="text-sm">
                        We&apos;ve sent a verification link to <strong>{signUpEmail}</strong>Click the link in the email to verify your account and get started.
                    </AlertDescription>
                </Alert>
                <div className="text-muted-foreground space-y-2 text-sm">
                    <p>Didn&apos;t receive the email?</p>
                    <ul className="ml-2 list-inside list-disc space-y-1">
                        <li>Check your spam or junk folder</li>
                        <li>Make sure {signUpEmail} is correct</li>
                        <li>Wait a few minutes and check again</li>
                    </ul>
                </div>
                <div className="space-y-4">
                    <Button ref={resendButtonRef} variant="outline" className="w-full" onClick={handleResend} disabled={isResending || countdown > 0}>
                        {isResending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Sending...
                            </>
                        ) : countdown > 0 ? (
                            `Resend in ${countdown}s`
                        ) : (
                            'Resend Verification Email'
                        )}
                    </Button>
                    <div className="text-center text-sm">
                        <Link to="/sign-in" className="underline underline-offset-4">
                            Back to Sign In
                        </Link>
                    </div>
                </div>
                <div aria-live="polite" aria-atomic="true" className="sr-only">
                    {countdown > 0 ? `You can resend the email in ${countdown} seconds` : 'You can now resend the verification email'}
                </div>
            </div>
        );
    }

    return (
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
    );
}
