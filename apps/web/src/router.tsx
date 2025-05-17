import { QueryClient } from '@tanstack/react-query';
import { AnyRouter, createRouter as createTanStackRouter } from '@tanstack/react-router';
import { routerWithQueryClient } from '@tanstack/react-router-with-query';
import { routeTree } from './routeTree.gen';
import DefaultCatchBoundary from '@/web/components/default-catch-boundry';
import NotFound from '@/web/components/not-found';

export const createRouter = (): AnyRouter => {
    const queryClient = new QueryClient();

    return routerWithQueryClient(
        createTanStackRouter({
            routeTree,
            context: { queryClient },
            defaultPreload: 'intent',
            defaultErrorComponent: DefaultCatchBoundary,
            defaultNotFoundComponent: () => <NotFound />
        }),
        queryClient
    );
};

declare module '@tanstack/react-router' {
    interface Register {
        router: ReturnType<typeof createRouter>;
    }
}
