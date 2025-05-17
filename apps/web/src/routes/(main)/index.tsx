import FeedCard from '@/web/components/feed-card';
import { feedQueryOptions, userQueryOptions } from '@/web/lib/react-query';
import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, redirect } from '@tanstack/react-router';

const Home = () => {
    const { data: feed } = useSuspenseQuery(feedQueryOptions());

    if (!feed) return null;

    return (
        <div className="container mx-auto flex flex-col items-center gap-5 xl:px-52">
            {feed.map((post, i) => (
                <FeedCard key={post.id} post={post} isFollowing={i % 2 === 0} />
            ))}
        </div>
    );
};

export const Route = createFileRoute('/(main)/')({
    component: Home,
    beforeLoad: async ({ context: { user } }) => {
        if (!user) {
            const path = '/sign-in';
            console.info(`[App] Redirecting to: ${path}`);

            throw redirect({
                to: path
            });
        }

        return { user };
    },
    loader: async ({ context }) => {
        const user = await context.queryClient.ensureQueryData(userQueryOptions(context.user));
        const feed = await context.queryClient.ensureQueryData(feedQueryOptions());

        return { user, feed };
    }
});
