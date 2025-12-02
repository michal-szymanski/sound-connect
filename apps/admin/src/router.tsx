import { QueryClient } from '@tanstack/react-query';
import { createRouter as createTanStackRouter } from '@tanstack/react-router';
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query';
import { routeTree } from './routeTree.gen';

export function getRouter() {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 1000 * 60 * 5,
                gcTime: 1000 * 60 * 30,
                retry: 1
            }
        }
    });

    const router = createTanStackRouter({
        routeTree,
        context: { queryClient },
        defaultPreload: 'intent',
        defaultNotFoundComponent: () => (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center">
                    <h1 className="text-4xl font-bold">404</h1>
                    <p className="mt-2 text-muted-foreground">Page not found</p>
                </div>
            </div>
        )
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
