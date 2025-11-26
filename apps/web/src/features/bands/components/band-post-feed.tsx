import { useBandPosts } from '@/features/bands/hooks/use-bands';
import { Post } from '@/features/posts/components/post';
import { PostSkeleton } from '@/features/posts/components/post-skeleton';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Loader2, FileText } from 'lucide-react';
import { useEffect } from 'react';
import { useInView } from 'react-intersection-observer';

type Props = {
    bandId: number;
    onViewAbout?: () => void;
};

export function BandPostFeed({ bandId, onViewAbout }: Props) {
    const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } = useBandPosts(bandId);
    const { ref, inView } = useInView();

    useEffect(() => {
        if (inView && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

    if (isLoading) {
        return (
            <div className="space-y-4">
                <PostSkeleton />
                <PostSkeleton />
                <PostSkeleton />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="py-12 text-center">
                <p className="text-muted-foreground">Failed to load posts. Please try again.</p>
            </div>
        );
    }

    const allPosts = data?.pages.flatMap((page) => page.posts) ?? [];

    if (allPosts.length === 0) {
        return (
            <Card>
                <CardContent className="p-12">
                    <div className="flex flex-col items-center justify-center text-center">
                        <div className="bg-muted mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                            <FileText className="text-muted-foreground h-8 w-8" />
                        </div>
                        <h3 className="mb-2 text-lg font-semibold">No posts yet</h3>
                        <p className="text-muted-foreground mb-4 max-w-sm text-sm">
                            This band hasn&apos;t shared any posts yet. Check the About tab to learn more about the band and what they&apos;re looking for.
                        </p>
                        {onViewAbout && (
                            <Button variant="outline" onClick={onViewAbout}>
                                View About
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {allPosts.map((item) => (
                <Post key={item.post.id} item={item} />
            ))}

            {hasNextPage && (
                <div ref={ref} className="flex justify-center py-4">
                    {isFetchingNextPage ? (
                        <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
                    ) : (
                        <Button variant="outline" onClick={() => fetchNextPage()}>
                            Load more
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}
