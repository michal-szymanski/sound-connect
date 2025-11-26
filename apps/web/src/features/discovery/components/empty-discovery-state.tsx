import { AlertCircle, ArrowRight, Search } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/shared/components/ui/alert';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { BlurFade } from '@/shared/components/ui/blur-fade';
import { DotPattern } from '@/shared/components/ui/dot-pattern';
import { cn } from '@/shared/lib/utils';
import { useNavigate } from '@tanstack/react-router';
import { useAuth } from '@/shared/lib/react-query';

type Props = {
    type: 'incomplete-profile' | 'no-matches';
};

export function EmptyDiscoveryState({ type }: Props) {
    const navigate = useNavigate();
    const { data: auth } = useAuth();

    if (type === 'incomplete-profile') {
        return (
            <Card className="border-primary/20 bg-primary/5 relative overflow-hidden">
                <DotPattern className={cn('text-primary/30 [mask-image:radial-gradient(400px_circle_at_center,white,transparent)]')} />
                <CardContent className="relative flex flex-col items-center justify-center px-6 py-12">
                    <BlurFade delay={0.1} inView>
                        <div className="bg-primary/10 mb-6 rounded-full p-3">
                            <AlertCircle className="text-primary h-6 w-6" />
                        </div>
                    </BlurFade>
                    <BlurFade delay={0.2} inView>
                        <h3 className="mb-3 text-center text-xl font-semibold">Let&apos;s find your next band!</h3>
                    </BlurFade>
                    <BlurFade delay={0.3} inView>
                        <p className="text-muted-foreground mb-6 max-w-md text-center">
                            Tell us your instruments, genres, and location so we can match you with bands looking for musicians like you.
                        </p>
                    </BlurFade>
                    <BlurFade delay={0.4} inView>
                        <Button
                            onClick={() => {
                                if (auth?.user?.id) {
                                    navigate({ to: '/users/$id', params: { id: auth.user.id } });
                                }
                            }}
                            size="lg"
                            variant="default"
                            className="group w-full sm:w-auto"
                            disabled={!auth?.user?.id}
                        >
                            Set Up Your Profile
                            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                        </Button>
                    </BlurFade>
                </CardContent>
            </Card>
        );
    }

    return (
        <Alert>
            <Search className="h-4 w-4" />
            <AlertTitle>No bands match your profile right now</AlertTitle>
            <AlertDescription className="mt-2">Try checking back later or search all bands manually.</AlertDescription>
            <div className="col-start-2 mt-4">
                <Button onClick={() => navigate({ to: '/bands/search' })} size="lg" className="w-full sm:w-auto">
                    Search All Bands
                </Button>
            </div>
        </Alert>
    );
}
