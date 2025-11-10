import { PresignedUploadInput } from '@/web/components/uploads/presigned-upload-input';
import { cn } from '@/shared/lib/utils';

type Props = {
    currentImageUrl?: string | null;
    onUploadComplete?: (result: { publicUrl: string; key: string }) => void;
    className?: string;
};

export const ProfileImageUpload = (props: Props) => {
    const { currentImageUrl, onUploadComplete, className } = props;

    return (
        <div className={cn('flex flex-col items-center gap-4', className)}>
            <div className="relative">
                <div className="border-input bg-muted flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-2">
                    {currentImageUrl ? (
                        <img src={currentImageUrl} alt="Profile" className="h-full w-full object-cover" />
                    ) : (
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="text-muted-foreground h-16 w-16"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                            />
                        </svg>
                    )}
                </div>
            </div>

            <PresignedUploadInput
                purpose="profile-image"
                accept="image/jpeg,image/png,image/webp"
                currentImageUrl={currentImageUrl || undefined}
                onUploadComplete={onUploadComplete}
                className="w-full max-w-md"
            />
        </div>
    );
};
