import { useState } from 'react';
import { Label } from '@/shared/components/ui/label';
import { Input } from '@/shared/components/ui/input';

type Props = {
    value: { city: string; country: string };
    onChange: (value: { city: string; country: string }) => void;
};

export const StepLocation = ({ value, onChange }: Props) => {
    const [formData, setFormData] = useState(value);

    const handleChange = (field: 'city' | 'country', val: string) => {
        const updated = { ...formData, [field]: val };
        setFormData(updated);
        onChange(updated);
    };

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label className="text-base">Where are you located?</Label>
                <p className="text-muted-foreground text-sm">This helps us find local musicians and bands near you.</p>
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="city">
                        City <span className="text-destructive">*</span>
                    </Label>
                    <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => handleChange('city', e.target.value)}
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
                        onChange={(e) => handleChange('country', e.target.value)}
                        maxLength={50}
                        placeholder="e.g., USA"
                        required
                    />
                </div>
            </div>
        </div>
    );
};
