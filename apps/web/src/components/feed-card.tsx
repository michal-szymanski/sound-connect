import { Button } from 'src/components/ui/button';
import { Card, CardHeader, CardContent, CardFooter } from 'src/components/ui/card';
import { Heart } from 'lucide-react';
import { Post } from '@/web/types/models';
import { useReactions } from 'src/lib/react-query';
import { Avatar, AvatarFallback, AvatarImage } from 'src/components/ui/avatar';
import { formatDistanceToNowStrict } from 'date-fns';
import { Link } from '@tanstack/react-router';

type Props = {
    post: Post;
    isFollowing?: boolean;
};

const FeedCard = ({ post, isFollowing }: Props) => {
    return null;
    // const { data: user } = useUser({ userId: post.userId });

    const { data: reactions } = useReactions({ postId: post.id });

    const renderLikes = () => {
        if (!reactions) return null;
        const suffix = reactions.length === 1 ? 'like' : 'likes';
        return `${reactions.length} ${suffix}`;
    };

    return (
        <Card className="w-[600px]">
            <CardHeader className="flex-row items-center space-x-2 space-y-0 text-sm">
                <Button variant="link" className="px-0" size="lg" asChild>
                    <Link to={`/user/$id`} params={{ id: post.userId }}>
                        <Avatar>
                            <AvatarImage src={user?.imageUrl} alt="avatar" />
                            <AvatarFallback>CN</AvatarFallback>
                        </Avatar>
                        <div>
                            {user?.firstName} {user?.lastName}
                        </div>
                    </Link>
                </Button>
                <div className="text-muted-foreground">•</div>
                <div className="text-muted-foreground">
                    {formatDistanceToNowStrict(new Date(post.createdAt), {
                        addSuffix: true
                    })}
                </div>
                {!isFollowing && (
                    <>
                        <div className="text-muted-foreground">•</div>
                        <Button variant="ghost" className="hover:text-card-foreground p-0 font-semibold text-blue-500 hover:bg-transparent">
                            Follow
                        </Button>
                    </>
                )}
            </CardHeader>
            <CardContent>{post.content}</CardContent>
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
