import { Link } from '@tanstack/react-router';
import { Heart, MessageCircle, Share2, Send, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useRef, useCallback, useEffect } from 'react';
import { VisuallyHidden } from 'radix-ui';
import ProfileAvatar from '@/shared/components/common/profile-avatar';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { useLikeToggle, useComments, useCreateComment } from '../hooks/use-posts';
import { useAuth } from '@/shared/lib/react-query';
import { CommentItem } from './comment-item';
import { cn } from '@/shared/lib/utils';
import { VideoPlayer } from './video-player';
import { AudioPlayer } from './audio-player';
import type { Media } from '@sound-connect/common/types/drizzle';

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

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    postId: number;
    author: {
        id: string;
        name: string;
        username: string;
        avatar: string | null;
    };
    content: string;
    image?: string;
    media?: Media[];
    timestamp: string;
    likes: number;
    shares: number;
    isLiked?: boolean;
    canLike?: boolean;
    initialMediaIndex?: number;
};

export function PostModal({
    open,
    onOpenChange,
    postId,
    author,
    content,
    image,
    media = [],
    timestamp,
    likes,
    shares: _shares,
    isLiked = false,
    canLike = true,
    initialMediaIndex
}: Props) {
    const [commentText, setCommentText] = useState('');
    const [expandedReplies, setExpandedReplies] = useState<Set<number>>(new Set());
    const [replyingTo, setReplyingTo] = useState<number | null>(null);
    const [currentMediaIndex, setCurrentMediaIndex] = useState(() => initialMediaIndex ?? 0);
    const commentInputRef = useRef<HTMLInputElement>(null);
    const { data: auth } = useAuth();
    const likeMutation = useLikeToggle(postId, auth?.user ?? null);
    const { data: comments = [], isLoading } = useComments(postId, open);
    const createCommentMutation = useCreateComment(postId);

    const hasMedia = (media && media.length > 0) || image;
    const displayMedia = media && media.length > 0 ? media : image ? [{ id: 0, postId, type: 'image' as const, key: image.replace('/media/', '') }] : [];

    const handlePreviousMedia = useCallback(() => {
        setCurrentMediaIndex((prev) => (prev > 0 ? prev - 1 : displayMedia.length - 1));
    }, [displayMedia.length]);

    const handleNextMedia = useCallback(() => {
        setCurrentMediaIndex((prev) => (prev < displayMedia.length - 1 ? prev + 1 : 0));
    }, [displayMedia.length]);

    const handleOpenChange = useCallback(
        (newOpen: boolean) => {
            if (!newOpen) {
                setCurrentMediaIndex(0);
            } else if (initialMediaIndex !== undefined) {
                setCurrentMediaIndex(initialMediaIndex);
            }
            onOpenChange(newOpen);
        },
        [onOpenChange, initialMediaIndex]
    );

    useEffect(() => {
        if (open && initialMediaIndex !== undefined) {
            setCurrentMediaIndex(initialMediaIndex);
        }
    }, [open, initialMediaIndex]);

    useEffect(() => {
        if (!open || displayMedia.length <= 1) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                handlePreviousMedia();
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                handleNextMedia();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [open, displayMedia.length, handlePreviousMedia, handleNextMedia]);

    const handleLikeToggle = () => {
        if (!canLike || !auth?.user || likeMutation.isPending) return;
        likeMutation.mutate(isLiked);
    };

    const handleCommentButtonClick = () => {
        commentInputRef.current?.focus();
    };

    const handleSubmitComment = () => {
        if (!commentText.trim() || createCommentMutation.isPending) return;

        const parentCommentId = replyingTo;

        createCommentMutation.mutate(
            {
                content: commentText.trim(),
                parentCommentId: replyingTo
            },
            {
                onSuccess: () => {
                    setCommentText('');
                    setReplyingTo(null);
                    if (parentCommentId) {
                        setExpandedReplies((prev) => new Set(prev).add(parentCommentId));
                    }
                }
            }
        );
    };

    const handleReply = (commentId: number) => {
        setReplyingTo(commentId);
        commentInputRef.current?.focus();
    };

    const cancelReply = () => {
        setReplyingTo(null);
        setCommentText('');
    };

    const toggleReplies = (commentId: number) => {
        setExpandedReplies((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(commentId)) {
                newSet.delete(commentId);
            } else {
                newSet.add(commentId);
            }
            return newSet;
        });
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent
                className={`z-dialog! flex h-[90vh] flex-row gap-0 overflow-hidden p-0 ${hasMedia ? 'w-[90vw] max-w-[1400px] sm:max-w-[1400px]' : 'w-[500px]'}`}
                showCloseButton={true}
            >
                <VisuallyHidden.Root>
                    <DialogTitle>Post by {author.name}</DialogTitle>
                    <DialogDescription>View post content, media, and comments. Like and comment on this post.</DialogDescription>
                </VisuallyHidden.Root>

                {hasMedia && displayMedia[currentMediaIndex] && (
                    <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-black">
                        {displayMedia[currentMediaIndex]!.type === 'video' ? (
                            <VideoPlayer src={`/media/${displayMedia[currentMediaIndex]!.key}`} controls className="max-h-full max-w-full" />
                        ) : displayMedia[currentMediaIndex]!.type === 'audio' ? (
                            <div className="w-full max-w-2xl px-8">
                                <AudioPlayer src={`/media/${displayMedia[currentMediaIndex]!.key}`} />
                            </div>
                        ) : (
                            <img src={`/media/${displayMedia[currentMediaIndex]!.key}`} alt="Post content" className="max-h-full max-w-full object-contain" />
                        )}

                        {displayMedia.length > 1 && (
                            <>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={handlePreviousMedia}
                                    className="absolute top-1/2 left-4 z-[101] h-12 w-12 -translate-y-1/2 rounded-full bg-black/50 text-white hover:bg-black/70 hover:text-white"
                                    aria-label="Previous media"
                                >
                                    <ChevronLeft className="h-8 w-8" aria-hidden="true" />
                                </Button>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={handleNextMedia}
                                    className="absolute top-1/2 right-4 z-[101] h-12 w-12 -translate-y-1/2 rounded-full bg-black/50 text-white hover:bg-black/70 hover:text-white"
                                    aria-label="Next media"
                                >
                                    <ChevronRight className="h-8 w-8" aria-hidden="true" />
                                </Button>

                                <div className="absolute bottom-4 left-1/2 z-[101] -translate-x-1/2 rounded-full bg-black/50 px-4 py-2 text-sm font-medium text-white">
                                    {currentMediaIndex + 1} / {displayMedia.length}
                                </div>
                            </>
                        )}
                    </div>
                )}

                <div className={`bg-card border-border flex w-[500px] flex-shrink-0 flex-col overflow-hidden ${hasMedia ? 'border-l' : ''}`}>
                    {/* Post Header */}
                    <div className="border-border flex flex-shrink-0 items-center border-b p-3">
                        <div className="flex items-center gap-2">
                            <ProfileAvatar profile={{ id: author.id, name: author.name, image: author.avatar }} type="user" className="h-9 w-9" linkToProfile />
                            <div className="flex flex-col">
                                <Link to="/profile/$username" params={{ username: author.username }} className="text-foreground text-sm font-semibold hover:underline">
                                    {author.name}
                                </Link>
                                {author.username && <span className="text-muted-foreground text-xs">@{author.username}</span>}
                            </div>
                        </div>
                    </div>

                    {/* Post Content */}
                    <div className="border-border flex-shrink-0 border-b p-3">
                        <div className="flex gap-2">
                            <ProfileAvatar profile={{ id: author.id, name: author.name, image: author.avatar }} type="user" className="h-9 w-9" linkToProfile />
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <Link to="/profile/$username" params={{ username: author.username }} className="text-foreground text-sm font-semibold hover:underline">
                                        {author.name}
                                    </Link>
                                    <span className="text-muted-foreground text-xs">{timestamp}</span>
                                </div>
                                <p className="text-foreground mt-1 text-sm">{content}</p>
                            </div>
                        </div>
                    </div>

                    {/* Comments Section */}
                    <ScrollArea className="h-0 flex-1">
                        <div className="space-y-4 p-3">
                            {isLoading ? (
                                <div className="text-muted-foreground text-center text-sm">Loading comments...</div>
                            ) : comments.length === 0 ? (
                                <div className="text-muted-foreground text-center text-sm">No comments yet</div>
                            ) : (
                                comments.map((commentData) => (
                                    <div key={commentData.comment.id}>
                                        <CommentItem commentData={commentData} currentUser={auth?.user ?? null} postId={postId} onReply={handleReply} />

                                        {commentData.replies && commentData.replies.length > 0 && (
                                            <div className="mt-3 ml-10">
                                                <button
                                                    onClick={() => toggleReplies(commentData.comment.id)}
                                                    className="text-muted-foreground hover:text-foreground mb-3 flex items-center gap-2 text-xs font-semibold"
                                                >
                                                    <div className="bg-muted-foreground/30 h-px w-6" />
                                                    {expandedReplies.has(commentData.comment.id)
                                                        ? `Hide replies`
                                                        : `View replies (${commentData.replies.length})`}
                                                </button>

                                                {expandedReplies.has(commentData.comment.id) && (
                                                    <div className="space-y-3">
                                                        {commentData.replies.map((replyData) => (
                                                            <CommentItem
                                                                key={replyData.comment.id}
                                                                commentData={replyData}
                                                                currentUser={auth?.user ?? null}
                                                                postId={postId}
                                                                onReply={handleReply}
                                                                isReply
                                                            />
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </ScrollArea>

                    {/* Action Buttons */}
                    <div className="border-border flex-shrink-0 border-t p-3">
                        <div className="flex items-center gap-1">
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
                                    {formatCount(likes)}
                                </span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleCommentButtonClick}
                                    className="text-muted-foreground hover:bg-primary/10 hover:text-primary h-8 rounded-full px-2"
                                    aria-label="View comments"
                                >
                                    <MessageCircle className="size-[18px]" aria-hidden="true" />
                                </Button>
                                <span className="text-muted-foreground min-w-[2ch] text-xs tabular-nums">{formatCount(comments.length)}</span>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-muted-foreground hover:bg-primary/10 hover:text-primary h-8 rounded-full px-2"
                                aria-label="Share post"
                            >
                                <Share2 className="size-[18px]" aria-hidden="true" />
                            </Button>
                        </div>
                    </div>

                    {/* Comment Input */}
                    <div className="border-border flex-shrink-0 border-t p-3">
                        {replyingTo && (
                            <div className="text-muted-foreground mb-2 flex items-center justify-between text-xs">
                                <span>Replying to comment...</span>
                                <button onClick={cancelReply} className="hover:text-foreground">
                                    Cancel
                                </button>
                            </div>
                        )}
                        <div className="flex items-center gap-2">
                            <Input
                                ref={commentInputRef}
                                placeholder={replyingTo ? 'Add a reply...' : 'Add a comment...'}
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSubmitComment();
                                    }
                                }}
                                className="flex-1 border-0 px-3 focus-visible:ring-0"
                            />
                            <Button
                                size="sm"
                                variant="ghost"
                                disabled={!commentText.trim() || createCommentMutation.isPending}
                                onClick={handleSubmitComment}
                                className="text-primary disabled:text-muted-foreground"
                            >
                                <Send className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
