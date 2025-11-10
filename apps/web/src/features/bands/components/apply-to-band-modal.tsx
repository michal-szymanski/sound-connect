import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Textarea } from '@/shared/components/ui/textarea';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { useSubmitBandApplication } from '@/features/bands/hooks/use-band-applications';
import { createBandApplicationSchema } from '@sound-connect/common/types/band-applications';
import { z } from 'zod';

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    bandId: number;
    bandName: string;
};

type FormErrors = {
    message?: string;
    position?: string;
    musicLink?: string;
};

export function ApplyToBandModal({ open, onOpenChange, bandId, bandName }: Props) {
    const [message, setMessage] = useState('');
    const [position, setPosition] = useState('');
    const [musicLink, setMusicLink] = useState('');
    const [errors, setErrors] = useState<FormErrors>({});

    const submitApplication = useSubmitBandApplication(bandId);

    const validateForm = () => {
        try {
            createBandApplicationSchema.parse({ message, position: position || undefined, musicLink: musicLink || undefined });
            setErrors({});
            return true;
        } catch (error) {
            if (error instanceof z.ZodError) {
                const fieldErrors: FormErrors = {};
                error.issues.forEach((issue) => {
                    const field = issue.path[0] as keyof FormErrors;
                    fieldErrors[field] = issue.message;
                });
                setErrors(fieldErrors);
            }
            return false;
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        submitApplication.mutate(
            {
                message,
                position: position || undefined,
                musicLink: musicLink || undefined
            },
            {
                onSuccess: () => {
                    setMessage('');
                    setPosition('');
                    setMusicLink('');
                    setErrors({});
                    onOpenChange(false);
                }
            }
        );
    };

    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen && !submitApplication.isPending) {
            setMessage('');
            setPosition('');
            setMusicLink('');
            setErrors({});
        }
        onOpenChange(newOpen);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[600px]" aria-describedby="apply-to-band-description">
                <DialogHeader>
                    <DialogTitle>Apply to Join {bandName}</DialogTitle>
                    <DialogDescription id="apply-to-band-description">
                        Tell the band why you&apos;re interested and what you can bring to the group.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="message">
                            Message to band <span className="text-destructive">*</span>
                        </Label>
                        <Textarea
                            id="message"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Tell the band why you're interested and what you can bring..."
                            maxLength={500}
                            rows={6}
                            className={errors.message ? 'border-destructive' : ''}
                            aria-invalid={!!errors.message}
                            aria-describedby={errors.message ? 'message-error' : undefined}
                        />
                        <div className="flex items-center justify-between text-xs">
                            <span id="message-error" className="text-destructive">
                                {errors.message}
                            </span>
                            <span className="text-muted-foreground">{message.length} / 500</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="position">Position applying for (optional)</Label>
                        <Input
                            id="position"
                            value={position}
                            onChange={(e) => setPosition(e.target.value)}
                            placeholder="e.g., Drummer, Lead Guitar"
                            maxLength={100}
                            className={errors.position ? 'border-destructive' : ''}
                            aria-invalid={!!errors.position}
                            aria-describedby={errors.position ? 'position-error' : undefined}
                        />
                        <div className="flex items-center justify-between text-xs">
                            <span id="position-error" className="text-destructive">
                                {errors.position}
                            </span>
                            {position.length > 50 && <span className="text-muted-foreground">{position.length} / 100</span>}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="musicLink">Link to your music (optional)</Label>
                        <Input
                            id="musicLink"
                            type="url"
                            value={musicLink}
                            onChange={(e) => setMusicLink(e.target.value)}
                            placeholder="YouTube, SoundCloud, Bandcamp, etc."
                            maxLength={500}
                            className={errors.musicLink ? 'border-destructive' : ''}
                            aria-invalid={!!errors.musicLink}
                            aria-describedby={errors.musicLink ? 'musicLink-error' : undefined}
                        />
                        <span id="musicLink-error" className="text-destructive text-xs">
                            {errors.musicLink}
                        </span>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={submitApplication.isPending}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={submitApplication.isPending || !message.trim()}>
                            {submitApplication.isPending ? 'Submitting...' : 'Submit Application'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
