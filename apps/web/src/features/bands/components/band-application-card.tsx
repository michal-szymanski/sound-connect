import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Badge } from '@/shared/components/ui/badge';
import { ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { BandApplicationWithUser } from '@sound-connect/common/types/band-applications';
import { RejectApplicationModal } from './reject-application-modal';
import { useAcceptBandApplication } from '@/features/bands/hooks/use-band-applications';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from '@/shared/components/ui/alert-dialog';

type Props = {
    application: BandApplicationWithUser;
    bandId: number;
};

export function BandApplicationCard({ application, bandId }: Props) {
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showAcceptDialog, setShowAcceptDialog] = useState(false);
    const acceptApplication = useAcceptBandApplication(bandId);

    const handleAccept = () => {
        setShowAcceptDialog(true);
    };

    const confirmAccept = () => {
        acceptApplication.mutate(application.id, {
            onSuccess: () => {
                setShowAcceptDialog(false);
            }
        });
    };

    const initials = application.userName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    return (
        <>
            <Card>
                <CardContent className="p-6">
                    <div className="flex flex-col gap-4 sm:flex-row">
                        <Link to="/users/$id" params={{ id: application.userId }} className="flex-shrink-0">
                            <Avatar className="h-12 w-12 sm:h-16 sm:w-16">
                                <AvatarImage src={application.userImage || undefined} alt={application.userName} />
                                <AvatarFallback>{initials}</AvatarFallback>
                            </Avatar>
                        </Link>

                        <div className="flex-1 space-y-3">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                    <Link to="/users/$id" params={{ id: application.userId }} className="hover:underline">
                                        <h3 className="text-lg font-semibold">{application.userName}</h3>
                                    </Link>
                                    {application.position && (
                                        <Badge variant="secondary" className="mt-1">
                                            {application.position}
                                        </Badge>
                                    )}
                                </div>

                                <span className="text-muted-foreground text-sm">
                                    {formatDistanceToNow(new Date(application.createdAt), { addSuffix: true })}
                                </span>
                            </div>

                            <p className="text-foreground text-sm whitespace-pre-wrap">{application.message}</p>

                            {application.musicLink && (
                                <div>
                                    <a
                                        href={application.musicLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary inline-flex items-center gap-1 text-sm hover:underline"
                                    >
                                        View music sample
                                        <ExternalLink className="h-3 w-3" />
                                    </a>
                                </div>
                            )}

                            <div className="flex flex-col gap-2 pt-2 sm:flex-row">
                                <Button onClick={handleAccept} variant="default" size="sm" disabled={acceptApplication.isPending} className="w-full sm:w-auto">
                                    {acceptApplication.isPending ? 'Accepting...' : 'Accept'}
                                </Button>
                                <Button
                                    onClick={() => setShowRejectModal(true)}
                                    variant="outline"
                                    size="sm"
                                    disabled={acceptApplication.isPending}
                                    className="w-full sm:w-auto"
                                >
                                    Reject
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <AlertDialog open={showAcceptDialog} onOpenChange={setShowAcceptDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Accept Application</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to accept {application.userName} as a member? They will be added to the band immediately.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmAccept}>Accept</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <RejectApplicationModal
                open={showRejectModal}
                onOpenChange={setShowRejectModal}
                applicationId={application.id}
                applicantName={application.userName}
                bandId={bandId}
            />
        </>
    );
}
