import { userDTOSchema } from '@/common/types/models';
import { createFileRoute } from '@tanstack/react-router';
import { useEffect } from 'react';
import AddPostDialog from '@/web/components/dialogs/add-post-dialog';
import { Post } from '@/web/components/post';
import UserAvatar from '@/web/components/small/user-avatar';
import { Card, CardContent } from '@/web/components/ui/card';
import { accessTokenQuery, envsQuery, feedQuery, followersQuery, followingsQuery, useFeed, authQuery, useAuth } from '@/web/lib/react-query';

export const Route = createFileRoute('/(main)/')({
    component: RouteComponent,
    loader: async ({ context }) => {
        const accessToken = (context as typeof context & { accessToken?: string })?.accessToken;

        await context.queryClient.ensureQueryData(envsQuery());
        await context.queryClient.ensureInfiniteQueryData(feedQuery());
        await context.queryClient.ensureQueryData(authQuery({ user: context.user, accessToken }));
        await context.queryClient.ensureQueryData(followersQuery(context.user));
        await context.queryClient.ensureQueryData(followingsQuery(context.user));
        await context.queryClient.ensureQueryData(accessTokenQuery(accessToken));
    }
});

function RouteComponent() {
    const { data: auth } = useAuth();
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
                        <UserAvatar user={userDTOSchema.parse(auth?.user)} />
                        <AddPostDialog />
                    </div>
                </CardContent>
            </Card>
            {feed.map((item) => (
                <Post key={item.post.id} item={item} />
            ))}
            {isFetchingNextPage && (
                <div className="flex justify-center py-4">
                    <div className="text-muted-foreground text-sm">Loading more posts...</div>
                </div>
            )}
        </div>
    );
}
