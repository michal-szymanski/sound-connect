import { useState, useEffect, useRef } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Separator } from '@/shared/components/ui/separator';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { AlertCircle, CheckCircle2, Loader2, AtSign } from 'lucide-react';
import { useUpdateEmail, useUpdatePassword, useCheckUsernameAvailability, useUpdateUsername } from '@/features/settings/hooks/use-settings';
import { updateEmailSchema, updatePasswordSchema, usernameSchema } from '@sound-connect/common/types/settings';
import type { AccountInfo } from '@sound-connect/common/types/settings';
import { useAuth } from '@/shared/hooks/use-auth';

type Props = {
    accountInfo: AccountInfo;
};

type ValidationState = 'idle' | 'validating' | 'valid' | 'invalid' | 'taken';

export function AccountSettings({ accountInfo }: Props) {
    const { user } = useAuth();
    const updateEmailMutation = useUpdateEmail();
    const updatePasswordMutation = useUpdatePassword();
    const checkAvailabilityMutation = useCheckUsernameAvailability();
    const updateUsernameMutation = useUpdateUsername();

    const [username, setUsername] = useState(user?.username || '');
    const [usernameValidationState, setUsernameValidationState] = useState<ValidationState>('idle');
    const [usernameError, setUsernameError] = useState<string>('');
    const debounceTimerRef = useRef<NodeJS.Timeout>();

    const [emailData, setEmailData] = useState({ email: '' });
    const [emailErrors, setEmailErrors] = useState<Record<string, string>>({});

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: ''
    });
    const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
    const [confirmPassword, setConfirmPassword] = useState('');

    useEffect(() => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        if (!username || username === user?.username) {
            setUsernameValidationState('idle');
            setUsernameError('');
            return;
        }

        setUsernameValidationState('validating');

        debounceTimerRef.current = setTimeout(async () => {
            const result = usernameSchema.safeParse(username);

            if (!result.success) {
                setUsernameValidationState('invalid');
                setUsernameError(result.error.issues[0]?.message || 'Invalid username');
                return;
            }

            try {
                const availabilityResult = await checkAvailabilityMutation.mutateAsync({ username: result.data });

                if (availabilityResult.available) {
                    setUsernameValidationState('valid');
                    setUsernameError('');
                } else {
                    setUsernameValidationState('taken');
                    setUsernameError('This username is already taken');
                }
            } catch {
                setUsernameValidationState('invalid');
                setUsernameError('Could not check availability');
            }
        }, 500);

        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [username, user?.username, checkAvailabilityMutation]);

    const handleUsernameSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (username === user?.username) {
            return;
        }

        if (!username) {
            updateUsernameMutation.mutate(
                { username: null },
                {
                    onSuccess: () => {
                        setUsername('');
                        setUsernameValidationState('idle');
                    }
                }
            );
            return;
        }

        const result = usernameSchema.safeParse(username);

        if (!result.success) {
            setUsernameError(result.error.issues[0]?.message || 'Invalid username');
            return;
        }

        updateUsernameMutation.mutate(
            { username: result.data },
            {
                onSuccess: () => {
                    setUsernameValidationState('idle');
                }
            }
        );
    };

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

    const getValidationIcon = () => {
        switch (usernameValidationState) {
            case 'validating':
                return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />;
            case 'valid':
                return <CheckCircle2 className="h-5 w-5 text-green-500" />;
            case 'invalid':
            case 'taken':
                return <AlertCircle className="h-5 w-5 text-destructive" />;
            default:
                return null;
        }
    };

    const profileUrl =
        usernameValidationState === 'valid' && username ? `${window.location.origin}/users/${username.toLowerCase()}` : user?.username ? `${window.location.origin}/users/${user.username}` : null;

    const isUsernameChanged = username !== (user?.username || '');
    const canSaveUsername = isUsernameChanged && (usernameValidationState === 'valid' || !username);

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Username</CardTitle>
                    <CardDescription>Your personalized profile URL</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleUsernameSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="username">Username</Label>
                            <div className="relative">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <AtSign className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <Input
                                    id="username"
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="username"
                                    className={`pl-9 pr-10 ${
                                        usernameValidationState === 'invalid' || usernameValidationState === 'taken'
                                            ? 'border-destructive focus-visible:ring-destructive'
                                            : usernameValidationState === 'valid'
                                              ? 'border-green-500 focus-visible:ring-green-500'
                                              : ''
                                    }`}
                                    maxLength={30}
                                    autoComplete="off"
                                    autoCapitalize="off"
                                    autoCorrect="off"
                                    spellCheck="false"
                                    disabled={updateUsernameMutation.isPending}
                                    aria-invalid={!!usernameError}
                                    aria-describedby={usernameError ? 'username-error' : undefined}
                                />
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3">{getValidationIcon()}</div>
                            </div>
                            {usernameError && (
                                <p id="username-error" className="text-destructive flex items-center gap-1 text-sm" role="alert">
                                    <AlertCircle className="h-4 w-4" />
                                    {usernameError}
                                </p>
                            )}
                            <p className="text-muted-foreground text-sm">Leave empty to use your user ID as the profile URL</p>
                        </div>

                        {profileUrl && (
                            <div className="bg-muted/50 rounded-lg p-3">
                                <p className="text-muted-foreground text-xs">Your profile URL</p>
                                <p className="text-primary mt-1 break-all text-sm font-medium">{profileUrl}</p>
                            </div>
                        )}

                        <Button type="submit" disabled={updateUsernameMutation.isPending || !canSaveUsername}>
                            {updateUsernameMutation.isPending ? 'Saving...' : 'Save Username'}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Email Address</CardTitle>
                    <CardDescription>Update your email address for account notifications</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleEmailSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="current-email">Current Email</Label>
                            <Input id="current-email" type="email" value={accountInfo.email} disabled className="bg-muted" />
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
                            {new Date(accountInfo.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </p>
                    </div>

                    <Separator />

                    <div className="space-y-1">
                        <Label className="text-muted-foreground">Last Active</Label>
                        <p className="font-medium">
                            {accountInfo.lastActiveAt
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
