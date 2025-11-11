import { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Separator } from '@/shared/components/ui/separator';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAccountInfo, useUpdateEmail, useUpdatePassword } from '@/features/settings/hooks/use-settings';
import { updateEmailSchema, updatePasswordSchema } from '@sound-connect/common/types/settings';

export function AccountSettings() {
    const { data: accountInfo, isLoading } = useAccountInfo();
    const updateEmailMutation = useUpdateEmail();
    const updatePasswordMutation = useUpdatePassword();

    const [emailData, setEmailData] = useState({ email: '' });
    const [emailErrors, setEmailErrors] = useState<Record<string, string>>({});

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: ''
    });
    const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleEmailSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const result = updateEmailSchema.safeParse(emailData);

        if (!result.success) {
            const fieldErrors: Record<string, string> = {};
            result.error.issues.forEach((issue) => {
                const path = issue.path[0];
                if (path) {
                    fieldErrors[path.toString()] = issue.message;
                }
            });
            setEmailErrors(fieldErrors);
            return;
        }

        setEmailErrors({});
        updateEmailMutation.mutate(result.data, {
            onSuccess: () => {
                setEmailData({ email: '' });
            }
        });
    };

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (passwordData.newPassword !== confirmPassword) {
            setPasswordErrors({ confirmPassword: 'Passwords do not match' });
            return;
        }

        const result = updatePasswordSchema.safeParse(passwordData);

        if (!result.success) {
            const fieldErrors: Record<string, string> = {};
            result.error.issues.forEach((issue) => {
                const path = issue.path[0];
                if (path) {
                    fieldErrors[path.toString()] = issue.message;
                }
            });
            setPasswordErrors(fieldErrors);
            return;
        }

        setPasswordErrors({});
        updatePasswordMutation.mutate(result.data, {
            onSuccess: () => {
                setPasswordData({ currentPassword: '', newPassword: '' });
                setConfirmPassword('');
            }
        });
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="mt-2 h-4 w-64" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-24" />
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Email Address</CardTitle>
                    <CardDescription>Update your email address for account notifications</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleEmailSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="current-email">Current Email</Label>
                            <Input id="current-email" type="email" value={accountInfo?.email || ''} disabled className="bg-muted" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="new-email">New Email Address</Label>
                            <Input
                                id="new-email"
                                type="email"
                                value={emailData.email}
                                onChange={(e) => setEmailData({ email: e.target.value })}
                                placeholder="Enter new email address"
                                disabled={updateEmailMutation.isPending}
                                aria-invalid={!!emailErrors['email']}
                                aria-describedby={emailErrors['email'] ? 'email-error' : undefined}
                            />
                            {emailErrors['email'] && (
                                <p id="email-error" className="text-destructive flex items-center gap-1 text-sm" role="alert">
                                    <AlertCircle className="h-4 w-4" />
                                    {emailErrors['email']}
                                </p>
                            )}
                        </div>

                        <Button type="submit" disabled={updateEmailMutation.isPending || !emailData.email}>
                            {updateEmailMutation.isPending ? 'Sending...' : 'Save Email'}
                        </Button>

                        {updateEmailMutation.isSuccess && (
                            <Alert>
                                <CheckCircle2 className="h-4 w-4" />
                                <AlertDescription>Verification email sent. Please check your inbox to verify your new email address.</AlertDescription>
                            </Alert>
                        )}
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Password</CardTitle>
                    <CardDescription>Change your password to keep your account secure</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handlePasswordSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="current-password">Current Password</Label>
                            <Input
                                id="current-password"
                                type="password"
                                value={passwordData.currentPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                placeholder="Enter current password"
                                disabled={updatePasswordMutation.isPending}
                                aria-invalid={!!passwordErrors['currentPassword']}
                                aria-describedby={passwordErrors['currentPassword'] ? 'current-password-error' : undefined}
                            />
                            {passwordErrors['currentPassword'] && (
                                <p id="current-password-error" className="text-destructive flex items-center gap-1 text-sm" role="alert">
                                    <AlertCircle className="h-4 w-4" />
                                    {passwordErrors['currentPassword']}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="new-password">New Password</Label>
                            <Input
                                id="new-password"
                                type="password"
                                value={passwordData.newPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                placeholder="Enter new password"
                                disabled={updatePasswordMutation.isPending}
                                aria-invalid={!!passwordErrors['newPassword']}
                                aria-describedby={passwordErrors['newPassword'] ? 'new-password-error' : undefined}
                            />
                            {passwordErrors['newPassword'] && (
                                <p id="new-password-error" className="text-destructive flex items-center gap-1 text-sm" role="alert">
                                    <AlertCircle className="h-4 w-4" />
                                    {passwordErrors['newPassword']}
                                </p>
                            )}
                            <p className="text-muted-foreground text-sm">
                                Password must be at least 8 characters and include uppercase, lowercase, and a number
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirm-password">Confirm New Password</Label>
                            <Input
                                id="confirm-password"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm new password"
                                disabled={updatePasswordMutation.isPending}
                                aria-invalid={!!passwordErrors['confirmPassword']}
                                aria-describedby={passwordErrors['confirmPassword'] ? 'confirm-password-error' : undefined}
                            />
                            {passwordErrors['confirmPassword'] && (
                                <p id="confirm-password-error" className="text-destructive flex items-center gap-1 text-sm" role="alert">
                                    <AlertCircle className="h-4 w-4" />
                                    {passwordErrors['confirmPassword']}
                                </p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            disabled={updatePasswordMutation.isPending || !passwordData.currentPassword || !passwordData.newPassword || !confirmPassword}
                        >
                            {updatePasswordMutation.isPending ? 'Changing...' : 'Change Password'}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Account Information</CardTitle>
                    <CardDescription>View your account details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-1">
                        <Label className="text-muted-foreground">Account Created</Label>
                        <p className="font-medium">
                            {accountInfo?.createdAt
                                ? new Date(accountInfo.createdAt).toLocaleDateString('en-US', {
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric'
                                  })
                                : 'N/A'}
                        </p>
                    </div>

                    <Separator />

                    <div className="space-y-1">
                        <Label className="text-muted-foreground">Last Active</Label>
                        <p className="font-medium">
                            {accountInfo?.lastActiveAt
                                ? new Date(accountInfo.lastActiveAt).toLocaleDateString('en-US', {
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric'
                                  })
                                : 'N/A'}
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
