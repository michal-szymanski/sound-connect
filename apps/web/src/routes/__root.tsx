/// <reference types="vite/client" />
import { type ReactNode } from 'react';
import { Outlet, createRootRouteWithContext, HeadContent, Scripts } from '@tanstack/react-router';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import globalsCss from '@/web/styles/globals.css?url';
import type { QueryClient } from '@tanstack/react-query';
import { getSession } from '@/web/server-functions/auth';
import { Toaster } from '@/web/components/ui/sonner';
import { APP_NAME } from '@sound-connect/common/constants';

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
        const result = await getSession();

        if (result.success) {
            return { user: result.body };
        }

        return { user: null };
    }
});

function RootComponent() {
    return (
        <RootDocument>
            <Outlet />
        </RootDocument>
    );
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
    return (
        <html className="dark">
            <head>
                <HeadContent />
            </head>
            <body>
                {children}
                {/* <TanStackRouterDevtools position="bottom-right" />
                <ReactQueryDevtools buttonPosition="bottom-right" /> */}
                <Toaster position="top-right" duration={7000} />
                <Scripts />
            </body>
        </html>
    );
}
