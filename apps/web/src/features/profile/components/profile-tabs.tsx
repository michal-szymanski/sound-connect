import { NavigationTabs, NavigationTabsContent } from '@/shared/components/common/navigation-tabs';
import { PortfolioTab } from './tabs/portfolio-tab';
import { MusicalIdentityTab } from './tabs/musical-identity-tab';
import { AvailabilityTab } from './tabs/availability-tab';
import type { FullProfile } from '@sound-connect/common/types/profile';

type Props = {
    userId: string;
    profile: FullProfile;
    canEdit: boolean;
};

export function ProfileTabs({ userId, profile, canEdit }: Props) {
    return (
        <NavigationTabs
            defaultValue="portfolio"
            tabs={[
                { value: 'portfolio', label: 'Portfolio' },
                { value: 'musical-identity', label: 'Musical Identity' },
                { value: 'availability', label: 'Availability' }
            ]}
            className="w-full"
        >
            <div className="mt-6 px-1">
                <NavigationTabsContent value="portfolio" className="mt-0">
                    <PortfolioTab userId={userId} canEdit={canEdit} />
                </NavigationTabsContent>

                <NavigationTabsContent value="musical-identity" className="mt-0">
                    <MusicalIdentityTab profile={profile} canEdit={canEdit} />
                </NavigationTabsContent>

                <NavigationTabsContent value="availability" className="mt-0">
                    <AvailabilityTab profile={profile} canEdit={canEdit} />
                </NavigationTabsContent>
            </div>
        </NavigationTabs>
    );
}
