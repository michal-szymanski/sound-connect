import { createFileRoute, notFound } from '@tanstack/react-router';
import { z } from 'zod';
import { Post } from '@/web/components/post';
import { envsQuery, followersQuery, followingsQuery, authQuery, postQuery } from '@/web/lib/react-query';

export const Route = createFileRoute('/(main)/posts/$postId')({
    component: RouteComponent,
    loader: async ({ context: { queryClient, user, accessToken }, params }) => {
        await queryClient.ensureQueryData(envsQuery());
        await queryClient.ensureQueryData(authQuery({ user, accessToken }));
        await queryClient.ensureQueryData(followersQuery(user));
        await queryClient.ensureQueryData(followingsQuery(user));

        try {
            const postId = z.coerce.number().positive().int().parse(params.postId);
            const post = await queryClient.ensureQueryData(postQuery(postId));

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
            <Post item={post} />
        </div>
    );
}
