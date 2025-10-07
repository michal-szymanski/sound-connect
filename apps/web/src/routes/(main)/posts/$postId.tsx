import FeedCard from '@/web/components/blocks/feed-card';
import { envsQuery, followersQuery, followingsQuery, userQuery, postQuery } from '@/web/lib/react-query';
import { createFileRoute, notFound } from '@tanstack/react-router';
import { z } from 'zod';

export const Route = createFileRoute('/(main)/posts/$postId')({
    component: RouteComponent,
    loader: async ({ context, params }) => {
        await context.queryClient.ensureQueryData(envsQuery());
        await context.queryClient.ensureQueryData(userQuery(context.user));
        await context.queryClient.ensureQueryData(followersQuery(context.user));
        await context.queryClient.ensureQueryData(followingsQuery(context.user));

        try {
            const postId = z.coerce.number().positive().int().parse(params.postId);
            const post = await context.queryClient.ensureQueryData(postQuery(postId));

            if (!post) {
                throw notFound();
            }

            return { post };
        } catch {
            throw notFound();
        }
    }
});

function RouteComponent() {
    const { post } = Route.useLoaderData();

    return (
        <div className="flex flex-col items-center gap-5">
            <FeedCard item={post} />
        </div>
    );
}
