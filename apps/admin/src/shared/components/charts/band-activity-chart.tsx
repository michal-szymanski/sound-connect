import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from '@/shared/components/ui/chart';
import { getBandsStats } from '@/shared/server-functions/admin';

const chartConfig = {
    bandsCreated: {
        label: 'Bands Created',
        color: 'hsl(var(--chart-2))'
    },
    applications: {
        label: 'Applications',
        color: 'hsl(var(--chart-3))'
    }
} satisfies ChartConfig;

export function BandActivityChart() {
    const [weeks, setWeeks] = useState(8);

    const { data, isLoading, error } = useQuery({
        queryKey: ['bands-stats', weeks],
        queryFn: async () => {
            const result = await getBandsStats({ data: { weeks } });
            if (!result.success) throw new Error('Failed to fetch bands stats');
            return result.body;
        }
    });

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle>Band Activity</CardTitle>
                <div className="flex gap-2">
                    <Button variant={weeks === 4 ? 'default' : 'outline'} size="sm" onClick={() => setWeeks(4)}>
                        4w
                    </Button>
                    <Button variant={weeks === 8 ? 'default' : 'outline'} size="sm" onClick={() => setWeeks(8)}>
                        8w
                    </Button>
                    <Button variant={weeks === 12 ? 'default' : 'outline'} size="sm" onClick={() => setWeeks(12)}>
                        12w
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="h-[300px] animate-pulse bg-muted rounded" />
                ) : error ? (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">Failed to load chart</div>
                ) : (
                    <ChartContainer config={chartConfig} className="h-[300px] w-full">
                        <BarChart data={data?.data ?? []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <XAxis dataKey="week" tickLine={false} axisLine={false} tickMargin={8} />
                            <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <ChartLegend content={<ChartLegendContent />} />
                            <Bar dataKey="bandsCreated" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="applications" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ChartContainer>
                )}
            </CardContent>
        </Card>
    );
}
