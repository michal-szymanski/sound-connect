import { Card } from '@/web/components/ui/card';
import { getFollowers, getFollowings, getPosts, getUser } from '@/web/server-functions/models';
import { createFileRoute, notFound } from '@tanstack/react-router';

export const Route = createFileRoute('/(main)/users/$id')({
    component: RouteComponent,
    loader: async (context) => {
        const userId = context.params.id;
        const result = await getUser({ data: { userId } });

        if (!result.success) {
            throw notFound();
        }

        const user = result.body;

        const followersResult = await getFollowers({ data: { userId } });
        const followers = followersResult.success ? followersResult.body : [];

        const followingsResult = await getFollowings({ data: { userId } });
        const followings = followingsResult.success ? followingsResult.body : [];

        const postsResult = await getPosts({ data: { userId } });
        const posts = postsResult.success ? postsResult.body : [];

        return { user, followers, followings, posts };
    }
});

function RouteComponent() {
    const { user, followers, followings, posts } = Route.useLoaderData();

    return (
        <>
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
                        src={user.image ?? 'https://github.com/shadcn.png'}
                        alt="Shadcn"
                        className="relative -top-20 left-10 rounded-full object-cover"
                        width={160}
                        height={160}
                    />
                    <div>
                        <h1 className="relative -top-10 left-10 text-xl">{user.name}</h1>
                        <div className="text-muted-foreground inline-flex w-full justify-end gap-2 p-5">
                            <div>{posts.length} posts</div>
                            <div>{followers.length} followers</div>
                            <div>{followings.length} following</div>
                        </div>
                    </div>
                </Card>
            </div>
        </>
    );
}
