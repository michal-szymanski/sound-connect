import { useState } from 'react';
import { Award } from 'lucide-react';
import { ProfileSection } from './profile-section';
import { useUpdateExperience } from '@/web/hooks/use-profile';
import { Button } from '@/web/components/ui/button';
import { Label } from '@/web/components/ui/label';
import { Textarea } from '@/web/components/ui/textarea';
import { Checkbox } from '@/web/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/web/components/ui/select';
import { CharacterCounter } from './character-counter';
import type { ExperienceSection as ExperienceSectionData, UpdateExperience } from '@sound-connect/common/types/profile';
import { GiggingLevelEnum, type GiggingLevel } from '@sound-connect/common/types/profile-enums';

type Props = {
    data: ExperienceSectionData | null;
    canEdit: boolean;
};

const giggingLabels: Record<GiggingLevel, string> = {
    beginner: 'Beginner',
    local: 'Local',
    regional: 'Regional',
    touring: 'Touring',
    professional: 'Professional'
};

export const ExperienceSection = ({ data, canEdit }: Props) => {
    const updateMutation = useUpdateExperience();
    const [formData, setFormData] = useState<UpdateExperience>({
        giggingLevel: data?.giggingLevel || undefined,
        pastBands: data?.pastBands || undefined,
        hasStudioExperience: data?.hasStudioExperience || undefined
    });

    const isEmpty = !data?.giggingLevel && !data?.pastBands && !data?.hasStudioExperience;

    const handleSubmit = (e: React.FormEvent, closeForm: () => void) => {
        e.preventDefault();
        updateMutation.mutate(formData, {
            onSuccess: () => closeForm()
        });
    };

    const editForm = (closeForm: () => void) => (
        <form onSubmit={(e) => handleSubmit(e, closeForm)} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="giggingLevel">Gigging Level</Label>
                <Select
                    value={formData.giggingLevel || ''}
                    onValueChange={(value) =>
                        setFormData({
                            ...formData,
                            giggingLevel: (value || undefined) as GiggingLevel
                        })
                    }
                >
                    <SelectTrigger id="giggingLevel" className="w-full">
                        <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                        {GiggingLevelEnum.map((level) => (
                            <SelectItem key={level} value={level}>
                                {giggingLabels[level]}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label htmlFor="pastBands">Past Bands</Label>
                    <CharacterCounter current={formData.pastBands?.length || 0} max={500} />
                </div>
                <Textarea
                    id="pastBands"
                    value={formData.pastBands || ''}
                    onChange={(e) => setFormData({ ...formData, pastBands: e.target.value })}
                    maxLength={500}
                    placeholder="e.g., The Wavelengths (2018-2022), Local Heroes (2015-2017)"
                    rows={3}
                />
            </div>

            <div className="flex items-center gap-2">
                <Checkbox
                    id="hasStudioExperience"
                    checked={formData.hasStudioExperience || false}
                    onCheckedChange={(checked) => setFormData({ ...formData, hasStudioExperience: checked as boolean })}
                />
                <Label htmlFor="hasStudioExperience" className="cursor-pointer font-normal">
                    Has studio/recording experience
                </Label>
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
            title="Experience"
            icon={<Award className="h-5 w-5" />}
            canEdit={canEdit}
            isEmpty={isEmpty}
            emptyMessage="Complete your experience to help musicians find you"
            editForm={canEdit ? editForm : undefined}
        >
            {data && (
                <div className="space-y-2">
                    {data.giggingLevel && (
                        <div>
                            <span className="font-medium">Gigging:</span> {giggingLabels[data.giggingLevel]}
                        </div>
                    )}
                    {data.pastBands && (
                        <div>
                            <span className="font-medium">Past Bands:</span> {data.pastBands}
                        </div>
                    )}
                    {data.hasStudioExperience && (
                        <div>
                            <span className="font-medium">Studio:</span> Yes, recording experience
                        </div>
                    )}
                </div>
            )}
        </ProfileSection>
    );
};
