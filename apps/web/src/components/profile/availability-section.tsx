import { useState } from 'react';
import { Calendar } from 'lucide-react';
import { ProfileSection } from './profile-section';
import { useUpdateAvailability } from '@/web/hooks/use-profile';
import { Button } from '@/web/components/ui/button';
import { Label } from '@/web/components/ui/label';
import { Input } from '@/web/components/ui/input';
import { Textarea } from '@/web/components/ui/textarea';
import { CharacterCounter } from './character-counter';
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

const statusLabels: Record<AvailabilityStatus, string> = {
    actively_looking: 'Actively Looking',
    open_to_offers: 'Open to Offers',
    not_looking: 'Not Looking',
    just_browsing: 'Just Browsing'
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
        statusExpiresAt: data?.statusExpiresAt || undefined,
        commitmentLevel: data?.commitmentLevel || undefined,
        weeklyAvailability: data?.weeklyAvailability || undefined,
        rehearsalFrequency: data?.rehearsalFrequency || undefined
    });

    const isEmpty = !data?.status;

    const handleSubmit = (e: React.FormEvent, closeForm: () => void) => {
        e.preventDefault();
        updateMutation.mutate(formData, {
            onSuccess: () => closeForm()
        });
    };

    const getExpirationText = (expiresAt: string) => {
        const date = new Date(expiresAt);
        const now = new Date();
        const daysLeft = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysLeft < 0) return 'Expired';
        if (daysLeft === 0) return 'Expires today';
        return `${daysLeft} days left`;
    };

    const editForm = (closeForm: () => void) => (
        <form onSubmit={(e) => handleSubmit(e, closeForm)} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="status">
                    Status <span className="text-destructive">*</span>
                </Label>
                <select
                    id="status"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as AvailabilityStatus })}
                    className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
                    required
                >
                    {AvailabilityStatusEnum.map((status) => (
                        <option key={status} value={status}>
                            {statusLabels[status]}
                        </option>
                    ))}
                </select>
            </div>

            {formData.status === 'actively_looking' && (
                <div className="space-y-2">
                    <Label htmlFor="statusExpiresAt">
                        Expires At <span className="text-destructive">*</span>
                    </Label>
                    <Input
                        id="statusExpiresAt"
                        type="datetime-local"
                        value={formData.statusExpiresAt ? new Date(formData.statusExpiresAt).toISOString().slice(0, 16) : ''}
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                statusExpiresAt: e.target.value ? new Date(e.target.value).toISOString() : undefined
                            })
                        }
                        required
                    />
                </div>
            )}

            <div className="space-y-2">
                <Label htmlFor="commitmentLevel">Commitment Level</Label>
                <select
                    id="commitmentLevel"
                    value={formData.commitmentLevel || ''}
                    onChange={(e) =>
                        setFormData({
                            ...formData,
                            commitmentLevel: (e.target.value || undefined) as CommitmentLevel
                        })
                    }
                    className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
                >
                    <option value="">Select...</option>
                    {CommitmentLevelEnum.map((level) => (
                        <option key={level} value={level}>
                            {commitmentLabels[level]}
                        </option>
                    ))}
                </select>
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
                <select
                    id="rehearsalFrequency"
                    value={formData.rehearsalFrequency || ''}
                    onChange={(e) =>
                        setFormData({
                            ...formData,
                            rehearsalFrequency: (e.target.value || undefined) as RehearsalFrequency
                        })
                    }
                    className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
                >
                    <option value="">Select...</option>
                    {RehearsalFrequencyEnum.map((freq) => (
                        <option key={freq} value={freq}>
                            {rehearsalLabels[freq]}
                        </option>
                    ))}
                </select>
            </div>

            <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={closeForm}>
                    Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
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
        >
            {data && (
                <div className="space-y-2">
                    <div>
                        <span className="font-medium">Status:</span> {data.status && statusLabels[data.status]}
                        {data.status === 'actively_looking' && data.statusExpiresAt && (
                            <span className="text-muted-foreground ml-2 text-sm">({getExpirationText(data.statusExpiresAt)})</span>
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
