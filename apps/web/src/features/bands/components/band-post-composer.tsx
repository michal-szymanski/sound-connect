import { useState } from 'react';
import { useCreateBandPost } from '@/features/bands/hooks/use-bands';
import { Button } from '@/shared/components/ui/button';
import { Textarea } from '@/shared/components/ui/textarea';
import { Card } from '@/shared/components/ui/card';
import { Loader2 } from 'lucide-react';
import type { BandPost } from '@sound-connect/common/types/band-posts';

type Props = {
    bandId: number;
    bandName: string;
    onPostCreated?: (post: BandPost) => void;
};

export function BandPostComposer({ bandId, bandName, onPostCreated }: Props) {
    const [content, setContent] = useState('');
    const createPost = useCreateBandPost(bandId);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) return;

        createPost.mutate(
            { content: content.trim() },
            {
                onSuccess: (post) => {
                    setContent('');
                    onPostCreated?.(post);
                }
            }
        );
    };

    const isDisabled = !content.trim() || createPost.isPending;

    return (
        <Card className="p-4">
            <form onSubmit={handleSubmit} className="space-y-3">
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                    <span>Posting as</span>
                    <span className="text-foreground font-semibold">{bandName}</span>
                </div>
                <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Share an update with your followers..."
                    maxLength={5000}
                    className="min-h-[100px] resize-none"
                    disabled={createPost.isPending}
                />
                <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-xs">{content.length} / 5000</span>
                    <Button type="submit" disabled={isDisabled}>
                        {createPost.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {createPost.isPending ? 'Posting...' : 'Post'}
                    </Button>
                </div>
            </form>
        </Card>
    );
}
