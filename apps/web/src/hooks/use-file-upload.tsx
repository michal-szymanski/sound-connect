import { Input } from '@/web/components/ui/input';
import { useRef } from 'react';

const useFileUpload = (options?: { accept?: string; multiple?: boolean; onFileSelect?: (files: FileList) => Promise<void> }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const triggerUpload = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;

        if (!files || files.length === 0 || !options?.onFileSelect) return;

        await options.onFileSelect(files);
    };

    const FileInput = () => (
        <Input type="file" ref={fileInputRef} onChange={handleFileChange} accept={options?.accept} multiple={options?.multiple} className="hidden" />
    );

    return { triggerUpload, FileInput };
};

export default useFileUpload;

// Usage
// function PostCreator() {
//     const { triggerUpload, FileInput } = useFileUpload({
//         accept: 'image/*,video/*',
//         multiple: true,
//         onFileSelect: (files) => {
//             console.log('Files selected:', files);
//             // Upload logic here
//         }
//     });

//     return (
//         <div>
//             <FileInput />
//             <button onClick={triggerUpload}>📷 Add Media</button>
//         </div>
//     );
// }
