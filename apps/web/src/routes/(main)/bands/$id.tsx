import { createFileRoute, notFound, redirect, Link } from '@tanstack/react-router';
import { useState } from 'react';
import type { CreateBandInput, UpdateBandInput } from '@sound-connect/common/types/bands';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
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
import { BandHeader } from '@/features/bands/components/band-header';
import { BandMemberCard } from '@/features/bands/components/band-member-card';
import { AddMemberModal } from '@/features/bands/components/add-member-modal';
import { BandForm } from '@/features/bands/components/band-form';
import { BandPostComposer } from '@/features/bands/components/band-post-composer';
import { BandPostFeed } from '@/features/bands/components/band-post-feed';
import { ApplyToBandButton } from '@/features/bands/components/apply-to-band-button';
import { BandApplicationsList } from '@/features/bands/components/band-applications-list';
import { useBand, useUpdateBand, useDeleteBand, useAddBandMember, useRemoveBandMember } from '@/features/bands/hooks/use-bands';
import { useBandApplications, useUserApplicationStatus } from '@/features/bands/hooks/use-band-applications';
import { useAuth } from '@/shared/lib/react-query';
import { ProfileSection } from '@/features/profile/components/profile-section';
import { Music2, Users, Search, AlertCircle, UserSearch, FileText } from 'lucide-react';
import { Badge } from '@/shared/components/ui/badge';

/* eslint-disable @typescript-eslint/no-explicit-any */
export const Route = createFileRoute('/(main)/bands/$id' as any)({
    component: RouteComponent,
    beforeLoad: async ({ context }: any) => {
        const { user } = context;
        if (!user) {
            throw redirect({
                to: '/sign-in'
            });
        }
    },
    loader: async ({ params }: any) => {
        const bandId = parseInt(params.id, 10);
        if (isNaN(bandId)) {
            throw notFound();
        }
        return { bandId };
    }
});

function RouteComponent() {
    const { bandId } = Route.useLoaderData();
    const { data: band, isLoading, error } = useBand(bandId);
    const { data: auth } = useAuth();
    const isUserAdmin = band?.isUserAdmin || false;
    const { data: applicationsData } = useBandApplications(bandId, 'pending', isUserAdmin);
    const { data: applicationStatus } = useUserApplicationStatus(bandId);
    const updateBand = useUpdateBand(bandId);
    const deleteBand = useDeleteBand();
    const addMember = useAddBandMember(bandId);
    const removeMember = useRemoveBandMember(bandId);

    const [isEditing, setIsEditing] = useState(false);
    const [showAddMemberModal, setShowAddMemberModal] = useState(false);
    const [memberToRemove, setMemberToRemove] = useState<{ userId: string; name: string } | null>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const pendingApplicationsCount = applicationsData?.total || 0;

    if (isLoading) {
        return (
            <div className="w-full space-y-6">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex gap-4">
                            <Skeleton className="h-24 w-24 rounded-full" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-8 w-48" />
                                <Skeleton className="h-4 w-32" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    if (error || !band) {
        return (
            <div className="w-full">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error?.message || 'Band not found'}</AlertDescription>
                </Alert>
            </div>
        );
    }

    const isUserMember = auth?.user ? band.members.some((m) => m.userId === auth.user?.id) : false;
    const existingMemberIds = band.members.map((m) => m.userId);

    const handleUpdateBand = (data: UpdateBandInput | CreateBandInput) => {
        updateBand.mutate(data as UpdateBandInput, {
            onSuccess: () => setIsEditing(false)
        });
    };

    const handleAddMember = (userId: string) => {
        addMember.mutate(userId, {
            onSuccess: () => setShowAddMemberModal(false)
        });
    };

    const handleRemoveMember = (userId: string, name: string) => {
        setMemberToRemove({ userId, name });
    };

    const confirmRemoveMember = () => {
        if (memberToRemove) {
            removeMember.mutate(memberToRemove.userId, {
                onSuccess: () => setMemberToRemove(null)
            });
        }
    };

    const handleDeleteBand = () => {
        deleteBand.mutate(bandId);
    };

    const buildMusiciansSearchUrl = () => {
        const params = new URLSearchParams();

        if (band.city) {
            params.set('city', band.city);
        }

        if (band.primaryGenre) {
            params.set('genres', band.primaryGenre);
        }

        return `/musicians?${params.toString()}`;
    };

    return (
        <div className="w-full space-y-6">
            <Card>
                <CardContent className="p-6">
                    <BandHeader band={band} isUserAdmin={isUserAdmin} isUserMember={isUserMember} onEdit={() => setIsEditing(true)} />
                </CardContent>
            </Card>

            {isUserMember && (
                <Card className="border-primary/20 bg-primary/5">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="bg-primary flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full">
                                    <UserSearch className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold">Looking for musicians?</h3>
                                    <p className="text-muted-foreground text-xs">Search for musicians in your area with the right skills</p>
                                </div>
                            </div>
                            <Button asChild variant="default" size="sm">
                                <Link to={buildMusiciansSearchUrl()}>Find Musicians</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {isEditing ? (
                <Card>
                    <CardContent className="p-6">
                        <BandForm
                            initialData={{
                                name: band.name,
                                description: band.description ?? undefined,
                                city: band.city ?? undefined,
                                state: band.state ?? undefined,
                                country: band.country ?? undefined,
                                primaryGenre: band.primaryGenre ?? undefined,
                                lookingFor: band.lookingFor ?? undefined
                            }}
                            onSubmit={handleUpdateBand}
                            onCancel={() => setIsEditing(false)}
                            isLoading={updateBand.isPending}
                            isEdit
                        />
                    </CardContent>
                </Card>
            ) : (
                <>
                    <Tabs defaultValue="about" className="w-full">
                        <TabsList className={`grid w-full ${isUserAdmin ? 'grid-cols-4' : 'grid-cols-3'}`}>
                            <TabsTrigger value="about">About</TabsTrigger>
                            <TabsTrigger value="posts">Posts</TabsTrigger>
                            <TabsTrigger value="members">Members</TabsTrigger>
                            {isUserAdmin && (
                                <TabsTrigger value="applications">
                                    <div className="flex items-center gap-2">
                                        Applications
                                        {pendingApplicationsCount > 0 && (
                                            <Badge variant="default" className="ml-1 rounded-full px-2 py-0.5 text-xs">
                                                {pendingApplicationsCount}
                                            </Badge>
                                        )}
                                    </div>
                                </TabsTrigger>
                            )}
                        </TabsList>

                        <TabsContent value="about" className="mt-6 space-y-6">
                            {band.description && (
                                <ProfileSection title="About" icon={<Music2 className="h-5 w-5" />} canEdit={false} isEmpty={false}>
                                    <p className="text-foreground whitespace-pre-wrap">{band.description}</p>
                                </ProfileSection>
                            )}

                            {band.lookingFor && (
                                <Card className="border-primary/20 bg-primary/5">
                                    <CardContent className="p-6">
                                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                            <div className="flex items-start gap-3">
                                                <div className="bg-primary flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full">
                                                    <Search className="h-5 w-5 text-white" />
                                                </div>
                                                <div className="flex-1">
                                                    <h2 className="mb-2 text-lg font-semibold">Looking For</h2>
                                                    <p className="text-foreground whitespace-pre-wrap">{band.lookingFor}</p>
                                                </div>
                                            </div>
                                            {!isUserAdmin && (
                                                <div className="sm:flex-shrink-0">
                                                    <ApplyToBandButton
                                                        bandId={band.id}
                                                        bandName={band.name}
                                                        lookingFor={band.lookingFor}
                                                        isUserMember={isUserMember}
                                                        hasApplied={applicationStatus?.hasApplied || false}
                                                        isRejected={applicationStatus?.isRejected || false}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {isUserAdmin && (
                                <Card className="border-destructive/50">
                                    <CardContent className="p-6">
                                        <h2 className="mb-2 text-lg font-semibold">Danger Zone</h2>
                                        <p className="text-muted-foreground mb-4 text-sm">Once you delete a band, there is no going back. Please be certain.</p>
                                        <Button variant="destructive" onClick={() => setShowDeleteDialog(true)} aria-label="Delete band">
                                            Delete Band
                                        </Button>
                                    </CardContent>
                                </Card>
                            )}
                        </TabsContent>

                        <TabsContent value="posts" className="mt-6 space-y-6">
                            {isUserAdmin && <BandPostComposer bandId={band.id} bandName={band.name} />}
                            <BandPostFeed bandId={band.id} />
                        </TabsContent>

                        <TabsContent value="members" className="mt-6 space-y-6">
                            <Card>
                                <CardContent className="p-6">
                                    <div className="mb-4 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Users className="h-5 w-5" />
                                            <h2 className="text-lg font-semibold">Members ({band.members.length})</h2>
                                        </div>
                                        {isUserAdmin && (
                                            <Button onClick={() => setShowAddMemberModal(true)} size="sm" aria-label="Add member">
                                                Add Member
                                            </Button>
                                        )}
                                    </div>

                                    {band.members.length > 0 ? (
                                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                            {band.members.map((member) => (
                                                <BandMemberCard
                                                    key={member.userId}
                                                    member={member}
                                                    canRemove={isUserAdmin && (!member.isAdmin || band.members.filter((m) => m.isAdmin).length > 1)}
                                                    onRemove={(userId) => handleRemoveMember(userId, member.name)}
                                                    isRemoving={removeMember.isPending}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-muted-foreground text-center text-sm">No members yet. Add members to get started.</p>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {isUserAdmin && (
                            <TabsContent value="applications" className="mt-6 space-y-6">
                                <div className="mb-4">
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-5 w-5" />
                                        <h2 className="text-lg font-semibold">Pending Applications</h2>
                                        {pendingApplicationsCount > 0 && <Badge variant="secondary">{pendingApplicationsCount}</Badge>}
                                    </div>
                                    <p className="text-muted-foreground mt-1 text-sm">
                                        Review and manage applications from musicians interested in joining your band.
                                    </p>
                                </div>
                                <BandApplicationsList bandId={band.id} />
                            </TabsContent>
                        )}
                    </Tabs>
                </>
            )}

            <AddMemberModal
                open={showAddMemberModal}
                onOpenChange={setShowAddMemberModal}
                onAddMember={handleAddMember}
                existingMemberIds={existingMemberIds}
                isAdding={addMember.isPending}
            />

            <AlertDialog open={!!memberToRemove} onOpenChange={(open) => !open && setMemberToRemove(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove Member</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to remove {memberToRemove?.name} from {band.name}? They will no longer have access to the band.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmRemoveMember} className="bg-destructive hover:bg-destructive/90">
                            Remove
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Band</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete {band.name}? This action cannot be undone. All members will be removed and the band profile will be
                            permanently deleted.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteBand} className="bg-destructive hover:bg-destructive/90">
                            Delete Band
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
