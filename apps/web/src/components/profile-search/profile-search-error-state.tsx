import { AlertTriangle } from 'lucide-react';
import { Button } from '@/web/components/ui/button';

type Props = {
    error: string;
    onRetry: () => void;
};

export function ProfileSearchErrorState({ error, onRetry }: Props) {
    return (
        <div className="flex flex-col items-center justify-center px-4 py-12 text-center" role="alert">
            <AlertTriangle className="text-destructive mb-4 h-16 w-16" />
            <h2 className="mb-2 text-2xl font-semibold">Unable to load search results</h2>
            <p className="text-muted-foreground mb-6 max-w-md">{error}</p>
            <Button onClick={onRetry}>Retry Search</Button>
        </div>
    );
}
