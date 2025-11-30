import { useState, useRef, useCallback } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { ImageCropModal } from '@/shared/components/image-cropper';
import { usePresignedUpload } from '@/hooks/use-presigned-upload';
import { useUpdateBackgroundImage } from '@/features/profile/hooks/use-profile';

type Props = {
    currentImage: string | null;
    onImageUpdated?: (imageUrl: string) => void;
};

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const DEFAULT_GRADIENT = 'linear-gradient(135deg, hsl(var(--primary)/0.1), hsl(var(--secondary)/0.1))';

export const EditableProfileBackground = ({ currentImage, onImageUpdated }: Props) => {
    const [cropModalOpen, setCropModalOpen] = useState(false);
    const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const updateBackgroundImageMutation = useUpdateBackgroundImage();

    const { upload, state: uploadState } = usePresignedUpload({
        purpose: 'user-background',
        onSuccess: async (result) => {
            await updateBackgroundImageMutation.mutateAsync({ backgroundImage: result.publicUrl });
            setIsUploading(false);
            setCropModalOpen(false);
            setSelectedImageSrc(null);
            onImageUpdated?.(result.publicUrl);
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

            const file = new File([croppedBlob], 'background-image.jpg', { type: 'image/jpeg' });
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
            <div className="group relative z-0 h-48 overflow-hidden sm:h-60">
                {currentImage ? (
                    <img
                        src={currentImage}
                        alt="Profile background"
                        className="h-full w-full object-cover"
                        loading="lazy"
                    />
                ) : (
                    <div className="h-full w-full" style={{ background: DEFAULT_GRADIENT }} />
                )}

                <button
                    type="button"
                    onClick={handleClick}
                    className="absolute bottom-4 right-4 z-10 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-black/50 transition-colors hover:bg-black/70 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isProcessing}
                    aria-label="Change cover image"
                >
                    {isProcessing ? (
                        <Loader2 className="h-5 w-5 animate-spin text-white" />
                    ) : (
                        <Camera className="h-5 w-5 text-white" />
                    )}
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
                    aspectRatio={16 / 9}
                    cropShape="rect"
                    title="Crop Cover Image"
                />
            )}
        </>
    );
};
