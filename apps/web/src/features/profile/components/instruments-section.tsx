import { useState } from 'react';
import { Guitar, Check, ChevronsUpDown } from 'lucide-react';
import { ProfileSection } from './profile-section';
import { useUpdateInstruments } from '@/features/profile/hooks/use-profile';
import { Button } from '@/shared/components/ui/button';
import { Label } from '@/shared/components/ui/label';
import { Input } from '@/shared/components/ui/input';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/shared/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import type { InstrumentsSection as InstrumentsSectionData, UpdateInstruments } from '@sound-connect/common/types/profile';
import { InstrumentEnum, type Instrument } from '@sound-connect/common/types/profile-enums';
import { formatInstrument } from '@/features/profile/lib/profile-utils';
import { cn } from '@/shared/lib/utils';

type FormAdditionalInstrument = {
    instrument: Instrument | '';
    years: number | undefined;
};

type Props = {
    data: InstrumentsSectionData | null;
    canEdit: boolean;
    id?: string;
};

type FormState = {
    primaryInstrument: Instrument | '';
    yearsPlayingPrimary: number | undefined;
    additionalInstruments: FormAdditionalInstrument[];
    seekingToPlay: Instrument[];
};

export const InstrumentsSection = ({ data, canEdit, id }: Props) => {
    const updateMutation = useUpdateInstruments();
    const [formData, setFormData] = useState<FormState>({
        primaryInstrument: data?.primaryInstrument || '',
        yearsPlayingPrimary: data?.yearsPlayingPrimary || undefined,
        additionalInstruments: data?.additionalInstruments || [],
        seekingToPlay: data?.seekingToPlay || []
    });
    const [openPrimary, setOpenPrimary] = useState(false);
    const [openAdditional, setOpenAdditional] = useState<Record<number, boolean>>({});

    const isEmpty = !data?.primaryInstrument;

    const getCompletionStatus = (): 'required' | null => {
        if (!data?.primaryInstrument) return 'required';
        return null;
    };

    const handleSubmit = (e: React.FormEvent, closeForm: () => void) => {
        e.preventDefault();

        const validAdditionalInstruments = formData.additionalInstruments.filter(
            (inst): inst is { instrument: Instrument; years: number } => inst.instrument !== '' && inst.years !== undefined
        );

        const submitData: UpdateInstruments = {
            primaryInstrument: formData.primaryInstrument as Instrument,
            yearsPlayingPrimary: formData.yearsPlayingPrimary!,
            additionalInstruments: validAdditionalInstruments,
            seekingToPlay: formData.seekingToPlay
        };

        updateMutation.mutate(submitData, {
            onSuccess: () => closeForm()
        });
    };

    const addInstrument = () => {
        if (formData.additionalInstruments.length >= 4) return;
        const newInstrument: FormAdditionalInstrument = { instrument: '', years: undefined };
        setFormData({
            ...formData,
            additionalInstruments: [...formData.additionalInstruments, newInstrument]
        });
    };

    const removeInstrument = (index: number) => {
        setFormData({
            ...formData,
            additionalInstruments: formData.additionalInstruments.filter((_, i) => i !== index)
        });
    };

    const updateAdditionalInstrument = (index: number, field: keyof FormAdditionalInstrument, value: Instrument | '' | number | undefined) => {
        const updated = [...formData.additionalInstruments];
        const current = updated[index];
        if (!current) return;

        updated[index] = {
            instrument: field === 'instrument' ? (value as Instrument | '') : current.instrument,
            years: field === 'years' ? (value as number | undefined) : current.years
        };
        setFormData({
            ...formData,
            additionalInstruments: updated
        });
    };

    const toggleSeekingToPlay = (instrument: Instrument) => {
        const current = formData.seekingToPlay;
        const updated = current.includes(instrument) ? current.filter((i) => i !== instrument) : [...current, instrument];
        setFormData({ ...formData, seekingToPlay: updated });
    };

    const handlePrimaryInstrumentChange = (newPrimary: Instrument | '') => {
        if (newPrimary === '') {
            setFormData({ ...formData, primaryInstrument: newPrimary });
            return;
        }

        const existingAdditional = formData.additionalInstruments.find((inst) => inst.instrument === newPrimary);

        if (existingAdditional) {
            if (formData.primaryInstrument !== '' && formData.primaryInstrument !== newPrimary) {
                const oldPrimary = formData.primaryInstrument;
                const oldPrimaryYears = formData.yearsPlayingPrimary;
                const newPrimaryYears = existingAdditional.years;

                const updatedAdditional = formData.additionalInstruments.map((inst) =>
                    inst.instrument === newPrimary
                        ? {
                              instrument: oldPrimary,
                              years: oldPrimaryYears
                          }
                        : inst
                );

                setFormData({
                    ...formData,
                    primaryInstrument: newPrimary,
                    yearsPlayingPrimary: newPrimaryYears,
                    additionalInstruments: updatedAdditional
                });
            } else {
                const newPrimaryYears = existingAdditional.years;
                const updatedAdditional = formData.additionalInstruments.filter((inst) => inst.instrument !== newPrimary);

                setFormData({
                    ...formData,
                    primaryInstrument: newPrimary,
                    yearsPlayingPrimary: newPrimaryYears,
                    additionalInstruments: updatedAdditional
                });
            }
        } else {
            setFormData({
                ...formData,
                primaryInstrument: newPrimary
            });
        }
    };

    const handleAdditionalInstrumentChange = (index: number, newInstrument: Instrument | '') => {
        const currentInstrument = formData.additionalInstruments[index];
        if (!currentInstrument) return;

        if (newInstrument === formData.primaryInstrument && formData.primaryInstrument !== '') {
            const oldAdditionalInstrument = currentInstrument.instrument;
            const oldAdditionalYears = currentInstrument.years;
            const oldPrimaryInstrument = formData.primaryInstrument;
            const oldPrimaryYears = formData.yearsPlayingPrimary;

            const updatedAdditional = [...formData.additionalInstruments];

            if (oldAdditionalInstrument !== '' && oldAdditionalYears !== undefined) {
                updatedAdditional[index] = {
                    instrument: oldPrimaryInstrument,
                    years: oldPrimaryYears
                };
                setFormData({
                    ...formData,
                    primaryInstrument: oldAdditionalInstrument as Instrument,
                    yearsPlayingPrimary: oldAdditionalYears,
                    additionalInstruments: updatedAdditional
                });
            } else {
                updatedAdditional[index] = {
                    instrument: oldPrimaryInstrument,
                    years: oldPrimaryYears
                };
                setFormData({
                    ...formData,
                    primaryInstrument: '' as Instrument,
                    yearsPlayingPrimary: undefined,
                    additionalInstruments: updatedAdditional
                });
            }
        } else {
            updateAdditionalInstrument(index, 'instrument', newInstrument);
        }
    };

    const getAvailableInstruments = (currentIndex: number) => {
        const alreadySelected = formData.additionalInstruments
            .map((inst, idx) => (idx !== currentIndex ? inst.instrument : null))
            .filter((inst): inst is Instrument => inst !== null && inst !== '');

        return InstrumentEnum.filter((instrument) => {
            if (instrument === formData.additionalInstruments[currentIndex]?.instrument) {
                return true;
            }
            if (instrument === formData.primaryInstrument) {
                return true;
            }
            return !alreadySelected.includes(instrument);
        });
    };

    const allInstruments = [formData.primaryInstrument, ...formData.additionalInstruments.map((i) => i.instrument)].filter(
        (inst): inst is Instrument => inst !== ''
    );

    const editForm = (closeForm: () => void) => (
        <form onSubmit={(e) => handleSubmit(e, closeForm)} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="primaryInstrument">
                    Primary Instrument <span className="text-destructive">*</span>
                </Label>
                <Popover open={openPrimary} onOpenChange={setOpenPrimary}>
                    <PopoverTrigger asChild>
                        <Button
                            id="primaryInstrument"
                            variant="outline"
                            role="combobox"
                            aria-expanded={openPrimary}
                            aria-required="true"
                            className="w-full justify-between"
                        >
                            {formData.primaryInstrument ? formatInstrument(formData.primaryInstrument) : 'Select your primary instrument'}
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
                                        <CommandItem
                                            key={instrument}
                                            value={formatInstrument(instrument)}
                                            onSelect={() => {
                                                handlePrimaryInstrumentChange(instrument);
                                                setOpenPrimary(false);
                                            }}
                                        >
                                            <Check
                                                className={cn('mr-2 h-4 w-4', formData.primaryInstrument === instrument ? 'opacity-100' : 'opacity-0')}
                                            />
                                            {formatInstrument(instrument)}
                                        </CommandItem>
                                    ))}
                                </ScrollArea>
                            </CommandGroup>
                        </Command>
                    </PopoverContent>
                </Popover>
            </div>

            <div className="space-y-2">
                <Label htmlFor="yearsPlayingPrimary">
                    Years Playing Primary <span className="text-destructive">*</span>
                </Label>
                <Input
                    id="yearsPlayingPrimary"
                    type="number"
                    min={0}
                    max={70}
                    value={formData.yearsPlayingPrimary ?? ''}
                    onChange={(e) => setFormData({ ...formData, yearsPlayingPrimary: e.target.value ? parseInt(e.target.value, 10) : undefined })}
                    placeholder="e.g., 5"
                    required
                />
            </div>

            <div className="space-y-2">
                <Label>Additional Instruments</Label>
                {formData.additionalInstruments.map((inst, index) => (
                    <div key={inst.instrument || `empty-${index}`} className="flex flex-col gap-2 sm:flex-row">
                        <Popover open={openAdditional[index] || false} onOpenChange={(open) => setOpenAdditional({ ...openAdditional, [index]: open })}>
                            <PopoverTrigger asChild>
                                <Button variant="outline" role="combobox" aria-expanded={openAdditional[index] || false} className="w-full justify-between sm:flex-1">
                                    {inst.instrument ? formatInstrument(inst.instrument) : 'Select instrument'}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0" align="start">
                                <Command>
                                    <CommandInput placeholder="Search instruments..." />
                                    <CommandEmpty>No instrument found.</CommandEmpty>
                                    <CommandGroup>
                                        <ScrollArea className="h-64">
                                            {getAvailableInstruments(index).map((instrument) => (
                                                <CommandItem
                                                    key={instrument}
                                                    value={formatInstrument(instrument)}
                                                    onSelect={() => {
                                                        handleAdditionalInstrumentChange(index, instrument);
                                                        setOpenAdditional({ ...openAdditional, [index]: false });
                                                    }}
                                                >
                                                    <Check className={cn('mr-2 h-4 w-4', inst.instrument === instrument ? 'opacity-100' : 'opacity-0')} />
                                                    {formatInstrument(instrument)}
                                                </CommandItem>
                                            ))}
                                        </ScrollArea>
                                    </CommandGroup>
                                </Command>
                            </PopoverContent>
                        </Popover>
                        <Input
                            type="number"
                            min={0}
                            max={70}
                            value={inst.years ?? ''}
                            onChange={(e) => updateAdditionalInstrument(index, 'years', e.target.value ? parseInt(e.target.value, 10) : undefined)}
                            className="w-full sm:w-24"
                            placeholder="Years"
                        />
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeInstrument(index)} className="w-full sm:w-auto">
                            Remove
                        </Button>
                    </div>
                ))}
                {formData.additionalInstruments.length < 4 && (
                    <Button type="button" variant="outline" size="sm" onClick={addInstrument}>
                        + Add Instrument
                    </Button>
                )}
            </div>

            <div className="space-y-2">
                <Label>Seeking to Play (in bands)</Label>
                <div className="space-y-2">
                    {allInstruments.map((instrument) => (
                        <div key={instrument} className="flex items-center gap-2">
                            <Checkbox
                                id={`seeking-${instrument}`}
                                checked={formData.seekingToPlay.includes(instrument)}
                                onCheckedChange={() => toggleSeekingToPlay(instrument)}
                            />
                            <Label htmlFor={`seeking-${instrument}`} className="cursor-pointer font-normal">
                                {formatInstrument(instrument)}
                            </Label>
                        </div>
                    ))}
                </div>
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
            title="Instruments"
            icon={<Guitar className="h-5 w-5" />}
            canEdit={canEdit}
            isEmpty={isEmpty}
            emptyMessage="Complete your instruments to help musicians find you"
            editForm={canEdit ? editForm : undefined}
            completionStatus={getCompletionStatus()}
            id={id}
        >
            {data && (
                <div className="space-y-2">
                    <div>
                        <span className="font-medium">Primary:</span> {data.primaryInstrument && formatInstrument(data.primaryInstrument)}
                        {data.yearsPlayingPrimary && ` (${data.yearsPlayingPrimary} years)`}
                    </div>
                    {data.additionalInstruments.length > 0 && (
                        <div>
                            <span className="font-medium">Also plays:</span>{' '}
                            {data.additionalInstruments.map((i) => `${formatInstrument(i.instrument)} (${i.years} years)`).join(', ')}
                        </div>
                    )}
                    {data.seekingToPlay.length > 0 && (
                        <div>
                            <span className="font-medium">Seeking to play:</span> {data.seekingToPlay.map((i) => formatInstrument(i)).join(', ')}
                        </div>
                    )}
                </div>
            )}
        </ProfileSection>
    );
};
