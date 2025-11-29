import { Link } from '@tanstack/react-router';
import { X, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { cn } from '@/shared/lib/utils';
import type { FullProfile } from '@sound-connect/common/types/profile';
import { isServer } from '@/web/utils/env-utils';

type Props = {
    profile: FullProfile;
    userId: string;
};

export function ProfileCompletionBanner({ profile, userId }: Props) {
    const [dismissed, setDismissed] = useState(() => {
        if (isServer()) return false;
        return localStorage.getItem('profile-completion-banner-dismissed') === 'true';
    });

    const handleDismiss = () => {
        localStorage.setItem('profile-completion-banner-dismissed', 'true');
        setDismissed(true);
    };

    if (profile.profileCompletion >= 100 || dismissed) {
        return null;
    }

    const missingFields = [];
    if (!profile.instruments?.primaryInstrument) missingFields.push('Primary Instrument');
    if (!profile.genres?.primaryGenre) missingFields.push('Primary Genre');
    if (!profile.logistics?.city) missingFields.push('Location');

    return (
        <Card className={cn('border-primary/20 from-primary/10 via-primary/5 to-background bg-gradient-to-r', 'relative overflow-hidden')}>
            <CardContent className="p-6">
                <button
                    onClick={handleDismiss}
                    className={cn(
                        'absolute top-3 right-3 rounded-md p-1.5',
                        'text-muted-foreground hover:text-foreground hover:bg-accent',
                        'focus-visible:ring-ring transition-colors focus-visible:ring-2 focus-visible:outline-none'
                    )}
                    aria-label="Dismiss profile completion banner"
                >
                    <X className="h-4 w-4" aria-hidden="true" />
                </button>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                            <Sparkles className="text-primary h-5 w-5" aria-hidden="true" />
                            <h3 className="text-foreground text-lg font-semibold">Your profile is {profile.profileCompletion}% complete</h3>
                        </div>
                        <p className="text-muted-foreground text-sm">Complete your profile to unlock better matches and discovery opportunities</p>
                        {missingFields.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-1">
                                {missingFields.map((field) => (
                                    <Badge key={field} variant="secondary" className="text-xs">
                                        {field}
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="shrink-0">
                        <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
                            <Link to="/users/$id" params={{ id: userId }}>
                                Complete Now
                            </Link>
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
