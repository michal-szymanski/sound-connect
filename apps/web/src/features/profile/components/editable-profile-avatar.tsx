import { useState, useRef, useCallback } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import ProfileAvatar from '@/shared/components/common/profile-avatar';
import { ImageCropModal } from '@/shared/components/image-cropper';
import { usePresignedUpload } from '@/hooks/use-presigned-upload';
import { useUpdateProfileImage } from '@/features/profile/hooks/use-profile';
import { cn } from '@/shared/lib/utils';

type Props = {
    userId: string;
    currentImage: string | null;
    name: string;
    className?: string;
    fallbackClassName?: string;
};

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export const EditableProfileAvatar = ({ userId, currentImage, name, className, fallbackClassName }: Props) => {
    const [cropModalOpen, setCropModalOpen] = useState(false);
    const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const updateProfileImageMutation = useUpdateProfileImage();

    const { upload, state: uploadState } = usePresignedUpload({
        purpose: 'profile-image',
        onSuccess: async (result) => {
            await updateProfileImageMutation.mutateAsync({ imageUrl: result.publicUrl });
            setCropModalOpen(false);
            setSelectedImageSrc(null);
        },
        onError: () => {
        }
    });

    const isProcessing = uploadState === 'requesting' || uploadState === 'uploading' || uploadState === 'confirming';

    const handleClick = () => {
        if (isProcessing) return;
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
            const file = new File([croppedBlob], 'profile-image.jpg', { type: 'image/jpeg' });
            await upload(file);
        },
        [upload]
    );

    const handleModalClose = (open: boolean) => {
        if (!isProcessing) {
            setCropModalOpen(open);
            if (!open) {
                setSelectedImageSrc(null);
            }
        }
    };

    return (
        <>
            <div className="group relative z-20 w-fit">
                <button
                    type="button"
                    onClick={handleClick}
                    className="relative cursor-pointer focus:outline-none"
                    disabled={isProcessing}
                    aria-label="Change profile picture"
                >
                    <ProfileAvatar
                        profile={{ id: userId, name, image: currentImage }}
                        type="user"
                        className={className}
                        fallbackClassName={fallbackClassName}
                    />

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
