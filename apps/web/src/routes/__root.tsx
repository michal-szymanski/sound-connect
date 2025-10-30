/// <reference types="vite/client" />
import { APP_NAME } from '@/common/constants';
import type { QueryClient } from '@tanstack/react-query';
import { Outlet, createRootRouteWithContext, HeadContent, Scripts } from '@tanstack/react-router';
import { type ReactNode } from 'react';
import { Toaster } from '@/web/components/ui/sonner';
import { getUser } from '@/web/server-functions/auth';
import globalsCss from '@/web/styles/globals.css?url';

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
            const result = await getUser();

            if (result.success) {
                return { user: result.body };
            }

            return { user: null };
        } catch (_error) {
            return { user: null };
        }
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
