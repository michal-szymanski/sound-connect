import { useState } from 'react';
import { User } from 'lucide-react';
import { ProfileSection } from './profile-section';
import { useUpdateBio } from '@/web/hooks/use-profile';
import { Button } from '@/web/components/ui/button';
import { Label } from '@/web/components/ui/label';
import { Input } from '@/web/components/ui/input';
import { Textarea } from '@/web/components/ui/textarea';
import { CharacterCounter } from './character-counter';
import type { BioSection as BioSectionData, UpdateBio } from '@sound-connect/common/types/profile';

type Props = {
    data: BioSectionData | null;
    canEdit: boolean;
};

export const BioSection = ({ data, canEdit }: Props) => {
    const updateMutation = useUpdateBio();
    const [formData, setFormData] = useState<UpdateBio>({
        bio: data?.bio || undefined,
        musicalGoals: data?.musicalGoals || undefined,
        ageRange: data?.ageRange || undefined
    });

    const isEmpty = !data?.bio && !data?.musicalGoals && !data?.ageRange;

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
                    <Label htmlFor="bio">About Me</Label>
                    <CharacterCounter current={formData.bio?.length || 0} max={500} />
                </div>
                <Textarea
                    id="bio"
                    value={formData.bio || ''}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    maxLength={500}
                    placeholder="Tell us about your musical journey..."
                    rows={4}
                />
            </div>

            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label htmlFor="musicalGoals">Musical Goals</Label>
                    <CharacterCounter current={formData.musicalGoals?.length || 0} max={300} />
                </div>
                <Textarea
                    id="musicalGoals"
                    value={formData.musicalGoals || ''}
                    onChange={(e) => setFormData({ ...formData, musicalGoals: e.target.value })}
                    maxLength={300}
                    placeholder="e.g., Record an album, tour nationally"
                    rows={2}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="ageRange">Age Range</Label>
                <Input
                    id="ageRange"
                    value={formData.ageRange || ''}
                    onChange={(e) => setFormData({ ...formData, ageRange: e.target.value })}
                    maxLength={20}
                    placeholder="e.g., 30-35"
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
            title="About"
            icon={<User className="h-5 w-5" />}
            canEdit={canEdit}
            isEmpty={isEmpty}
            emptyMessage="Complete your bio to help musicians find you"
            editForm={canEdit ? editForm : undefined}
        >
            {data && (
                <div className="space-y-2">
                    {data.bio && <div>{data.bio}</div>}
                    {data.musicalGoals && (
                        <div>
                            <span className="font-medium">Goals:</span> {data.musicalGoals}
                        </div>
                    )}
                    {data.ageRange && (
                        <div>
                            <span className="font-medium">Age:</span> {data.ageRange}
                        </div>
                    )}
                </div>
            )}
        </ProfileSection>
    );
};
