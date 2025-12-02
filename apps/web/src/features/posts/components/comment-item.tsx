import { Link } from '@tanstack/react-router';
import ProfileAvatar from '@/shared/components/common/profile-avatar';
import { useCommentLikeToggle } from '../hooks/use-posts';
import { useElapsedTime } from '@/shared/lib/utils';
import type { UserDTO, BandInfo } from '@/common/types/models';
import type { User } from '@/common/types/drizzle';

type Props = {
    commentData: {
        comment: {
            id: number;
            authorType: 'user' | 'band';
            userId: string;
            bandId?: number | null;
            content: string;
            createdAt: string;
        };
        user: {
            id: string;
            name: string;
            image: string | null;
        } | null;
        band?: BandInfo | null;
        reactions: Array<{
            id: number;
            userId: string;
        }>;
    };
    currentUser: User | UserDTO | null;
    postId: number;
    onReply: (commentId: number) => void;
    isReply?: boolean;
};

export function CommentItem({ commentData, currentUser, postId, onReply, isReply }: Props) {
    const commentElapsedTime = useElapsedTime(commentData.comment.createdAt);
    const isCommentLiked = commentData.reactions.some((r) => r.userId === currentUser?.id);
    const commentLikeMutation = useCommentLikeToggle(commentData.comment.id, postId, currentUser);

    const handleLikeToggle = () => {
        if (!currentUser || commentLikeMutation.isPending) return;
        commentLikeMutation.mutate(isCommentLiked);
    };

    const isBandComment = commentData.comment.authorType === 'band';
    const authorName = isBandComment ? (commentData.band?.name ?? 'Band') : (commentData.user?.name ?? 'User');

    return (
        <div className="flex gap-2">
            <ProfileAvatar
                profile={
                    isBandComment
                        ? { id: String(commentData.comment.bandId!), name: authorName, image: commentData.band?.profileImageUrl ?? null }
                        : (commentData.user ?? { id: commentData.comment.userId, name: 'User', image: null })
                }
                type={isBandComment ? 'band' : 'user'}
                className={isReply ? 'h-7 w-7' : 'h-8 w-8'}
                linkToProfile
            />
            <div className="flex-1">
                <div className="flex items-center gap-2">
                    {isBandComment && commentData.band?.username ? (
                        <Link
                            to="/profile/$username"
                            params={{ username: commentData.band.username }}
                            className="text-foreground text-sm font-semibold hover:underline"
                        >
                            {authorName}
                        </Link>
                    ) : (
                        <span className="text-foreground text-sm font-semibold">{authorName}</span>
                    )}
                    {isBandComment && <span className="text-muted-foreground bg-muted rounded px-2 py-0.5 text-xs font-normal">Band</span>}
                    <span className="text-muted-foreground text-xs">{commentElapsedTime}</span>
                </div>
                <p className="text-foreground mt-0.5 text-sm">{commentData.comment.content}</p>
                <div className="mt-1 flex items-center gap-3">
                    <button
                        onClick={handleLikeToggle}
                        className={`text-xs ${isCommentLiked ? 'font-semibold text-red-500' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        {commentData.reactions.length} {commentData.reactions.length === 1 ? 'like' : 'likes'}
                    </button>
                    {!isReply && (
                        <button onClick={() => onReply(commentData.comment.id)} className="text-muted-foreground hover:text-foreground text-xs">
                            Reply
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
