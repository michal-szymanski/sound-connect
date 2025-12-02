import { useState, useEffect } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { CharacterCounter } from '@/features/profile/components/character-counter';
import { createBandInputSchema, type CreateBandInput, type UpdateBandInput } from '@sound-connect/common/types/bands';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { AlertCircle, Check, ChevronsUpDown, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { LocationAutocomplete } from '@/shared/components/location/location-autocomplete';
import type { SelectedLocation } from '@sound-connect/common/types/location';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/shared/components/ui/command';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { getSortedGenres, formatGenre } from '@/features/profile/lib/profile-utils';
import { cn } from '@/shared/lib/utils';
import { checkUsernameAvailability } from '@/features/settings/server-functions/settings';
import { usernameSchema } from '@sound-connect/common/types/settings';

type Props = {
    initialData?: Partial<UpdateBandInput>;
    onSubmit: (data: CreateBandInput | UpdateBandInput) => void;
    onCancel?: () => void;
    isLoading: boolean;
    isEdit?: boolean;
};

type BandFormData = Omit<CreateBandInput, 'primaryGenre'> & {
    primaryGenre: CreateBandInput['primaryGenre'] | '';
};

export function BandForm({ initialData, onSubmit, onCancel, isLoading, isEdit = false }: Props) {
    const [formData, setFormData] = useState<BandFormData>({
        name: initialData?.name || '',
        username: initialData?.username || '',
        description: initialData?.description || '',
        city: initialData?.city || '',
        state: initialData?.state || '',
        country: initialData?.country || 'USA',
        latitude: initialData?.latitude ?? 0,
        longitude: initialData?.longitude ?? 0,
        primaryGenre: initialData?.primaryGenre || '',
        lookingFor: initialData?.lookingFor || ''
    });

    const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(
        initialData?.city && initialData.latitude !== undefined && initialData.longitude !== undefined
            ? {
                  city: initialData.city,
                  state: initialData.state,
                  country: initialData.country || 'USA',
                  latitude: initialData.latitude,
                  longitude: initialData.longitude
              }
            : null
    );

    const [genrePopoverOpen, setGenrePopoverOpen] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [usernameCheckStatus, setUsernameCheckStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
    const [usernameCheckTimer, setUsernameCheckTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const result = createBandInputSchema.safeParse(formData);

        if (!result.success) {
            const fieldErrors: Record<string, string> = {};
            result.error.issues.forEach((issue) => {
                const path = issue.path[0];
                if (path) {
                    fieldErrors[path.toString()] = issue.message;
                }
            });
            setErrors(fieldErrors);
            return;
        }

        setErrors({});
        onSubmit(result.data);
    };

    const handleLocationChange = (location: SelectedLocation | null) => {
        setSelectedLocation(location);
        if (location) {
            setFormData({
                ...formData,
                city: location.city,
                state: location.state || '',
                country: location.country,
                latitude: location.latitude,
                longitude: location.longitude
            });
        } else {
            setFormData({
                ...formData,
                city: '',
                state: '',
                country: 'USA',
                latitude: 0,
                longitude: 0
            });
        }
    };

    const handleUsernameChange = (value: string) => {
        const rawValue = value.startsWith('@') ? value.slice(1) : value;
        setFormData({ ...formData, username: rawValue });

        if (usernameCheckTimer) {
            clearTimeout(usernameCheckTimer);
        }

        if (!rawValue) {
            setUsernameCheckStatus('idle');
            return;
        }

        const validationResult = usernameSchema.safeParse(rawValue);
        if (!validationResult.success) {
            setUsernameCheckStatus('invalid');
            setErrors({ ...errors, username: validationResult.error.issues[0]?.message || 'Invalid username' });
            return;
        }

        setUsernameCheckStatus('checking');
        setErrors({ ...errors, username: '' });

        const timer = setTimeout(async () => {
            const result = await checkUsernameAvailability({ data: { username: rawValue } });
            if (result.success && result.body.available) {
                setUsernameCheckStatus('available');
            } else {
                setUsernameCheckStatus('taken');
                setErrors({ ...errors, username: 'Username is already taken' });
            }
        }, 500);

        setUsernameCheckTimer(timer);
    };

    useEffect(() => {
        return () => {
            if (usernameCheckTimer) {
                clearTimeout(usernameCheckTimer);
            }
        };
    }, [usernameCheckTimer]);

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="name">
                    Band Name <span className="text-destructive">*</span>
                </Label>
                <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter band name"
                    maxLength={100}
                    aria-required="true"
                    aria-invalid={!!errors['name']}
                    aria-describedby={errors['name'] ? 'name-error' : undefined}
                />
                {errors['name'] && (
                    <p id="name-error" className="text-destructive text-sm" role="alert">
                        {errors['name']}
                    </p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="username">
                    Username <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <span className="text-muted-foreground text-sm">@</span>
                    </div>
                    <Input
                        id="username"
                        value={formData.username}
                        onChange={(e) => handleUsernameChange(e.target.value)}
                        placeholder="bandname"
                        maxLength={30}
                        className="pl-7 pr-10"
                        aria-required="true"
                        aria-invalid={usernameCheckStatus === 'invalid' || usernameCheckStatus === 'taken'}
                        aria-describedby={errors['username'] ? 'username-error' : 'username-help'}
                    />
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                        {usernameCheckStatus === 'checking' && <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" aria-hidden="true" />}
                        {usernameCheckStatus === 'available' && <CheckCircle2 className="h-4 w-4 text-green-500" aria-hidden="true" />}
                        {usernameCheckStatus === 'taken' && <XCircle className="h-4 w-4 text-red-500" aria-hidden="true" />}
                        {usernameCheckStatus === 'invalid' && <XCircle className="h-4 w-4 text-red-500" aria-hidden="true" />}
                    </div>
                </div>
                {!errors['username'] && (
                    <p id="username-help" className="text-muted-foreground text-xs">
                        3-30 characters, letters, numbers, underscores, and hyphens only
                    </p>
                )}
                {errors['username'] && (
                    <p id="username-error" className="text-destructive text-sm" role="alert">
                        {errors['username']}
                    </p>
                )}
            </div>

            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label htmlFor="description">
                        Bio <span className="text-destructive">*</span>
                    </Label>
                    <CharacterCounter current={formData.description.length} max={500} />
                </div>
                <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Tell us about your band..."
                    maxLength={500}
                    rows={4}
                    aria-required="true"
                    aria-invalid={!!errors['description']}
                    aria-describedby={errors['description'] ? 'description-error' : undefined}
                />
                {errors['description'] && (
                    <p id="description-error" className="text-destructive text-sm" role="alert">
                        {errors['description']}
                    </p>
                )}
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
                    error={errors['city'] || errors['state'] || errors['country']}
                />
                {(errors['city'] || errors['state'] || errors['country']) && (
                    <p className="text-destructive text-sm" role="alert">
                        {errors['city'] || errors['state'] || errors['country']}
                    </p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="primaryGenre">
                    Primary Genre <span className="text-destructive">*</span>
                </Label>
                <Popover open={genrePopoverOpen} onOpenChange={setGenrePopoverOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            id="primaryGenre"
                            variant="outline"
                            role="combobox"
                            aria-expanded={genrePopoverOpen}
                            aria-required="true"
                            aria-invalid={!!errors['primaryGenre']}
                            className="w-full justify-between"
                        >
                            {formData.primaryGenre ? formatGenre(formData.primaryGenre) : 'Select a genre'}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0 z-popover" align="start">
                        <Command>
                            <CommandInput placeholder="Search genres..." />
                            <CommandEmpty>No genre found.</CommandEmpty>
                            <CommandGroup>
                                <ScrollArea className="h-64">
                                    {getSortedGenres().map((genre) => (
                                        <CommandItem
                                            key={genre}
                                            value={formatGenre(genre)}
                                            onSelect={() => {
                                                setFormData({
                                                    ...formData,
                                                    primaryGenre: genre
                                                });
                                                setGenrePopoverOpen(false);
                                            }}
                                        >
                                            <Check className={cn('mr-2 h-4 w-4', formData.primaryGenre === genre ? 'opacity-100' : 'opacity-0')} />
                                            {formatGenre(genre)}
                                        </CommandItem>
                                    ))}
                                </ScrollArea>
                            </CommandGroup>
                        </Command>
                    </PopoverContent>
                </Popover>
                {errors['primaryGenre'] && (
                    <p className="text-destructive text-sm" role="alert">
                        {errors['primaryGenre']}
                    </p>
                )}
            </div>

            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label htmlFor="lookingFor">Looking For</Label>
                    <CharacterCounter current={formData.lookingFor?.length || 0} max={500} />
                </div>
                <Alert className="border-primary/20 bg-primary/5">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        This section is prominently displayed on your band profile. Use it to describe what musicians you&apos;re looking for.
                    </AlertDescription>
                </Alert>
                <Textarea
                    id="lookingFor"
                    value={formData.lookingFor || ''}
                    onChange={(e) => setFormData({ ...formData, lookingFor: e.target.value })}
                    placeholder="e.g., Looking for an experienced bassist and drummer for gigging..."
                    maxLength={500}
                    rows={3}
                    aria-describedby={errors['lookingFor'] ? 'lookingFor-error' : undefined}
                />
                {errors['lookingFor'] && (
                    <p id="lookingFor-error" className="text-destructive text-sm" role="alert">
                        {errors['lookingFor']}
                    </p>
                )}
            </div>

            <div className="flex gap-2">
                {onCancel && (
                    <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                        Cancel
                    </Button>
                )}
                <Button type="submit" disabled={isLoading} className="flex-1 sm:flex-initial" aria-busy={isLoading}>
                    {isLoading ? (isEdit ? 'Saving...' : 'Creating...') : isEdit ? 'Save Changes' : 'Create Band'}
                </Button>
            </div>
        </form>
    );
}
