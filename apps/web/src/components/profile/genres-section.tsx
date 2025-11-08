import { useState } from 'react';
import { Music } from 'lucide-react';
import { ProfileSection } from './profile-section';
import { useUpdateGenres } from '@/web/hooks/use-profile';
import { Button } from '@/web/components/ui/button';
import { Label } from '@/web/components/ui/label';
import { Textarea } from '@/web/components/ui/textarea';
import { CharacterCounter } from './character-counter';
import type { GenresSection as GenresSectionData, UpdateGenres } from '@sound-connect/common/types/profile';
import { GenreEnum, type Genre } from '@sound-connect/common/types/profile-enums';
import { formatGenre } from '@/web/lib/profile-utils';

type Props = {
    data: GenresSectionData | null;
    canEdit: boolean;
};

export const GenresSection = ({ data, canEdit }: Props) => {
    const updateMutation = useUpdateGenres();
    const [formData, setFormData] = useState<UpdateGenres>({
        primaryGenre: data?.primaryGenre || 'rock',
        secondaryGenres: data?.secondaryGenres || [],
        influences: data?.influences || ''
    });

    const isEmpty = !data?.primaryGenre;

    const handleSubmit = (e: React.FormEvent, closeForm: () => void) => {
        e.preventDefault();
        updateMutation.mutate(formData, {
            onSuccess: () => closeForm()
        });
    };

    const toggleSecondaryGenre = (genre: Genre) => {
        const current = formData.secondaryGenres;
        if (current.includes(genre)) {
            setFormData({
                ...formData,
                secondaryGenres: current.filter((g) => g !== genre)
            });
        } else if (current.length < 3) {
            setFormData({
                ...formData,
                secondaryGenres: [...current, genre]
            });
        }
    };

    const editForm = (closeForm: () => void) => (
        <form onSubmit={(e) => handleSubmit(e, closeForm)} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="primaryGenre">
                    Primary Genre <span className="text-destructive">*</span>
                </Label>
                <select
                    id="primaryGenre"
                    value={formData.primaryGenre}
                    onChange={(e) => setFormData({ ...formData, primaryGenre: e.target.value as Genre })}
                    className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
                    required
                >
                    {GenreEnum.map((genre) => (
                        <option key={genre} value={genre}>
                            {formatGenre(genre)}
                        </option>
                    ))}
                </select>
            </div>

            <div className="space-y-2">
                <Label>Secondary Genres (up to 3)</Label>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                    {GenreEnum.filter((g) => g !== formData.primaryGenre).map((genre) => (
                        <button
                            key={genre}
                            type="button"
                            onClick={() => toggleSecondaryGenre(genre)}
                            className={`rounded-md border px-3 py-2 text-sm ${
                                formData.secondaryGenres.includes(genre)
                                    ? 'border-primary bg-primary text-primary-foreground'
                                    : 'border-input bg-background hover:bg-accent'
                            }`}
                            disabled={!formData.secondaryGenres.includes(genre) && formData.secondaryGenres.length >= 3}
                        >
                            {formatGenre(genre)}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label htmlFor="influences">Musical Influences</Label>
                    <CharacterCounter current={formData.influences?.length || 0} max={500} />
                </div>
                <Textarea
                    id="influences"
                    value={formData.influences || ''}
                    onChange={(e) => setFormData({ ...formData, influences: e.target.value })}
                    maxLength={500}
                    placeholder="e.g., FFO: Tool, Primus, Dream Theater"
                    rows={3}
                />
            </div>

            <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={closeForm}>
                    Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
            </div>
        </form>
    );

    return (
        <ProfileSection
            title="Genres & Style"
            icon={<Music className="h-5 w-5" />}
            canEdit={canEdit}
            isEmpty={isEmpty}
            emptyMessage="Complete your genres to help musicians find you"
            editForm={canEdit ? editForm : undefined}
        >
            {data && (
                <div className="space-y-2">
                    <div>
                        <span className="font-medium">Primary:</span> {data.primaryGenre && formatGenre(data.primaryGenre)}
                    </div>
                    {data.secondaryGenres.length > 0 && (
                        <div>
                            <span className="font-medium">Also:</span> {data.secondaryGenres.map((g) => formatGenre(g)).join(', ')}
                        </div>
                    )}
                    {data.influences && (
                        <div>
                            <span className="font-medium">Influences:</span> {data.influences}
                        </div>
                    )}
                </div>
            )}
        </ProfileSection>
    );
};
