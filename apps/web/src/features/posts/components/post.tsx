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
import { useUserBands } from '@/features/bands/hooks/use-bands';

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
    const { post, user, band, media, reactions, commentsCount } = item;
    const { data: auth } = useAuth();
    const { data: followings } = useFollowings(auth?.user ?? null);
    const { data: userBands } = useUserBands(auth?.user?.id ?? '');
    const [isLikesDialogOpen, setIsLikesDialogOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const elapsedTime = useElapsedTime(post.createdAt);

    const isBandPost = post.authorType === 'band';
    const authorId = isBandPost ? String(post.bandId ?? 0) : post.userId;
    const authorName = isBandPost ? (band?.name ?? 'Band') : (user?.name ?? 'User');
    const authorImage = isBandPost ? (band?.profileImageUrl ?? null) : (user?.image ?? null);

    const canFollow = !isBandPost && auth?.user?.id !== post.userId && !followings.some((following) => following.id === post.userId);

    const isUserBandAdmin = isBandPost && post.bandId ? userBands?.bands.some((membership) => membership.id === post.bandId && membership.isAdmin) : false;

    const canLike = auth?.user && (isBandPost ? !isUserBandAdmin : auth.user.id !== post.userId);

    const isLiked = reactions.some((reaction) => reaction.userId === auth?.user?.id);

    const likeMutation = useLikeToggle(post.id, auth?.user ?? null);

    const handleLikeToggle = () => {
        if (!canLike || !auth?.user || likeMutation.isPending) return;
        likeMutation.mutate(isLiked);
    };

    const username = isBandPost ? '' : (user?.name.toLowerCase().replace(/\s+/g, '') ?? '');

    return (
        <Card className="border-border/40 bg-card w-full overflow-hidden transition-shadow hover:shadow-md hover:shadow-black/5">
            <div className="flex items-start justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                    {isBandPost ? (
                        <Link to="/bands/$id" params={{ id: String(post.bandId!) }}>
                            {authorImage ? (
                                <img src={authorImage} alt={authorName} className="h-10 w-10 rounded-full object-cover" />
                            ) : (
                                <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-full">
                                    <span className="text-sm font-semibold">{authorName.charAt(0)}</span>
                                </div>
                            )}
                        </Link>
                    ) : (
                        <Link to="/users/$id" params={{ id: post.userId }}>
                            <UserAvatar user={user ?? { id: post.userId, name: 'User', image: null, lastActiveAt: null }} />
                        </Link>
                    )}
                    <div className="flex flex-col">
                        {isBandPost ? (
                            <Link
                                to="/bands/$id"
                                params={{ id: String(post.bandId!) }}
                                className="text-foreground flex items-center gap-2 text-sm font-semibold hover:underline"
                            >
                                {authorName}
                                <span className="text-muted-foreground bg-muted rounded px-2 py-0.5 text-xs font-normal">Band</span>
                            </Link>
                        ) : (
                            <Link to="/users/$id" params={{ id: post.userId }} className="text-foreground text-sm font-semibold hover:underline">
                                {authorName}
                            </Link>
                        )}
                        <span className="text-muted-foreground text-xs">
                            {!isBandPost && `@${username} · `}
                            {elapsedTime}
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
                        <img key={m.id} src={`/media/${m.key}`} alt={`Post media by ${authorName}`} className="h-full w-full object-cover" loading="lazy" />
                    ))}
                </div>
            )}
            <CardFooter className="border-border/40 flex min-h-[52px] items-center justify-between border-t px-4 py-0">
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleLikeToggle}
                        disabled={!canLike}
                        className={`min-h-[44px] min-w-[44px] ${!canLike ? `${isLiked ? 'text-red-500 opacity-75' : 'opacity-50'}` : isLiked ? 'scale-105 text-red-500 transition-all' : 'text-muted-foreground transition-all hover:scale-105 hover:text-red-500'}`}
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
                    id: authorId,
                    name: authorName,
                    username: username,
                    avatar: authorImage
                }}
                content={post.content}
                image={media && media.length > 0 && media[0] ? `/media/${media[0].key}` : undefined}
                timestamp={elapsedTime}
                likes={reactions.length}
                shares={0}
                isLiked={isLiked}
                canLike={canLike ?? false}
            />
        </Card>
    );
}
