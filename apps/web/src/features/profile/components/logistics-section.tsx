import { useState } from 'react';
import { MapPin } from 'lucide-react';
import { ProfileSection } from './profile-section';
import { useUpdateLogistics } from '@/features/profile/hooks/use-profile';
import { Button } from '@/shared/components/ui/button';
import { Label } from '@/shared/components/ui/label';
import { Input } from '@/shared/components/ui/input';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { LocationAutocomplete } from '@/shared/components/location/location-autocomplete';
import type { SelectedLocation } from '@sound-connect/common/types/location';
import type { LogisticsSection as LogisticsSectionData, UpdateLogistics } from '@sound-connect/common/types/profile';

type Props = {
    data: LogisticsSectionData | null;
    canEdit: boolean;
    id?: string;
};

export const LogisticsSection = ({ data, canEdit, id }: Props) => {
    const updateMutation = useUpdateLogistics();
    const [formData, setFormData] = useState<UpdateLogistics>({
        city: data?.city || '',
        state: data?.state || undefined,
        country: data?.country || '',
        latitude: data?.latitude ?? 0,
        longitude: data?.longitude ?? 0,
        travelRadius: data?.travelRadius || undefined,
        hasRehearsalSpace: data?.hasRehearsalSpace || undefined,
        hasTransportation: data?.hasTransportation || undefined
    });

    const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(
        data?.city && data.latitude !== null && data.longitude !== null
            ? {
                  city: data.city,
                  state: data.state || undefined,
                  country: data.country || '',
                  latitude: data.latitude,
                  longitude: data.longitude
              }
            : null
    );

    const isEmpty = !data?.city;

    const getCompletionStatus = (): 'required' | null => {
        if (!data?.city) return 'required';
        return null;
    };

    const hasChanges = () => {
        return !!(
            formData.city ||
            formData.travelRadius ||
            formData.hasRehearsalSpace !== undefined ||
            formData.hasTransportation !== undefined
        );
    };

    const handleSubmit = (e: React.FormEvent, closeForm: () => void) => {
        e.preventDefault();
        updateMutation.mutate(formData, {
            onSuccess: () => closeForm()
        });
    };

    const handleLocationChange = (location: SelectedLocation | null) => {
        setSelectedLocation(location);
        if (location) {
            setFormData({
                ...formData,
                city: location.city,
                state: location.state,
                country: location.country,
                latitude: location.latitude,
                longitude: location.longitude
            });
        } else {
            setFormData({
                ...formData,
                city: '',
                state: undefined,
                country: '',
                latitude: 0,
                longitude: 0
            });
        }
    };

    const editForm = (closeForm: () => void) => (
        <form onSubmit={(e) => handleSubmit(e, closeForm)} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="location">
                    Location <span className="text-destructive">*</span>
                </Label>
                <LocationAutocomplete id="location" value={selectedLocation} onChange={handleLocationChange} placeholder="Search for a city..." required />
            </div>

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
                <Button type="submit" disabled={updateMutation.isPending || !hasChanges()} aria-busy={updateMutation.isPending}>
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
            completionStatus={getCompletionStatus()}
            id={id}
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
