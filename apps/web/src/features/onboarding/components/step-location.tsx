import { useState } from 'react';
import { Label } from '@/shared/components/ui/label';
import { LocationAutocomplete } from '@/shared/components/location/location-autocomplete';
import type { SelectedLocation } from '@sound-connect/common/types/location';

type Props = {
    value: { city: string; country: string };
    onChange: (value: { city: string; country: string }) => void;
};

export const StepLocation = ({ value, onChange }: Props) => {
    const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(
        value.city ? { city: value.city, state: undefined, country: value.country, latitude: 0, longitude: 0 } : null
    );

    const handleLocationChange = (location: SelectedLocation | null) => {
        setSelectedLocation(location);
        if (location) {
            onChange({ city: location.city, country: location.country });
        } else {
            onChange({ city: '', country: '' });
        }
    };

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label className="text-base">Where are you located?</Label>
                <p className="text-muted-foreground text-sm">This helps us find local musicians and bands near you.</p>
            </div>

            <div className="space-y-2">
                <Label htmlFor="location">
                    Location <span className="text-destructive">*</span>
                </Label>
                <LocationAutocomplete
                    id="location"
                    value={selectedLocation}
                    onChange={handleLocationChange}
                    placeholder="Search for a city..."
                    required
                />
            </div>
        </div>
    );
};
