import { Button } from '@/web/components/ui/button';
import { Card, CardFooter } from '@/web/components/ui/card';
import { Heart, MoreHorizontal, MessageCircle, Share2 } from 'lucide-react';
import { useFollowings, useUser, useLikeToggle } from '@/web/lib/react-query';
import { Link } from '@tanstack/react-router';
import { useElapsedTime } from '@/web/lib/utils';
import { FeedItem } from '@sound-connect/common/types/models';
import StatusAvatar from '@/web/components/small/status-avatar';
import { useState } from 'react';
import LikesDialog from '@/web/components/dialogs/likes-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/web/components/ui/dropdown-menu';
import { PostModal } from '@/web/components/post-modal';

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

export function Post({ item }: Props) {
    const { post, user, media, reactions } = item;
    const { data: currentUser } = useUser();
    const { data: followings } = useFollowings(currentUser);
    const [isLikesDialogOpen, setIsLikesDialogOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const elapsedTime = useElapsedTime(post.createdAt);

    const canFollow = currentUser?.id !== post.userId && !followings.some((following) => following.id === post.userId);

    const isLiked = reactions.some((reaction) => reaction.userId === currentUser?.id);

    const likeMutation = useLikeToggle(post.id, currentUser);

    const handleLikeToggle = () => {
        if (!currentUser || likeMutation.isPending) return;
        likeMutation.mutate(isLiked);
    };

    if (!user) return null;

    const username = user.name.toLowerCase().replace(/\s+/g, '');

    return (
        <Card className="border-border bg-card w-[500px] overflow-hidden">
            <div className="flex items-start justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                    <Link to="/users/$id" params={{ id: post.userId }}>
                        <StatusAvatar user={user} />
                    </Link>
                    <div className="flex flex-col">
                        <Link to="/users/$id" params={{ id: post.userId }} className="text-foreground text-sm font-semibold hover:underline">
                            {user.name}
                        </Link>
                        <span className="text-muted-foreground text-xs">
                            @{username} · {elapsedTime}
                        </span>
                    </div>
                </div>
                <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8">
                            <MoreHorizontal className="size-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                            <Link to="/posts/$postId" params={{ postId: post.id.toString() }}>
                                View post
                            </Link>
                        </DropdownMenuItem>
                        {canFollow && <DropdownMenuItem>Follow</DropdownMenuItem>}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <div className="px-4 pb-3">
                <div
                    className="text-foreground whitespace-pre-wrap break-words text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: formatContent(post.content) }}
                />
            </div>
            {media && media.length > 0 && (
                <div className="bg-muted relative aspect-video w-full cursor-pointer overflow-hidden" onClick={() => setIsModalOpen(true)}>
                    {media.map((m) => (
                        <img key={m.id} src={`/media/${m.key}`} alt={m.type} className="h-full w-full object-cover" />
                    ))}
                </div>
            )}
            <CardFooter className="border-border flex min-h-[44px] items-center justify-between border-t px-4 py-0">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={handleLikeToggle} className={isLiked ? 'text-red-500' : 'text-muted-foreground'}>
                        <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
                    </Button>
                    <span className="text-sm font-medium tabular-nums">{reactions.length}</span>
                </div>

                <div className="text-muted-foreground flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(true)}>
                        <MessageCircle className="h-5 w-5" />
                    </Button>
                    <span className="text-sm font-medium tabular-nums">0</span>
                </div>

                <div className="text-muted-foreground flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                        <Share2 className="h-5 w-5" />
                    </Button>
                    <span className="text-sm font-medium tabular-nums">0</span>
                </div>
            </CardFooter>
            <LikesDialog isOpen={isLikesDialogOpen} onClose={() => setIsLikesDialogOpen(false)} postId={post.id} />
            <PostModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                postId={post.id}
                author={{
                    name: user.name,
                    username: username,
                    avatar: user.image || ''
                }}
                content={post.content}
                image={media && media.length > 0 && media[0] ? `/media/${media[0].key}` : undefined}
                timestamp={elapsedTime}
                likes={reactions.length}
                comments={[]}
                shares={0}
                isLiked={isLiked}
            />
        </Card>
    );
}
