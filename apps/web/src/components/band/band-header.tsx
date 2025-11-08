import { Avatar, AvatarFallback, AvatarImage } from '@/web/components/ui/avatar';
import { Badge } from '@/web/components/ui/badge';
import { Button } from '@/web/components/ui/button';
import { MapPin, Music2, Pencil } from 'lucide-react';
import type { Band } from '@sound-connect/common/types/bands';

type Props = {
    band: Band;
    isUserAdmin: boolean;
    onEdit: () => void;
};

export function BandHeader({ band, isUserAdmin, onEdit }: Props) {
    const initials = band.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    const formatLabel = (value: string) => {
        return value
            .split('_')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex gap-4">
                <Avatar className="h-20 w-20 flex-shrink-0 sm:h-24 sm:w-24">
                    <AvatarImage src={band.profileImageUrl || undefined} alt={band.name} />
                    <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1 space-y-2">
                    <h1 className="text-2xl font-bold sm:text-3xl">{band.name}</h1>

                    <div className="flex flex-wrap gap-2">
                        {band.city && band.state && (
                            <div className="text-muted-foreground flex items-center gap-1 text-sm">
                                <MapPin className="h-4 w-4 flex-shrink-0" />
                                <span>
                                    {band.city}, {band.state}
                                    {band.country && band.country !== 'USA' && `, ${band.country}`}
                                </span>
                            </div>
                        )}

                        {band.primaryGenre && (
                            <div className="text-muted-foreground flex items-center gap-1 text-sm">
                                <Music2 className="h-4 w-4 flex-shrink-0" />
                                <Badge variant="outline">{formatLabel(band.primaryGenre)}</Badge>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {isUserAdmin && (
                <Button variant="outline" size="sm" onClick={onEdit} className="w-full sm:w-auto" aria-label="Edit band">
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit Band
                </Button>
            )}
        </div>
    );
}
