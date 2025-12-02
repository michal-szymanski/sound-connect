import { createFileRoute, Link, redirect } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { Layout } from '@/shared/components/layout';
import { getUsers } from '@/shared/server-functions/admin';

export const Route = createFileRoute('/users/')({
    component: UsersPage,
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

function UsersPage() {
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(0);
    const limit = 10;

    const { data, isLoading } = useQuery({
        queryKey: ['admin-users', search, page],
        queryFn: async () => {
            const result = await getUsers({ data: { search, limit, offset: page * limit } });
            if (!result.success) throw new Error('Failed to fetch users');
            return result.body;
        }
    });

    const totalPages = data ? Math.ceil(data.total / limit) : 0;

    return (
        <Layout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">User Management</h1>
                    <p className="text-muted-foreground">Manage all users in the system</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Users</CardTitle>
                        <div className="mt-4">
                            <Input placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-md" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="space-y-2">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="h-12 animate-pulse bg-muted rounded" />
                                ))}
                            </div>
                        ) : (
                            <>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Role</TableHead>
                                            <TableHead>Created At</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data?.users.map((user) => (
                                            <TableRow key={user.id}>
                                                <TableCell>{user.name}</TableCell>
                                                <TableCell>{user.email}</TableCell>
                                                <TableCell>
                                                    <span className={user.role === 'admin' ? 'font-semibold text-primary' : ''}>{user.role || 'user'}</span>
                                                </TableCell>
                                                <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                                                <TableCell>
                                                    <Link to="/users/$userId" params={{ userId: user.id }}>
                                                        <Button variant="outline" size="sm">
                                                            View
                                                        </Button>
                                                    </Link>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>

                                <div className="flex items-center justify-between mt-4">
                                    <p className="text-sm text-muted-foreground">
                                        Showing {page * limit + 1} to {Math.min((page + 1) * limit, data?.total || 0)} of {data?.total || 0} users
                                    </p>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                                            Previous
                                        </Button>
                                        <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>
                                            Next
                                        </Button>
                                    </div>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
}
