import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/shared/components/ui/chart';
import { getLocationsStats } from '@/shared/server-functions/admin';

const chartConfig = {
    count: {
        label: 'Users',
        color: 'hsl(var(--chart-1))'
    }
} satisfies ChartConfig;

export function GeographicDistributionChart() {
    const { data, isLoading, error } = useQuery({
        queryKey: ['locations-stats'],
        queryFn: async () => {
            const result = await getLocationsStats({ data: { limit: 10 } });
            if (!result.success) throw new Error('Failed to fetch locations stats');
            return result.body;
        }
    });

    const chartData = data?.data.map((item) => ({
        location: `${item.city}, ${item.country}`,
        count: item.count
    }));

    return (
        <Card>
            <CardHeader>
                <CardTitle>Geographic Distribution</CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="h-[300px] animate-pulse bg-muted rounded" />
                ) : error ? (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">Failed to load chart</div>
                ) : (
                    <ChartContainer config={chartConfig} className="h-[300px] w-full">
                        <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 10, left: 120, bottom: 5 }}>
                            <XAxis type="number" />
                            <YAxis dataKey="location" type="category" tickLine={false} axisLine={false} width={120} />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Bar dataKey="count" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ChartContainer>
                )}
            </CardContent>
        </Card>
    );
}
