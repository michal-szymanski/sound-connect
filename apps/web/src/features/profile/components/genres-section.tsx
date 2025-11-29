import { useState } from 'react';
import { Music, Check, ChevronsUpDown } from 'lucide-react';
import { ProfileSection } from './profile-section';
import { useUpdateGenres } from '@/features/profile/hooks/use-profile';
import { Button } from '@/shared/components/ui/button';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/shared/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { CharacterCounter } from './character-counter';
import type { GenresSection as GenresSectionData, UpdateGenres } from '@sound-connect/common/types/profile';
import { type Genre } from '@sound-connect/common/types/profile-enums';
import { formatGenre, getSortedGenres } from '@/features/profile/lib/profile-utils';
import { cn } from '@/shared/lib/utils';

type Props = {
    data: GenresSectionData | null;
    canEdit: boolean;
    id?: string;
};

export const GenresSection = ({ data, canEdit, id }: Props) => {
    const updateMutation = useUpdateGenres();
    const [formData, setFormData] = useState<UpdateGenres>({
        primaryGenre: data?.primaryGenre || ('' as Genre),
        secondaryGenres: data?.secondaryGenres || [],
        influences: data?.influences || ''
    });
    const [openPrimary, setOpenPrimary] = useState(false);

    const isEmpty = !data?.primaryGenre;

    const getCompletionStatus = (): 'required' | null => {
        if (!data?.primaryGenre) return 'required';
        return null;
    };

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
                <Popover open={openPrimary} onOpenChange={setOpenPrimary}>
                    <PopoverTrigger asChild>
                        <Button
                            id="primaryGenre"
                            variant="outline"
                            role="combobox"
                            aria-expanded={openPrimary}
                            aria-required="true"
                            className="w-full justify-between"
                        >
                            {formData.primaryGenre ? formatGenre(formData.primaryGenre) : 'Select your primary genre'}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
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
                                                const newPrimary = genre;
                                                setFormData({
                                                    ...formData,
                                                    primaryGenre: newPrimary,
                                                    secondaryGenres: formData.secondaryGenres.filter((g) => g !== newPrimary)
                                                });
                                                setOpenPrimary(false);
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
            </div>

            <div className="space-y-2">
                <Label>Secondary Genres (up to 3)</Label>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                    {getSortedGenres()
                        .filter((g) => g !== formData.primaryGenre)
                        .map((genre) => (
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
                <Button type="submit" disabled={updateMutation.isPending} aria-busy={updateMutation.isPending}>
                    {updateMutation.isPending ? (
                        <>
                            <span className="sr-only">Saving changes, please wait</span>
                            <span aria-hidden="true">Saving...</span>
                        </>
                    ) : (
                        'Save Changes'
                    )}
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
            completionStatus={getCompletionStatus()}
            id={id}
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
