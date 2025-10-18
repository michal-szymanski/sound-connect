import { Avatar, AvatarFallback, AvatarImage } from '@/web/components/ui/avatar';
import { Button } from '@/web/components/ui/button';
import { Dialog, DialogContent } from '@/web/components/ui/dialog';
import { Input } from '@/web/components/ui/input';
import { ScrollArea } from '@/web/components/ui/scroll-area';
import { Heart, MessageCircle, Share2, MoreHorizontal, Send } from 'lucide-react';
import { useState } from 'react';

interface Comment {
    id: string;
    author: {
        name: string;
        username: string;
        avatar: string;
    };
    content: string;
    timestamp: string;
    likes: number;
    replies?: Comment[];
}

interface PostModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    author: {
        name: string;
        username: string;
        avatar: string;
    };
    content: string;
    image?: string;
    timestamp: string;
    likes: number;
    comments: Comment[];
    shares: number;
    isLiked?: boolean;
}

export function PostModal({
    open,
    onOpenChange,
    author,
    content,
    image,
    timestamp,
    likes,
    comments: initialComments,
    shares,
    isLiked = false
}: PostModalProps) {
    const [commentText, setCommentText] = useState('');
    const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());

    const toggleReplies = (commentId: string) => {
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

    console.log('PostModal image:', image);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="h-[90vh] w-[90vw] max-w-[1400px] sm:max-w-[1400px] gap-0 p-0 flex flex-row overflow-hidden !z-[100]" showCloseButton={true}>
                <div className="flex flex-1 items-center justify-center bg-black overflow-hidden">
                    {image ? (
                        <img src={image} alt="Post content" className="max-h-full max-w-full object-contain" />
                    ) : (
                        <div className="bg-muted flex h-full w-full items-center justify-center">
                            <span className="text-muted-foreground">No image</span>
                        </div>
                    )}
                </div>

                <div className="bg-card border-border flex w-[500px] flex-shrink-0 flex-col overflow-hidden border-l">
                        {/* Post Header */}
                        <div className="border-border flex flex-shrink-0 items-center border-b p-3">
                            <div className="flex items-center gap-2">
                                <Avatar className="h-9 w-9">
                                    <AvatarImage src={author.avatar || '/placeholder.svg'} alt={author.name} />
                                    <AvatarFallback>{author.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                    <span className="text-foreground text-sm font-semibold">{author.name}</span>
                                    <span className="text-muted-foreground text-xs">@{author.username}</span>
                                </div>
                            </div>
                        </div>

                        {/* Post Content */}
                        <div className="border-border flex-shrink-0 border-b p-3">
                            <div className="flex gap-2">
                                <Avatar className="h-9 w-9">
                                    <AvatarImage src={author.avatar || '/placeholder.svg'} alt={author.name} />
                                    <AvatarFallback>{author.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-foreground text-sm font-semibold">{author.name}</span>
                                        <span className="text-muted-foreground text-xs">{timestamp}</span>
                                    </div>
                                    <p className="text-foreground mt-1 text-sm">{content}</p>
                                </div>
                            </div>
                        </div>

                        {/* Comments Section */}
                        <ScrollArea className="h-0 flex-1">
                            <div className="space-y-4 p-3">
                                {initialComments.map((comment) => (
                                    <div key={comment.id}>
                                        <div className="flex gap-2">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={comment.author.avatar || '/placeholder.svg'} alt={comment.author.name} />
                                                <AvatarFallback>{comment.author.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-foreground text-sm font-semibold">{comment.author.name}</span>
                                                    <span className="text-muted-foreground text-xs">{comment.timestamp}</span>
                                                </div>
                                                <p className="text-foreground mt-0.5 text-sm">{comment.content}</p>
                                                <div className="mt-1 flex items-center gap-3">
                                                    <button className="text-muted-foreground hover:text-foreground text-xs">{comment.likes} likes</button>
                                                    <button className="text-muted-foreground hover:text-foreground text-xs">Reply</button>
                                                </div>
                                            </div>
                                        </div>

                                        {comment.replies && comment.replies.length > 0 && (
                                            <div className="ml-10 mt-3">
                                                <button
                                                    onClick={() => toggleReplies(comment.id)}
                                                    className="text-muted-foreground hover:text-foreground mb-3 flex items-center gap-2 text-xs font-semibold"
                                                >
                                                    <div className="bg-muted-foreground/30 h-px w-6" />
                                                    {expandedReplies.has(comment.id) ? `Hide replies` : `View replies (${comment.replies.length})`}
                                                </button>

                                                {expandedReplies.has(comment.id) && (
                                                    <div className="space-y-3">
                                                        {comment.replies.map((reply) => (
                                                            <div key={reply.id} className="flex gap-2">
                                                                <Avatar className="h-7 w-7">
                                                                    <AvatarImage src={reply.author.avatar || '/placeholder.svg'} alt={reply.author.name} />
                                                                    <AvatarFallback>{reply.author.name.charAt(0)}</AvatarFallback>
                                                                </Avatar>
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-foreground text-sm font-semibold">{reply.author.name}</span>
                                                                        <span className="text-muted-foreground text-xs">{reply.timestamp}</span>
                                                                    </div>
                                                                    <p className="text-foreground mt-0.5 text-sm">{reply.content}</p>
                                                                    <div className="mt-1 flex items-center gap-3">
                                                                        <button className="text-muted-foreground hover:text-foreground text-xs">
                                                                            {reply.likes} likes
                                                                        </button>
                                                                        <button className="text-muted-foreground hover:text-foreground text-xs">Reply</button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>

                        {/* Action Buttons */}
                        <div className="border-border flex-shrink-0 space-y-2 border-t p-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Button variant="ghost" size="sm" className={`h-8 px-2 ${isLiked ? 'text-red-500' : 'text-muted-foreground'}`}>
                                        <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
                                    </Button>
                                    <Button variant="ghost" size="sm" className="text-muted-foreground h-8 px-2">
                                        <MessageCircle className="h-5 w-5" />
                                    </Button>
                                    <Button variant="ghost" size="sm" className="text-muted-foreground h-8 px-2">
                                        <Share2 className="h-5 w-5" />
                                    </Button>
                                </div>
                            </div>
                            <div className="text-foreground text-sm font-semibold">{likes} likes</div>
                            <div className="text-muted-foreground text-xs">{timestamp}</div>
                        </div>

                        {/* Comment Input */}
                        <div className="border-border flex-shrink-0 border-t p-3">
                            <div className="flex items-center gap-2">
                                <Input
                                    placeholder="Add a comment..."
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    className="flex-1 border-0 px-0 focus-visible:ring-0"
                                />
                                <Button size="sm" variant="ghost" disabled={!commentText.trim()} className="text-primary disabled:text-muted-foreground">
                                    <Send className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
            </DialogContent>
        </Dialog>
    );
}
