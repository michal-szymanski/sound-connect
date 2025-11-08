import { Link } from '@tanstack/react-router';
import UserAvatar from '@/web/components/small/user-avatar';
import { Card, CardContent } from '@/web/components/ui/card';
import { useAuth, useFollowers, useFollowings } from '@/web/lib/react-query';

export function UserQuickInfoCard() {
    const { data: auth } = useAuth();
    const { data: followers } = useFollowers(auth?.user ?? null);
    const { data: followings } = useFollowings(auth?.user ?? null);

    if (!auth?.user) return null;

    const username = auth.user.name.toLowerCase().replace(/\s+/g, '');

    return (
        <Card className="border-border/40">
            <CardContent className="p-4">
                <Link to="/users/$id" params={{ id: auth.user.id }} className="group block">
                    <div className="flex items-center gap-3">
                        <UserAvatar user={auth.user} className="h-12 w-12" />
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold group-hover:underline">{auth.user.name}</p>
                            <p className="text-muted-foreground truncate text-xs">@{username}</p>
                        </div>
                    </div>
                </Link>
                <div className="mt-3 flex items-center gap-4 text-sm">
                    <Link
                        to="/users/$id"
                        params={{ id: auth.user.id }}
                        className="focus-visible:ring-ring rounded-sm outline-none hover:underline focus-visible:ring-2"
                    >
                        <span className="text-foreground font-semibold">{followers.length}</span>
                        <span className="text-muted-foreground ml-1">followers</span>
                    </Link>
                    <Link
                        to="/users/$id"
                        params={{ id: auth.user.id }}
                        className="focus-visible:ring-ring rounded-sm outline-none hover:underline focus-visible:ring-2"
                    >
                        <span className="text-foreground font-semibold">{followings.length}</span>
                        <span className="text-muted-foreground ml-1">following</span>
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}
