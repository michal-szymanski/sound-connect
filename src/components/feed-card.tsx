'use client';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Heart } from 'lucide-react';
import { Post } from '@/types';
import { useUser } from '@/lib/react-query';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

type Props = {
    post: Post;
};

const FeedCard = ({ post }: Props) => {
    const { data: user } = useUser({ userId: post.userId });

    return (
        <Card key={post.id}>
            <CardHeader className="flex-row items-start space-x-3 space-y-0">
                <Avatar>
                    <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
                    <AvatarFallback>CN</AvatarFallback>
                </Avatar>
                <div className="text-sm">
                    {user?.firstName} {user?.lastName}
                </div>
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
