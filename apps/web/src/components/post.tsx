import { Button } from '@/web/components/ui/button';
import { Card, CardContent, CardFooter } from '@/web/components/ui/card';
import { Heart, MoreHorizontal } from 'lucide-react';
import { useFollowings, useUser, useLikeToggle } from '@/web/lib/react-query';
import { Link } from '@tanstack/react-router';
import { useElapsedTime } from '@/web/lib/utils';
import { FeedItem, PostReaction } from '@sound-connect/common/types/models';
import StatusAvatar from '@/web/components/small/status-avatar';
import { useState } from 'react';
import LikesDialog from '@/web/components/dialogs/likes-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/web/components/ui/dropdown-menu';

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

const renderLikes = (reactions: PostReaction[]) => {
    if (!reactions || reactions.length === 0) return null;
    const count = reactions.length;
    if (count === 1) return '1 like';
    return `${count.toLocaleString()} likes`;
};

export function Post({ item: { post, user, media, reactions } }: Props) {
    const { data: currentUser } = useUser();
    const { data: followings } = useFollowings(currentUser);
    const [justLiked, setJustLiked] = useState(false);
    const [isLikesDialogOpen, setIsLikesDialogOpen] = useState(false);
    const elapsedTime = useElapsedTime(post.createdAt);

    const canFollow = currentUser?.id !== post.userId && !followings.some((following) => following.id === post.userId);

    const isLiked = reactions.some((reaction) => reaction.userId === currentUser?.id);

    const likeMutation = useLikeToggle(post.id, currentUser);

    const handleLikeToggle = () => {
        if (!currentUser || likeMutation.isPending) return;

        if (!isLiked) {
            setJustLiked(true);
            setTimeout(() => setJustLiked(false), 300);
        }

        likeMutation.mutate(isLiked);
    };

    if (!user) return null;

    return (
        <Card className="w-[500px]">
            <div className="inline-flex w-full items-center space-x-2 space-y-0 px-6 py-4 text-sm">
                <Button variant="link" className="w-min px-0" size="lg" asChild>
                    <Link to="/users/$id" params={{ id: post.userId }}>
                        <StatusAvatar user={user} />
                        <div>{user.name}</div>
                    </Link>
                </Button>
                <div className="text-muted-foreground">•</div>
                <div className="text-muted-foreground">{elapsedTime}</div>
                {canFollow && (
                    <>
                        <div className="text-muted-foreground">•</div>
                        <Button variant="ghost" className="hover:text-card-foreground p-0 font-semibold text-blue-500 hover:bg-transparent">
                            Follow
                        </Button>
                    </>
                )}
                <div className="ml-auto">
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
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
            <CardContent>
                <div className="whitespace-pre-wrap break-words" dangerouslySetInnerHTML={{ __html: formatContent(post.content) }} />
                {media && media.length > 0 && (
                    <div className="mt-3 grid gap-2">
                        {media.map((m) => (
                            <img key={m.id} src={`/media/${m.key}`} alt={m.type} className="h-auto w-full rounded-lg border object-cover" />
                        ))}
                    </div>
                )}
            </CardContent>
            <CardFooter className="flex-col items-start gap-2">
                <div className="inline-flex gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleLikeToggle}
                        className="group cursor-pointer rounded-full p-2 hover:bg-transparent hover:text-current dark:hover:bg-transparent"
                    >
                        <Heart
                            className={`size-6 transition-colors duration-150 ease-out ${
                                isLiked ? 'fill-red-500 text-red-500' : 'text-gray-700 group-hover:text-white dark:text-gray-300 dark:group-hover:text-white'
                            } ${justLiked ? 'animate-heartbeat' : ''}`}
                        />
                    </Button>
                </div>
                <div className="flex h-5 items-center pl-1">
                    {reactions.length > 0 && (
                        <button onClick={() => setIsLikesDialogOpen(true)} className="text-sm font-semibold text-gray-900 hover:underline dark:text-gray-100">
                            {renderLikes(reactions)}
                        </button>
                    )}
                </div>
            </CardFooter>
            <LikesDialog isOpen={isLikesDialogOpen} onClose={() => setIsLikesDialogOpen(false)} postId={post.id} />
        </Card>
    );
}
