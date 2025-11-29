import { GenresSection } from '../genres-section';
import { InstrumentsSection } from '../instruments-section';
import { LookingForSection } from '../looking-for-section';
import type { FullProfile } from '@sound-connect/common/types/profile';

type Props = {
    profile: FullProfile;
    canEdit: boolean;
};

export function MusicalIdentityTab({ profile, canEdit }: Props) {
    const { genres, instruments, lookingFor } = profile;

    return (
        <div className="space-y-6">
            <GenresSection data={genres} canEdit={canEdit} />
            <InstrumentsSection data={instruments} canEdit={canEdit} />
            <LookingForSection data={lookingFor} canEdit={canEdit} />
        </div>
    );
}
