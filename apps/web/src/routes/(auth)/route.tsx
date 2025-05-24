import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/(auth)')({
    component: RouteComponent,
    beforeLoad: ({ context: { user } }) => {
        if (user) {
            const path = '/';
            console.info(`[App] Redirecting to: ${path}`);

            throw redirect({
                to: path
            });
        }
    }
});

function RouteComponent() {
    return <Outlet />;
}
