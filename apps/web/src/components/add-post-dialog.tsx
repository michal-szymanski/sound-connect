import SubmitButton from '@/web/components/submit-button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/web/components/ui/dialog';
import { Form, FormField, FormItem } from '@/web/components/ui/form';
import { Textarea } from '@/web/components/ui/textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import { POST_TEXT_MAX_LENGTH } from '@sound-connect/common/constants';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import z from 'zod';

const AddPostDialog = () => {
    const text = `What's on your mind?`;
    const [open, setOpen] = useState(false);

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
