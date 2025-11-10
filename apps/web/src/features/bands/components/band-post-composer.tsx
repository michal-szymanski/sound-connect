import { useState, useRef } from 'react';
import { useCreateBandPost } from '@/features/bands/hooks/use-bands';
import { Button } from '@/shared/components/ui/button';
import { Textarea } from '@/shared/components/ui/textarea';
import { Card } from '@/shared/components/ui/card';
import { Loader2 } from 'lucide-react';
import type { BandPost } from '@sound-connect/common/types/band-posts';
import { EmojiPicker } from '@/web/components/emoji-picker';
import { insertAtCursor } from '@/web/utils/emoji-utils';

type Props = {
    bandId: number;
    bandName: string;
    onPostCreated?: (post: BandPost) => void;
};

export function BandPostComposer({ bandId, bandName, onPostCreated }: Props) {
    const [content, setContent] = useState('');
    const createPost = useCreateBandPost(bandId);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

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

    const handleAddEmoji = (emoji: string) => {
        if (content.length >= 5000) return;

        if (textareaRef.current) {
            insertAtCursor(textareaRef.current, emoji);
            setContent(textareaRef.current.value);
        } else {
            setContent((prev) => prev + emoji);
        }
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
                    ref={textareaRef}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Share an update with your followers..."
                    maxLength={5000}
                    className="min-h-[100px] resize-none"
                    disabled={createPost.isPending}
                />
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <EmojiPicker onEmojiSelect={handleAddEmoji} />
                        <span className="text-muted-foreground text-xs">{content.length} / 5000</span>
                    </div>
                    <Button type="submit" disabled={isDisabled}>
                        {createPost.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {createPost.isPending ? 'Posting...' : 'Post'}
                    </Button>
                </div>
            </form>
        </Card>
    );
}
