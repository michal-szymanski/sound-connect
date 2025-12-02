import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Button } from '@/shared/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger
} from '@/shared/components/ui/alert-dialog';
import { Layout } from '@/shared/components/layout';
import { getUserById, updateUser, deleteUser } from '@/shared/server-functions/admin';
import { toast } from 'sonner';

export const Route = createFileRoute('/users/$userId')({
    component: UserDetailPage,
    beforeLoad: async () => {
        try {
            const sessionResult = await import('@/shared/server-functions/auth').then((m) => m.getAdminSession());

            if (!sessionResult.success) {
                throw redirect({ to: '/login' });
            }
        } catch {
            throw redirect({ to: '/login' });
        }
    }
});

function UserDetailPage() {
    const { userId } = Route.useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data: user, isLoading } = useQuery({
        queryKey: ['admin-user', userId],
        queryFn: async () => {
            const result = await getUserById({ data: { id: userId } });
            if (!result.success) throw new Error('Failed to fetch user');
            return result.body;
        }
    });

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<'user' | 'admin'>('user');

    useEffect(() => {
        if (user) {
            setName(user.name);
            setEmail(user.email);
            setRole((user.role as 'user' | 'admin') || 'user');
        }
    }, [user]);

    const updateMutation = useMutation({
        mutationFn: async (data: { name: string; email: string; role: 'user' | 'admin' }) => {
            const result = await updateUser({ data: { id: userId, ...data } });
            if (!result.success) throw new Error(result.body?.message || 'Failed to update user');
            return result.body;
        },
        onSuccess: () => {
            toast.success('User updated successfully');
            queryClient.invalidateQueries({ queryKey: ['admin-user', userId] });
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
        },
        onError: (error: Error) => {
            toast.error(error.message);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async () => {
            const result = await deleteUser({ data: { id: userId } });
            if (!result.success) throw new Error(result.body?.message || 'Failed to delete user');
        },
        onSuccess: () => {
            toast.success('User deleted successfully');
            navigate({ to: '/users' });
        },
        onError: (error: Error) => {
            toast.error(error.message);
        }
    });

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        updateMutation.mutate({ name, email, role });
    };

    if (isLoading) {
        return (
            <Layout>
                <Card>
                    <CardContent className="p-6">
                        <div className="space-y-4">
                            <div className="h-8 animate-pulse bg-muted rounded" />
                            <div className="h-8 animate-pulse bg-muted rounded" />
                            <div className="h-8 animate-pulse bg-muted rounded" />
                        </div>
                    </CardContent>
                </Card>
            </Layout>
        );
    }

    if (!user) {
        return (
            <Layout>
                <Card>
                    <CardContent className="p-6">
                        <p>User not found</p>
                    </CardContent>
                </Card>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">User Details</h1>
                    <p className="text-muted-foreground">View and edit user information</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>User Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleUpdate} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Name</Label>
                                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="role">Role</Label>
                                <Select value={role} onValueChange={(value) => setRole(value as 'user' | 'admin')}>
                                    <SelectTrigger id="role">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="user">User</SelectItem>
                                        <SelectItem value="admin">Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center gap-4 pt-4">
                                <Button type="submit" disabled={updateMutation.isPending}>
                                    {updateMutation.isPending ? 'Updating...' : 'Update User'}
                                </Button>

                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button type="button" variant="destructive">
                                            Delete User
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This action cannot be undone. This will permanently delete the user account and all associated data.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}>
                                                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Metadata</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm font-medium">User ID</p>
                                <p className="text-sm text-muted-foreground">{user.id}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium">Created At</p>
                                <p className="text-sm text-muted-foreground">{new Date(user.createdAt).toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium">Updated At</p>
                                <p className="text-sm text-muted-foreground">{new Date(user.updatedAt).toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium">Email Verified</p>
                                <p className="text-sm text-muted-foreground">{user.emailVerified ? 'Yes' : 'No'}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
}
