/// <reference types="vite/client" />
import { APP_NAME } from '@/common/constants';
import type { QueryClient } from '@tanstack/react-query';
import { Outlet, createRootRouteWithContext, HeadContent, Scripts, useLocation } from '@tanstack/react-router';
import { type ReactNode, useEffect } from 'react';
import { Toaster } from '@/web/components/ui/sonner';
import { getAuth } from '@/web/server-functions/auth';
import globalsCss from '@/web/styles/globals.css?url';
import { ThemeProvider } from '@/web/components/providers/theme-provider';

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
                title: APP_NAME
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
    beforeLoad: async () => {
        try {
            const result = await getAuth();

            if (result.success) {
                return result.body;
            }

            return { user: null, accessToken: undefined };
        } catch {
            return { user: null, accessToken: undefined };
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
