import { useState } from 'react';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { GenreEnum, type Genre } from '@sound-connect/common/types/profile-enums';
import { formatGenre } from '@/features/profile/lib/profile-utils';

type Props = {
    value: Genre | null;
    onChange: (value: Genre) => void;
};

export const StepGenre = ({ value, onChange }: Props) => {
    const [selectedGenre, setSelectedGenre] = useState<Genre>(value || 'rock');

    const handleChange = (genre: Genre) => {
        setSelectedGenre(genre);
        onChange(genre);
    };

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="primaryGenre" className="text-base">
                    What is your primary genre?
                </Label>
                <p className="text-muted-foreground text-sm">This helps us match you with musicians who share your style.</p>
            </div>

            <Select value={selectedGenre} onValueChange={(value) => handleChange(value as Genre)} required>
                <SelectTrigger id="primaryGenre" className="w-full" aria-required="true">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {GenreEnum.map((genre) => (
                        <SelectItem key={genre} value={genre}>
                            {formatGenre(genre)}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
};
