import { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Label } from '@/shared/components/ui/label';
import { Button } from '@/shared/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/shared/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { InstrumentEnum, type Instrument } from '@sound-connect/common/types/profile-enums';
import { formatInstrument } from '@/features/profile/lib/profile-utils';
import { cn } from '@/shared/lib/utils';

type Props = {
    value: Instrument | null;
    onChange: (value: Instrument) => void;
};

export const StepInstrument = ({ value, onChange }: Props) => {
    const [selectedInstrument, setSelectedInstrument] = useState<Instrument | ''>(value || '');
    const [open, setOpen] = useState(false);

    const handleChange = (instrument: Instrument) => {
        setSelectedInstrument(instrument);
        onChange(instrument);
        setOpen(false);
    };

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="primaryInstrument" className="text-base">
                    What is your primary instrument?
                </Label>
                <p className="text-muted-foreground text-sm">This helps us connect you with the right musicians and bands.</p>
            </div>

            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        id="primaryInstrument"
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        aria-required="true"
                        className="w-full justify-between"
                    >
                        {selectedInstrument ? formatInstrument(selectedInstrument) : 'Select your primary instrument'}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                    <Command>
                        <CommandInput placeholder="Search instruments..." />
                        <CommandEmpty>No instrument found.</CommandEmpty>
                        <CommandGroup>
                            <ScrollArea className="h-64">
                                {InstrumentEnum.map((instrument) => (
                                    <CommandItem key={instrument} value={formatInstrument(instrument)} onSelect={() => handleChange(instrument)}>
                                        <Check className={cn('mr-2 h-4 w-4', selectedInstrument === instrument ? 'opacity-100' : 'opacity-0')} />
                                        {formatInstrument(instrument)}
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
