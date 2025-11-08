import { useState } from 'react';
import { Button } from '@/web/components/ui/button';
import { Input } from '@/web/components/ui/input';
import { Label } from '@/web/components/ui/label';
import { Textarea } from '@/web/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/web/components/ui/select';
import { CharacterCounter } from '@/web/components/profile/character-counter';
import { GenreEnum } from '@sound-connect/common/types/profile-enums';
import { createBandInputSchema, type CreateBandInput, type UpdateBandInput } from '@sound-connect/common/types/bands';
import { Alert, AlertDescription } from '@/web/components/ui/alert';
import { AlertCircle } from 'lucide-react';

type Props = {
    initialData?: Partial<UpdateBandInput>;
    onSubmit: (data: CreateBandInput | UpdateBandInput) => void;
    onCancel?: () => void;
    isLoading: boolean;
    isEdit?: boolean;
};

export function BandForm({ initialData, onSubmit, onCancel, isLoading, isEdit = false }: Props) {
    const [formData, setFormData] = useState<CreateBandInput>({
        name: initialData?.name || '',
        description: initialData?.description || '',
        city: initialData?.city || '',
        state: initialData?.state || '',
        country: initialData?.country || 'USA',
        primaryGenre: initialData?.primaryGenre || ('rock' as const),
        lookingFor: initialData?.lookingFor || ''
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

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
        onSubmit(isEdit ? formData : result.data);
    };

    const formatLabel = (value: string) => {
        return value
            .split('_')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

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

            <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="city">
                        City <span className="text-destructive">*</span>
                    </Label>
                    <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="Chicago"
                        maxLength={100}
                        aria-required="true"
                        aria-invalid={!!errors['city']}
                        aria-describedby={errors['city'] ? 'city-error' : undefined}
                    />
                    {errors['city'] && (
                        <p id="city-error" className="text-destructive text-sm" role="alert">
                            {errors['city']}
                        </p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="state">
                        State <span className="text-destructive">*</span>
                    </Label>
                    <Input
                        id="state"
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        placeholder="IL"
                        maxLength={100}
                        aria-required="true"
                        aria-invalid={!!errors['state']}
                        aria-describedby={errors['state'] ? 'state-error' : undefined}
                    />
                    {errors['state'] && (
                        <p id="state-error" className="text-destructive text-sm" role="alert">
                            {errors['state']}
                        </p>
                    )}
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="primaryGenre">
                    Primary Genre <span className="text-destructive">*</span>
                </Label>
                <Select
                    value={formData.primaryGenre}
                    onValueChange={(value) => setFormData({ ...formData, primaryGenre: value as typeof formData.primaryGenre })}
                >
                    <SelectTrigger id="primaryGenre" aria-required="true" aria-invalid={!!errors['primaryGenre']}>
                        <SelectValue placeholder="Select a genre" />
                    </SelectTrigger>
                    <SelectContent>
                        {GenreEnum.map((genre) => (
                            <SelectItem key={genre} value={genre}>
                                {formatLabel(genre)}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
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
