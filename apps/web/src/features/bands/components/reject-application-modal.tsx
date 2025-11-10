import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Textarea } from '@/shared/components/ui/textarea';
import { Label } from '@/shared/components/ui/label';
import { useRejectBandApplication } from '@/features/bands/hooks/use-band-applications';
import { rejectBandApplicationSchema } from '@sound-connect/common/types/band-applications';
import { z } from 'zod';

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    applicationId: number;
    applicantName: string;
    bandId: number;
};

export function RejectApplicationModal({ open, onOpenChange, applicationId, applicantName, bandId }: Props) {
    const [feedbackMessage, setFeedbackMessage] = useState('');
    const [error, setError] = useState('');

    const rejectApplication = useRejectBandApplication(bandId);

    const validateForm = () => {
        try {
            rejectBandApplicationSchema.parse({ feedbackMessage: feedbackMessage || undefined });
            setError('');
            return true;
        } catch (err) {
            if (err instanceof z.ZodError) {
                setError(err.issues[0]?.message || '');
            }
            return false;
        }
    };

    const handleReject = () => {
        if (!validateForm()) {
            return;
        }

        rejectApplication.mutate(
            {
                applicationId,
                feedbackMessage: feedbackMessage || undefined
            },
            {
                onSuccess: () => {
                    setFeedbackMessage('');
                    setError('');
                    onOpenChange(false);
                }
            }
        );
    };

    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen && !rejectApplication.isPending) {
            setFeedbackMessage('');
            setError('');
        }
        onOpenChange(newOpen);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[500px]" aria-describedby="reject-application-description">
                <DialogHeader>
                    <DialogTitle>Reject Application</DialogTitle>
                    <DialogDescription id="reject-application-description">
                        Reject application from {applicantName}. You can optionally provide feedback.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="feedbackMessage">Feedback message (optional)</Label>
                        <Textarea
                            id="feedbackMessage"
                            value={feedbackMessage}
                            onChange={(e) => setFeedbackMessage(e.target.value)}
                            placeholder="You can optionally provide feedback to the applicant"
                            maxLength={300}
                            rows={4}
                            className={error ? 'border-destructive' : ''}
                            aria-invalid={!!error}
                            aria-describedby={error ? 'feedback-error' : undefined}
                        />
                        <div className="flex items-center justify-between text-xs">
                            <span id="feedback-error" className="text-destructive">
                                {error}
                            </span>
                            <span className="text-muted-foreground">{feedbackMessage.length} / 300</span>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={rejectApplication.isPending}>
                        Cancel
                    </Button>
                    <Button type="button" variant="destructive" onClick={handleReject} disabled={rejectApplication.isPending}>
                        {rejectApplication.isPending ? 'Rejecting...' : 'Reject'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
