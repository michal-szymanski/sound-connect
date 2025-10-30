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
import EmojiPicker from '@/web/components/small/emoji-picker';
import SubmitButton from '@/web/components/small/submit-button';
import { Button } from '@/web/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/web/components/ui/dialog';
import { Form, FormField, FormItem } from '@/web/components/ui/form';
import { ScrollArea } from '@/web/components/ui/scroll-area';
import { Textarea } from '@/web/components/ui/textarea';
import useFileUpload from '@/web/hooks/use-file-upload';
import { showSidebar } from '@/web/redux/slices/ui-slice';
import { addPost } from '@/web/server-functions/models';

const AddPostDialog = () => {
    const text = `What's on your mind?`;
    const [open, setOpen] = useState(false);
    const dispatch = useDispatch();
    const dialogContentRef = useRef<HTMLDivElement | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const queryClient = useQueryClient();

    const { selectFiles, FileInput, uploadedFiles, removeFile, clearAllFiles } = useFileUpload({
        accept: 'image/*,video/*',
        multiple: true
    });

    const formSchema = z.object({
        content: z.string().min(1).max(POST_TEXT_MAX_LENGTH)
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const handleAddEmoji = (emoji: { native: string }) => {
        if (form.getValues('content').length >= POST_TEXT_MAX_LENGTH) return;

        form.setValue('content', form.getValues('content') + emoji.native);
        form.trigger('content');
    };

    const isSpinner = form.formState.isSubmitting || form.formState.isSubmitSuccessful;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger className="border-input dark:bg-input/30 text-muted-foreground dark:hover:bg-accent h-12 flex-1 rounded-md border bg-transparent px-3 py-1 text-left text-sm font-normal shadow-xs">
                {text}
            </DialogTrigger>
            <DialogContent ref={dialogContentRef} className="z-[100]! flex max-h-[90vh] w-full max-w-2xl flex-col p-6">
                <DialogHeader className="mb-4">
                    <DialogTitle>Create post</DialogTitle>
                    <VisuallyHidden.Root>
                        <DialogDescription>Write something to share with your followers.</DialogDescription>
                    </VisuallyHidden.Root>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 space-y-4">
                        <FormField
                            control={form.control}
                            name="content"
                            render={({ field }) => (
                                <FormItem className="h-full">
                                    <ScrollArea className="max-h-60 w-full">
                                        <Textarea
                                            {...field}
                                            ref={textareaRef}
                                            maxLength={POST_TEXT_MAX_LENGTH}
                                            className={clsx('min-h-50 w-full max-w-full resize-none overflow-y-auto wrap-anywhere md:text-xl', {
                                                'md:text-sm': form.getValues('content').length > 100
                                            })}
                                        />
                                    </ScrollArea>
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
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="inline-flex items-end justify-end gap-3">
                            <EmojiPicker onEmojiSelect={handleAddEmoji} dialogRef={dialogContentRef} />
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
