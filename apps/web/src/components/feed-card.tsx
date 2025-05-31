import { Button } from 'src/components/ui/button';
import { Card, CardHeader, CardContent, CardFooter } from 'src/components/ui/card';
import { Heart } from 'lucide-react';
import { Post } from '@/web/types/models';
import { followingsQuery, useReactions, userQueryOptions } from 'src/lib/react-query';
import { Avatar, AvatarFallback, AvatarImage } from 'src/components/ui/avatar';
import { formatDistanceToNowStrict } from 'date-fns';
import { Link } from '@tanstack/react-router';
import { UserDTO } from '@/web/types/auth';
import { useEffect, useState } from 'react';
import { getUser } from '@/web/server-functions/models';
import StatusAvatar from '@/web/components/status-avatar';
import { useSuspenseQuery } from '@tanstack/react-query';

type Props = {
    post: Post;
};

const FeedCard = ({ post }: Props) => {
    const [user, setUser] = useState<UserDTO>();

    const { data: reactions } = useReactions({ postId: post.id });
    const { data: followings } = useSuspenseQuery(followingsQuery(post.userId));
    const { data: currentUser } = useSuspenseQuery(userQueryOptions(null));

    const canFollow = currentUser?.id !== post.userId && followings.some((f) => f.userId !== post.userId);

    useEffect(() => {
        getUser({ data: { userId: post.userId } }).then((res) => {
            if (res.success) {
                setUser(res.body);
            } else {
                console.error('Failed to fetch user:', res);
            }
        });
    }, [post.userId]);

    const renderLikes = () => {
        if (!reactions) return null;
        const suffix = reactions.length === 1 ? 'like' : 'likes';
        return `${reactions.length} ${suffix}`;
    };

    if (!user) return null;

    const formatContent = (content: string) => {
        const urlRegex = /https?:\/\/[^\s]+|www\.[^\s]+/g;
        return content.replace(urlRegex, (url) => {
            const formattedUrl = url.startsWith('www.') ? `https://${url}` : url;
            return `<a href="${formattedUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-500 underline-offset-4 hover:underline">${formattedUrl}</a>`;
        });
    };

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
                <div className="text-sm font-semibold">{renderLikes()}</div>
            </CardFooter>
        </Card>
    );
};

export default FeedCard;
