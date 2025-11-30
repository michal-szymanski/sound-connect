import { zodResolver } from '@hookform/resolvers/zod';
import { DialogDescription } from '@radix-ui/react-dialog';
import { appConfig } from '@sound-connect/common/app-config';
import type { Post, Media } from '@sound-connect/common/types/drizzle';
import { useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import { Loader2 } from 'lucide-react';
import { VisuallyHidden } from 'radix-ui';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import z from 'zod';
import { EmojiPicker } from '@/web/components/emoji-picker';
import { insertAtCursor } from '@/utils/emoji-utils';
import { getCharacterCount } from '@/utils/string-utils';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/components/ui/dialog';
import { Form, FormField, FormItem } from '@/shared/components/ui/form';
import { Textarea } from '@/shared/components/ui/textarea';
import { addPost } from '@/features/posts/server-functions/posts';
import { useUpdatePost } from '../hooks/use-posts';
import { PostMediaUpload, type MediaWithType } from './post-media-upload';

type PostDialogContentProps = {
    mode: 'create' | 'edit';
    post?: Post;
    existingMedia?: Media[];
    isBandPost?: boolean;
    onSuccess?: () => void;
};

type PostDialogProps = PostDialogContentProps & {
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

const formSchema = z.object({
    content: z
        .string()
        .min(1)
        .refine((val) => getCharacterCount(val) <= appConfig.postTextMaxLength, {
            message: `Post must be ${appConfig.postTextMaxLength} characters or less`
        })
});

export function PostDialogContent({ mode, post, existingMedia = [], isBandPost = false, onSuccess }: PostDialogContentProps) {
    const [mediaKeysWithTypes, setMediaKeysWithTypes] = useState<MediaWithType[]>([]);
    const [removedMediaKeys, setRemovedMediaKeys] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const queryClient = useQueryClient();

    const updateMutation = useUpdatePost(post?.id ?? 0, isBandPost);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            content: ''
        }
    });

    useEffect(() => {
        if (mode === 'edit' && post) {
            form.reset({ content: post.content });
            setRemovedMediaKeys([]);
            setMediaKeysWithTypes([]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode, post?.id]);

    useEffect(() => {
        if (!form.formState.isSubmitSuccessful) return;

        if (mode === 'create') {
            onSuccess?.();
            form.reset();
            setMediaKeysWithTypes([]);
            setRemovedMediaKeys([]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form.formState.isSubmitSuccessful, mode, onSuccess]);

    const handleAddEmoji = (emoji: string) => {
        if (getCharacterCount(form.getValues('content')) >= appConfig.postTextMaxLength) return;

        if (textareaRef.current) {
            insertAtCursor(textareaRef.current, emoji);
            form.setValue('content', textareaRef.current.value);
        } else {
            form.setValue('content', form.getValues('content') + emoji);
        }
        form.trigger('content');
        textareaRef.current?.focus();
    };

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        if (mode === 'create') {
            try {
                const media = mediaKeysWithTypes.map(({ key, type, title }) => ({ type, key, title }));

                const result = await addPost({
                    data: {
                        content: values.content,
                        media: media.length > 0 ? media : undefined
                    }
                });

                if (result.success) {
                    queryClient.invalidateQueries({ queryKey: ['feed-infinite'] });
                    toast.success('Post published successfully');
                }
            } catch {
                toast.error('Could not publish the post', {
                    description: 'Unknown error occurred'
                });
            }
        } else if (mode === 'edit') {
            const existingKeysToKeep = existingMedia?.filter((m) => !removedMediaKeys.includes(m.key)).map((m) => m.key);

            updateMutation.mutate(
                {
                    content: values.content.trim(),
                    mediaKeysToKeep: existingKeysToKeep && existingKeysToKeep.length > 0 ? existingKeysToKeep : undefined,
                    newMediaKeys: mediaKeysWithTypes.length > 0 ? mediaKeysWithTypes.map((m) => m.key) : undefined
                },
                {
                    onSuccess: () => {
                        onSuccess?.();
                    }
                }
            );
        }
    };

    const isSubmitting = form.formState.isSubmitting || form.formState.isSubmitSuccessful;
    const isEditPending = mode === 'edit' && updateMutation.isPending;
    const isDisabled = isSubmitting || isEditPending || isUploading;

    const currentContent = form.watch('content');
    const currentContentLength = getCharacterCount(currentContent);
    const isOverLimit = currentContentLength > appConfig.postTextMaxLength;
    const isNearLimit = currentContentLength > appConfig.postTextMaxLength * 0.9;
    const hasContent = currentContent.trim().length > 0;

    return (
        <DialogContent className="z-dialog flex max-h-[85vh] w-full max-w-2xl flex-col p-6 md:max-h-[90vh]">
            <DialogHeader className="mb-4">
                <DialogTitle>{mode === 'create' ? 'Create post' : 'Edit Post'}</DialogTitle>
                <VisuallyHidden.Root>
                    <DialogDescription>
                        {mode === 'create' ? 'Write something to share with your followers.' : 'Edit your post content and media.'}
                    </DialogDescription>
                </VisuallyHidden.Root>
            </DialogHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-1 flex-col gap-4">
                    <FormField
                        control={form.control}
                        name="content"
                        render={({ field }) => (
                            <FormItem>
                                <Textarea
                                    {...field}
                                    ref={textareaRef}
                                    placeholder="What's on your mind?"
                                    className={clsx(
                                        'min-h-32 w-full max-w-full resize-none overflow-y-auto wrap-anywhere md:min-h-24',
                                        'text-base md:text-sm',
                                        {
                                            'text-sm': currentContentLength > 100
                                        }
                                    )}
                                    disabled={isDisabled}
                                />
                            </FormItem>
                        )}
                    />

                    <PostMediaUpload
                        maxFiles={appConfig.maxPostMediaCount}
                        existingMedia={existingMedia?.map((m) => ({
                            id: m.id.toString(),
                            key: m.key,
                            type: m.type as 'image' | 'video' | 'audio'
                        }))}
                        onMediaKeysChange={(keysWithTypes) => setMediaKeysWithTypes(keysWithTypes)}
                        onExistingMediaRemove={(key) => setRemovedMediaKeys((prev) => [...prev, key])}
                        onUploadStateChange={(state) => setIsUploading(state === 'uploading')}
                        disabled={isDisabled}
                    />

                    <div className="flex items-center justify-between gap-3">
                        <EmojiPicker onEmojiSelect={handleAddEmoji} popoverProps={{ side: 'top', sideOffset: 8, align: 'start' }} />
                        <div className={clsx('text-sm tabular-nums', isOverLimit ? 'text-destructive' : 'text-muted-foreground')}>
                            {currentContentLength} / {appConfig.postTextMaxLength}
                        </div>
                    </div>

                    <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
                        {isNearLimit && !isOverLimit && `${appConfig.postTextMaxLength - currentContentLength} characters remaining`}
                    </div>

                    {mode === 'create' ? (
                        <Button type="submit" disabled={isDisabled || isOverLimit || !hasContent} className="w-full">
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isSubmitting ? 'Publishing...' : 'Publish'}
                        </Button>
                    ) : (
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onSuccess?.()} disabled={isDisabled}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isDisabled || isOverLimit || !hasContent}>
                                {isEditPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isEditPending ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </DialogFooter>
                    )}
                </form>
            </Form>
        </DialogContent>
    );
}

export function PostDialog({ mode, open, onOpenChange, post, existingMedia, isBandPost }: PostDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <PostDialogContent mode={mode} post={post} existingMedia={existingMedia} isBandPost={isBandPost} onSuccess={() => onOpenChange(false)} />
        </Dialog>
    );
}
