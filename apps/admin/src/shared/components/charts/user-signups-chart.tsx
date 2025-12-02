import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Area, AreaChart, XAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/shared/components/ui/chart';
import { getSignupsStats } from '@/shared/server-functions/admin';

const chartConfig = {
    signups: {
        label: 'Signups',
        color: 'hsl(var(--chart-1))'
    }
} satisfies ChartConfig;

export function UserSignupsChart() {
    const [days, setDays] = useState(30);

    const { data, isLoading, error } = useQuery({
        queryKey: ['signups-stats', days],
        queryFn: async () => {
            const result = await getSignupsStats({ data: { days } });
            if (!result.success) throw new Error('Failed to fetch signups stats');
            return result.body;
        }
    });

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle>User Signups Over Time</CardTitle>
                <div className="flex gap-2">
                    <Button variant={days === 7 ? 'default' : 'outline'} size="sm" onClick={() => setDays(7)}>
                        7d
                    </Button>
                    <Button variant={days === 30 ? 'default' : 'outline'} size="sm" onClick={() => setDays(30)}>
                        30d
                    </Button>
                    <Button variant={days === 90 ? 'default' : 'outline'} size="sm" onClick={() => setDays(90)}>
                        90d
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="h-[300px] animate-pulse bg-muted rounded" />
                ) : error ? (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">Failed to load chart</div>
                ) : !data?.data || data.data.length === 0 ? (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">No signups in the last {days} days</div>
                ) : (
                    <ChartContainer config={chartConfig} className="h-[300px] w-full">
                        <AreaChart data={data.data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="signupsGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                                    <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis
                                dataKey="date"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                tickFormatter={(value) => {
                                    const date = new Date(value);
                                    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                }}
                            />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Area type="monotone" dataKey="count" stroke="hsl(var(--chart-1))" fill="url(#signupsGradient)" strokeWidth={2} />
                        </AreaChart>
                    </ChartContainer>
                )}
            </CardContent>
        </Card>
    );
}
