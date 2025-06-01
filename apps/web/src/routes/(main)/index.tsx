import AddPostDialog from '@/web/components/dialogs/add-post-dialog';
import FeedCard from '@/web/components/blocks/feed-card';
import StatusAvatar from '@/web/components/small/status-avatar';
import { Card, CardContent } from '@/web/components/ui/card';
import { envsQuery, feedQuery, followersQuery, followingsQuery, useFeed, userQuery, useUser } from '@/web/lib/react-query';
import { userDTOSchema } from '@sound-connect/common/types/models';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/(main)/')({
    component: RouteComponent,
    loader: async ({ context }) => {
        await context.queryClient.ensureQueryData(envsQuery());
        await context.queryClient.ensureQueryData(feedQuery());
        await context.queryClient.ensureQueryData(userQuery(context.user));
        await context.queryClient.ensureQueryData(followersQuery(context.user));
        await context.queryClient.ensureQueryData(followingsQuery(context.user));
        await context.queryClient.ensureQueryData(userQuery(context.user));
    }
});

function RouteComponent() {
    const { data: feed } = useFeed();
    const { data: user } = useUser();

    return (
        <div className="container mx-auto flex flex-col items-center gap-5 xl:px-52">
            <Card className="w-full">
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
        </div>
    );
}
