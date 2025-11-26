import { Music2, Users } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { BlurFade } from '@/shared/components/ui/blur-fade';
import { DotPattern } from '@/shared/components/ui/dot-pattern';
import { cn } from '@/shared/lib/utils';

export function EmptyFeed() {
    return (
        <Card className="border-border/40 relative w-full overflow-hidden">
            <DotPattern className={cn('text-primary/20 [mask-image:radial-gradient(300px_circle_at_center,white,transparent)]')} />
            <CardContent className="relative flex flex-col items-center justify-center py-12">
                <BlurFade delay={0.1} inView>
                    <div className="bg-primary/10 mb-4 rounded-full p-4">
                        <Music2 className="text-primary h-12 w-12" aria-hidden="true" />
                    </div>
                </BlurFade>
                <BlurFade delay={0.2} inView>
                    <h3 className="mb-2 text-lg font-semibold">Your feed is empty</h3>
                </BlurFade>
                <BlurFade delay={0.3} inView>
                    <p className="text-muted-foreground mb-6 max-w-sm text-center text-sm">
                        Follow musicians to see their posts and discover new music collaborations.
                    </p>
                </BlurFade>
                <BlurFade delay={0.4} inView>
                    <Button asChild>
                        <Link to="/musicians" search={{ page: 1, limit: 12 }}>
                            <Users className="mr-2 h-4 w-4" aria-hidden="true" />
                            Find Musicians
                        </Link>
                    </Button>
                </BlurFade>
            </CardContent>
        </Card>
    );
}
