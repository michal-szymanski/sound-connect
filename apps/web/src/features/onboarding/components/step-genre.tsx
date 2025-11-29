import { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Label } from '@/shared/components/ui/label';
import { Button } from '@/shared/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/shared/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { type Genre } from '@sound-connect/common/types/profile-enums';
import { formatGenre, getSortedGenres } from '@/features/profile/lib/profile-utils';
import { cn } from '@/shared/lib/utils';

type Props = {
    value: Genre | null;
    onChange: (value: Genre) => void;
};

export const StepGenre = ({ value, onChange }: Props) => {
    const [selectedGenre, setSelectedGenre] = useState<Genre | ''>(value || '');
    const [open, setOpen] = useState(false);

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

            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        id="primaryGenre"
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        aria-required="true"
                        className="w-full justify-between"
                    >
                        {selectedGenre ? formatGenre(selectedGenre) : 'Select your primary genre'}
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
                                            handleChange(genre);
                                            setOpen(false);
                                        }}
                                    >
                                        <Check className={cn('mr-2 h-4 w-4', selectedGenre === genre ? 'opacity-100' : 'opacity-0')} />
                                        {formatGenre(genre)}
                                    </CommandItem>
                                ))}
                            </ScrollArea>
                        </CommandGroup>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    );
};
