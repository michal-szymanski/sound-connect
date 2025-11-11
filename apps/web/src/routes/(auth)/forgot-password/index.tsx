import { zodResolver } from '@hookform/resolvers/zod';
import { createFileRoute, Link, redirect } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { z } from 'zod';
import SubmitButton from '@/shared/components/common/submit-button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';
import { forgotPassword } from '@/features/auth/server-functions/auth';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { CheckCircle2 } from 'lucide-react';

export const Route = createFileRoute('/(auth)/forgot-password/')({
    component: RouteComponent,
    loader: async ({ context: { user } }) => {
        if (user) {
            throw redirect({ to: '/' });
        }
    }
});

function RouteComponent() {
    const [isSuccess, setIsSuccess] = useState(false);
    const formSchema = z.object({
        email: z.string().email('Please enter a valid email address')
    });

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: ''
        }
    });

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            const result = await forgotPassword({ data: values });

            if (result.success) {
                setIsSuccess(true);
            } else if (result.body) {
                form.setError('email', { message: result.body.message });
            } else {
                form.setError('email', { message: 'Failed to send reset email. Please try again.' });
            }
        } catch {
            form.setError('email', { message: 'An unexpected error occurred' });
        }
    };

    const isSpinner = form.formState.isSubmitting;

    if (isSuccess) {
        return (
            <div className="mx-auto flex w-full flex-col justify-center space-y-8 sm:w-[400px]">
                <h1 className="text-center text-2xl font-semibold tracking-tight">Check Your Email</h1>
                <div className="flex flex-col gap-6">
                    <Alert className="border-green-200 bg-green-50 text-green-900">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <AlertDescription>If an account exists with that email, you will receive a password reset link shortly.</AlertDescription>
                    </Alert>
                    <div className="text-center text-sm">
                        Remember your password?{' '}
                        <Link to="/sign-in" className="underline underline-offset-4">
                            Sign In
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto flex w-full flex-col justify-center space-y-8 sm:w-[400px]">
            <div className="flex flex-col space-y-2 text-center">
                <h1 className="text-2xl font-semibold tracking-tight">Forgot Password</h1>
                <p className="text-muted-foreground text-sm">Enter your email and we&apos;ll send you a link to reset your password</p>
            </div>
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
                                        <Input {...field} type="email" placeholder="name@example.com" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <SubmitButton isSpinner={isSpinner}>Send Reset Link</SubmitButton>
                    </form>
                </Form>
                <div className="text-center text-sm">
                    Remember your password?{' '}
                    <Link to="/sign-in" className="underline underline-offset-4">
                        Sign In
                    </Link>
                </div>
            </div>
        </div>
    );
}
