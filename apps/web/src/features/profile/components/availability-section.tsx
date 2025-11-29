import { useState } from 'react';
import { Calendar } from 'lucide-react';
import { ProfileSection } from './profile-section';
import { useUpdateAvailability } from '@/features/profile/hooks/use-profile';
import { Button } from '@/shared/components/ui/button';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { CharacterCounter } from './character-counter';
import { availabilityStatusConfig } from '@/shared/lib/utils/availability';
import type { AvailabilitySection as AvailabilitySectionData, UpdateAvailability } from '@sound-connect/common/types/profile';
import {
    AvailabilityStatusEnum,
    CommitmentLevelEnum,
    RehearsalFrequencyEnum,
    type AvailabilityStatus,
    type CommitmentLevel,
    type RehearsalFrequency
} from '@sound-connect/common/types/profile-enums';

type Props = {
    data: AvailabilitySectionData | null;
    canEdit: boolean;
};

const commitmentLabels: Record<CommitmentLevel, string> = {
    hobbyist: 'Hobbyist',
    serious_amateur: 'Serious Amateur',
    professional: 'Professional'
};

const rehearsalLabels: Record<RehearsalFrequency, string> = {
    '1x_per_week': '1x per week',
    '2-3x_per_week': '2-3x per week',
    '4+_per_week': '4+ per week',
    flexible: 'Flexible'
};

export const AvailabilitySection = ({ data, canEdit }: Props) => {
    const updateMutation = useUpdateAvailability();
    const [formData, setFormData] = useState<UpdateAvailability>({
        status: data?.status || 'just_browsing',
        commitmentLevel: data?.commitmentLevel || undefined,
        weeklyAvailability: data?.weeklyAvailability || undefined,
        rehearsalFrequency: data?.rehearsalFrequency || undefined
    });

    const isEmpty = !data?.status;

    const getCompletionStatus = (): 'complete' | 'incomplete' => {
        if (!data?.status) return 'incomplete';
        if (data.commitmentLevel || data.weeklyAvailability || data.rehearsalFrequency) return 'complete';
        return 'incomplete';
    };

    const handleSubmit = (e: React.FormEvent, closeForm: () => void) => {
        e.preventDefault();
        updateMutation.mutate(formData, {
            onSuccess: () => closeForm()
        });
    };

    const editForm = (closeForm: () => void) => (
        <form onSubmit={(e) => handleSubmit(e, closeForm)} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as AvailabilityStatus })} required>
                    <SelectTrigger id="status" className="w-full" aria-required="true">
                        <SelectValue>
                            {formData.status && (
                                <div className="flex items-center gap-2">
                                    <span
                                        className={`h-2.5 w-2.5 rounded-full ${availabilityStatusConfig[formData.status].dot} ring-background ring-2`}
                                        aria-hidden="true"
                                    />
                                    <span>{availabilityStatusConfig[formData.status].label}</span>
                                </div>
                            )}
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        {AvailabilityStatusEnum.map((status) => {
                            const config = availabilityStatusConfig[status];
                            return (
                                <SelectItem key={status} value={status}>
                                    <div className="flex items-center gap-2">
                                        <span className={`h-2.5 w-2.5 rounded-full ${config.dot} ring-background ring-2`} aria-hidden="true" />
                                        <span>{config.label}</span>
                                    </div>
                                </SelectItem>
                            );
                        })}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="commitmentLevel">Commitment Level</Label>
                <Select
                    value={formData.commitmentLevel || ''}
                    onValueChange={(value) =>
                        setFormData({
                            ...formData,
                            commitmentLevel: (value || undefined) as CommitmentLevel
                        })
                    }
                >
                    <SelectTrigger id="commitmentLevel" className="w-full">
                        <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                        {CommitmentLevelEnum.map((level) => (
                            <SelectItem key={level} value={level}>
                                {commitmentLabels[level]}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label htmlFor="weeklyAvailability">Weekly Availability</Label>
                    <CharacterCounter current={formData.weeklyAvailability?.length || 0} max={200} />
                </div>
                <Textarea
                    id="weeklyAvailability"
                    value={formData.weeklyAvailability || ''}
                    onChange={(e) => setFormData({ ...formData, weeklyAvailability: e.target.value })}
                    maxLength={200}
                    placeholder="e.g., Tuesday/Thursday evenings, weekends"
                    rows={2}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="rehearsalFrequency">Rehearsal Frequency</Label>
                <Select
                    value={formData.rehearsalFrequency || ''}
                    onValueChange={(value) =>
                        setFormData({
                            ...formData,
                            rehearsalFrequency: (value || undefined) as RehearsalFrequency
                        })
                    }
                >
                    <SelectTrigger id="rehearsalFrequency" className="w-full">
                        <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                        {RehearsalFrequencyEnum.map((freq) => (
                            <SelectItem key={freq} value={freq}>
                                {rehearsalLabels[freq]}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
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
            title="Availability"
            icon={<Calendar className="h-5 w-5" />}
            canEdit={canEdit}
            isEmpty={isEmpty}
            emptyMessage="Complete your availability to help musicians find you"
            editForm={canEdit ? editForm : undefined}
            completionStatus={getCompletionStatus()}
        >
            {data && (
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="font-medium">Status:</span>
                        {data.status && (
                            <>
                                <span
                                    className={`h-2.5 w-2.5 rounded-full ${availabilityStatusConfig[data.status].dot} ring-background ring-2`}
                                    aria-hidden="true"
                                />
                                <span>{availabilityStatusConfig[data.status].label}</span>
                            </>
                        )}
                    </div>
                    {data.commitmentLevel && (
                        <div>
                            <span className="font-medium">Commitment:</span> {commitmentLabels[data.commitmentLevel]}
                        </div>
                    )}
                    {data.weeklyAvailability && (
                        <div>
                            <span className="font-medium">Available:</span> {data.weeklyAvailability}
                        </div>
                    )}
                    {data.rehearsalFrequency && (
                        <div>
                            <span className="font-medium">Rehearsal:</span> {rehearsalLabels[data.rehearsalFrequency]}
                        </div>
                    )}
                </div>
            )}
        </ProfileSection>
    );
};
