import { useState } from 'react';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { AvailabilityStatusEnum, type AvailabilityStatus } from '@sound-connect/common/types/profile-enums';
import { availabilityStatusConfig } from '@/shared/lib/utils/availability';

type Props = {
    value: AvailabilityStatus | null;
    onChange: (value: AvailabilityStatus) => void;
};

export const StepAvailability = ({ value, onChange }: Props) => {
    const [status, setStatus] = useState<AvailabilityStatus | ''>(value || '');

    const handleChange = (newStatus: AvailabilityStatus) => {
        setStatus(newStatus);
        onChange(newStatus);
    };

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label className="text-base">What&apos;s your availability status?</Label>
                <p className="text-muted-foreground text-sm">
                    Let musicians and bands know if you&apos;re actively looking to collaborate. This step is optional.
                </p>
            </div>

            <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={(value) => handleChange(value as AvailabilityStatus)}>
                    <SelectTrigger id="status" className="w-full">
                        <SelectValue placeholder="Select your availability status">
                            {status && (
                                <div className="flex items-center gap-2">
                                    <span
                                        className={`h-2.5 w-2.5 rounded-full ${availabilityStatusConfig[status].dot} ring-background ring-2`}
                                        aria-hidden="true"
                                    />
                                    <span>{availabilityStatusConfig[status].label}</span>
                                </div>
                            )}
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        {AvailabilityStatusEnum.map((availStatus) => {
                            const config = availabilityStatusConfig[availStatus];
                            return (
                                <SelectItem key={availStatus} value={availStatus}>
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

            <div className="bg-muted/50 rounded-md p-3 text-sm">
                <p className="font-medium">Status meanings:</p>
                <ul className="mt-2 space-y-1">
                    <li className="flex items-center gap-2">
                        <span className="ring-background h-2 w-2 rounded-full bg-green-500 ring-2" />
                        <span>Actively Looking - Open to new opportunities</span>
                    </li>
                    <li className="flex items-center gap-2">
                        <span className="ring-background h-2 w-2 rounded-full bg-blue-500 ring-2" />
                        <span>Open to Offers - Not searching but open to the right fit</span>
                    </li>
                    <li className="flex items-center gap-2">
                        <span className="ring-background h-2 w-2 rounded-full bg-gray-500 ring-2" />
                        <span>Not Looking - Not available at this time</span>
                    </li>
                    <li className="flex items-center gap-2">
                        <span className="ring-background h-2 w-2 rounded-full bg-yellow-500 ring-2" />
                        <span>Just Browsing - Exploring the platform</span>
                    </li>
                </ul>
            </div>
        </div>
    );
};
