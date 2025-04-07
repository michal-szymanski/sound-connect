import type { ReactNode } from "react";
import {
  Outlet,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
  redirect,
} from "@tanstack/react-router";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import globalsCss from "@/styles/globals.css?url";
import { SidebarProvider } from "src/components/ui/sidebar";
import LeftSidebar from "src/components/left-sidebar";
import Header from "src/components/header";
import type { QueryClient } from "@tanstack/react-query";
import { auth } from "@/lib/auth";
import { authClient } from "@/lib/auth-client";
import { createServerFn } from "@tanstack/react-start";
import { getWebRequest } from "@tanstack/react-start/server";

export const getSession = createServerFn().handler(async () => {
  const request = getWebRequest();

  if (!request?.headers) return null;

  const session = await auth.api.getSession({
    headers: request.headers,
  });

  return session;
});

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "TanStack Start Starter",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: globalsCss,
      },
    ],
  }),
  component: RootComponent,
  beforeLoad: async () => {
    // const { data: session, error } = await authClient.getSession();
    const session = getSession();
    console.log({ session });
    // if (!session) {
    //   throw redirect({
    //     to: "/sign-in",
    //   });
    // }

    // if (error) {
    //   throw new Error(error.message);
    // }

    return { session };
  },
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
        <TanStackRouterDevtools position="bottom-right" />
        <ReactQueryDevtools buttonPosition="bottom-left" />
        <Scripts />
      </body>
    </html>
  );
}
