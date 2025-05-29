import { Button } from '@/web/components/ui/button';
import { Card } from '@/web/components/ui/card';
import { sendFollowRequest, getFollowers, getFollowings, getPosts, getUser, unfollowUser } from '@/web/server-functions/models';
import { UserDTO, userDTOSchema } from '@/web/types/auth';
import { followerSchema, followingSchema, postSchema } from '@/web/types/models';
import { createFileRoute, notFound, useRouter } from '@tanstack/react-router';
import { DEFAULT_AVATAR_URL } from '@sound-connect/common/constants';
import z from 'zod';

const loaderSchema = z.object({
    currentUser: userDTOSchema,
    user: userDTOSchema,
    followers: z.array(followerSchema),
    followings: z.array(followingSchema),
    posts: z.array(postSchema)
});

export const Route = createFileRoute('/(main)/users/$id')({
    component: RouteComponent,
    loader: async (context) => {
        const currentUser = context.context.user;

        const userId = context.params.id;

        let user: UserDTO;

        if (currentUser?.id === userId) {
            user = userDTOSchema.parse(currentUser);
        } else {
            const result = await getUser({ data: { userId } });

            if (!result.success) {
                throw notFound();
            }

            user = result.body;
        }

        const followersResult = await getFollowers({ data: { userId } });
        const followers = followersResult.success ? followersResult.body : [];

        const followingsResult = await getFollowings({ data: { userId } });
        const followings = followingsResult.success ? followingsResult.body : [];

        const postsResult = await getPosts({ data: { userId } });
        const posts = postsResult.success ? postsResult.body : [];

        return loaderSchema.parse({ currentUser, user, followers, followings, posts });
    }
});

function RouteComponent() {
    const { currentUser, user, followers, followings, posts } = loaderSchema.parse(Route.useLoaderData());
    const router = useRouter();

    const handleFollow = async () => {
        const result = await sendFollowRequest({ data: { userId: user.id } });

        if (!result.success) {
            console.error('[App] Could not follow the user');
            return;
        }

        router.invalidate();
    };
    const handleUnfollow = async () => {
        const result = await unfollowUser({ data: { userId: user.id } });

        if (!result.success) {
            console.error('[App] Could not unfollow the user');
            return;
        }

        router.invalidate();
    };

    const renderFollowButton = () => {
        if (currentUser.id === user.id) return null;

        const isCurrentUserFollowing = followings.some((f) => f.userId === currentUser.id);

        if (isCurrentUserFollowing) {
            return <Button onClick={handleUnfollow}>Following</Button>;
        }

        return <Button onClick={handleFollow}>Follow</Button>;
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
                <img
                    src={user.image ?? DEFAULT_AVATAR_URL}
                    alt="Shadcn"
                    className="relative -top-20 left-10 rounded-full object-cover"
                    width={160}
                    height={160}
                />
                <div>
                    <h1 className="relative -top-10 left-10 text-xl">{user.name}</h1>
                    <div className="flex w-full flex-col items-end gap-5 p-5">
                        <div className="text-muted-foreground inline-flex gap-3">
                            <div>{posts.length} posts</div>
                            <div>{followers.length} followers</div>
                            <div>{followings.length} following</div>
                        </div>
                        <div>{renderFollowButton()}</div>
                    </div>
                </div>
            </Card>
        </div>
    );
}
