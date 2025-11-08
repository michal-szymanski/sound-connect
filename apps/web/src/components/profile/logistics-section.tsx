import { useState } from 'react';
import { MapPin } from 'lucide-react';
import { ProfileSection } from './profile-section';
import { useUpdateLogistics } from '@/web/hooks/use-profile';
import { Button } from '@/web/components/ui/button';
import { Label } from '@/web/components/ui/label';
import { Input } from '@/web/components/ui/input';
import { Checkbox } from '@/web/components/ui/checkbox';
import type { LogisticsSection as LogisticsSectionData, UpdateLogistics } from '@sound-connect/common/types/profile';

type Props = {
    data: LogisticsSectionData | null;
    canEdit: boolean;
};

export const LogisticsSection = ({ data, canEdit }: Props) => {
    const updateMutation = useUpdateLogistics();
    const [formData, setFormData] = useState<UpdateLogistics>({
        city: data?.city || '',
        state: data?.state || undefined,
        country: data?.country || 'USA',
        travelRadius: data?.travelRadius || undefined,
        hasRehearsalSpace: data?.hasRehearsalSpace || undefined,
        hasTransportation: data?.hasTransportation || undefined
    });

    const isEmpty = !data?.city;

    const handleSubmit = (e: React.FormEvent, closeForm: () => void) => {
        e.preventDefault();
        updateMutation.mutate(formData, {
            onSuccess: () => closeForm()
        });
    };

    const needsState = formData.country === 'USA' || formData.country === 'Canada';

    const editForm = (closeForm: () => void) => (
        <form onSubmit={(e) => handleSubmit(e, closeForm)} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="city">
                    City <span className="text-destructive">*</span>
                </Label>
                <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    maxLength={100}
                    placeholder="e.g., Chicago"
                    required
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="country">
                    Country <span className="text-destructive">*</span>
                </Label>
                <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    maxLength={50}
                    placeholder="e.g., USA"
                    required
                />
            </div>

            {needsState && (
                <div className="space-y-2">
                    <Label htmlFor="state">
                        State/Province <span className="text-destructive">*</span>
                    </Label>
                    <Input
                        id="state"
                        value={formData.state || ''}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        maxLength={50}
                        placeholder="e.g., IL"
                        required
                    />
                </div>
            )}

            <div className="space-y-2">
                <Label htmlFor="travelRadius">Travel Radius (miles)</Label>
                <Input
                    id="travelRadius"
                    type="number"
                    min={0}
                    max={500}
                    value={formData.travelRadius || ''}
                    onChange={(e) =>
                        setFormData({
                            ...formData,
                            travelRadius: e.target.value ? parseInt(e.target.value) : undefined
                        })
                    }
                    placeholder="e.g., 30"
                />
            </div>

            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <Checkbox
                        id="hasRehearsalSpace"
                        checked={formData.hasRehearsalSpace || false}
                        onCheckedChange={(checked) => setFormData({ ...formData, hasRehearsalSpace: checked as boolean })}
                    />
                    <Label htmlFor="hasRehearsalSpace" className="cursor-pointer font-normal">
                        Has rehearsal space
                    </Label>
                </div>
                <div className="flex items-center gap-2">
                    <Checkbox
                        id="hasTransportation"
                        checked={formData.hasTransportation || false}
                        onCheckedChange={(checked) => setFormData({ ...formData, hasTransportation: checked as boolean })}
                    />
                    <Label htmlFor="hasTransportation" className="cursor-pointer font-normal">
                        Has transportation
                    </Label>
                </div>
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
            title="Logistics"
            icon={<MapPin className="h-5 w-5" />}
            canEdit={canEdit}
            isEmpty={isEmpty}
            emptyMessage="Complete your logistics to help musicians find you"
            editForm={canEdit ? editForm : undefined}
        >
            {data && (
                <div className="space-y-2">
                    <div>
                        <span className="font-medium">Location:</span> {data.city}
                        {data.state && `, ${data.state}`}
                        {data.country && `, ${data.country}`}
                    </div>
                    {data.travelRadius !== null && data.travelRadius !== undefined && (
                        <div>
                            <span className="font-medium">Travel:</span> Up to {data.travelRadius} miles
                        </div>
                    )}
                    {data.hasRehearsalSpace && (
                        <div>
                            <span className="font-medium">Rehearsal Space:</span> Yes
                        </div>
                    )}
                    {data.hasTransportation && (
                        <div>
                            <span className="font-medium">Transportation:</span> Has car
                        </div>
                    )}
                </div>
            )}
        </ProfileSection>
    );
};
