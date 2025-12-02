import { useQuery } from '@tanstack/react-query';
import { Pie, PieChart, Cell, Label } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/shared/components/ui/chart';
import { getModerationStats } from '@/shared/server-functions/admin';

const chartConfig = {
    pending: {
        label: 'Pending',
        color: 'hsl(var(--chart-3))'
    },
    approved: {
        label: 'Approved',
        color: 'hsl(var(--chart-4))'
    },
    rejected: {
        label: 'Rejected',
        color: 'hsl(var(--chart-5))'
    }
} satisfies ChartConfig;

export function ModerationStatsChart() {
    const { data, isLoading, error } = useQuery({
        queryKey: ['moderation-stats'],
        queryFn: async () => {
            const result = await getModerationStats();
            if (!result.success) throw new Error('Failed to fetch moderation stats');
            return result.body;
        }
    });

    const chartData = data
        ? [
              { name: 'Pending', value: data.pending, fill: 'hsl(var(--chart-3))' },
              { name: 'Approved', value: data.approved, fill: 'hsl(var(--chart-4))' },
              { name: 'Rejected', value: data.rejected, fill: 'hsl(var(--chart-5))' }
          ]
        : [];

    const total = data ? data.pending + data.approved + data.rejected : 0;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Content Moderation</CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="h-[300px] animate-pulse bg-muted rounded" />
                ) : error ? (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">Failed to load chart</div>
                ) : (
                    <ChartContainer config={chartConfig} className="h-[300px] w-full">
                        <PieChart>
                            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                            <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={2}>
                                {chartData.map((entry) => (
                                    <Cell key={entry.name} fill={entry.fill} />
                                ))}
                                <Label
                                    content={({ viewBox }) => {
                                        if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                                            return (
                                                <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                                                    <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-2xl font-bold">
                                                        {total}
                                                    </tspan>
                                                    <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 20} className="fill-muted-foreground text-sm">
                                                        Total
                                                    </tspan>
                                                </text>
                                            );
                                        }
                                    }}
                                />
                            </Pie>
                        </PieChart>
                    </ChartContainer>
                )}
                {data && (
                    <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
                        <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-[hsl(var(--chart-3))]" />
                            <span className="text-muted-foreground">Pending: {data.pending}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-[hsl(var(--chart-4))]" />
                            <span className="text-muted-foreground">Approved: {data.approved}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-[hsl(var(--chart-5))]" />
                            <span className="text-muted-foreground">Rejected: {data.rejected}</span>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
