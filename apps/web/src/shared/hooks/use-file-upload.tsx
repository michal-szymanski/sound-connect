import { useRef, useState, useCallback, useEffect } from 'react';
import { Input } from '@/shared/components/ui/input';

type FileWithPreview = {
    id: string;
    file: File;
    previewUrl: string;
};

const useFileUpload = (options?: { accept?: string; multiple?: boolean }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadedFiles, setUploadedFiles] = useState<FileWithPreview[]>([]);

    const selectFiles = () => {
        fileInputRef.current?.click();
    };

    const createFilePreview = (file: File): FileWithPreview => {
        const previewUrl = URL.createObjectURL(file);
        return {
            id: crypto.randomUUID(),
            file,
            previewUrl
        };
    };

    const removeFile = useCallback((fileId: string) => {
        setUploadedFiles((prev) => {
            const fileToRemove = prev.find((f) => f.id === fileId);
            if (fileToRemove) {
                URL.revokeObjectURL(fileToRemove.previewUrl);
            }
            return prev.filter((f) => f.id !== fileId);
        });
    }, []);

    const clearAllFiles = useCallback(() => {
        uploadedFiles.forEach((file) => {
            URL.revokeObjectURL(file.previewUrl);
        });
        setUploadedFiles([]);
    }, [uploadedFiles]);

    const onFileSelect = useCallback(async (callback?: (files: FileList) => Promise<void>) => {
        const files = fileInputRef.current?.files;
        if (files && callback) {
            await callback(files);
        }
    }, []);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;

        if (!files || files.length === 0) return;

        const newFiles = Array.from(files).map(createFilePreview);

        if (options?.multiple) {
            setUploadedFiles((prev) => [...prev, ...newFiles]);
        } else {
            uploadedFiles.forEach((file) => {
                URL.revokeObjectURL(file.previewUrl);
            });
            setUploadedFiles(newFiles);
        }
    };

    useEffect(() => {
        return () => {
            uploadedFiles.forEach((file) => {
                URL.revokeObjectURL(file.previewUrl);
            });
        };
    }, [uploadedFiles]);

    const FileInput = () => (
        <Input type="file" ref={fileInputRef} onChange={handleFileChange} accept={options?.accept} multiple={options?.multiple} className="hidden" />
    );

    return {
        selectFiles,
        FileInput,
        uploadedFiles,
        removeFile,
        clearAllFiles,
        onFileSelect
    };
};

export default useFileUpload;

// Usage
// function PostCreator() {
//     const { selectFiles, FileInput, uploadedFiles, removeFile, clearAllFiles, onFileSelect } = useFileUpload({
//         accept: 'image/*,video/*',
//         multiple: true
//     });
//
//     const handleUpload = async (files: FileList) => {
//         console.log('Files selected:', files);
//         // Upload logic here
//     };

//     return (
//         <div>
//             <FileInput />
//             <button onClick={selectFiles}>📷 Select Media</button>
//             <button onClick={() => onFileSelect(handleUpload)}>Upload Selected</button>
//             <button onClick={clearAllFiles}>Clear All</button>
//
//             {uploadedFiles.map(fileWithPreview => (
//                 <div key={fileWithPreview.id}>
//                     <img src={fileWithPreview.previewUrl} alt={fileWithPreview.file.name} />
//                     <span>{fileWithPreview.file.name}</span>
//                     <button onClick={() => removeFile(fileWithPreview.id)}>Remove</button>
//                 </div>
//             ))}
//         </div>
//     );
// }
