---
name: tanstack
description: Guide for implementing Tanstack Router, Query, and Start patterns. Use when building routes, data fetching hooks, server functions, or handling navigation and search params in the frontend.
---

# Tanstack Stack

Guide for implementing Tanstack Router, Query, and Start in the Sound Connect frontend. This skill covers routing, data fetching, caching, and server functions.

## Quick Reference

### Router Essentials

```tsx
// File-based route
export const Route = createFileRoute('/(main)/bands/$id')({
    component: RouteComponent,
    beforeLoad: async ({ context }) => {
        if (!context.user) throw redirect({ to: '/sign-in' });
        return { user: context.user };
    },
    loader: async ({ params, context: { queryClient } }) => {
        const bandId = parseInt(params.id, 10);
        await queryClient.ensureQueryData(bandQuery(bandId));
        return { bandId };
    },
    validateSearch: (search) => ({
        page: search['page'] ? Number(search['page']) : 1
    })
});

// Navigation
const navigate = useNavigate();
navigate({ to: '/bands/$id', params: { id: '123' } });
navigate({ to: '/musicians', search: { city: 'NYC' }, replace: true });

// Links
<Link to="/bands/$id" params={{ id: band.id }}>View Band</Link>
```

### Query Essentials

```tsx
// Basic query hook
export const useBand = (bandId: number) => useQuery({
    queryKey: ['band', bandId],
    queryFn: async () => {
        const result = await getBand({ data: { bandId } });
        if (!result.success) throw new Error(result.body?.message);
        return result.body;
    },
    staleTime: 5 * 60 * 1000
});

// Query factory for loaders
export const bandQuery = (bandId: number) => queryOptions({
    queryKey: ['band', bandId],
    queryFn: async () => { /* ... */ }
});

// Mutation with cache invalidation
export const useCreateBand = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data) => { /* ... */ },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-bands'] });
        }
    });
};
```

### Server Function Essentials

```tsx
// Server function with middleware and validation
export const getBand = createServerFn()
    .middleware([authMiddleware])
    .inputValidator(z.object({ bandId: z.number() }))
    .handler(async ({ data, context: { env, auth } }) => {
        const response = await env.API.fetch(`${env.API_URL}/api/bands/${data.bandId}`, {
            headers: { ...(auth.cookie && { Cookie: auth.cookie }) },
            credentials: 'include'
        });
        if (!response.ok) return await apiErrorHandler(response);
        return success(bandSchema.parse(await response.json()));
    });
```

## When to Use

| Pattern | Use Case |
|---------|----------|
| `beforeLoad` | Auth guards, redirects, context setup |
| `loader` | Prefetch data before render |
| `validateSearch` | Type-safe URL search params |
| `useQuery` | Standard data fetching with loading states |
| `useSuspenseQuery` | SSR/loader prefetched data |
| `useInfiniteQuery` | Paginated/infinite scroll data |
| `useMutation` | Create/update/delete operations |
| `createServerFn` | Server-side API calls |

## Resources

Detailed documentation in `references/`:

- **[router.md](references/router.md)** - File-based routing, guards, loaders, search params
- **[query.md](references/query.md)** - Hooks, query keys, mutations, optimistic updates
- **[start.md](references/start.md)** - Server functions, middleware, response helpers

## Context7 Integration

For official documentation, use Context7 MCP:

```
// Resolve library IDs first
mcp__context7__resolve-library-id({ libraryName: "tanstack router" })
mcp__context7__resolve-library-id({ libraryName: "tanstack query" })
mcp__context7__resolve-library-id({ libraryName: "tanstack start" })

// Then fetch docs with topics
mcp__context7__get-library-docs({
    context7CompatibleLibraryID: "/tanstack/router",
    topic: "file-based routing"
})
```

Common topics: `file-based routing`, `loaders`, `search params`, `useQuery`, `useMutation`, `server functions`
