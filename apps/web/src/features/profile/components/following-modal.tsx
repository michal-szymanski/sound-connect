import { UserDTO } from '@/common/types/models';
import { Link } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { Button } from '@/shared/components/ui/button';
import ProfileAvatar from '@/shared/components/common/profile-avatar';
import { useAuth } from '@/shared/lib/react-query';
import { unfollowUser } from '@/shared/server-functions/users';

type Props = {
    user: UserDTO;
    following: UserDTO[];
    isLoading?: boolean;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export function FollowingModal({ user, following, isLoading, open, onOpenChange }: Props) {
    const { data: auth } = useAuth();
    const queryClient = useQueryClient();
    const isOwnProfile = auth?.user?.id === user.id;

    const handleUnfollow = async (userId: string) => {
        try {
            const result = await unfollowUser({ data: { userId } });

            if (!result.success) {
                throw new Error('Failed to unfollow user');
            }

            await queryClient.invalidateQueries({ queryKey: ['followings'] });
            await queryClient.invalidateQueries({ queryKey: ['followers'] });
            await queryClient.invalidateQueries({ queryKey: ['follow-request-status', userId] });
            toast.success('User unfollowed successfully');
        } catch {
            toast.error('Failed to unfollow user');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="z-dialog max-w-md">
                <DialogHeader>
                    <DialogTitle>Following</DialogTitle>
                </DialogHeader>
                <ScrollArea className="max-h-[400px]">
                    {isLoading && (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
                        </div>
                    )}

                    {!isLoading && following.length === 0 && (
                        <div className="py-8 text-center">
                            <p className="text-muted-foreground text-sm">Not following anyone yet</p>
                        </div>
                    )}

                    {!isLoading && following.length > 0 && (
                        <div className="space-y-2">
                            {following.map((followedUser) => (
                                <div key={followedUser.id} className="flex items-center justify-between gap-3 rounded-lg p-2">
                                    <Link
                                        to="/users/$id"
                                        params={{ id: followedUser.id }}
                                        className="hover:bg-accent flex min-w-0 flex-1 items-center gap-3 rounded-lg p-2 transition-colors"
                                        onClick={() => onOpenChange(false)}
                                    >
                                        <ProfileAvatar profile={followedUser} type="user" className="h-10 w-10 shrink-0" />
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium">{followedUser.name}</p>
                                            <p className="text-muted-foreground truncate text-xs">@{followedUser.id.slice(0, 8)}</p>
                                        </div>
                                    </Link>
                                    {isOwnProfile && (
                                        <Button variant="outline" size="sm" onClick={() => handleUnfollow(followedUser.id)} className="shrink-0">
                                            Following
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
