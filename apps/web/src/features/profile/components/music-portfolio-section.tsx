import { useState } from 'react';
import { Music, Trash2 } from 'lucide-react';
import { ProfileSection } from './profile-section';
import { MusicSamplePlayer } from './music-sample-player';
import { UploadMusicSampleModal } from './upload-music-sample-modal';
import { useMusicSamples, useDeleteMusicSample } from '@/features/profile/hooks/use-music-samples';
import { Button } from '@/shared/components/ui/button';
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
import { appConfig } from '@sound-connect/common/app-config';

type Props = {
    userId: string;
    canEdit: boolean;
};

export const MusicPortfolioSection = ({ userId, canEdit }: Props) => {
    const { data: samples = [], isLoading } = useMusicSamples(userId);
    const deleteMutation = useDeleteMusicSample();
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [sampleToDelete, setSampleToDelete] = useState<number | null>(null);

    const isEmpty = samples.length === 0;
    const canAddMore = samples.length < appConfig.maxMusicSampleCount;

    const handleDeleteClick = (id: number) => {
        setSampleToDelete(id);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (sampleToDelete !== null) {
            deleteMutation.mutate(sampleToDelete, {
                onSettled: () => {
                    setDeleteDialogOpen(false);
                    setSampleToDelete(null);
                }
            });
        }
    };

    if (isLoading) {
        return null;
    }

    const editForm = (closeForm: () => void) => (
        <div className="space-y-6">
            {canAddMore && (
                <Button onClick={() => setUploadModalOpen(true)} variant="outline" className="w-full sm:w-auto">
                    Add Sample ({samples.length}/{appConfig.maxMusicSampleCount})
                </Button>
            )}

            {samples.map((sample) => (
                <div key={sample.id} className="border-border/40 rounded-lg border p-3">
                    <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-medium">{sample.title}</span>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(sample.id)}
                            className="text-destructive hover:text-destructive h-8 w-8"
                            aria-label={`Delete ${sample.title}`}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                    <MusicSamplePlayer sample={sample} compact hideTitle />
                </div>
            ))}

            {isEmpty && (
                <Button onClick={() => setUploadModalOpen(true)} className="w-full sm:w-auto">
                    Add Your First Sample
                </Button>
            )}

            <div className="flex justify-end">
                <Button variant="outline" onClick={closeForm}>
                    Done
                </Button>
            </div>
        </div>
    );

    return (
        <>
            <ProfileSection
                title="Music Portfolio"
                icon={<Music className="h-5 w-5" />}
                canEdit={canEdit}
                isEmpty={isEmpty}
                emptyMessage={canEdit ? 'Showcase your music by adding audio or video samples' : undefined}
                editForm={canEdit ? editForm : undefined}
            >
                {!isEmpty && (
                    <div className="space-y-6">
                        {samples.map((sample) => (
                            <div key={sample.id}>
                                <MusicSamplePlayer sample={sample} />
                            </div>
                        ))}
                    </div>
                )}
            </ProfileSection>

            {canEdit && <UploadMusicSampleModal open={uploadModalOpen} onOpenChange={setUploadModalOpen} />}

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent className="z-dialog">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Music Sample</AlertDialogTitle>
                        <AlertDialogDescription>Are you sure you want to delete this music sample? This action cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteConfirm} disabled={deleteMutation.isPending} className="bg-destructive hover:bg-destructive/90">
                            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};
