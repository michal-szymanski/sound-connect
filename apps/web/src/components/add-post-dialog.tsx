import SubmitButton from '@/web/components/submit-button';
import { Button } from '@/web/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/web/components/ui/dialog';
import { Form, FormField, FormItem } from '@/web/components/ui/form';
import { Textarea } from '@/web/components/ui/textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import { POST_TEXT_MAX_LENGTH } from '@sound-connect/common/constants';
import { Smile } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import z from 'zod';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

const AddPostDialog = () => {
    const text = `What's on your mind?`;
    const [open, setOpen] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

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
            console.log({ values });
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

    const isSpinner = form.formState.isSubmitting || form.formState.isSubmitSuccessful;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger className="border-input dark:bg-input/30 text-muted-foreground shadow-xs hover:bg-muted/50 h-9 flex-1 rounded-md border bg-transparent px-3 py-1 text-sm font-normal">
                {text}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader className="mb-4">
                    <DialogTitle>Create post</DialogTitle>
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
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setShowEmojiPicker((prev) => !prev)}
                                className="text-muted-foreground bg-auto p-0 has-[>svg]:px-0 dark:hover:bg-inherit [&_svg:not([class*='size-'])]:size-5"
                            >
                                <Smile />
                            </Button>
                            {showEmojiPicker && (
                                <div className="absolute bottom-16 right-4 z-50">
                                    <Picker
                                        data={data}
                                        onEmojiSelect={(emoji) => {
                                            form.setValue('content', form.getValues('content') + emoji.native);
                                        }}
                                        // onClickOutside={() => {
                                        //     setShowEmojiPicker(false);
                                        //     console.log('Emoji picker closed');
                                        // }}
                                        theme="dark"
                                    />
                                </div>
                            )}
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
