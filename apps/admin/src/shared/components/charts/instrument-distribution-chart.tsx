import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/shared/components/ui/chart';
import { getInstrumentsStats } from '@/shared/server-functions/admin';

const chartConfig = {
    count: {
        label: 'Users',
        color: 'hsl(var(--chart-2))'
    }
} satisfies ChartConfig;

export function InstrumentDistributionChart() {
    const { data, isLoading, error } = useQuery({
        queryKey: ['instruments-stats'],
        queryFn: async () => {
            const result = await getInstrumentsStats();
            if (!result.success) throw new Error('Failed to fetch instruments stats');
            return result.body;
        }
    });

    return (
        <Card>
            <CardHeader>
                <CardTitle>Instrument Distribution</CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="h-[300px] animate-pulse bg-muted rounded" />
                ) : error ? (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">Failed to load chart</div>
                ) : (
                    <ChartContainer config={chartConfig} className="h-[300px] w-full">
                        <BarChart data={data?.data ?? []} layout="vertical" margin={{ top: 5, right: 10, left: 80, bottom: 5 }}>
                            <XAxis type="number" />
                            <YAxis
                                dataKey="instrument"
                                type="category"
                                tickLine={false}
                                axisLine={false}
                                width={80}
                                tickFormatter={(value) => {
                                    return value
                                        .split('_')
                                        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                                        .join(' ');
                                }}
                            />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Bar dataKey="count" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ChartContainer>
                )}
            </CardContent>
        </Card>
    );
}
