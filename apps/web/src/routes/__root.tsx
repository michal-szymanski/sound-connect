/// <reference types="vite/client" />
import { appConfig } from '@sound-connect/common/app-config';
import type { QueryClient } from '@tanstack/react-query';
import { Outlet, createRootRouteWithContext, HeadContent, Scripts, useLocation } from '@tanstack/react-router';
import { type ReactNode, useEffect } from 'react';
import { Toaster } from '@/shared/components/ui/sonner';
import { getAuth } from '@/features/auth/server-functions/auth';
import globalsCss from '@/web/styles/globals.css?url';
import { ThemeProvider } from '@/shared/components/providers/theme-provider';
import { authQuery } from '@/shared/lib/react-query';

export const Route = createRootRouteWithContext<{
    queryClient: QueryClient;
}>()({
    head: () => ({
        meta: [
            {
                charSet: 'utf-8'
            },
            {
                name: 'viewport',
                content: 'width=device-width, initial-scale=1'
            },
            {
                title: appConfig.appName
            }
        ],
        links: [
            {
                rel: 'stylesheet',
                href: globalsCss
            }
        ]
    }),
    component: RootComponent,
    beforeLoad: async ({ context: { queryClient } }) => {
        try {
            const result = await getAuth();
            const authData = result.success ? result.body : { user: null, accessToken: undefined };

            await queryClient.prefetchQuery(authQuery(authData));

            return authData;
        } catch {
            const authData = { user: null, accessToken: undefined };
            await queryClient.prefetchQuery(authQuery(authData));
            return authData;
        }
    }
});

function ScrollToTop() {
    const location = useLocation();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [location.pathname]);

    return null;
}

function RootComponent() {
    return (
        <RootDocument>
            <ScrollToTop />
            <Outlet />
        </RootDocument>
    );
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
    return (
        <html suppressHydrationWarning>
            <head>
                <HeadContent />
            </head>
            <body>
                <ThemeProvider>
                    {children}
                    {/* <TanStackRouterDevtools position="bottom-right" />
                    <ReactQueryDevtools buttonPosition="bottom-right" /> */}
                    <Toaster position="top-right" duration={7000} />
                </ThemeProvider>
                <Scripts />
            </body>
        </html>
    );
}
