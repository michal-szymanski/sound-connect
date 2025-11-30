import { FeedItem } from '@/common/types/models';
import { Link } from '@tanstack/react-router';
import { Heart, MoreHorizontal, MessageCircle, Share2, Sparkles, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { LikesDialog } from '../index';
import { PostModal } from './post-modal';
import { PostDialog } from './post-dialog';
import { DeletePostDialog } from './delete-post-dialog';
import { MediaGrid } from './media-grid';
import ProfileAvatar from '@/shared/components/common/profile-avatar';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/shared/components/ui/dropdown-menu';
import { Input } from '@/shared/components/ui/input';
import { EmojiPicker } from '@/web/components/emoji-picker';
import { useLikeToggle, useCreateComment } from '../hooks/use-posts';
import { useAuth } from '@/shared/lib/react-query';
import { useElapsedTime } from '@/shared/lib/utils';
import { useUserBands } from '@/features/bands/hooks/use-bands';
import { cn } from '@/shared/lib/utils';

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

const formatCount = (count: number): string => {
    if (count === 0) return '';
    if (count < 1000) return count.toString();
    if (count < 1000000) {
        const k = count / 1000;
        return k % 1 === 0 ? `${k}K` : `${k.toFixed(1)}K`;
    }
    const m = count / 1000000;
    return m % 1 === 0 ? `${m}M` : `${m.toFixed(1)}M`;
};

export function Post({ item }: Props) {
    const { post, user, band, media, reactions, commentsCount } = item;
    const { data: auth } = useAuth();
    const { data: userBands } = useUserBands(auth?.user?.id ?? '');
    const [isLikesDialogOpen, setIsLikesDialogOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [isExpanded, setIsExpanded] = useState(false);
    const [commentText, setCommentText] = useState('');
    const elapsedTime = useElapsedTime(post.createdAt);

    const isBandPost = post.authorType === 'band';
    const authorId = isBandPost ? String(post.bandId ?? 0) : post.userId;
    const authorName = isBandPost ? (band?.name ?? 'Band') : (user?.name ?? 'User');
    const authorImage = isBandPost ? (band?.profileImageUrl ?? null) : (user?.image ?? null);

    const isUserBandAdmin = isBandPost && post.bandId ? userBands?.bands.some((membership) => membership.id === post.bandId && membership.isAdmin) : false;

    const canLike = auth?.user && (isBandPost ? !isUserBandAdmin : auth.user.id !== post.userId);

    const isLiked = reactions.some((reaction) => reaction.userId === auth?.user?.id);

    const canEdit = auth?.user && (isBandPost ? isUserBandAdmin : auth.user.id === post.userId);

    const isEdited = post.updatedAt && post.updatedAt !== post.createdAt;

    const likeMutation = useLikeToggle(post.id, auth?.user ?? null);
    const createCommentMutation = useCreateComment(post.id);

    const handleLikeToggle = () => {
        if (!canLike || !auth?.user || likeMutation.isPending) return;
        likeMutation.mutate(isLiked);
    };

    const handleShare = async () => {
        const postUrl = `${window.location.origin}/posts/${post.id}`;
        const shareData = {
            title: `Post by ${authorName}`,
            text: post.content,
            url: postUrl
        };

        if (typeof navigator.share !== 'undefined') {
            try {
                await navigator.share(shareData);
            } catch (error) {
                if (error instanceof Error && error.name !== 'AbortError') {
                    toast.error('Could not share post');
                }
            }
        } else {
            try {
                await navigator.clipboard.writeText(postUrl);
                toast.success('Link copied to clipboard!');
            } catch {
                toast.error('Could not copy link');
            }
        }
    };

    const handleMediaClick = (mediaKey: string) => {
        const index = media.findIndex((m) => m.key === mediaKey);
        if (index >= 0) {
            setLightboxIndex(index);
            setIsModalOpen(true);
        }
    };

    const handleEmojiSelect = (emoji: string) => {
        setCommentText((prev) => prev + emoji);
    };

    const handleCommentSubmit = () => {
        if (!commentText.trim() || createCommentMutation.isPending) return;
        createCommentMutation.mutate(
            { content: commentText.trim(), parentCommentId: null },
            {
                onSuccess: () => {
                    setCommentText('');
                    setIsModalOpen(true);
                }
            }
        );
    };

    return (
        <article className="border-border/40 bg-card w-full overflow-hidden rounded-xl border px-4 py-3 transition-shadow hover:shadow-md hover:shadow-black/5">
            <header className="mb-2 flex items-start gap-3">
                <ProfileAvatar
                    profile={{
                        id: isBandPost ? String(post.bandId!) : post.userId,
                        name: authorName,
                        image: authorImage
                    }}
                    type={isBandPost ? 'band' : 'user'}
                    className="size-10 flex-shrink-0"
                    linkToProfile
                />
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                        <Link
                            to="/profile/$username"
                            params={{ username: isBandPost ? (band?.username ?? '') : (user?.username ?? '') }}
                            className="truncate text-sm font-semibold hover:underline"
                        >
                            {authorName}
                        </Link>
                        {isBandPost && (
                            <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-normal">
                                Band
                            </Badge>
                        )}
                        {item.isDiscovery && (
                            <Badge variant="outline" className="h-5 gap-0.5 px-1.5 text-[10px] font-normal">
                                <Sparkles className="size-3" />
                                Suggested
                            </Badge>
                        )}
                        <span className="text-muted-foreground" aria-hidden="true">
                            ·
                        </span>
                        <time className="text-muted-foreground text-xs whitespace-nowrap">{elapsedTime}</time>
                        {isEdited && (
                            <>
                                <span className="text-muted-foreground" aria-hidden="true">
                                    ·
                                </span>
                                <span className="text-muted-foreground text-xs">Edited</span>
                            </>
                        )}
                    </div>
                    {!isBandPost && user?.username && <span className="text-muted-foreground text-xs">@{user.username}</span>}
                </div>
                <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8 flex-shrink-0 rounded-full" aria-label="Post options">
                            <MoreHorizontal className="size-4" aria-hidden="true" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                            <Link to="/posts/$postId" params={{ postId: post.id.toString() }}>
                                View post
                            </Link>
                        </DropdownMenuItem>
                        {canEdit && (
                            <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)} className="text-destructive focus:text-destructive">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                </DropdownMenuItem>
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </header>
            {media && media.length > 0 && (
                <div className="-mx-4 mb-2 sm:mx-0 sm:overflow-hidden">
                    <MediaGrid media={media} onMediaClick={handleMediaClick} />
                </div>
            )}
            <footer className="mb-2 flex items-center gap-1">
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleLikeToggle}
                        disabled={!canLike}
                        className={cn(
                            'h-8 rounded-full px-2',
                            canLike && 'hover:bg-red-500/10 hover:text-red-500',
                            isLiked ? 'text-red-500' : 'text-muted-foreground',
                            !canLike && 'cursor-default opacity-60'
                        )}
                        aria-label={isLiked ? 'Unlike post' : 'Like post'}
                        aria-pressed={isLiked}
                    >
                        <Heart className={cn('size-[18px]', isLiked && 'fill-current')} aria-hidden="true" />
                    </Button>
                    <span className={cn('min-w-[2ch] text-xs tabular-nums', isLiked ? 'text-red-500' : 'text-muted-foreground')}>
                        {formatCount(reactions.length)}
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsModalOpen(true)}
                        className="text-muted-foreground hover:bg-primary/10 hover:text-primary h-8 rounded-full px-2"
                        aria-label={`View ${commentsCount} comments`}
                    >
                        <MessageCircle className="size-[18px]" aria-hidden="true" />
                    </Button>
                    <span className="text-muted-foreground min-w-[2ch] text-xs tabular-nums">{formatCount(commentsCount)}</span>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleShare}
                    className="text-muted-foreground hover:bg-primary/10 hover:text-primary h-8 rounded-full px-2"
                    aria-label="Share post"
                >
                    <Share2 className="size-[18px]" aria-hidden="true" />
                </Button>
            </footer>
            <div className="mb-2 text-sm">
                <Link to="/profile/$username" params={{ username: isBandPost ? (band?.username ?? '') : (user?.username ?? '') }} className="font-semibold hover:underline">
                    {authorName}
                </Link>{' '}
                {isExpanded ? (
                    <span className="text-foreground break-words whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: formatContent(post.content) }} />
                ) : (
                    <>
                        <span className="text-foreground line-clamp-2 break-words" dangerouslySetInnerHTML={{ __html: formatContent(post.content) }} />
                        {post.content.length > 100 && (
                            <button onClick={() => setIsExpanded(true)} className="text-muted-foreground ml-1">
                                more
                            </button>
                        )}
                    </>
                )}
            </div>
            <div className="border-border/40 flex items-center gap-2 border-t pt-2">
                <Input
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleCommentSubmit();
                        }
                    }}
                    placeholder="Add a comment..."
                    className="border-0 px-0 focus-visible:ring-0"
                />
                {commentText.trim() && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCommentSubmit}
                        disabled={createCommentMutation.isPending}
                        className="text-primary h-8 px-2 font-semibold"
                    >
                        Post
                    </Button>
                )}
                <EmojiPicker onEmojiSelect={handleEmojiSelect} popoverProps={{ align: 'end' }} />
            </div>
            <LikesDialog isOpen={isLikesDialogOpen} onClose={() => setIsLikesDialogOpen(false)} postId={post.id} />
            <PostModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                postId={post.id}
                author={{
                    id: authorId,
                    name: authorName,
                    username: isBandPost ? '' : (user?.username || ''),
                    avatar: authorImage
                }}
                content={post.content}
                media={media}
                timestamp={elapsedTime}
                likes={reactions.length}
                shares={0}
                isLiked={isLiked}
                canLike={canLike ?? false}
                initialMediaIndex={lightboxIndex}
            />
            <PostDialog mode="edit" open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} post={post} existingMedia={media} isBandPost={isBandPost} />
            <DeletePostDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen} postId={post.id} isBandPost={isBandPost} />
        </article>
    );
}
