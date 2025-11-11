import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Label } from '@/shared/components/ui/label';
import { Input } from '@/shared/components/ui/input';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from '@/shared/components/ui/alert-dialog';
import { AlertCircle, Download, Trash2 } from 'lucide-react';
import { useExportData, useDeleteAccount } from '@/features/settings/hooks/use-settings';
import { deleteAccountSchema } from '@sound-connect/common/types/settings';

export function DataAccountSettings() {
    const exportDataMutation = useExportData();
    const deleteAccountMutation = useDeleteAccount();

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');
    const [deleteError, setDeleteError] = useState('');

    const handleExportData = () => {
        exportDataMutation.mutate();
    };

    const handleDeleteAccount = () => {
        const result = deleteAccountSchema.safeParse({ password: deletePassword });

        if (!result.success) {
            setDeleteError('Password is required');
            return;
        }

        setDeleteError('');
        deleteAccountMutation.mutate(result.data, {
            onError: () => {
                setDeleteError('Incorrect password or unable to delete account');
            }
        });
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Export Your Data</CardTitle>
                    <CardDescription>Download a copy of all your data</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Alert>
                        <Download className="h-4 w-4" />
                        <AlertDescription>
                            Your export will include your profile information, posts, comments, messages, band memberships, and followers/following lists in
                            JSON format.
                        </AlertDescription>
                    </Alert>

                    <Button onClick={handleExportData} disabled={exportDataMutation.isPending} className="w-full sm:w-auto">
                        {exportDataMutation.isPending ? 'Generating Export...' : 'Export My Data'}
                    </Button>

                    {exportDataMutation.isSuccess && (
                        <Alert>
                            <AlertDescription>Your data export is ready for download. The link will expire in 24 hours.</AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>

            <Card className="border-destructive">
                <CardHeader>
                    <CardTitle className="text-destructive">Delete Account</CardTitle>
                    <CardDescription>Permanently delete your account and all associated data</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            This action is permanent and cannot be undone. All your data will be permanently deleted, including:
                        </AlertDescription>
                    </Alert>

                    <ul className="text-muted-foreground ml-2 list-inside list-disc space-y-1 text-sm">
                        <li>Profile information and settings</li>
                        <li>Posts and comments</li>
                        <li>Messages and conversations</li>
                        <li>Band memberships and applications</li>
                        <li>Followers and following relationships</li>
                        <li>Notifications</li>
                    </ul>

                    <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)} className="w-full sm:w-auto">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete My Account
                    </Button>
                </CardContent>
            </Card>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <div className="space-y-4 py-4">
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>All of your posts, comments, messages, and band memberships will be permanently deleted.</AlertDescription>
                        </Alert>

                        <div className="space-y-2">
                            <Label htmlFor="delete-password">Enter your password to confirm</Label>
                            <Input
                                id="delete-password"
                                type="password"
                                value={deletePassword}
                                onChange={(e) => {
                                    setDeletePassword(e.target.value);
                                    setDeleteError('');
                                }}
                                placeholder="Enter your password"
                                disabled={deleteAccountMutation.isPending}
                                aria-invalid={!!deleteError}
                                aria-describedby={deleteError ? 'delete-error' : undefined}
                            />
                            {deleteError && (
                                <p id="delete-error" className="text-destructive flex items-center gap-1 text-sm" role="alert">
                                    <AlertCircle className="h-4 w-4" />
                                    {deleteError}
                                </p>
                            )}
                        </div>
                    </div>

                    <AlertDialogFooter>
                        <AlertDialogCancel
                            onClick={() => {
                                setDeletePassword('');
                                setDeleteError('');
                            }}
                        >
                            Cancel
                        </AlertDialogCancel>
                        <Button variant="destructive" onClick={handleDeleteAccount} disabled={!deletePassword || deleteAccountMutation.isPending}>
                            {deleteAccountMutation.isPending ? 'Deleting...' : 'Delete Account'}
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
