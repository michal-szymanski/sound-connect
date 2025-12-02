import { createFileRoute, redirect } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Layout } from '@/shared/components/layout';
import { getStats } from '@/shared/server-functions/admin';
import { useAdminSession } from '@/shared/hooks/use-admin-session';
import {
    UserSignupsChart,
    InstrumentDistributionChart,
    ModerationStatsChart,
    GeographicDistributionChart,
    OnboardingFunnelChart,
    BandActivityChart
} from '@/shared/components/charts';

export const Route = createFileRoute('/')({
    component: DashboardPage,
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

function DashboardPage() {
    const { data: session } = useAdminSession();
    const { data: stats, isLoading } = useQuery({
        queryKey: ['admin-stats'],
        queryFn: async () => {
            const result = await getStats();
            if (!result.success) throw new Error('Failed to fetch stats');
            return result.body;
        }
    });

    return (
        <Layout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                    <p className="text-muted-foreground">Welcome back, {session.user?.name}</p>
                </div>

                {isLoading ? (
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Loading...</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-8 animate-pulse bg-muted rounded" />
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Loading...</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-8 animate-pulse bg-muted rounded" />
                            </CardContent>
                        </Card>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Total Users</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-bold">{stats?.totalUsers || 0}</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Recent Signups (Last 7 Days)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-bold">{stats?.recentSignups || 0}</p>
                            </CardContent>
                        </Card>
                    </div>
                )}

                <div className="w-full">
                    <UserSignupsChart />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <InstrumentDistributionChart />
                    <ModerationStatsChart />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <GeographicDistributionChart />
                    <OnboardingFunnelChart />
                </div>

                <div className="w-full">
                    <BandActivityChart />
                </div>
            </div>
        </Layout>
    );
}
