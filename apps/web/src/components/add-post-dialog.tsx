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

const AddPostDialog = () => {
    const text = `What's on your mind?`;
    const [open, setOpen] = useState(false);
    const dispatch = useDispatch();
    const ref = useRef<HTMLDivElement | null>(null);
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

    const isSpinner = form.formState.isSubmitting || form.formState.isSubmitSuccessful;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger className="border-input dark:bg-input/30 text-muted-foreground shadow-xs hover:bg-muted/50 h-9 flex-1 rounded-md border bg-transparent px-3 py-1 text-sm font-normal">
                {text}
            </DialogTrigger>
            <DialogContent ref={ref} data-dialog="add-post-dialog">
                <DialogHeader className="mb-4">
                    <DialogTitle>Create post</DialogTitle>
                    <VisuallyHidden.Root>
                        <DialogDescription>Write something to share with your followers.</DialogDescription>
                    </VisuallyHidden.Root>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="content"
                            render={({ field }) => (
                                <FormItem>
                                    <Textarea {...field} maxLength={POST_TEXT_MAX_LENGTH} className="min-h-50 md:text-xl" />
                                </FormItem>
                            )}
                        />
                        <div className="inline-flex items-end justify-end gap-3">
                            <EmojiPicker containerRef={ref} onEmojiSelect={(emoji) => form.setValue('content', form.getValues('content') + emoji.native)} />
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
