import { useState, useRef, useCallback } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { ImageCropModal } from '@/shared/components/image-cropper';
import { usePresignedUpload } from '@/hooks/use-presigned-upload';
import { useUpdateBandProfileImage } from '@/features/bands/hooks/use-bands';
import { cn } from '@/shared/lib/utils';

type Props = {
    bandId: number;
    currentImage: string | null;
    bandName: string;
    className?: string;
};

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export const EditableBandAvatar = ({ bandId, currentImage, bandName, className }: Props) => {
    const [cropModalOpen, setCropModalOpen] = useState(false);
    const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const updateBandProfileImageMutation = useUpdateBandProfileImage(bandId);

    const { upload, state: uploadState } = usePresignedUpload({
        purpose: 'band-image',
        bandId,
        onSuccess: async (result) => {
            await updateBandProfileImageMutation.mutateAsync(result.publicUrl);
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
            const file = new File([croppedBlob], 'band-image.jpg', { type: 'image/jpeg' });
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

    const initials = bandName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    return (
        <>
            <div className="group relative z-20 w-fit">
                <button
                    type="button"
                    onClick={handleClick}
                    className="relative cursor-pointer focus:outline-none"
                    disabled={isProcessing}
                    aria-label="Change band profile image"
                >
                    <Avatar className={cn('h-20 w-20 flex-shrink-0 rounded-lg sm:h-24 sm:w-24', className)}>
                        <AvatarImage src={currentImage || undefined} alt={bandName} />
                        <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
                    </Avatar>

                    <div
                        className={cn(
                            'absolute inset-0 flex items-center justify-center rounded-lg bg-black/50 transition-opacity',
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
                    aspectRatio={1}
                    cropShape="rect"
                    title="Crop Band Image"
                />
            )}
        </>
    );
};
