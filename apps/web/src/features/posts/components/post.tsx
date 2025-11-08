import { FeedItem } from '@/common/types/models';
import { Link } from '@tanstack/react-router';
import { Heart, MoreHorizontal, MessageCircle, Share2 } from 'lucide-react';
import { useState } from 'react';
import { LikesDialog } from '../index';
import { PostModal } from './post-modal';
import UserAvatar from '@/shared/components/common/user-avatar';
import { Button } from '@/shared/components/ui/button';
import { Card, CardFooter } from '@/shared/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/shared/components/ui/dropdown-menu';
import { useLikeToggle } from '../hooks/use-posts';
import { useFollowings, useAuth } from '@/shared/lib/react-query';
import { useElapsedTime } from '@/shared/lib/utils';

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
    const { post, user, media, reactions, commentsCount } = item;
    const { data: auth } = useAuth();
    const { data: followings } = useFollowings(auth?.user ?? null);
    const [isLikesDialogOpen, setIsLikesDialogOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const elapsedTime = useElapsedTime(post.createdAt);

    const canFollow = auth?.user?.id !== post.userId && !followings.some((following) => following.id === post.userId);

    const isLiked = reactions.some((reaction) => reaction.userId === auth?.user?.id);

    const likeMutation = useLikeToggle(post.id, auth?.user ?? null);

    const handleLikeToggle = () => {
        if (!auth?.user || likeMutation.isPending) return;
        likeMutation.mutate(isLiked);
    };

    if (!user) return null;

    const username = user.name.toLowerCase().replace(/\s+/g, '');

    return (
        <Card className="border-border/40 bg-card w-full overflow-hidden transition-shadow hover:shadow-md hover:shadow-black/5">
            <div className="flex items-start justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                    <Link to="/users/$id" params={{ id: post.userId }}>
                        <UserAvatar user={user} />
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
                        <Button variant="ghost" size="icon" className="size-8" aria-label="Post options">
                            <MoreHorizontal className="size-4" aria-hidden="true" />
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
                    className="text-foreground text-sm leading-relaxed wrap-break-word whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: formatContent(post.content) }}
                />
            </div>
            {media && media.length > 0 && (
                <div className="bg-muted relative aspect-video w-full cursor-pointer overflow-hidden" onClick={() => setIsModalOpen(true)}>
                    {media.map((m) => (
                        <img key={m.id} src={`/media/${m.key}`} alt={`Post media by ${user.name}`} className="h-full w-full object-cover" loading="lazy" />
                    ))}
                </div>
            )}
            <CardFooter className="border-border/40 flex min-h-[52px] items-center justify-between border-t px-4 py-0">
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleLikeToggle}
                        className={`min-h-[44px] min-w-[44px] transition-all ${isLiked ? 'scale-105 text-red-500' : 'text-muted-foreground hover:text-red-500'}`}
                        aria-label={isLiked ? 'Unlike post' : 'Like post'}
                        aria-pressed={isLiked}
                    >
                        <Heart className={`h-5 w-5 transition-all ${isLiked ? 'fill-current' : ''}`} aria-hidden="true" />
                    </Button>
                    <span className="text-sm font-medium tabular-nums">{reactions.length}</span>
                </div>

                <div className="text-muted-foreground flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsModalOpen(true)}
                        className="text-muted-foreground hover:text-foreground min-h-[44px] min-w-[44px] transition-colors"
                        aria-label={`View ${commentsCount} comments`}
                    >
                        <MessageCircle className="h-5 w-5" aria-hidden="true" />
                    </Button>
                    <span className="text-sm font-medium tabular-nums">{commentsCount}</span>
                </div>

                <div className="text-muted-foreground flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-foreground min-h-[44px] min-w-[44px] transition-colors"
                        aria-label="Share post"
                    >
                        <Share2 className="h-5 w-5" aria-hidden="true" />
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
                    id: user.id,
                    name: user.name,
                    username: username,
                    avatar: user.image
                }}
                content={post.content}
                image={media && media.length > 0 && media[0] ? `/media/${media[0].key}` : undefined}
                timestamp={elapsedTime}
                likes={reactions.length}
                shares={0}
                isLiked={isLiked}
            />
        </Card>
    );
}
