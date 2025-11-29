import { zodResolver } from '@hookform/resolvers/zod';
import { DialogDescription } from '@radix-ui/react-dialog';
import { appConfig } from '@sound-connect/common/app-config';
import type { Post, Media } from '@sound-connect/common/types/drizzle';
import { useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import { X, ImagePlus, Loader2 } from 'lucide-react';
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
import { Progress } from '@/shared/components/ui/progress';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { useBatchPresignedUpload } from '@/web/hooks/use-batch-presigned-upload';
import { addPost } from '@/features/posts/server-functions/posts';
import { useUpdatePost } from '../hooks/use-posts';
import { VideoPlayer } from './video-player';

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

type MediaPreview = {
    id: string;
    file?: File;
    previewUrl: string;
    type: 'image' | 'video' | 'audio';
    key?: string;
    isExisting: boolean;
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
    const [previews, setPreviews] = useState<MediaPreview[]>([]);
    const [removedMediaKeys, setRemovedMediaKeys] = useState<string[]>([]);
    const [newMediaKeys, setNewMediaKeys] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const queryClient = useQueryClient();

    const updateMutation = useUpdatePost(post?.id ?? 0, isBandPost);

    const {
        upload,
        progress,
        overallProgress,
        state: uploadState,
        error: uploadError
    } = useBatchPresignedUpload({
        purpose: 'post-media',
        maxFiles: appConfig.maxPostMediaCount,
        onSuccess: (results) => {
            const keys = results.map((r) => r.key);
            setNewMediaKeys((prev) => [...prev, ...keys]);
        }
    });

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            content: ''
        }
    });

    useEffect(() => {
        if (mode === 'edit' && post) {
            form.reset({ content: post.content });
            const existingPreviews: MediaPreview[] = existingMedia.map((m) => ({
                id: m.id.toString(),
                previewUrl: `/media/${m.key}`,
                type: m.type === 'image' ? 'image' : m.type === 'video' ? 'video' : 'audio',
                key: m.key,
                isExisting: true
            }));
            setPreviews(existingPreviews);
            setRemovedMediaKeys([]);
            setNewMediaKeys([]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode, post?.id, existingMedia]);

    useEffect(() => {
        if (!form.formState.isSubmitSuccessful) return;

        if (mode === 'create') {
            onSuccess?.();
            form.reset();
            setPreviews([]);
            setRemovedMediaKeys([]);
            setNewMediaKeys([]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form.formState.isSubmitSuccessful, mode, onSuccess]);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);
        if (files.length === 0) return;

        const existingCount = previews.filter((p) => p.isExisting && !removedMediaKeys.includes(p.key!)).length;
        const newCount = previews.filter((p) => !p.isExisting).length;
        const totalCount = existingCount + newCount + files.length;

        if (totalCount > appConfig.maxPostMediaCount) {
            toast.error(`Maximum ${appConfig.maxPostMediaCount} files allowed`);
            return;
        }

        const newPreviews: MediaPreview[] = [];

        for (const file of files) {
            const isImage = file.type.startsWith('image/');
            const isVideo = file.type.startsWith('video/');
            const isAudio = file.type.startsWith('audio/');

            if (!isImage && !isVideo && !isAudio) continue;

            const previewUrl = URL.createObjectURL(file);
            newPreviews.push({
                id: crypto.randomUUID(),
                file,
                previewUrl,
                type: isImage ? 'image' : isVideo ? 'video' : 'audio',
                isExisting: false
            });
        }

        const updatedPreviews = [...previews, ...newPreviews];
        setPreviews(updatedPreviews);

        await upload(files);

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleRemove = (id: string) => {
        const preview = previews.find((p) => p.id === id);
        if (!preview) return;

        if (preview.isExisting && preview.key) {
            setRemovedMediaKeys((prev) => [...prev, preview.key!]);
        } else if (preview.previewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(preview.previewUrl);
        }

        setPreviews((prev) => prev.filter((p) => p.id !== id));
    };

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
                const newFiles = previews.filter((p) => !p.isExisting);
                const media = newMediaKeys
                    .map((key, index) => {
                        const preview = newFiles[index];
                        if (!preview) return null;
                        return {
                            type: preview.type,
                            key
                        };
                    })
                    .filter((item): item is { type: 'image' | 'video' | 'audio'; key: string } => item !== null);

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
            const existingKeysToKeep = previews.filter((p) => p.isExisting && p.key && !removedMediaKeys.includes(p.key)).map((p) => p.key!);

            updateMutation.mutate(
                {
                    content: values.content.trim(),
                    mediaKeysToKeep: existingKeysToKeep.length > 0 ? existingKeysToKeep : undefined,
                    newMediaKeys: newMediaKeys.length > 0 ? newMediaKeys : undefined
                },
                {
                    onSuccess: () => {
                        onSuccess?.();
                    }
                }
            );
        }
    };

    const isUploading = uploadState === 'uploading' || uploadState === 'requesting' || uploadState === 'confirming';
    const hasUploadError = uploadState === 'error';
    const isSubmitting = form.formState.isSubmitting || form.formState.isSubmitSuccessful;
    const isEditPending = mode === 'edit' && updateMutation.isPending;
    const isDisabled = isSubmitting || isEditPending || isUploading;
    const canAddMore = previews.length < appConfig.maxPostMediaCount && !isUploading;

    const currentContent = form.watch('content');
    const currentContentLength = getCharacterCount(currentContent);
    const isOverLimit = currentContentLength > appConfig.postTextMaxLength;
    const isNearLimit = currentContentLength > appConfig.postTextMaxLength * 0.9;
    const hasContent = currentContent.trim().length > 0;

    const visiblePreviews = previews.filter((p) => !p.isExisting || !removedMediaKeys.includes(p.key!));

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

                    {visiblePreviews.length > 0 && (
                        <div className={clsx('grid gap-3', visiblePreviews.some((p) => p.type === 'audio') ? 'grid-cols-1' : 'grid-cols-2 md:grid-cols-3')}>
                            {visiblePreviews.map((preview, index) => (
                                <div key={preview.id} className="group relative">
                                    <div
                                        className={clsx(
                                            'border-input bg-muted relative overflow-hidden rounded-lg border',
                                            preview.type === 'audio' ? '' : 'aspect-square'
                                        )}
                                    >
                                        {preview.type === 'image' ? (
                                            <img src={preview.previewUrl} alt={`Media ${index + 1}`} className="h-full w-full object-cover" />
                                        ) : preview.type === 'video' ? (
                                            <VideoPlayer src={preview.previewUrl} controls={false} muted aspectRatio="1/1" className="h-full w-full" />
                                        ) : (
                                            <div className="flex items-center justify-center p-4">
                                                <audio src={preview.previewUrl} controls className="w-full" preload="metadata" />
                                            </div>
                                        )}

                                        {isUploading && !preview.isExisting && progress[index] !== undefined && (
                                            <div className="bg-background/80 absolute inset-0 flex flex-col items-center justify-center gap-2 p-2">
                                                <Progress value={progress[index]} className="h-2 w-full" />
                                                <span className="text-sm font-medium">{progress[index]}%</span>
                                            </div>
                                        )}

                                        {!isUploading && (
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="sm"
                                                className="absolute top-2 right-2 h-6 w-6 rounded-full p-0 opacity-0 transition-opacity group-hover:opacity-100"
                                                onClick={() => handleRemove(preview.id)}
                                                aria-label={`Remove ${preview.type}`}
                                            >
                                                <X className="h-3 w-3" aria-hidden="true" />
                                            </Button>
                                        )}
                                    </div>

                                    {preview.type === 'video' && (
                                        <div className="absolute top-2 left-2 rounded bg-black/70 px-2 py-1 text-xs text-white">Video</div>
                                    )}
                                    {preview.type === 'audio' && (
                                        <div className="absolute top-2 left-2 rounded bg-black/70 px-2 py-1 text-xs text-white">Audio</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {isUploading && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">
                                    {uploadState === 'requesting' && 'Preparing uploads...'}
                                    {uploadState === 'uploading' && `Uploading... ${overallProgress}%`}
                                    {uploadState === 'confirming' && 'Processing...'}
                                </span>
                            </div>
                        </div>
                    )}

                    {hasUploadError && uploadError && (
                        <Alert variant="destructive">
                            <AlertDescription>{uploadError}</AlertDescription>
                        </Alert>
                    )}

                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <EmojiPicker onEmojiSelect={handleAddEmoji} popoverProps={{ side: 'top', sideOffset: 8, align: 'start' }} />
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime,audio/mpeg,audio/wav,audio/ogg,audio/webm"
                                onChange={handleFileChange}
                                className="hidden"
                                disabled={isDisabled || !canAddMore}
                                multiple
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isDisabled || !canAddMore}
                                className="text-muted-foreground bg-auto p-0 has-[>svg]:px-0 dark:hover:bg-inherit [&_svg:not([class*='size-'])]:size-5"
                            >
                                <span className="sr-only">Select media files</span>
                                <ImagePlus />
                            </Button>
                        </div>
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
