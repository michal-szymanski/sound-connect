import { Label } from '@/shared/components/ui/label';
import { OnboardingProfileImageUpload } from '@/features/onboarding/components/onboarding-profile-image-upload';
import { useAuth } from '@/shared/lib/react-query';

type Props = {
    currentImageUrl?: string | null;
    onUploadComplete?: (result: { publicUrl: string; key: string }) => void;
};

export const StepProfilePhoto = ({ currentImageUrl, onUploadComplete }: Props) => {
    const { data: auth } = useAuth();

    if (!auth?.user) {
        return null;
    }

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label className="text-base">Add a profile photo</Label>
                <p className="text-muted-foreground text-sm">
                    Help other musicians recognize you. A profile photo makes your profile more welcoming. This step is optional.
                </p>
            </div>

            <div className="flex justify-center py-6">
                <OnboardingProfileImageUpload currentImageUrl={currentImageUrl} userName={auth.user.name} onUploadComplete={onUploadComplete} />
            </div>
        </div>
    );
};
