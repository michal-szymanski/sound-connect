import { createFileRoute, redirect } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/web/components/ui/card';
import { BandForm } from '@/web/components/band/band-form';
import { useCreateBand } from '@/web/hooks/use-bands';

/* eslint-disable @typescript-eslint/no-explicit-any */
export const Route = createFileRoute('/(main)/bands/new' as any)({
    component: RouteComponent,
    beforeLoad: async ({ context }: any) => {
        const { user } = context;
        if (!user) {
            throw redirect({
                to: '/sign-in'
            });
        }
    }
});

function RouteComponent() {
    const createBand = useCreateBand();

    return (
        <div className="mx-auto w-full max-w-2xl space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Create a Band</CardTitle>
                    <CardDescription>Tell us about your band and start connecting with musicians</CardDescription>
                </CardHeader>
                <CardContent>
                    <BandForm onSubmit={(data) => createBand.mutate(data as any)} isLoading={createBand.isPending} />
                </CardContent>
            </Card>
        </div>
    );
}
