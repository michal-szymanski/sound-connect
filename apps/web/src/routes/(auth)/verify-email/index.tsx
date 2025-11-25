import { createFileRoute, redirect, useRouter } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import { verifyEmail, resendVerificationEmail } from '@/features/auth/server-functions/auth';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Button } from '@/shared/components/ui/button';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

const verifyEmailSearchSchema = z.object({
    token: z.string().optional()
});

export const Route = createFileRoute('/(auth)/verify-email/')({
    component: RouteComponent,
    validateSearch: verifyEmailSearchSchema,
    loader: async ({ context: { user } }) => {
        if (user) {
            throw redirect({ to: '/' });
        }
    }
});

type VerificationState = 'loading' | 'success' | 'error';

function RouteComponent() {
    const { token } = Route.useSearch();
    const router = useRouter();
    const [state, setState] = useState<VerificationState>('loading');
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [isResending, setIsResending] = useState(false);
    const [email, setEmail] = useState('');

    useEffect(() => {
        if (!token) {
            setState('error');
            setErrorMessage('No verification token provided');
            return;
        }

        const verify = async () => {
            try {
                const result = await verifyEmail({ data: { token } });

                if (result.success) {
                    setState('success');
                    setTimeout(() => {
                        router.navigate({ to: '/onboarding', search: { redirect: undefined } });
                    }, 3000);
                } else if (result.body) {
                    setState('error');
                    setErrorMessage(result.body.message || 'Verification failed');
                } else {
                    setState('error');
                    setErrorMessage('Verification failed. Please try again.');
                }
            } catch {
                setState('error');
                setErrorMessage('An unexpected error occurred');
            }
        };

        verify();
    }, [token, router]);

    const handleResendEmail = async () => {
        if (!email) {
            setErrorMessage('Please enter your email address');
            return;
        }

        setIsResending(true);
        try {
            const result = await resendVerificationEmail({ data: { email } });

            if (result.success) {
                setErrorMessage('Verification email sent! Please check your inbox.');
            } else if (result.body) {
                setErrorMessage(result.body.message || 'Failed to send verification email');
            } else {
                setErrorMessage('Failed to send verification email');
            }
        } catch {
            setErrorMessage('An unexpected error occurred');
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className="mx-auto flex w-full flex-col justify-center space-y-8 sm:w-[400px]">
            <h1 className="text-center text-2xl font-semibold tracking-tight">Email Verification</h1>

            <div className="flex flex-col gap-6">
                {state === 'loading' && (
                    <Alert>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <AlertDescription>Verifying your email address...</AlertDescription>
                    </Alert>
                )}

                {state === 'success' && (
                    <Alert className="border-green-200 bg-green-50 text-green-900">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <AlertDescription>Email verified successfully! Redirecting to onboarding...</AlertDescription>
                    </Alert>
                )}

                {state === 'error' && (
                    <>
                        <Alert variant="destructive">
                            <XCircle className="h-4 w-4" />
                            <AlertDescription>{errorMessage}</AlertDescription>
                        </Alert>

                        <div className="space-y-3">
                            <p className="text-center text-sm">Need a new verification link?</p>
                            <input
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full rounded-md border px-3 py-2 text-sm"
                            />
                            <Button onClick={handleResendEmail} disabled={isResending || !email} className="w-full">
                                {isResending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    'Resend Verification Email'
                                )}
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
