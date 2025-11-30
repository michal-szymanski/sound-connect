import { AlertCircle, ArrowRight, Search } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { BlurFade } from '@/shared/components/ui/blur-fade';
import { DotPattern } from '@/shared/components/ui/dot-pattern';
import { cn } from '@/shared/lib/utils';
import { Link, useNavigate } from '@tanstack/react-router';
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
                                if (auth?.user?.username) {
                                    navigate({ to: '/profile/$username', params: { username: auth.user.username } });
                                }
                            }}
                            size="lg"
                            variant="default"
                            className="group w-full sm:w-auto"
                            disabled={!auth?.user?.username}
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
        <Card className="border-border/40 relative w-full overflow-hidden">
            <DotPattern className={cn('text-primary/20 [mask-image:radial-gradient(300px_circle_at_center,white,transparent)]')} />
            <CardContent className="relative flex flex-col items-center justify-center py-12">
                <BlurFade delay={0.1} inView>
                    <div className="bg-primary/10 mb-4 rounded-full p-4">
                        <Search className="text-primary h-12 w-12" aria-hidden="true" />
                    </div>
                </BlurFade>
                <BlurFade delay={0.2} inView>
                    <h3 className="mb-2 text-lg font-semibold">No bands match your profile right now</h3>
                </BlurFade>
                <BlurFade delay={0.3} inView>
                    <p className="text-muted-foreground mb-6 max-w-sm text-center text-sm">
                        Try checking back later or search all bands manually.
                    </p>
                </BlurFade>
                <BlurFade delay={0.4} inView>
                    <Button asChild size="lg">
                        <Link to="/bands/search">Search All Bands</Link>
                    </Button>
                </BlurFade>
            </CardContent>
        </Card>
    );
}
