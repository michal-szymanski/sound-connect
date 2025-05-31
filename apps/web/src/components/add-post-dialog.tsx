import SubmitButton from '@/web/components/submit-button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/web/components/ui/dialog';
import { Form, FormField, FormItem } from '@/web/components/ui/form';
import { Textarea } from '@/web/components/ui/textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import { POST_TEXT_MAX_LENGTH } from '@sound-connect/common/constants';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import z from 'zod';
import EmojiPicker from '@/web/components/emoji-picker';
import { useDispatch } from 'react-redux';
import { showSidebar } from '@/web/redux/slices/ui-slice';
import { VisuallyHidden } from 'radix-ui';
import { DialogDescription } from '@radix-ui/react-dialog';
import { addPost } from '@/web/server-functions/models';
import { useQueryClient } from '@tanstack/react-query';
import { ScrollArea } from '@/web/components/ui/scroll-area';
import clsx from 'clsx';

const AddPostDialog = () => {
    const text = `What's on your mind?`;
    const [open, setOpen] = useState(false);
    const dispatch = useDispatch();
    const containerRef = useRef<HTMLDivElement | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const queryClient = useQueryClient();

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
            const result = await addPost({ data: { content: values.content } });

            if (result.success) {
                queryClient.invalidateQueries({ queryKey: ['feed'] });
            }
        } catch (error) {
            toast.error('Could not publish the post', {
                description: 'Unknown error occurred'
            });
        }
    };

    useEffect(() => {
        if (!form.formState.isSubmitSuccessful) return;

        setOpen(false);
        form.reset();
    }, [form.formState.isSubmitSuccessful]);

    useEffect(() => {
        dispatch(showSidebar(!open));
    }, [open]);

    const handleAddEmoji = (emoji: { native: string }) => {
        if (form.getValues('content').length >= POST_TEXT_MAX_LENGTH) return;

        form.setValue('content', form.getValues('content') + emoji.native);
        form.trigger('content');
    };

    const isSpinner = form.formState.isSubmitting || form.formState.isSubmitSuccessful;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger className="border-input dark:bg-input/30 text-muted-foreground shadow-xs dark:hover:bg-accent h-12 flex-1 rounded-md border bg-transparent px-3 py-1 text-left text-sm font-normal">
                {text}
            </DialogTrigger>
            <DialogContent ref={containerRef} className="flex max-h-[90vh] w-full max-w-2xl flex-col p-6">
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
                                            className={clsx(
                                                'w-full resize-none overflow-y-auto break-words md:text-xl', // Ensure content wraps and respects parent width
                                                {
                                                    'md:text-sm': form.getValues('content').length > 50 // Dynamically adjust text size
                                                }
                                            )}
                                        />
                                    </ScrollArea>
                                </FormItem>
                            )}
                        />

                        <div className="inline-flex items-end justify-end gap-3">
                            <EmojiPicker containerRef={containerRef} onEmojiSelect={handleAddEmoji} />
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
