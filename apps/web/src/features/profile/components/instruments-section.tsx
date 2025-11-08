import { useState } from 'react';
import { Guitar } from 'lucide-react';
import { ProfileSection } from './profile-section';
import { useUpdateInstruments } from '@/features/profile/hooks/use-profile';
import { Button } from '@/shared/components/ui/button';
import { Label } from '@/shared/components/ui/label';
import { Input } from '@/shared/components/ui/input';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import type { InstrumentsSection as InstrumentsSectionData, UpdateInstruments, AdditionalInstrument } from '@sound-connect/common/types/profile';
import { InstrumentEnum, type Instrument } from '@sound-connect/common/types/profile-enums';
import { formatInstrument } from '@/features/profile/lib/profile-utils';

type Props = {
    data: InstrumentsSectionData | null;
    canEdit: boolean;
};

export const InstrumentsSection = ({ data, canEdit }: Props) => {
    const updateMutation = useUpdateInstruments();
    const [formData, setFormData] = useState<UpdateInstruments>({
        primaryInstrument: data?.primaryInstrument || 'guitar',
        yearsPlayingPrimary: data?.yearsPlayingPrimary || 1,
        additionalInstruments: data?.additionalInstruments || [],
        seekingToPlay: data?.seekingToPlay || []
    });

    const isEmpty = !data?.primaryInstrument;

    const handleSubmit = (e: React.FormEvent, closeForm: () => void) => {
        e.preventDefault();
        updateMutation.mutate(formData, {
            onSuccess: () => closeForm()
        });
    };

    const addInstrument = () => {
        if (formData.additionalInstruments.length >= 4) return;
        const newInstrument: AdditionalInstrument = { instrument: 'guitar', years: 1 };
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

    const updateAdditionalInstrument = (index: number, field: keyof AdditionalInstrument, value: Instrument | number) => {
        const updated = [...formData.additionalInstruments];
        const current = updated[index];
        if (!current) return;

        updated[index] = {
            instrument: field === 'instrument' ? (value as Instrument) : current.instrument,
            years: field === 'years' ? (value as number) : current.years
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

    const allInstruments = [formData.primaryInstrument, ...formData.additionalInstruments.map((i) => i.instrument)];

    const editForm = (closeForm: () => void) => (
        <form onSubmit={(e) => handleSubmit(e, closeForm)} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="primaryInstrument">
                    Primary Instrument <span className="text-destructive">*</span>
                </Label>
                <Select
                    value={formData.primaryInstrument}
                    onValueChange={(value) => setFormData({ ...formData, primaryInstrument: value as Instrument })}
                    required
                >
                    <SelectTrigger id="primaryInstrument" className="w-full" aria-required="true">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {InstrumentEnum.map((instrument) => (
                            <SelectItem key={instrument} value={instrument}>
                                {formatInstrument(instrument)}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
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
                    value={formData.yearsPlayingPrimary}
                    onChange={(e) => setFormData({ ...formData, yearsPlayingPrimary: parseInt(e.target.value) || 0 })}
                    required
                />
            </div>

            <div className="space-y-2">
                <Label>Additional Instruments</Label>
                {formData.additionalInstruments.map((inst, index) => (
                    <div key={index} className="flex flex-col gap-2 sm:flex-row">
                        <Select value={inst.instrument} onValueChange={(value) => updateAdditionalInstrument(index, 'instrument', value as Instrument)}>
                            <SelectTrigger className="w-full sm:flex-1">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {InstrumentEnum.filter((i) => i !== formData.primaryInstrument).map((instrument) => (
                                    <SelectItem key={instrument} value={instrument}>
                                        {formatInstrument(instrument)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Input
                            type="number"
                            min={0}
                            max={70}
                            value={inst.years}
                            onChange={(e) => updateAdditionalInstrument(index, 'years', parseInt(e.target.value) || 0)}
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
