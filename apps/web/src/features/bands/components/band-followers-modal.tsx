import { useBandFollowers } from '@/features/bands/hooks/use-bands';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Loader2 } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { ScrollArea } from '@/shared/components/ui/scroll-area';

type Props = {
    bandId: number;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export function BandFollowersModal({ bandId, open, onOpenChange }: Props) {
    const { data, isLoading, isError } = useBandFollowers(bandId);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Followers</DialogTitle>
                </DialogHeader>
                <ScrollArea className="max-h-[400px]">
                    {isLoading && (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
                        </div>
                    )}

                    {isError && (
                        <div className="py-8 text-center">
                            <p className="text-muted-foreground text-sm">Failed to load followers</p>
                        </div>
                    )}

                    {data && data.followers.length === 0 && (
                        <div className="py-8 text-center">
                            <p className="text-muted-foreground text-sm">No followers yet</p>
                        </div>
                    )}

                    {data && data.followers.length > 0 && (
                        <div className="space-y-3">
                            {data.followers.map((follower) => (
                                <Link
                                    key={follower.userId}
                                    to="/users/$id"
                                    params={{ id: follower.userId }}
                                    className="hover:bg-accent flex items-center gap-3 rounded-lg p-2 transition-colors"
                                    onClick={() => onOpenChange(false)}
                                >
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={follower.profileImageUrl || undefined} alt={follower.name} />
                                        <AvatarFallback>{follower.name.charAt(0).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium">{follower.name}</p>
                                        {follower.primaryInstrument && <p className="text-muted-foreground truncate text-xs">{follower.primaryInstrument}</p>}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
