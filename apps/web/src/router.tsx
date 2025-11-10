import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import { createRouter as createTanStackRouter } from '@tanstack/react-router';
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query';
import DefaultCatchBoundary from '@/shared/components/common/default-catch-boundry';
import NotFound from '@/shared/components/common/not-found';
import { routeTree } from './routeTree.gen';

export function getRouter() {
    const handleAuthError = (error: unknown) => {
        if (error instanceof Error && error.message === 'UNAUTHORIZED') {
            if (typeof window !== 'undefined') {
                window.location.href = '/sign-in';
            }
        }
    };

    const queryClient = new QueryClient({
        queryCache: new QueryCache({
            onError: handleAuthError
        }),
        mutationCache: new MutationCache({
            onError: handleAuthError
        }),
        defaultOptions: {
            queries: {
                retry: (failureCount, error) => {
                    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
                        return false;
                    }
                    return failureCount < 3;
                }
            }
        }
    });

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
