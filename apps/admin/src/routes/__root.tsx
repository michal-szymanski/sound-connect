import { appConfig } from '@sound-connect/common/app-config';
import type { QueryClient } from '@tanstack/react-query';
import { Outlet, createRootRouteWithContext, HeadContent, Scripts } from '@tanstack/react-router';
import { type ReactNode } from 'react';
import { Toaster } from '@/shared/components/ui/sonner';
import { adminSessionQuery } from '@/shared/hooks/use-admin-session';
import globalsCss from '@/styles/globals.css?url';

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
                title: `${appConfig.appName} - Admin Dashboard`
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
            await queryClient.prefetchQuery(adminSessionQuery());
        } catch {}
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
        <html>
            <head>
                <HeadContent />
            </head>
            <body>
                {children}
                <Toaster position="top-right" duration={5000} />
                <Scripts />
            </body>
        </html>
    );
}
