'use client';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Heart } from 'lucide-react';
import { Post } from '@/types';
import { useUser } from '@/lib/react-query';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNowStrict } from 'date-fns';
import Link from 'next/link';

type Props = {
    post: Post;
    isFollowing?: boolean;
};

const FeedCard = ({ post, isFollowing }: Props) => {
    const { data: user } = useUser({ userId: post.userId });

    return (
        <Card key={post.id} className="w-[600px]">
            <CardHeader className="flex-row items-center space-x-2 space-y-0 text-sm">
                <Button variant="link" className="px-0" size="lg" asChild>
                    <Link href={`/user/${user?.id}`}>
                        <Avatar>
                            <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
                            <AvatarFallback>CN</AvatarFallback>
                        </Avatar>
                        <div>
                            {user?.firstName} {user?.lastName}
                        </div>
                    </Link>
                </Button>
                <div className="text-muted-foreground">•</div>
                <div className="text-muted-foreground">{formatDistanceToNowStrict(new Date(post.createdAt), { addSuffix: true })}</div>
                {!isFollowing && (
                    <>
                        <div className="text-muted-foreground">•</div>
                        <Button variant="ghost" className="p-0 font-semibold text-blue-500 hover:bg-transparent hover:text-card-foreground">
                            Follow
                        </Button>
                    </>
                )}
            </CardHeader>
            <CardContent>{post.content}</CardContent>
            <CardFooter className="justify-end">
                <Button variant="ghost" size="sm" className="group hover:bg-transparent hover:text-red-500 [&_svg]:size-6">
                    <Heart className="group-hover:fill-red-500" />
                </Button>
            </CardFooter>
        </Card>
    );
};

export default FeedCard;
