import { zodResolver } from '@hookform/resolvers/zod';
import { DialogDescription } from '@radix-ui/react-dialog';
import { POST_TEXT_MAX_LENGTH } from '@/common/constants';
import { useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import { X, ImagePlus } from 'lucide-react';
import { VisuallyHidden } from 'radix-ui';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch } from 'react-redux';
import { toast } from 'sonner';
import z from 'zod';
import { EmojiPicker } from '@/web/components/emoji-picker';
import { insertAtCursor } from '@/web/utils/emoji-utils';
import { getCharacterCount } from '@/web/utils/string-utils';
import SubmitButton from '@/shared/components/common/submit-button';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/components/ui/dialog';
import { Form, FormField, FormItem } from '@/shared/components/ui/form';
import { Textarea } from '@/shared/components/ui/textarea';
import useFileUpload from '@/shared/hooks/use-file-upload';
import { showSidebar } from '@/web/redux/slices/ui-slice';
import { addPost } from '@/features/posts/server-functions/posts';

const AddPostDialog = () => {
    const text = `What's on your mind?`;
    const [open, setOpen] = useState(false);
    const dispatch = useDispatch();
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const queryClient = useQueryClient();

    const { selectFiles, FileInput, uploadedFiles, removeFile, clearAllFiles } = useFileUpload({
        accept: 'image/*,video/*',
        multiple: true
    });

    const formSchema = z.object({
        content: z
            .string()
            .min(1)
            .refine((val) => getCharacterCount(val) <= POST_TEXT_MAX_LENGTH, {
                message: `Post must be ${POST_TEXT_MAX_LENGTH} characters or less`
            })
    });

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            content: ''
        }
    });

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            const formData = new FormData();
            formData.append('content', values.content);

            uploadedFiles.forEach((fileWithPreview) => {
                formData.append('media', fileWithPreview.file);
            });

            const result = await addPost({ data: formData });

            if (result.success) {
                queryClient.invalidateQueries({ queryKey: ['feed'] });
            }
        } catch {
            toast.error('Could not publish the post', {
                description: 'Unknown error occurred'
            });
        }
    };

    useEffect(() => {
        if (!form.formState.isSubmitSuccessful) return;

        setOpen(false);
        form.reset();
        clearAllFiles();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form.formState.isSubmitSuccessful, clearAllFiles]);

    useEffect(() => {
        dispatch(showSidebar(!open));
    }, [open, dispatch]);

    useEffect(() => {
        if (open && textareaRef.current) {
            setTimeout(() => textareaRef.current?.focus(), 100);
        }
    }, [open]);

    const handleAddEmoji = (emoji: string) => {
        if (getCharacterCount(form.getValues('content')) >= POST_TEXT_MAX_LENGTH) return;

        if (textareaRef.current) {
            insertAtCursor(textareaRef.current, emoji);
            form.setValue('content', textareaRef.current.value);
        } else {
            form.setValue('content', form.getValues('content') + emoji);
        }
        form.trigger('content');
        textareaRef.current?.focus();
    };

    const isSpinner = form.formState.isSubmitting || form.formState.isSubmitSuccessful;
    const currentContentLength = getCharacterCount(form.watch('content'));
    const isOverLimit = currentContentLength > POST_TEXT_MAX_LENGTH;
    const isNearLimit = currentContentLength > POST_TEXT_MAX_LENGTH * 0.9;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger className="border-input dark:bg-input/30 text-muted-foreground dark:hover:bg-accent h-12 flex-1 rounded-md border bg-transparent px-3 py-1 text-left text-sm font-normal shadow-xs">
                {text}
            </DialogTrigger>
            <DialogContent className="z-dialog! flex max-h-[85vh] w-full max-w-2xl flex-col p-6 md:max-h-[90vh]">
                <DialogHeader className="mb-4">
                    <DialogTitle>Create post</DialogTitle>
                    <VisuallyHidden.Root>
                        <DialogDescription>Write something to share with your followers.</DialogDescription>
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
                                        className={clsx(
                                            'min-h-32 w-full max-w-full resize-none overflow-y-auto wrap-anywhere md:min-h-24',
                                            'text-base md:text-sm',
                                            {
                                                'text-sm': currentContentLength > 100
                                            }
                                        )}
                                    />
                                </FormItem>
                            )}
                        />

                        {uploadedFiles.length > 0 && (
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                {uploadedFiles.map((fileWithPreview) => (
                                    <div key={fileWithPreview.id} className="group relative">
                                        <div className="aspect-square overflow-hidden rounded-lg border">
                                            {fileWithPreview.file.type.startsWith('image/') ? (
                                                <img src={fileWithPreview.previewUrl} alt={fileWithPreview.file.name} className="h-full w-full object-cover" />
                                            ) : (
                                                <video src={fileWithPreview.previewUrl} className="h-full w-full object-cover" controls={false} muted />
                                            )}
                                        </div>
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="sm"
                                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 opacity-0 transition-opacity group-hover:opacity-100"
                                            onClick={() => removeFile(fileWithPreview.id)}
                                            aria-label={`Remove ${fileWithPreview.file.name}`}
                                        >
                                            <X className="h-3 w-3" aria-hidden="true" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <EmojiPicker onEmojiSelect={handleAddEmoji} popoverProps={{ side: 'top', sideOffset: 8, align: 'start' }} />
                                <FileInput />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={selectFiles}
                                    className="text-muted-foreground bg-auto p-0 has-[>svg]:px-0 dark:hover:bg-inherit [&_svg:not([class*='size-'])]:size-5"
                                >
                                    <span className="sr-only">Select media files</span>
                                    <ImagePlus />
                                </Button>
                            </div>
                            <div className={clsx('text-sm tabular-nums', isOverLimit ? 'text-destructive' : 'text-muted-foreground')}>
                                {currentContentLength} / {POST_TEXT_MAX_LENGTH}
                            </div>
                        </div>

                        <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
                            {isNearLimit && !isOverLimit && `${POST_TEXT_MAX_LENGTH - currentContentLength} characters remaining`}
                        </div>

                        <SubmitButton isSpinner={isSpinner} className="w-full">
                            Publish
                        </SubmitButton>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default AddPostDialog;
