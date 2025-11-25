import { useState } from 'react';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { InstrumentEnum, type Instrument } from '@sound-connect/common/types/profile-enums';
import { formatInstrument } from '@/features/profile/lib/profile-utils';

type Props = {
    value: Instrument | null;
    onChange: (value: Instrument) => void;
};

export const StepInstrument = ({ value, onChange }: Props) => {
    const [selectedInstrument, setSelectedInstrument] = useState<Instrument | ''>(value || '');

    const handleChange = (instrument: Instrument) => {
        setSelectedInstrument(instrument);
        onChange(instrument);
    };

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="primaryInstrument" className="text-base">
                    What is your primary instrument?
                </Label>
                <p className="text-muted-foreground text-sm">This helps us connect you with the right musicians and bands.</p>
            </div>

            <Select value={selectedInstrument} onValueChange={(value) => handleChange(value as Instrument)} required>
                <SelectTrigger id="primaryInstrument" className="w-full" aria-required="true">
                    <SelectValue placeholder="Select your primary instrument" />
                </SelectTrigger>
                <SelectContent>
                    {InstrumentEnum.map((instrument) => (
                        <SelectItem key={instrument} value={instrument}>
                            {formatInstrument(instrument)}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
};
