import { createFileRoute, notFound, redirect } from '@tanstack/react-router';
import { useState } from 'react';
import type { CreateBandInput, UpdateBandInput } from '@sound-connect/common/types/bands';
import { Card, CardContent } from '@/web/components/ui/card';
import { Button } from '@/web/components/ui/button';
import { Skeleton } from '@/web/components/ui/skeleton';
import { Alert, AlertDescription } from '@/web/components/ui/alert';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from '@/web/components/ui/alert-dialog';
import { BandHeader } from '@/web/components/band/band-header';
import { BandMemberCard } from '@/web/components/band/band-member-card';
import { AddMemberModal } from '@/web/components/band/add-member-modal';
import { BandForm } from '@/web/components/band/band-form';
import { useBand, useUpdateBand, useDeleteBand, useAddBandMember, useRemoveBandMember } from '@/web/hooks/use-bands';
import { ProfileSection } from '@/web/components/profile/profile-section';
import { Music2, Users, Search, AlertCircle } from 'lucide-react';

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
    const updateBand = useUpdateBand(bandId);
    const deleteBand = useDeleteBand();
    const addMember = useAddBandMember(bandId);
    const removeMember = useRemoveBandMember(bandId);

    const [isEditing, setIsEditing] = useState(false);
    const [showAddMemberModal, setShowAddMemberModal] = useState(false);
    const [memberToRemove, setMemberToRemove] = useState<{ userId: string; name: string } | null>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

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

    const isUserAdmin = band.isUserAdmin || false;
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

    return (
        <div className="w-full space-y-6">
            <Card>
                <CardContent className="p-6">
                    <BandHeader band={band} isUserAdmin={isUserAdmin} onEdit={() => setIsEditing(true)} />
                </CardContent>
            </Card>

            {isEditing ? (
                <Card>
                    <CardContent className="p-6">
                        <BandForm initialData={band} onSubmit={handleUpdateBand} onCancel={() => setIsEditing(false)} isLoading={updateBand.isPending} isEdit />
                    </CardContent>
                </Card>
            ) : (
                <>
                    {band.description && (
                        <ProfileSection title="About" icon={<Music2 className="h-5 w-5" />} canEdit={false} isEmpty={false}>
                            <p className="text-foreground whitespace-pre-wrap">{band.description}</p>
                        </ProfileSection>
                    )}

                    {band.lookingFor && (
                        <Card className="border-primary/20 bg-primary/5">
                            <CardContent className="p-6">
                                <div className="flex items-start gap-3">
                                    <div className="bg-primary flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full">
                                        <Search className="h-5 w-5 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h2 className="mb-2 text-lg font-semibold">Looking For</h2>
                                        <p className="text-foreground whitespace-pre-wrap">{band.lookingFor}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

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
                                            canRemove={isUserAdmin && band.members.filter((m) => m.isAdmin).length > 1}
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
