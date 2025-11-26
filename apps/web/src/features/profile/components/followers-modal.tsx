import { UserDTO } from '@/common/types/models';
import { useState } from 'react';
import { toast } from 'sonner';
import { Link } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { Button } from '@/shared/components/ui/button';
import ProfileAvatar from '@/shared/components/common/profile-avatar';
import { useFollowings, useAuth } from '@/shared/lib/react-query';
import { followUser } from '@/shared/server-functions/users';

type Props = {
    followers: UserDTO[];
    isLoading?: boolean;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export function FollowersModal({ followers, isLoading, open, onOpenChange }: Props) {
    const { data: auth } = useAuth();
    const { data: currentUserFollowings } = useFollowings(auth?.user ?? null);
    const queryClient = useQueryClient();
    const [followingUsers, setFollowingUsers] = useState<Set<string>>(new Set());

    const handleFollow = async (userId: string) => {
        if (!auth?.user || followingUsers.has(userId)) return;

        setFollowingUsers((prev) => new Set(prev).add(userId));

        try {
            const result = await followUser({ data: { userId } });

            if (!result.success) {
                throw new Error('Failed to follow user');
            }

            await queryClient.invalidateQueries({ queryKey: ['followings'] });
            await queryClient.invalidateQueries({ queryKey: ['follow-request-status', userId] });
            toast.success('User followed successfully');
        } catch {
            setFollowingUsers((prev) => {
                const newSet = new Set(prev);
                newSet.delete(userId);
                return newSet;
            });
            toast.error('Failed to follow user');
        }
    };

    const isFollowing = (userId: string) => {
        return currentUserFollowings?.some((following) => following.id === userId) || followingUsers.has(userId);
    };

    const canFollow = (userId: string) => {
        return auth?.user?.id !== userId && !isFollowing(userId);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="z-dialog max-w-md">
                <DialogHeader>
                    <DialogTitle>Followers</DialogTitle>
                </DialogHeader>
                <ScrollArea className="max-h-[400px]">
                    {isLoading && (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
                        </div>
                    )}

                    {!isLoading && followers.length === 0 && (
                        <div className="py-8 text-center">
                            <p className="text-muted-foreground text-sm">No followers yet</p>
                        </div>
                    )}

                    {!isLoading && followers.length > 0 && (
                        <div className="space-y-2">
                            {followers.map((follower) => (
                                <div key={follower.id} className="flex items-center justify-between gap-3 rounded-lg p-2">
                                    <Link
                                        to="/users/$id"
                                        params={{ id: follower.id }}
                                        className="hover:bg-accent flex min-w-0 flex-1 items-center gap-3 rounded-lg p-2 transition-colors"
                                        onClick={() => onOpenChange(false)}
                                    >
                                        <ProfileAvatar profile={follower} type="user" className="h-10 w-10 shrink-0" />
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium">{follower.name}</p>
                                            <p className="text-muted-foreground truncate text-xs">@{follower.id.slice(0, 8)}</p>
                                        </div>
                                    </Link>
                                    {canFollow(follower.id) && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleFollow(follower.id)}
                                            disabled={followingUsers.has(follower.id)}
                                            className="shrink-0"
                                        >
                                            {followingUsers.has(follower.id) ? 'Following...' : 'Follow'}
                                        </Button>
                                    )}
                                    {auth?.user?.id === follower.id && <span className="text-muted-foreground shrink-0 text-xs">(You)</span>}
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
