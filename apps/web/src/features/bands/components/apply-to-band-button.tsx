import { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/tooltip';
import { ApplyToBandModal } from './apply-to-band-modal';

type Props = {
    bandId: number;
    bandName: string;
    lookingFor: string | null;
    isUserMember: boolean;
    hasApplied?: boolean;
    isRejected?: boolean;
};

export function ApplyToBandButton({ bandId, bandName, lookingFor, isUserMember, hasApplied = false, isRejected = false }: Props) {
    const [showModal, setShowModal] = useState(false);

    if (isUserMember) {
        return null;
    }

    if (!lookingFor) {
        return null;
    }

    if (hasApplied) {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="secondary" disabled className="cursor-not-allowed">
                            Application Pending
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>You have a pending application to this band</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    if (isRejected) {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="secondary" disabled className="cursor-not-allowed">
                            Cannot Apply
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>You cannot re-apply during this recruitment period</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    return (
        <>
            <Button onClick={() => setShowModal(true)} variant="default">
                Apply to Join
            </Button>
            <ApplyToBandModal open={showModal} onOpenChange={setShowModal} bandId={bandId} bandName={bandName} />
        </>
    );
}
