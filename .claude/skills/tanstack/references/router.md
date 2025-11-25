# Tanstack Router Reference

File-based routing patterns for Sound Connect frontend.

## Route File Structure

```
apps/web/src/routes/
├── __root.tsx           # Root layout, global context setup
├── (auth)/              # Auth route group (unauthenticated)
│   ├── route.tsx        # Group layout with video background
│   ├── sign-in/
│   ├── sign-up/
│   └── forgot-password/
├── (main)/              # Main app route group (authenticated)
│   ├── route.tsx        # Group layout with header, sidebar
│   ├── index.tsx        # Home page (/)
│   ├── musicians.tsx    # /musicians
│   ├── bands/
│   │   ├── index.tsx    # /bands
│   │   ├── new.tsx      # /bands/new
│   │   ├── search.tsx   # /bands/search
│   │   └── $id.tsx      # /bands/:id (dynamic)
│   └── users/
│       └── $id.tsx      # /users/:id (dynamic)
└── media/
    └── $key.tsx         # /media/:key
```

## Route Groups

Route groups `(groupName)` create shared layouts without affecting URLs.

```tsx
// (auth)/route.tsx - Unauthenticated layout
export const Route = createFileRoute('/(auth)')({
    component: RouteComponent,
    beforeLoad: ({ context: { user } }) => {
        if (user) {
            throw redirect({ to: '/' });
        }
    }
});

// (main)/route.tsx - Authenticated layout
export const Route = createFileRoute('/(main)')({
    component: RouteComponent,
    beforeLoad: async ({ context }) => {
        if (!context.user || !context.accessToken) {
            throw redirect({ to: '/sign-in' });
        }
        return {
            user: context.user,
            accessToken: context.accessToken
        };
    }
});
```

## Root Route

The `__root.tsx` sets up global context and authentication state.

```tsx
// __root.tsx
export const Route = createRootRouteWithContext<{
    queryClient: QueryClient;
}>()({
    head: () => ({
        meta: [
            { charSet: 'utf-8' },
            { name: 'viewport', content: 'width=device-width, initial-scale=1' },
            { title: APP_NAME }
        ],
        links: [{ rel: 'stylesheet', href: globalsCss }]
    }),
    component: RootComponent,
    beforeLoad: async ({ context: { queryClient } }) => {
        const result = await getAuth();
        const authData = result.success
            ? result.body
            : { user: null, accessToken: undefined };
        await queryClient.prefetchQuery(authQuery(authData));
        return authData;
    }
});
```

## Dynamic Routes

Use `$paramName` syntax for dynamic route segments.

```tsx
// bands/$id.tsx
export const Route = createFileRoute('/(main)/bands/$id')({
    component: RouteComponent,
    beforeLoad: async ({ context }) => {
        if (!context.user) {
            throw redirect({ to: '/sign-in' });
        }
    },
    loader: async ({ params }) => {
        const bandId = parseInt(params.id, 10);
        if (isNaN(bandId)) {
            throw notFound();
        }
        return { bandId };
    }
});

function RouteComponent() {
    const { bandId } = Route.useLoaderData();
    const { data: band } = useBand(bandId);
}
```

## Auth Guards (beforeLoad)

`beforeLoad` runs before the route renders. Use for auth checks and redirects.

```tsx
// Require authentication
beforeLoad: async ({ context }) => {
    if (!context.user) {
        throw redirect({ to: '/sign-in' });
    }
    return { user: context.user };
}

// Redirect if already authenticated
beforeLoad: ({ context: { user } }) => {
    if (user) {
        throw redirect({ to: '/' });
    }
}

// Access parent context
beforeLoad: async ({ context }: { context: { user: User } }) => {
    // context includes data returned from parent beforeLoad
}
```

## Data Loaders

`loader` prefetches data before rendering. Use with React Query.

```tsx
// Prefetch single query
loader: async ({ params, context: { queryClient } }) => {
    const bandId = parseInt(params.id, 10);
    await queryClient.ensureQueryData(bandQuery(bandId));
    return { bandId };
}

// Prefetch multiple queries
loader: async ({ context: { queryClient, user, accessToken } }) => {
    await queryClient.ensureQueryData(envsQuery());
    await queryClient.ensureInfiniteQueryData(feedQuery());
    await queryClient.ensureQueryData(authQuery({ user, accessToken }));
    await queryClient.ensureQueryData(followersQuery(user));
    await queryClient.ensureQueryData(followingsQuery(user));
}

// Return loader data for component
function RouteComponent() {
    const { bandId } = Route.useLoaderData();
}
```

## Search Params

Use `validateSearch` for type-safe URL search parameters.

```tsx
// musicians.tsx
export const Route = createFileRoute('/(main)/musicians')({
    component: MusiciansPage,
    validateSearch: (search: Record<string, unknown>) => {
        return {
            city: search['city'] as string | undefined,
            instruments: search['instruments']
                ? Array.isArray(search['instruments'])
                    ? search['instruments']
                    : [search['instruments']]
                : undefined,
            genres: search['genres']
                ? Array.isArray(search['genres'])
                    ? search['genres']
                    : [search['genres']]
                : undefined,
            radius: search['radius'] ? Number(search['radius']) : undefined,
            page: search['page'] ? Number(search['page']) : 1,
            limit: 12
        } as ProfileSearchParams;
    }
});

function MusiciansPage() {
    const searchParams = Route.useSearch();
    const navigate = useNavigate();

    // Update search params
    navigate({
        to: '/musicians',
        search: {
            city: filters.city,
            instruments: filters.instruments,
            page: filters.page,
            limit: 12
        },
        replace: true
    });
}
```

## Navigation

### useNavigate Hook

```tsx
const navigate = useNavigate();

// Navigate to static route
navigate({ to: '/' });

// Navigate with params
navigate({ to: '/bands/$id', params: { id: '123' } });

// Navigate with search params
navigate({
    to: '/musicians',
    search: { city: 'NYC', genres: ['rock'] },
    replace: true  // Replace history entry
});

// Navigate after mutation
const createBand = useCreateBand();
createBand.mutate(data, {
    onSuccess: (band) => {
        navigate({ to: `/bands/${band.id}` });
    }
});
```

### Link Component

```tsx
import { Link } from '@tanstack/react-router';

// Static link
<Link to="/">Home</Link>

// Dynamic link with params
<Link to="/bands/$id" params={{ id: band.id }}>
    View Band
</Link>

// Link with search params
<Link to="/musicians" search={{ city: band.city, genres: band.primaryGenre }}>
    Find Musicians
</Link>

// Active link styling (use className function)
<Link
    to="/bands"
    className={({ isActive }) =>
        isActive ? 'text-primary font-bold' : 'text-muted-foreground'
    }
>
    My Bands
</Link>
```

### useRouter Hook

```tsx
const router = useRouter();

// Invalidate and refetch all route data (useful after auth changes)
await router.invalidate();
```

## Hooks Reference

| Hook | Purpose |
|------|---------|
| `Route.useLoaderData()` | Access data returned from loader |
| `Route.useSearch()` | Access validated search params |
| `useNavigate()` | Programmatic navigation |
| `useRouter()` | Router instance for invalidation |
| `useLocation()` | Current location info |
| `useRouteContext()` | Access route context |
| `useParams()` | Access route params |

## Error Handling

```tsx
import { notFound, redirect } from '@tanstack/react-router';

// Throw 404
loader: async ({ params }) => {
    const bandId = parseInt(params.id, 10);
    if (isNaN(bandId)) {
        throw notFound();
    }
}

// Redirect
beforeLoad: ({ context }) => {
    if (!context.user) {
        throw redirect({ to: '/sign-in' });
    }
}
```
