import { Button } from '@/web/components/ui/button';
import useFileUpload from '@/web/hooks/use-file-upload';
import { uploadMedia } from '@/web/server-functions/media';
import clsx from 'clsx';
import { ImagePlus } from 'lucide-react';

const FilePicker = () => {
    const { triggerUpload, FileInput } = useFileUpload({
        accept: 'image/*,video/*',
        multiple: false,
        onFileSelect: async (files) => {
            const file = files[0];
            if (!file) return;

            const formData = new FormData();
            formData.append('file', file);

            try {
                const result = await uploadMedia({ data: formData });
                console.log('Upload result:', result);
            } catch (error) {
                console.error('Upload failed:', error);
            }
        }
    });
    return (
        <>
            <FileInput />
            <Button
                type="button"
                variant="ghost"
                onClick={triggerUpload}
                className={clsx("text-muted-foreground bg-auto p-0 has-[>svg]:px-0 dark:hover:bg-inherit [&_svg:not([class*='size-'])]:size-5", {
                    'text-inherit': false
                })}
            >
                <span className="sr-only">Open file picker</span>
                <ImagePlus />
            </Button>
        </>
    );
};

export default FilePicker;
