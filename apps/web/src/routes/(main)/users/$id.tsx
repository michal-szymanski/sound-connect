import { UserDTO, userDTOSchema } from '@/common/types/models';
import { postSchema } from '@/common/types/drizzle';
import { fullProfileSchema } from '@sound-connect/common/types/profile';
import { createFileRoute, notFound, redirect } from '@tanstack/react-router';
import { useState } from 'react';
import z from 'zod';
import { MoreVertical, AlertCircle, ChevronDown } from 'lucide-react';
import ProfileAvatar from '@/shared/components/common/profile-avatar';
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
import { getUser } from '@/shared/server-functions/users';
import { useFollowUser, useUnfollowUser } from '@/shared/hooks/use-follow';
import { getProfile } from '@/features/profile/server-functions/profile';
import { useProfile } from '@/features/profile/hooks/use-profile';
import { InstrumentsSection } from '@/features/profile/components/instruments-section';
import { GenresSection } from '@/features/profile/components/genres-section';
import { AvailabilitySection } from '@/features/profile/components/availability-section';
import { ExperienceSection } from '@/features/profile/components/experience-section';
import { LogisticsSection } from '@/features/profile/components/logistics-section';
import { LookingForSection } from '@/features/profile/components/looking-for-section';
import { BioSection } from '@/features/profile/components/bio-section';
import { UserBandsSection } from '@/features/bands/components/user-bands-section';
import { useBlockedUsers, useBlockUser, useUnblockUser } from '@/features/settings/hooks/use-settings';
import { MessageButton } from '@/features/chat/components/message-button';
import { FollowersModal } from '@/features/profile/components/followers-modal';
import { FollowingModal } from '@/features/profile/components/following-modal';
import { MusicPortfolioSection } from '@/features/profile/components/music-portfolio-section';

const loaderSchema = z.object({
    currentUser: userDTOSchema,
    user: userDTOSchema,
    posts: z.array(postSchema),
    profile: fullProfileSchema.nullable()
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

        const profileResult = await getProfile({ data: { userId } });
        const profile = profileResult.success ? profileResult.body : null;

        await Promise.all([
            queryClient.ensureQueryData(followingsQuery(currentUser)),
            queryClient.ensureQueryData(followersQuery(user)),
            queryClient.ensureQueryData(followingsQuery(user)),
            queryClient.ensureQueryData(followRequestStatusQuery(user.id))
        ]);

        return loaderSchema.parse({ currentUser, user, posts, profile });
    }
});

function RouteComponent() {
    const loaderData = loaderSchema.parse(Route.useLoaderData());
    const { currentUser, user, posts } = loaderData;

    const { data: profile } = useProfile(user.id);
    const { data: followings } = useFollowings(user);
    const { data: followers } = useFollowers(user);
    const { data: currentUserFollowings } = useFollowings(currentUser);
    const { data: followRequestStatus } = useFollowRequestStatus(user.id);
    const { data: blockedUsers } = useBlockedUsers();
    const { mutate: blockUser, isPending: isBlocking } = useBlockUser();
    const { mutate: unblockUser, isPending: isUnblocking } = useUnblockUser();
    const followUserMutation = useFollowUser(user.id);
    const unfollowUserMutation = useUnfollowUser(user.id);
    const [blockDialogOpen, setBlockDialogOpen] = useState(false);
    const [unblockDialogOpen, setUnblockDialogOpen] = useState(false);
    const [followersModalOpen, setFollowersModalOpen] = useState(false);
    const [followingModalOpen, setFollowingModalOpen] = useState(false);
    const isOwnProfile = currentUser.id === user.id;
    const isBlocked = blockedUsers?.some((u) => u.id === user.id) ?? false;

    const handleFollow = () => {
        followUserMutation.mutate();
    };

    const handleUnfollow = () => {
        unfollowUserMutation.mutate();
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

        if (isCurrentUserFollowing) {
            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button data-testid="following-button" className="gap-1">
                            Following
                            <ChevronDown className="h-4 w-4" aria-hidden="true" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="z-popover">
                        <DropdownMenuItem onClick={handleUnfollow} disabled={unfollowUserMutation.isPending}>
                            {unfollowUserMutation.isPending ? 'Unfollowing...' : 'Unfollow'}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        }

        if (followRequestStatus?.status === 'pending') {
            return (
                <Button disabled variant="outline" data-testid="requested-button">
                    Requested
                </Button>
            );
        }

        return (
            <Button onClick={handleFollow} disabled={followUserMutation.isPending} data-testid="follow-button">
                {followUserMutation.isPending ? 'Following...' : 'Follow'}
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
                        <ProfileAvatar
                            profile={user}
                            type="user"
                            className="border-card h-24 w-24 border-4 sm:h-32 sm:w-32"
                            fallbackClassName="bg-primary text-primary-foreground text-4xl sm:text-6xl"
                        />
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
                            {!isOwnProfile && <MessageButton user={user} />}
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
                        <button
                            onClick={() => setFollowersModalOpen(true)}
                            className="focus-visible:ring-ring cursor-pointer rounded-sm outline-none hover:underline focus-visible:ring-2"
                        >
                            <span className="text-foreground font-semibold">{followers.length}</span>
                            <span className="text-muted-foreground ml-1">followers</span>
                        </button>
                        <button
                            onClick={() => setFollowingModalOpen(true)}
                            className="focus-visible:ring-ring cursor-pointer rounded-sm outline-none hover:underline focus-visible:ring-2"
                        >
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

            {profile && (
                <>
                    <InstrumentsSection data={profile.instruments} canEdit={isOwnProfile} id="instruments-section" />
                    <GenresSection data={profile.genres} canEdit={isOwnProfile} id="genres-section" />
                    <LogisticsSection data={profile.logistics} canEdit={isOwnProfile} id="logistics-section" />
                    <AvailabilitySection data={profile.availability} canEdit={isOwnProfile} />
                    <ExperienceSection data={profile.experience} canEdit={isOwnProfile} />
                    <LookingForSection data={profile.lookingFor} canEdit={isOwnProfile} />
                    <BioSection data={profile.bio} canEdit={isOwnProfile} />
                </>
            )}

            <UserBandsSection userId={user.id} isOwnProfile={isOwnProfile} />

            <MusicPortfolioSection userId={user.id} canEdit={isOwnProfile} />

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

            <FollowersModal followers={followers} open={followersModalOpen} onOpenChange={setFollowersModalOpen} />

            <FollowingModal user={user} following={followings || []} open={followingModalOpen} onOpenChange={setFollowingModalOpen} />
        </div>
    );
}
