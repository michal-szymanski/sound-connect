import { UserDTO, userDTOSchema } from '@/common/types/models';
import { postSchema } from '@/common/types/drizzle';
import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute, notFound, redirect, useRouter } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import z from 'zod';
import { MoreVertical, AlertCircle } from 'lucide-react';
import UserAvatar from '@/shared/components/common/user-avatar';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/shared/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from '@/shared/components/ui/alert-dialog';
import { availabilityStatusConfig } from '@/shared/lib/utils/availability';
import { useFollowers, useFollowings, useFollowRequestStatus, followingsQuery, followersQuery, followRequestStatusQuery } from '@/shared/lib/react-query';
import { getPosts } from '@/features/posts/server-functions/posts';
import { getUser, followUser, unfollowUser } from '@/shared/server-functions/users';
import { useProfile } from '@/features/profile/hooks/use-profile';
import { ProfileSkeleton } from '@/features/profile/components/profile-skeleton';
import { InstrumentsSection } from '@/features/profile/components/instruments-section';
import { GenresSection } from '@/features/profile/components/genres-section';
import { AvailabilitySection } from '@/features/profile/components/availability-section';
import { ExperienceSection } from '@/features/profile/components/experience-section';
import { LogisticsSection } from '@/features/profile/components/logistics-section';
import { LookingForSection } from '@/features/profile/components/looking-for-section';
import { BioSection } from '@/features/profile/components/bio-section';
import { UserBandsSection } from '@/features/bands/components/user-bands-section';
import { useBlockedUsers, useBlockUser, useUnblockUser } from '@/features/settings/hooks/use-settings';

const loaderSchema = z.object({
    currentUser: userDTOSchema,
    user: userDTOSchema,
    posts: z.array(postSchema)
});

export const Route = createFileRoute('/(main)/users/$id')({
    component: RouteComponent,
    loader: async ({ context: { queryClient, user: currentUser }, params }) => {
        if (!currentUser) {
            const path = '/sign-in';

            throw redirect({
                to: path
            });
        }

        const userId = params.id;

        let user: UserDTO;

        const queryDataUser = queryClient.getQueryData<UserDTO>(['user', userId]);

        if (queryDataUser) {
            user = userDTOSchema.parse(queryDataUser);
        } else if (currentUser?.id === userId) {
            user = userDTOSchema.parse(currentUser);
        } else {
            const result = await getUser({ data: { userId } });

            if (!result.success) {
                throw notFound();
            }

            user = result.body;
            queryClient.setQueryData(['user', user.id], user);
        }

        const postsResult = await getPosts({ data: { userId } });
        const posts = postsResult.success ? postsResult.body : [];

        await Promise.all([
            queryClient.ensureQueryData(followingsQuery(currentUser)),
            queryClient.ensureQueryData(followersQuery(user)),
            queryClient.ensureQueryData(followingsQuery(user)),
            queryClient.ensureQueryData(followRequestStatusQuery(user.id))
        ]);

        return loaderSchema.parse({ currentUser, user, posts });
    }
});

function RouteComponent() {
    const { currentUser, user, posts } = loaderSchema.parse(Route.useLoaderData());
    const { data: followings } = useFollowings(user);
    const { data: followers } = useFollowers(user);
    const { data: currentUserFollowings } = useFollowings(currentUser);
    const { data: followRequestStatus } = useFollowRequestStatus(user.id);
    const { data: profile, isLoading: isProfileLoading } = useProfile(user.id);
    const { data: blockedUsers } = useBlockedUsers();
    const { mutate: blockUser, isPending: isBlocking } = useBlockUser();
    const { mutate: unblockUser, isPending: isUnblocking } = useUnblockUser();
    const queryClient = useQueryClient();
    const router = useRouter();
    const [optimisticStatus, setOptimisticStatus] = useState<'pending' | 'following' | null>(null);
    const [blockDialogOpen, setBlockDialogOpen] = useState(false);
    const [unblockDialogOpen, setUnblockDialogOpen] = useState(false);
    const isOwnProfile = currentUser.id === user.id;
    const isBlocked = blockedUsers?.some((u) => u.id === user.id) ?? false;

    useEffect(() => {
        if (followRequestStatus?.status === 'following') {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setOptimisticStatus('following');
        } else if (followRequestStatus?.status === 'pending') {
            setOptimisticStatus(null);
        } else if (followRequestStatus?.status === 'none') {
            setOptimisticStatus(null);
        }
    }, [followRequestStatus?.status]);

    useEffect(() => {
        const isCurrentUserFollowing = currentUserFollowings?.some((following) => following.id === user.id);
        if (isCurrentUserFollowing) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setOptimisticStatus(null);
        }
    }, [currentUserFollowings, user.id]);

    const handleFollow = async () => {
        setOptimisticStatus('pending');

        try {
            const result = await followUser({ data: { userId: user.id } });

            if (!result.success) {
                setOptimisticStatus(null);
                return;
            }

            queryClient.invalidateQueries({ queryKey: ['follow-request-status', user.id] });
            router.invalidate();
        } catch {
            setOptimisticStatus(null);
        }
    };

    const handleUnfollow = async () => {
        setOptimisticStatus(null);

        try {
            const result = await unfollowUser({ data: { userId: user.id } });

            if (!result.success) {
                return;
            }

            router.invalidate();
        } catch (error) {
            console.error('Failed to unfollow user:', error);
        }
    };

    const handleBlockClick = () => {
        setBlockDialogOpen(true);
    };

    const handleUnblockClick = () => {
        setUnblockDialogOpen(true);
    };

    const handleBlockConfirm = () => {
        blockUser(user.id, {
            onSettled: () => {
                setBlockDialogOpen(false);
            }
        });
    };

    const handleUnblockConfirm = () => {
        unblockUser(user.id, {
            onSettled: () => {
                setUnblockDialogOpen(false);
            }
        });
    };

    const renderFollowButton = () => {
        if (currentUser.id === user.id) return null;

        const isCurrentUserFollowing = currentUserFollowings?.some((following) => following.id === user.id) ?? false;

        if (isCurrentUserFollowing || optimisticStatus === 'following') {
            return (
                <Button onClick={handleUnfollow} data-testid="following-button">
                    Following
                </Button>
            );
        }

        if (followRequestStatus?.status === 'pending' || optimisticStatus === 'pending') {
            return (
                <Button disabled variant="outline" data-testid="requested-button">
                    Requested
                </Button>
            );
        }

        return (
            <Button onClick={handleFollow} data-testid="follow-button">
                Follow
            </Button>
        );
    };

    return (
        <div className="w-full space-y-6">
            {isOwnProfile && (
                <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
                    {profile?.profileCompletion === 100
                        ? 'Profile setup complete! You can now be discovered by bands.'
                        : `Profile ${profile?.profileCompletion}% complete. ${3 - Math.floor((profile?.profileCompletion || 0) / 34)} items remaining.`}
                </div>
            )}

            <Card className="border-border/40 overflow-hidden">
                <div className="relative h-48 overflow-hidden sm:h-60">
                    <img
                        src="https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=800&dpr=2&q=80"
                        alt="Photo by Drew Beamer"
                        className="h-full w-full object-cover"
                        loading="lazy"
                    />
                </div>

                <div className="px-4 pb-4 sm:px-6 sm:pb-6">
                    <div className="-mt-12 mb-4 sm:-mt-16">
                        <UserAvatar user={user} className="border-card h-24 w-24 border-4 sm:h-32 sm:w-32" fallbackClassName="text-4xl sm:text-6xl" />
                    </div>

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="truncate text-xl font-bold sm:text-2xl">{user.name}</h1>

                                {profile?.availability?.status && (
                                    <Badge variant="outline" className="gap-1.5 whitespace-nowrap" role="status">
                                        <span
                                            className={`h-2.5 w-2.5 rounded-full ${availabilityStatusConfig[profile.availability.status].dot} ring-background ring-2`}
                                            aria-hidden="true"
                                        />
                                        <span>{availabilityStatusConfig[profile.availability.status].label}</span>
                                    </Badge>
                                )}
                            </div>
                            <p className="text-muted-foreground text-sm">@{user.id.slice(0, 8)}</p>
                        </div>

                        <div className="flex items-center gap-2">
                            {renderFollowButton()}
                            {!isOwnProfile && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" aria-label="More options">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="z-popover">
                                        {isBlocked ? (
                                            <DropdownMenuItem onClick={handleUnblockClick} disabled={isUnblocking}>
                                                {isUnblocking ? 'Unblocking...' : 'Unblock User'}
                                            </DropdownMenuItem>
                                        ) : (
                                            <DropdownMenuItem
                                                onClick={handleBlockClick}
                                                disabled={isBlocking}
                                                className="text-destructive focus:text-destructive"
                                            >
                                                {isBlocking ? 'Blocking...' : 'Block User'}
                                            </DropdownMenuItem>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                        <button className="focus-visible:ring-ring rounded-sm outline-none hover:underline focus-visible:ring-2">
                            <span className="text-foreground font-semibold">{posts.length}</span>
                            <span className="text-muted-foreground ml-1">posts</span>
                        </button>
                        <button className="focus-visible:ring-ring rounded-sm outline-none hover:underline focus-visible:ring-2">
                            <span className="text-foreground font-semibold">{followers.length}</span>
                            <span className="text-muted-foreground ml-1">followers</span>
                        </button>
                        <button className="focus-visible:ring-ring rounded-sm outline-none hover:underline focus-visible:ring-2">
                            <span className="text-foreground font-semibold">{followings ? followings.length : 0}</span>
                            <span className="text-muted-foreground ml-1">following</span>
                        </button>
                    </div>
                </div>
            </Card>

            {isOwnProfile && profile && profile.profileCompletion < 100 && (
                <Card className="bg-accent/50 border-primary/20 p-4">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <h3 className="text-sm font-semibold">Complete Your Profile Setup</h3>
                                <p className="text-muted-foreground mt-1 text-xs">Add required info to unlock musician discovery and be found by bands.</p>
                            </div>
                            <span className="text-primary ml-4 text-2xl font-bold">{profile.profileCompletion}%</span>
                        </div>

                        <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                            <div
                                className="bg-primary h-full transition-all duration-300"
                                style={{ width: `${profile.profileCompletion}%` }}
                                role="progressbar"
                                aria-valuenow={profile.profileCompletion}
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-label="Profile setup progress"
                            />
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {!profile.instruments?.primaryInstrument && (
                                <Badge variant="destructive" className="gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    Primary Instrument
                                </Badge>
                            )}
                            {!profile.genres?.primaryGenre && (
                                <Badge variant="destructive" className="gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    Primary Genre
                                </Badge>
                            )}
                            {!profile.logistics?.city && (
                                <Badge variant="destructive" className="gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    Location
                                </Badge>
                            )}
                        </div>
                    </div>
                </Card>
            )}

            {isProfileLoading ? (
                <ProfileSkeleton />
            ) : profile ? (
                <>
                    <InstrumentsSection data={profile.instruments} canEdit={isOwnProfile} id="instruments-section" />
                    <GenresSection data={profile.genres} canEdit={isOwnProfile} id="genres-section" />
                    <LogisticsSection data={profile.logistics} canEdit={isOwnProfile} id="logistics-section" />
                    <AvailabilitySection data={profile.availability} canEdit={isOwnProfile} />
                    <ExperienceSection data={profile.experience} canEdit={isOwnProfile} />
                    <LookingForSection data={profile.lookingFor} canEdit={isOwnProfile} />
                    <BioSection data={profile.bio} canEdit={isOwnProfile} />
                </>
            ) : null}

            <UserBandsSection userId={user.id} isOwnProfile={isOwnProfile} />

            <AlertDialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
                <AlertDialogContent className="z-dialog">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Block {user.name}?</AlertDialogTitle>
                        <AlertDialogDescription>
                            They won&apos;t be able to see your profile or message you. You can unblock them at any time from your settings.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isBlocking}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleBlockConfirm} disabled={isBlocking} className="bg-destructive hover:bg-destructive/90">
                            {isBlocking ? 'Blocking...' : 'Block'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={unblockDialogOpen} onOpenChange={setUnblockDialogOpen}>
                <AlertDialogContent className="z-dialog">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Unblock {user.name}?</AlertDialogTitle>
                        <AlertDialogDescription>They will be able to see your profile and message you again.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isUnblocking}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleUnblockConfirm} disabled={isUnblocking}>
                            {isUnblocking ? 'Unblocking...' : 'Unblock'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
