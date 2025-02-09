import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Heart } from 'lucide-react';
import { Post } from '@/types';

type Props = {
    post: Post;
};

const FeedCard = ({ post }: Props) => {
    return (
        <Card key={post.id}>
            <CardHeader>{post.userId}</CardHeader>
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
