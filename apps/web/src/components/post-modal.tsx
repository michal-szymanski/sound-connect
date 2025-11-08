import { Link } from '@tanstack/react-router';
import { Heart, MessageCircle, Share2, Send } from 'lucide-react';
import { useState, useRef } from 'react';
import UserAvatar from '@/web/components/small/user-avatar';
import { Button } from '@/web/components/ui/button';
import { Dialog, DialogContent } from '@/web/components/ui/dialog';
import { Input } from '@/web/components/ui/input';
import { ScrollArea } from '@/web/components/ui/scroll-area';
import { useAuth, useLikeToggle, useComments, useCreateComment } from '@/web/lib/react-query';
import { CommentItem } from '@/web/components/post-modal/comment-item';

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
    timestamp: string;
    likes: number;
    shares: number;
    isLiked?: boolean;
};

export function PostModal({ open, onOpenChange, postId, author, content, image, timestamp, likes, shares: _shares, isLiked = false }: Props) {
    const [commentText, setCommentText] = useState('');
    const [expandedReplies, setExpandedReplies] = useState<Set<number>>(new Set());
    const [replyingTo, setReplyingTo] = useState<number | null>(null);
    const commentInputRef = useRef<HTMLInputElement>(null);
    const { data: auth } = useAuth();
    const likeMutation = useLikeToggle(postId, auth?.user ?? null);
    const { data: comments = [], isLoading } = useComments(postId, open);
    const createCommentMutation = useCreateComment(postId);

    const handleLikeToggle = () => {
        if (!auth?.user || likeMutation.isPending) return;
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
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className={`z-[100]! flex h-[90vh] flex-row gap-0 overflow-hidden p-0 ${image ? 'w-[90vw] max-w-[1400px] sm:max-w-[1400px]' : 'w-[500px]'}`}
                showCloseButton={true}
            >
                {image && (
                    <div className="flex flex-1 items-center justify-center overflow-hidden bg-black">
                        <img src={image} alt="Post content" className="max-h-full max-w-full object-contain" />
                    </div>
                )}

                <div className={`bg-card border-border flex w-[500px] flex-shrink-0 flex-col overflow-hidden ${image ? 'border-l' : ''}`}>
                    {/* Post Header */}
                    <div className="border-border flex flex-shrink-0 items-center border-b p-3">
                        <div className="flex items-center gap-2">
                            <Link to="/users/$id" params={{ id: author.id }}>
                                <UserAvatar user={{ id: author.id, name: author.name, image: author.avatar }} className="h-9 w-9" />
                            </Link>
                            <div className="flex flex-col">
                                <Link to="/users/$id" params={{ id: author.id }} className="text-foreground text-sm font-semibold hover:underline">
                                    {author.name}
                                </Link>
                                <span className="text-muted-foreground text-xs">@{author.username}</span>
                            </div>
                        </div>
                    </div>

                    {/* Post Content */}
                    <div className="border-border flex-shrink-0 border-b p-3">
                        <div className="flex gap-2">
                            <Link to="/users/$id" params={{ id: author.id }}>
                                <UserAvatar user={{ id: author.id, name: author.name, image: author.avatar }} className="h-9 w-9" />
                            </Link>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <Link to="/users/$id" params={{ id: author.id }} className="text-foreground text-sm font-semibold hover:underline">
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
                    <div className="border-border flex-shrink-0 space-y-2 border-t p-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleLikeToggle}
                                    className={`h-8 px-2 ${isLiked ? 'text-red-500' : 'text-muted-foreground'}`}
                                >
                                    <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={handleCommentButtonClick} className="text-muted-foreground h-8 px-2">
                                    <MessageCircle className="h-5 w-5" />
                                </Button>
                                <Button variant="ghost" size="sm" className="text-muted-foreground h-8 px-2">
                                    <Share2 className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>
                        <div className="text-foreground text-sm font-semibold tabular-nums">
                            {likes} {likes === 1 ? 'like' : 'likes'}
                        </div>
                        <div className="text-muted-foreground text-xs">{timestamp}</div>
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
