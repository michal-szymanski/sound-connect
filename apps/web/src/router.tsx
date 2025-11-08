import { QueryClient } from '@tanstack/react-query';
import { createRouter as createTanStackRouter } from '@tanstack/react-router';
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query';
import DefaultCatchBoundary from '@/shared/components/common/default-catch-boundry';
import NotFound from '@/shared/components/common/not-found';
import { routeTree } from './routeTree.gen';

export function getRouter() {
    const queryClient = new QueryClient();

    const router = createTanStackRouter({
        routeTree,
        context: { queryClient },
        defaultPreload: 'intent',
        defaultErrorComponent: DefaultCatchBoundary,
        defaultNotFoundComponent: () => <NotFound />
    });
    setupRouterSsrQueryIntegration({
        router,
        queryClient
    });

    return router;
}

declare module '@tanstack/react-router' {
    interface Register {
        router: ReturnType<typeof getRouter>;
    }
}
