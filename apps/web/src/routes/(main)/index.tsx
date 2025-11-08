import { userDTOSchema } from '@/common/types/models';
import { createFileRoute } from '@tanstack/react-router';
import { useEffect } from 'react';
import AddPostDialog from '@/web/components/dialogs/add-post-dialog';
import { EmptyFeed } from '@/web/components/empty-states/empty-feed';
import { Post } from '@/web/components/post';
import { PostSkeleton } from '@/web/components/skeletons/post-skeleton';
import UserAvatar from '@/web/components/small/user-avatar';
import { Card, CardContent } from '@/web/components/ui/card';
import { envsQuery, feedQuery, followersQuery, followingsQuery, useFeed, authQuery, useAuth } from '@/web/lib/react-query';

export const Route = createFileRoute('/(main)/')({
    component: RouteComponent,
    loader: async ({ context: { queryClient, user, accessToken } }) => {
        await queryClient.ensureQueryData(envsQuery());
        await queryClient.ensureInfiniteQueryData(feedQuery());
        await queryClient.ensureQueryData(authQuery({ user, accessToken }));
        await queryClient.ensureQueryData(followersQuery(user));
        await queryClient.ensureQueryData(followingsQuery(user));
    }
});

function RouteComponent() {
    const { data: auth } = useAuth();
    const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useFeed();

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
        <div className="flex w-full flex-col gap-5">
            <Card className="border-border/40 w-full">
                <CardContent className="w-full">
                    <div className="inline-flex w-full items-center justify-center gap-5">
                        <UserAvatar user={userDTOSchema.parse(auth?.user)} />
                        <AddPostDialog />
                    </div>
                </CardContent>
            </Card>

            {isLoading ? (
                <>
                    <PostSkeleton />
                    <PostSkeleton />
                    <PostSkeleton />
                </>
            ) : feed.length === 0 ? (
                <EmptyFeed />
            ) : (
                <>
                    {feed.map((item) => (
                        <Post key={item.post.id} item={item} />
                    ))}
                </>
            )}

            {isFetchingNextPage && (
                <>
                    <PostSkeleton />
                    <PostSkeleton />
                </>
            )}
        </div>
    );
}
