import AddPostDialog from '@/web/components/dialogs/add-post-dialog';
import FeedCard from '@/web/components/blocks/feed-card';
import StatusAvatar from '@/web/components/small/status-avatar';
import { Card, CardContent } from '@/web/components/ui/card';
import { envsQuery, feedQuery, followersQuery, followingsQuery, useFeed, userQuery, useUser } from '@/web/lib/react-query';
import { userDTOSchema } from '@sound-connect/common/types/models';
import { createFileRoute } from '@tanstack/react-router';
import { useEffect } from 'react';

export const Route = createFileRoute('/(main)/')({
    component: RouteComponent,
    loader: async ({ context }) => {
        await context.queryClient.ensureQueryData(envsQuery());
        await context.queryClient.ensureInfiniteQueryData(feedQuery());
        await context.queryClient.ensureQueryData(userQuery(context.user));
        await context.queryClient.ensureQueryData(followersQuery(context.user));
        await context.queryClient.ensureQueryData(followingsQuery(context.user));
    }
});

function RouteComponent() {
    const { data: user } = useUser();
    const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useFeed();

    const feed = data?.pages.flat() ?? [];

    useEffect(() => {
        const handleScroll = () => {
            if (isFetchingNextPage || !hasNextPage) {
                return;
            }

            const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
            const isNearBottom = scrollTop + clientHeight >= scrollHeight - 1000;

            if (isNearBottom) {
                fetchNextPage();
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

    return (
        <div className="flex flex-col items-center gap-5">
            <Card className="w-[500px]">
                <CardContent className="w-full">
                    <div className="inline-flex w-full items-center justify-center gap-5">
                        <StatusAvatar user={userDTOSchema.parse(user)} />
                        <AddPostDialog />
                    </div>
                </CardContent>
            </Card>
            {feed.map((item) => (
                <FeedCard key={item.post.id} item={item} />
            ))}
            {isFetchingNextPage && (
                <div className="flex justify-center py-4">
                    <div className="text-muted-foreground text-sm">Loading more posts...</div>
                </div>
            )}
        </div>
    );
}
