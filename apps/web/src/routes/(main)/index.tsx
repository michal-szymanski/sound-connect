import AddPostDialog from '@/web/components/add-post-dialog';
import FeedCard from '@/web/components/feed-card';
import StatusAvatar from '@/web/components/status-avatar';
import { Card, CardContent } from '@/web/components/ui/card';
import { feedQueryOptions, userQueryOptions } from '@/web/lib/react-query';
import { userDTOSchema } from '@sound-connect/common/types/models';
import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/(main)/')({
    component: RouteComponent,
    loader: async ({ context }) => {
        await context.queryClient.ensureQueryData(feedQueryOptions());
        await context.queryClient.ensureQueryData(userQueryOptions(context.user));
    }
});

function RouteComponent() {
    const { data: feed } = useSuspenseQuery(feedQueryOptions());
    const { data: user } = useSuspenseQuery(userQueryOptions(null));

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
