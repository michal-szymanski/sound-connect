import { Music2, Users } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';

export function EmptyFeed() {
    return (
        <Card className="border-border/40 w-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="bg-muted mb-4 rounded-full p-4">
                    <Music2 className="text-muted-foreground h-12 w-12" aria-hidden="true" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">Your feed is empty</h3>
                <p className="text-muted-foreground mb-6 max-w-sm text-center text-sm">
                    Follow musicians to see their posts and discover new music collaborations.
                </p>
                <Button asChild>
                    <Link to="/musicians">
                        <Users className="mr-2 h-4 w-4" aria-hidden="true" />
                        Find Musicians
                    </Link>
                </Button>
            </CardContent>
        </Card>
    );
}
