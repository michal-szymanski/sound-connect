import { Button } from 'src/components/ui/button';
import { Card, CardHeader, CardContent, CardFooter } from 'src/components/ui/card';
import { Heart } from 'lucide-react';
import { useFollowings, useUser } from 'src/lib/react-query';
import { formatDistanceToNowStrict } from 'date-fns';
import { Link } from '@tanstack/react-router';
import { FeedItem, PostReaction } from '@sound-connect/common/types/models';
import StatusAvatar from '@/web/components/small/status-avatar';

type Props = {
    item: FeedItem;
};

const formatContent = (content: string) => {
    const urlRegex = /https?:\/\/[^\s]+|www\.[^\s]+/g;
    return content.replace(urlRegex, (url) => {
        const formattedUrl = url.startsWith('www.') ? `https://${url}` : url;

        return `<a href="${formattedUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-500 underline-offset-4 hover:underline">${formattedUrl.replace(/^(https?:\/\/)/, '')}</a>`;
    });
};

const renderLikes = (reactions: PostReaction[]) => {
    if (!reactions) return null;
    const suffix = reactions.length === 1 ? 'like' : 'likes';
    return `${reactions.length} ${suffix}`;
};

const FeedCard = ({ item: { post, user, reactions } }: Props) => {
    const { data: currentUser } = useUser();
    const { data: followings } = useFollowings(currentUser);

    const canFollow = currentUser?.id !== post.userId && !followings.some((following) => following.id === post.userId);

    if (!user) return null;

    return (
        <Card className="w-full">
            <CardHeader className="inline-flex items-center space-x-2 space-y-0 text-sm">
                <Button variant="link" className="w-min px-0" size="lg" asChild>
                    <Link to="/users/$id" params={{ id: post.userId }}>
                        <StatusAvatar user={user} />
                        <div>{user.name}</div>
                    </Link>
                </Button>
                <div className="text-muted-foreground">•</div>
                <div className="text-muted-foreground">
                    {formatDistanceToNowStrict(new Date(post.createdAt), {
                        addSuffix: true
                    })}
                </div>
                {canFollow && (
                    <>
                        <div className="text-muted-foreground">•</div>
                        <Button variant="ghost" className="hover:text-card-foreground p-0 font-semibold text-blue-500 hover:bg-transparent">
                            Follow
                        </Button>
                    </>
                )}
            </CardHeader>
            <CardContent className="whitespace-pre-wrap break-words" dangerouslySetInnerHTML={{ __html: formatContent(post.content) }} />
            <CardFooter className="flex-col items-start gap-1">
                <div className="inline-flex gap-1">
                    <Button variant="ghost" size="sm" className="group p-0 hover:bg-transparent hover:text-red-500 [&_svg]:size-6">
                        <Heart className="group-hover:fill-red-500" />
                    </Button>
                </div>
                <div className="text-sm font-semibold">{renderLikes(reactions)}</div>
            </CardFooter>
        </Card>
    );
};

export default FeedCard;
