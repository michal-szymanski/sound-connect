import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { getOnboardingStats } from '@/shared/server-functions/admin';

const STEP_LABELS: Record<number, string> = {
    1: 'Basic Info',
    2: 'Instruments',
    3: 'Location',
    4: 'Musical Background',
    5: 'Preferences',
    6: 'Profile Review'
};

export function OnboardingFunnelChart() {
    const { data, isLoading, error } = useQuery({
        queryKey: ['onboarding-stats'],
        queryFn: async () => {
            const result = await getOnboardingStats();
            if (!result.success) throw new Error('Failed to fetch onboarding stats');
            return result.body;
        }
    });

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Onboarding Funnel</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] animate-pulse bg-muted rounded" />
                </CardContent>
            </Card>
        );
    }

    if (error || !data) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Onboarding Funnel</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">Failed to load chart</div>
                </CardContent>
            </Card>
        );
    }

    const totalUsers = data.completed + data.skipped + data.inProgress + data.notStarted;
    const completionRate = totalUsers > 0 ? (data.completed / totalUsers) * 100 : 0;
    const skipRate = totalUsers > 0 ? (data.skipped / totalUsers) * 100 : 0;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Onboarding Funnel</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Completed</p>
                            <p className="text-2xl font-bold text-green-600">{data.completed}</p>
                            <p className="text-xs text-muted-foreground">{completionRate.toFixed(1)}% of total</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Skipped</p>
                            <p className="text-2xl font-bold text-gray-500">{data.skipped}</p>
                            <p className="text-xs text-muted-foreground">{skipRate.toFixed(1)}% of total</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">In Progress</p>
                            <p className="text-2xl font-bold text-blue-600">{data.inProgress}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Not Started</p>
                            <p className="text-2xl font-bold text-orange-600">{data.notStarted}</p>
                        </div>
                    </div>

                    <div className="pt-4 border-t">
                        <h3 className="text-sm font-semibold mb-3">Users at Each Step</h3>
                        <div className="space-y-3">
                            {data.steps.map((stepData) => {
                                const maxUsers = Math.max(...data.steps.map((s) => s.usersAtStep));
                                const barWidth = maxUsers > 0 ? (stepData.usersAtStep / maxUsers) * 100 : 0;

                                return (
                                    <div key={stepData.step} className="space-y-1">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="font-medium">
                                                Step {stepData.step}: {STEP_LABELS[stepData.step] || 'Unknown'}
                                            </span>
                                            <span className="text-muted-foreground">{stepData.usersAtStep} users</span>
                                        </div>
                                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                                            <div className="h-full bg-primary transition-all duration-300" style={{ width: `${barWidth}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
