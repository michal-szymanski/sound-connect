import { UserDTO, userDTOSchema } from '@/common/types/models';
import { postSchema } from '@/common/types/drizzle';
import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute, notFound, redirect, useRouter } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import z from 'zod';
import UserAvatar from '@/web/components/small/user-avatar';
import { Button } from '@/web/components/ui/button';
import { Card } from '@/web/components/ui/card';
import { useFollowers, useFollowings, useFollowRequestStatus, followingsQuery, followersQuery, followRequestStatusQuery } from '@/web/lib/react-query';
import { getPosts } from '@/web/server-functions/posts';
import { getUser, followUser, unfollowUser } from '@/web/server-functions/users';

const loaderSchema = z.object({
    currentUser: userDTOSchema,
    user: userDTOSchema,
    posts: z.array(postSchema)
});

export const Route = createFileRoute('/(main)/users/$id')({
    component: RouteComponent,
    loader: async ({ context: { queryClient, user: currentUser }, params }) => {
        if (!currentUser) {
            const path = '/sign-in';

            throw redirect({
                to: path
            });
        }

        const userId = params.id;

        let user: UserDTO;

        const queryDataUser = queryClient.getQueryData<UserDTO>(['user', userId]);

        if (queryDataUser) {
            user = userDTOSchema.parse(queryDataUser);
        } else if (currentUser?.id === userId) {
            user = userDTOSchema.parse(currentUser);
        } else {
            const result = await getUser({ data: { userId } });

            if (!result.success) {
                throw notFound();
            }

            user = result.body;
            queryClient.setQueryData(['user', user.id], user);
        }

        const postsResult = await getPosts({ data: { userId } });
        const posts = postsResult.success ? postsResult.body : [];

        await Promise.all([
            queryClient.ensureQueryData(followingsQuery(currentUser)),
            queryClient.ensureQueryData(followersQuery(user)),
            queryClient.ensureQueryData(followingsQuery(user)),
            queryClient.ensureQueryData(followRequestStatusQuery(user.id))
        ]);

        return loaderSchema.parse({ currentUser, user, posts });
    }
});

function RouteComponent() {
    const { currentUser, user, posts } = loaderSchema.parse(Route.useLoaderData());
    const { data: followings } = useFollowings(user);
    const { data: followers } = useFollowers(user);
    const { data: currentUserFollowings } = useFollowings(currentUser);
    const { data: followRequestStatus } = useFollowRequestStatus(user.id);
    const queryClient = useQueryClient();
    const router = useRouter();
    const [optimisticStatus, setOptimisticStatus] = useState<'pending' | 'following' | null>(null);

    useEffect(() => {
        /* eslint-disable react-hooks/set-state-in-effect */
        if (followRequestStatus?.status === 'following') {
            setOptimisticStatus('following');
        } else if (followRequestStatus?.status === 'pending') {
            setOptimisticStatus(null);
        } else if (followRequestStatus?.status === 'none') {
            setOptimisticStatus(null);
        }
        /* eslint-enable react-hooks/set-state-in-effect */
    }, [followRequestStatus?.status]);

    useEffect(() => {
        const isCurrentUserFollowing = currentUserFollowings?.some((following) => following.id === user.id);
        if (isCurrentUserFollowing) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setOptimisticStatus(null);
        }
    }, [currentUserFollowings, user.id]);

    const handleFollow = async () => {
        setOptimisticStatus('pending');

        try {
            const result = await followUser({ data: { userId: user.id } });

            if (!result.success) {
                setOptimisticStatus(null);
                return;
            }

            queryClient.invalidateQueries({ queryKey: ['follow-request-status', user.id] });
            router.invalidate();
        } catch {
            setOptimisticStatus(null);
        }
    };

    const handleUnfollow = async () => {
        setOptimisticStatus(null);

        try {
            const result = await unfollowUser({ data: { userId: user.id } });

            if (!result.success) {
                return;
            }

            router.invalidate();
        } catch (error) {
            console.error('Failed to unfollow user:', error);
        }
    };

    const renderFollowButton = () => {
        if (currentUser.id === user.id) return null;

        const isCurrentUserFollowing = currentUserFollowings?.some((following) => following.id === user.id) ?? false;

        if (isCurrentUserFollowing || optimisticStatus === 'following') {
            return (
                <Button onClick={handleUnfollow} data-testid="following-button">
                    Following
                </Button>
            );
        }

        if (followRequestStatus?.status === 'pending' || optimisticStatus === 'pending') {
            return (
                <Button disabled variant="outline" data-testid="requested-button">
                    Requested
                </Button>
            );
        }

        return (
            <Button onClick={handleFollow} data-testid="follow-button">
                Follow
            </Button>
        );
    };

    return (
        <div className="container mx-auto px-4">
            <Card className="overflow-hidden">
                <div className="relative h-60 max-h-60">
                    <img
                        src="https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=800&dpr=2&q=80"
                        alt="Photo by Drew Beamer"
                        className="object-fit h-90 w-full"
                    />
                </div>
                <UserAvatar user={user} className="relative -top-20 left-10 h-40 w-40" fallbackClassName="text-6xl" />
                <div>
                    <h1 className="relative -top-10 left-10 text-xl">{user.name}</h1>
                    <div className="flex w-full flex-col items-end gap-5 p-5">
                        <div className="text-muted-foreground inline-flex gap-3">
                            <div>{posts.length} posts</div>
                            <div>{followers.length} followers</div>
                            {followings && <div>{followings.length} following</div>}
                        </div>
                        <div>{renderFollowButton()}</div>
                    </div>
                </div>
            </Card>
        </div>
    );
}
