import { useState } from 'react';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';

type Props = {
    value: string;
    onChange: (value: string) => void;
};

export const StepBio = ({ value, onChange }: Props) => {
    const [bio, setBio] = useState(value);

    const handleChange = (val: string) => {
        setBio(val);
        onChange(val);
    };

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="bio" className="text-base">
                    Tell us about yourself
                </Label>
                <p className="text-muted-foreground text-sm">Share your musical journey, experience, or what you're looking for. This step is optional.</p>
            </div>

            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label htmlFor="bio">About Me</Label>
                    <span className="text-muted-foreground text-xs">{bio.length} / 500</span>
                </div>
                <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => handleChange(e.target.value)}
                    maxLength={500}
                    placeholder="Tell us about your musical journey..."
                    rows={6}
                />
            </div>
        </div>
    );
};
