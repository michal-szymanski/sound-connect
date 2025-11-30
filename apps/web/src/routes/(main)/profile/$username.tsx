import { createFileRoute, notFound, redirect } from '@tanstack/react-router';
import { getProfileByUsername } from '@/shared/server-functions/profile-lookup';
import { UserProfile } from '@/features/profile/components/user-profile';
import { BandProfile } from '@/features/bands/components/band-profile';

export const Route = createFileRoute('/(main)/profile/$username')({
    component: RouteComponent,
    loader: async ({ context: { user }, params }) => {
        if (!user) {
            throw redirect({
                to: '/sign-in'
            });
        }

        const result = await getProfileByUsername({ data: { username: params.username } });

        if (!result.success) {
            throw notFound();
        }

        return result.body;
    }
});

function RouteComponent() {
    const profileData = Route.useLoaderData();

    if (profileData.type === 'user') {
        return <UserProfile profileData={profileData.data} />;
    }

    return <BandProfile profileData={profileData.data} />;
}
