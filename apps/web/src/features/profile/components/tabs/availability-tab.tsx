import { LogisticsSection } from '../logistics-section';
import { AvailabilitySection } from '../availability-section';
import type { FullProfile } from '@sound-connect/common/types/profile';

type Props = {
    profile: FullProfile;
    canEdit: boolean;
};

export function AvailabilityTab({ profile, canEdit }: Props) {
    const { logistics, availability } = profile;

    return (
        <div className="space-y-6">
            <LogisticsSection data={logistics} canEdit={canEdit} />
            <AvailabilitySection data={availability} canEdit={canEdit} />
        </div>
    );
}
