import { Link, useRouter } from '@tanstack/react-router';
import { MoreVertical, User, Settings, LogOut } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import ProfileAvatar from '@/shared/components/common/profile-avatar';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { useAuth, useFollowers, useFollowings } from '@/shared/lib/react-query';
import { signOut } from '@/features/auth/server-functions/auth';
import { NotificationsButton } from '@/features/notifications';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/shared/components/ui/dropdown-menu';

export function UserQuickInfoCard() {
    const { data: auth } = useAuth();
    const { data: followers } = useFollowers(auth?.user ?? null);
    const { data: followings } = useFollowings(auth?.user ?? null);
    const router = useRouter();
    const queryClient = useQueryClient();

    if (!auth?.user) return null;

    const handleLogout = async () => {
        try {
            await signOut();
            queryClient.clear();
            router.invalidate();
        } catch {
            toast.error('Failed to sign out. Please try again.');
        }
    };

    return (
        <Card className="border-border/40">
            <CardContent className="relative p-4">
                <div className="absolute top-3 right-3 flex items-center gap-1">
                    <NotificationsButton />
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Account menu">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>Account</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link to="/users/$username" params={{ username: auth.user.username }}>
                                    <User className="mr-2 h-4 w-4" aria-hidden="true" />
                                    View Profile
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link to="/settings">
                                    <Settings className="mr-2 h-4 w-4" aria-hidden="true" />
                                    Settings & Privacy
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive cursor-pointer">
                                <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
                                Log Out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <Link to="/users/$username" params={{ username: auth.user.username }} className="group block">
                    <div className="flex items-center gap-3">
                        <ProfileAvatar profile={auth.user} type="user" className="h-12 w-12" />
                        <div className="min-w-0 flex-1 pr-8">
                            <p className="truncate text-sm font-semibold group-hover:underline">{auth.user.name}</p>
                            <p className="text-muted-foreground truncate text-xs">@{auth.user.username}</p>
                        </div>
                    </div>
                </Link>
                <div className="mt-3 flex items-center gap-4 text-sm">
                    <Link
                        to="/users/$username"
                        params={{ username: auth.user.username }}
                        className="focus-visible:ring-ring rounded-sm outline-none hover:underline focus-visible:ring-2"
                    >
                        <span className="text-foreground font-semibold">{followers.length}</span>
                        <span className="text-muted-foreground ml-1">followers</span>
                    </Link>
                    <Link
                        to="/users/$username"
                        params={{ username: auth.user.username }}
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
