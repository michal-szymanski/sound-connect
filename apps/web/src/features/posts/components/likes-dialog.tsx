import { UserDTO } from '@/common/types/models';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import { toast } from 'sonner';
import UserAvatar from '@/shared/components/common/user-avatar';
import { getPostLikesUsers } from '@/features/posts/server-functions/posts';
import { followUser } from '@/shared/server-functions/users';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { useFollowings, useAuth } from '@/shared/lib/react-query';

type Props = {
    isOpen: boolean;
    onClose: () => void;
    postId: number;
};

const LikesDialog = ({ isOpen, onClose, postId }: Props) => {
    const { data: auth } = useAuth();
    const { data: followings } = useFollowings(auth?.user ?? null);
    const queryClient = useQueryClient();
    const [followingUsers, setFollowingUsers] = useState<Set<string>>(new Set());

    const { data: likesUsers, isLoading } = useQuery({
        queryKey: ['postLikesUsers', postId],
        queryFn: async () => {
            const result = await getPostLikesUsers({ data: { postId } });
            return result.success ? result.body : [];
        },
        enabled: isOpen
    });

    const handleFollow = async (userId: string) => {
        if (!auth?.user || followingUsers.has(userId)) return;

        setFollowingUsers((prev) => new Set(prev).add(userId));

        try {
            await followUser({ data: { userId } });
            await queryClient.invalidateQueries({ queryKey: ['followings'] });
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
        return followings?.some((following) => following.id === userId) || followingUsers.has(userId);
    };

    const canFollow = (userId: string) => {
        return auth?.user?.id !== userId && !isFollowing(userId);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="z-[100]! max-w-md">
                <DialogHeader>
                    <DialogTitle>Likes</DialogTitle>
                </DialogHeader>
                <div className="max-h-96 overflow-y-auto">
                    {isLoading ? (
                        <p className="text-muted-foreground py-4 text-center">Loading...</p>
                    ) : !likesUsers || likesUsers.length === 0 ? (
                        <p className="text-muted-foreground py-4 text-center">No likes yet</p>
                    ) : (
                        <div className="space-y-3">
                            {likesUsers.map((user: UserDTO) => (
                                <div key={user.id} className="flex items-center justify-between">
                                    <Link
                                        to="/users/$id"
                                        params={{ id: user.id }}
                                        className="hover:bg-muted/50 flex flex-1 items-center space-x-3 rounded-lg p-2 transition-colors"
                                        onClick={onClose}
                                    >
                                        <UserAvatar user={user} />
                                        <span className="font-medium">{user.name}</span>
                                    </Link>
                                    {canFollow(user.id) && (
                                        <Button variant="outline" size="sm" onClick={() => handleFollow(user.id)} disabled={followingUsers.has(user.id)}>
                                            {followingUsers.has(user.id) ? 'Following...' : 'Follow'}
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default LikesDialog;
