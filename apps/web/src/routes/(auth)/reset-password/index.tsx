import { zodResolver } from '@hookform/resolvers/zod';
import { createFileRoute, redirect, useRouter } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { z } from 'zod';
import SubmitButton from '@/shared/components/common/submit-button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';
import { resetPassword } from '@/features/auth/server-functions/auth';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { CheckCircle2, XCircle } from 'lucide-react';

const resetPasswordSearchSchema = z.object({
    token: z.string().optional()
});

export const Route = createFileRoute('/(auth)/reset-password/')({
    component: RouteComponent,
    validateSearch: resetPasswordSearchSchema,
    loader: async ({ context: { user } }) => {
        if (user) {
            throw redirect({ to: '/' });
        }
    }
});

function RouteComponent() {
    const { token } = Route.useSearch();
    const router = useRouter();
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string>('');

    const formSchema = z
        .object({
            password: z.string().min(8, 'Password must be at least 8 characters'),
            confirmPassword: z.string()
        })
        .refine((data) => data.password === data.confirmPassword, {
            message: "Passwords don't match",
            path: ['confirmPassword']
        });

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            password: '',
            confirmPassword: ''
        }
    });

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        if (!token) {
            setError('Invalid or missing reset token');
            return;
        }

        try {
            const result = await resetPassword({ data: { token, password: values.password } });

            if (result.success) {
                setIsSuccess(true);
                setTimeout(() => {
                    router.navigate({ to: '/sign-in' });
                }, 3000);
            } else if (result.body) {
                setError(result.body.message || 'Failed to reset password. The link may have expired.');
            } else {
                setError('Failed to reset password. Please try again.');
            }
        } catch {
            setError('An unexpected error occurred');
        }
    };

    const isSpinner = form.formState.isSubmitting || isSuccess;

    if (!token) {
        return (
            <div className="mx-auto flex w-full flex-col justify-center space-y-8 sm:w-[400px]">
                <h1 className="text-center text-2xl font-semibold tracking-tight">Reset Password</h1>
                <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>Invalid or missing reset token. Please request a new password reset link.</AlertDescription>
                </Alert>
            </div>
        );
    }

    if (isSuccess) {
        return (
            <div className="mx-auto flex w-full flex-col justify-center space-y-8 sm:w-[400px]">
                <h1 className="text-center text-2xl font-semibold tracking-tight">Password Reset Successful</h1>
                <Alert className="border-green-200 bg-green-50 text-green-900">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription>Your password has been reset successfully! Redirecting to sign in page...</AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="mx-auto flex w-full flex-col justify-center space-y-8 sm:w-[400px]">
            <div className="flex flex-col space-y-2 text-center">
                <h1 className="text-2xl font-semibold tracking-tight">Reset Password</h1>
                <p className="text-muted-foreground text-sm">Enter your new password below</p>
            </div>
            <div className="flex flex-col gap-6">
                {error && (
                    <Alert variant="destructive">
                        <XCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-3">
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>New Password</FormLabel>
                                    <FormControl>
                                        <Input {...field} type="password" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="confirmPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Confirm Password</FormLabel>
                                    <FormControl>
                                        <Input {...field} type="password" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <SubmitButton isSpinner={isSpinner}>Reset Password</SubmitButton>
                    </form>
                </Form>
            </div>
        </div>
    );
}
