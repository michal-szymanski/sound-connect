import { useState, useRef, useCallback } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { ImageCropModal } from '@/shared/components/image-cropper';
import { usePresignedUpload } from '@/hooks/use-presigned-upload';
import { cn } from '@/shared/lib/utils';

type Props = {
    currentImageUrl?: string | null;
    userName: string;
    onUploadComplete?: (result: { publicUrl: string; key: string }) => void;
    className?: string;
};

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export const OnboardingProfileImageUpload = ({ currentImageUrl, userName, onUploadComplete, className }: Props) => {
    const [cropModalOpen, setCropModalOpen] = useState(false);
    const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { upload, state: uploadState } = usePresignedUpload({
        purpose: 'profile-image',
        onSuccess: async (result) => {
            onUploadComplete?.(result);
            setIsUploading(false);
            setCropModalOpen(false);
            setSelectedImageSrc(null);
        },
        onError: () => {
            setIsUploading(false);
        }
    });

    const handleClick = () => {
        if (isUploading) return;
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!ACCEPTED_TYPES.includes(file.type)) {
            return;
        }

        if (file.size > MAX_FILE_SIZE) {
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            setSelectedImageSrc(reader.result as string);
            setCropModalOpen(true);
        };
        reader.readAsDataURL(file);

        event.target.value = '';
    };

    const handleCropComplete = useCallback(
        async (croppedBlob: Blob) => {
            setIsUploading(true);

            const file = new File([croppedBlob], 'profile-image.jpg', { type: 'image/jpeg' });
            await upload(file);
        },
        [upload]
    );

    const handleModalClose = (open: boolean) => {
        if (!isUploading) {
            setCropModalOpen(open);
            if (!open) {
                setSelectedImageSrc(null);
            }
        }
    };

    const isProcessing = isUploading || uploadState === 'uploading' || uploadState === 'confirming';

    return (
        <>
            <div className={cn('group relative z-20 w-fit', className)}>
                <button
                    type="button"
                    onClick={handleClick}
                    className="relative cursor-pointer focus:outline-none"
                    disabled={isProcessing}
                    aria-label="Upload profile picture"
                >
                    <Avatar className="h-32 w-32">
                        <AvatarImage src={currentImageUrl ?? undefined} alt={userName} />
                        <AvatarFallback className="bg-muted text-4xl">
                            {userName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>

                    <div
                        className={cn(
                            'absolute inset-0 flex items-center justify-center rounded-full bg-black/50 transition-opacity',
                            isProcessing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        )}
                    >
                        {isProcessing ? (
                            <Loader2 className="h-8 w-8 animate-spin text-white" />
                        ) : (
                            <Camera className="h-8 w-8 text-white" />
                        )}
                    </div>
                </button>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPTED_TYPES.join(',')}
                    onChange={handleFileChange}
                    className="hidden"
                    aria-hidden="true"
                />
            </div>

            {selectedImageSrc && (
                <ImageCropModal
                    open={cropModalOpen}
                    onOpenChange={handleModalClose}
                    imageSrc={selectedImageSrc}
                    onCropComplete={handleCropComplete}
                    isUploading={isProcessing}
                />
            )}
        </>
    );
};
