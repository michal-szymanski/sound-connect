import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
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
        <Tabs defaultValue="portfolio" className="w-full">
            <TabsList className="h-auto w-full justify-start gap-1 rounded-lg bg-muted/30 p-1">
                <TabsTrigger
                    value="portfolio"
                    className="rounded-md px-4 py-2 text-sm font-medium text-muted-foreground text-center transition-all duration-200 hover:bg-muted/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                >
                    Portfolio
                </TabsTrigger>
                <TabsTrigger
                    value="musical-identity"
                    className="rounded-md px-4 py-2 text-sm font-medium text-muted-foreground text-center transition-all duration-200 hover:bg-muted/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                >
                    Musical Identity
                </TabsTrigger>
                <TabsTrigger
                    value="availability"
                    className="rounded-md px-4 py-2 text-sm font-medium text-muted-foreground text-center transition-all duration-200 hover:bg-muted/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                >
                    Availability
                </TabsTrigger>
            </TabsList>

            <div className="mt-6 px-1">
                <TabsContent value="portfolio" className="mt-0">
                    <PortfolioTab userId={userId} canEdit={canEdit} />
                </TabsContent>

                <TabsContent value="musical-identity" className="mt-0">
                    <MusicalIdentityTab profile={profile} canEdit={canEdit} />
                </TabsContent>

                <TabsContent value="availability" className="mt-0">
                    <AvailabilityTab profile={profile} canEdit={canEdit} />
                </TabsContent>
            </div>
        </Tabs>
    );
}
