import { AlertCircle } from 'lucide-react';
import { Button } from '@/web/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/web/components/ui/alert';

type Props = {
    onRetry: () => void;
    error: string;
};

export function BandSearchErrorState({ onRetry, error }: Props) {
    return (
        <div className="flex flex-col items-center justify-center px-4 py-12">
            <Alert variant="destructive" className="max-w-md">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button onClick={onRetry} className="mt-6">
                Try Again
            </Button>
        </div>
    );
}
