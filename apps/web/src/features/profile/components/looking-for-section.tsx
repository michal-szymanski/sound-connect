import { useState } from 'react';
import { Target } from 'lucide-react';
import { ProfileSection } from './profile-section';
import { useUpdateLookingFor } from '@/features/profile/hooks/use-profile';
import { Button } from '@/shared/components/ui/button';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { CharacterCounter } from './character-counter';
import type { LookingForSection as LookingForSectionData, UpdateLookingFor } from '@sound-connect/common/types/profile';

type Props = {
    data: LookingForSectionData | null;
    canEdit: boolean;
};

export const LookingForSection = ({ data, canEdit }: Props) => {
    const updateMutation = useUpdateLookingFor();
    const [formData, setFormData] = useState<UpdateLookingFor>({
        seeking: data?.seeking || undefined,
        canOffer: data?.canOffer || undefined,
        dealBreakers: data?.dealBreakers || undefined
    });

    const isEmpty = !data?.seeking && !data?.canOffer && !data?.dealBreakers;

    const handleSubmit = (e: React.FormEvent, closeForm: () => void) => {
        e.preventDefault();
        updateMutation.mutate(formData, {
            onSuccess: () => closeForm()
        });
    };

    const editForm = (closeForm: () => void) => (
        <form onSubmit={(e) => handleSubmit(e, closeForm)} className="space-y-4">
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label htmlFor="seeking">What I&apos;m Looking For</Label>
                    <CharacterCounter current={formData.seeking?.length || 0} max={500} />
                </div>
                <Textarea
                    id="seeking"
                    value={formData.seeking || ''}
                    onChange={(e) => setFormData({ ...formData, seeking: e.target.value })}
                    maxLength={500}
                    placeholder="e.g., Original prog/metal band, serious commitment, gigging opportunities"
                    rows={3}
                />
            </div>

            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label htmlFor="canOffer">What I Can Offer</Label>
                    <CharacterCounter current={formData.canOffer?.length || 0} max={500} />
                </div>
                <Textarea
                    id="canOffer"
                    value={formData.canOffer || ''}
                    onChange={(e) => setFormData({ ...formData, canOffer: e.target.value })}
                    maxLength={500}
                    placeholder="e.g., Solid bass skills, professional gear, rehearsal space, reliable transportation"
                    rows={3}
                />
            </div>

            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label htmlFor="dealBreakers">Deal Breakers</Label>
                    <CharacterCounter current={formData.dealBreakers?.length || 0} max={300} />
                </div>
                <Textarea
                    id="dealBreakers"
                    value={formData.dealBreakers || ''}
                    onChange={(e) => setFormData({ ...formData, dealBreakers: e.target.value })}
                    maxLength={300}
                    placeholder="e.g., No cover bands, original music only"
                    rows={2}
                />
            </div>

            <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={closeForm}>
                    Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending} aria-busy={updateMutation.isPending}>
                    {updateMutation.isPending ? (
                        <>
                            <span className="sr-only">Saving changes, please wait</span>
                            <span aria-hidden="true">Saving...</span>
                        </>
                    ) : (
                        'Save Changes'
                    )}
                </Button>
            </div>
        </form>
    );

    return (
        <ProfileSection
            title="Looking For"
            icon={<Target className="h-5 w-5" />}
            canEdit={canEdit}
            isEmpty={isEmpty}
            emptyMessage="Complete this section to help musicians find you"
            editForm={canEdit ? editForm : undefined}
            completionStatus={null}
        >
            {data && (
                <div className="space-y-2">
                    {data.seeking && (
                        <div>
                            <span className="font-medium">Seeking:</span> {data.seeking}
                        </div>
                    )}
                    {data.canOffer && (
                        <div>
                            <span className="font-medium">Can offer:</span> {data.canOffer}
                        </div>
                    )}
                    {data.dealBreakers && (
                        <div>
                            <span className="font-medium">Deal breakers:</span> {data.dealBreakers}
                        </div>
                    )}
                </div>
            )}
        </ProfileSection>
    );
};
