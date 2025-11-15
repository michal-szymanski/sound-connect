---
name: tanstack-router
description: TanStack Router patterns for Sound Connect - file-based routing, loaders, protected routes, navigation, search params, and SSR integration
---

# TanStack Router Skill for Sound Connect

## Core Concepts

1. **File-Based Routing** - Routes defined by file structure in `src/routes/`
2. **Type-Safe Navigation** - Full type safety for routes and params
3. **Data Prefetching** - Loaders run before component renders
4. **Route Layouts** - Shared layouts via route groups `(main)`
5. **SSR Integration** - Server-side rendering with streaming support

## Sound Connect Patterns

### 1. Route Definition
```tsx
// apps/web/src/routes/(main)/bands/$id.tsx
import { createFileRoute, notFound, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/(main)/bands/$id' as any)({
    component: RouteComponent,
    beforeLoad: async ({ context }: any) => {
        const { user } = context;
        if (!user) {
            throw redirect({ to: '/sign-in' });
        }
    },
    loader: async ({ params, context: { queryClient } }: any) => {
        const bandId = parseInt(params.id, 10);
        if (isNaN(bandId)) {
            throw notFound();
        }
        // Prefetch data
        await queryClient.ensureQueryData(bandQuery(bandId));
        return { bandId };
    }
});

function RouteComponent() {
    const { bandId } = Route.useLoaderData();
    // Component implementation
}
```

### 2. Route with Query Prefetching
```tsx
// apps/web/src/routes/(main)/index.tsx
export const Route = createFileRoute('/(main)/')({
    component: RouteComponent,
    loader: async ({ context: { queryClient, user, accessToken } }) => {
        // Prefetch multiple queries in parallel
        await Promise.all([
            queryClient.ensureQueryData(envsQuery()),
            queryClient.ensureInfiniteQueryData(feedQuery()),
            queryClient.ensureQueryData(authQuery({ user, accessToken })),
            queryClient.ensureQueryData(followersQuery(user)),
            queryClient.ensureQueryData(followingsQuery(user))
        ]);
    }
});
```

### 3. Protected Routes
```tsx
// Authentication check in beforeLoad
beforeLoad: async ({ context }: any) => {
    const { user } = context;
    if (!user) {
        throw redirect({
            to: '/sign-in',
            search: { redirect: location.pathname }
        });
    }
}
```

### 4. Dynamic Navigation
```tsx
// Type-safe navigation with params
import { Link, useNavigate } from '@tanstack/react-router';

// Link component
<Link
    to="/bands/$id"
    params={{ id: String(bandId) }}
    className="hover:underline"
>
    {bandName}
</Link>

// Programmatic navigation
const navigate = useNavigate();
navigate({
    to: '/bands/$id',
    params: { id: String(bandId) }
});
```

### 5. Search Params
```tsx
// Reading search params
const { query, genres, radius } = Route.useSearch();

// Setting search params
<Link
    to="/musicians"
    search={{
        city: band.city,
        genres: band.primaryGenre,
        radius: 25
    }}
>
    Find Musicians
</Link>

// Building URLs with params
const buildSearchUrl = () => {
    const params = new URLSearchParams();
    if (city) params.set('city', city);
    if (genre) params.set('genre', genre);
    return `/musicians?${params.toString()}`;
};
```

### 6. Route Groups and Layouts
```tsx
// Route group layout: routes/(main).tsx
export const Route = createFileRoute('/(main)')({
    component: MainLayout
});

function MainLayout() {
    return (
        <div className="flex">
            <LeftSidebar />
            <main className="flex-1">
                <Outlet />
            </main>
            <RightSidebar />
        </div>
    );
}
```

### 7. Error Boundaries
```tsx
// Route-level error handling
export const Route = createFileRoute('/posts/$postId')({
    component: PostComponent,
    errorComponent: PostErrorComponent,
    notFoundComponent: () => <NotFound />,
    loader: async ({ params }) => {
        const post = await fetchPost(params.postId);
        if (!post) {
            throw notFound();
        }
        return post;
    }
});
```

## Common Tasks

### Creating a New Route
1. Create file in `apps/web/src/routes/` following naming convention
2. Export Route using `createFileRoute`
3. Add component and optional loader
4. Use route groups for shared layouts

### Adding Route Protection
1. Add `beforeLoad` hook to check authentication
2. Redirect to sign-in if not authenticated
3. Optionally save redirect URL in search params

### Implementing Data Loading
1. Add loader function to route
2. Use queryClient from context to prefetch data
3. Return data for component consumption
4. Access via `Route.useLoaderData()`

### Setting Up Nested Routes
1. Create parent route file
2. Add `<Outlet />` for child routes
3. Create child route files in subdirectory
4. Share data via route context

## Anti-Patterns to Avoid

- ❌ Using `any` type for route params - define proper types
- ❌ Fetching data in components instead of loaders
- ❌ Not handling loading/error states in routes
- ❌ Creating routes without proper file structure
- ❌ Ignoring TypeScript errors with `as any` unnecessarily

## Integration Guide

- **With TanStack Query**: Loaders prefetch queries via queryClient
- **With React**: Components receive route data via hooks
- **With Server Functions**: Loaders can call server functions
- **With Authentication**: beforeLoad hooks check auth state
- **With SSR**: Routes support streaming and progressive enhancement

## Quick Reference

```tsx
// Basic route template
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/path/$param')({
    component: RouteComponent,
    beforeLoad: async ({ context }) => {
        // Auth checks
    },
    loader: async ({ params, context: { queryClient } }) => {
        // Prefetch data
        await queryClient.ensureQueryData(query(params.param));
        return { param: params.param };
    }
});

function RouteComponent() {
    const { param } = Route.useLoaderData();
    const searchParams = Route.useSearch();

    return <div>{/* Content */}</div>;
}
```

## Real Examples from Codebase

- **Protected Route**: `apps/web/src/routes/(main)/bands/$id.tsx`
- **Route with Loader**: `apps/web/src/routes/(main)/index.tsx`
- **Layout Route**: `apps/web/src/routes/(main).tsx`
- **Dynamic Params**: `apps/web/src/routes/(main)/users/$id.tsx`
- **Search Params**: `apps/web/src/routes/(main)/musicians/index.tsx`
