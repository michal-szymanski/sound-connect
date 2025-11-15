---
name: tanstack-query
description: TanStack Query patterns for Sound Connect - queries, mutations, infinite queries, optimistic updates, cache invalidation, and server state management
---

# TanStack Query Skill for Sound Connect

## Core Concepts

1. **Query-First Architecture** - All server state managed through queries
2. **Optimistic Updates** - Immediate UI updates with rollback on error
3. **Cache Invalidation** - Smart cache updates across related queries
4. **Infinite Queries** - Pagination with automatic page management
5. **Suspense Integration** - Leverages React Suspense for loading states

## Sound Connect Patterns

### 1. Query Definition
```tsx
// apps/web/src/shared/lib/react-query.ts
import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';

export const authQuery = (data?: { user: User | null; accessToken: string | undefined }) =>
    queryOptions({
        queryKey: ['user'],
        queryFn: async () => {
            if (data) return data;

            const result = await getAuth();
            if (result.success) {
                return result.body;
            }
            return { user: null, accessToken: undefined };
        }
    });

export const useAuth = () => useSuspenseQuery(authQuery());
```

### 2. Infinite Query for Pagination
```tsx
// apps/web/src/features/posts/hooks/use-posts.ts
export const feedQuery = () =>
    infiniteQueryOptions({
        queryKey: ['feed-infinite'],
        queryFn: async ({ pageParam }) => {
            const result = await getFeedPaginated({
                data: { limit: 10, offset: pageParam }
            });
            return result.success ? result.body : [];
        },
        initialPageParam: 0,
        getNextPageParam: (lastPage, allPages) => {
            if (lastPage.length < 10) return undefined;
            return allPages.length * 10;
        }
    });

export const useFeed = () => useInfiniteQuery(feedQuery());
```

### 3. Mutation with Optimistic Updates
```tsx
export const useLikeToggle = (postId: number, currentUser: User | null) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (isLiked: boolean) => {
            const result = isLiked
                ? await unlikePost({ data: { postId } })
                : await likePost({ data: { postId } });

            if (!result.success) {
                throw new Error('Failed to update like status');
            }
            return result;
        },
        onMutate: async (isLiked: boolean) => {
            // Cancel queries to prevent overwrites
            await queryClient.cancelQueries({ queryKey: ['feed-infinite'] });

            // Snapshot previous value
            const previousData = queryClient.getQueryData(['feed-infinite']);

            // Optimistically update
            queryClient.setQueryData(['feed-infinite'], (old: any) => {
                if (!old || !currentUser) return old;

                return {
                    ...old,
                    pages: old.pages.map((page) =>
                        page.map((item) => {
                            if (item.post.id !== postId) return item;

                            if (isLiked) {
                                // Remove like
                                return {
                                    ...item,
                                    reactions: item.reactions.filter(
                                        (r) => r.userId !== currentUser.id
                                    )
                                };
                            } else {
                                // Add like
                                return {
                                    ...item,
                                    reactions: [...item.reactions, {
                                        id: Date.now(),
                                        userId: currentUser.id,
                                        postId,
                                        createdAt: new Date().toISOString()
                                    }]
                                };
                            }
                        })
                    )
                };
            });

            return { previousData };
        },
        onError: (err, variables, context) => {
            // Rollback on error
            if (context?.previousData) {
                queryClient.setQueryData(['feed-infinite'], context.previousData);
            }
            toast.error('Failed to update');
        },
        onSuccess: () => {
            // Invalidate to refetch
            queryClient.invalidateQueries({ queryKey: ['feed-infinite'] });
        }
    });
};
```

### 4. Dependent Queries
```tsx
// Query depends on auth state
export const useUserProfile = (userId: string) => {
    const { data: auth } = useAuth();

    return useQuery({
        queryKey: ['profile', userId],
        queryFn: async () => {
            const result = await getProfile({ data: { userId } });
            return result.success ? result.body : null;
        },
        enabled: !!auth?.user // Only run when authenticated
    });
};
```

### 5. Query Invalidation Patterns
```tsx
// Invalidate specific queries after mutation
const createPost = useMutation({
    mutationFn: async (data: CreatePostInput) => {
        const result = await createPostAPI({ data });
        if (!result.success) throw new Error('Failed');
        return result.body;
    },
    onSuccess: () => {
        // Invalidate multiple related queries
        queryClient.invalidateQueries({ queryKey: ['feed-infinite'] });
        queryClient.invalidateQueries({ queryKey: ['user-posts'] });
        queryClient.invalidateQueries({ queryKey: ['band-posts'] });
    }
});
```

### 6. Prefetching in Loaders
```tsx
// Route loader prefetching
export const Route = createFileRoute('/(main)/')({
    loader: async ({ context: { queryClient, user } }) => {
        // Parallel prefetching
        await Promise.all([
            queryClient.ensureQueryData(authQuery()),
            queryClient.ensureInfiniteQueryData(feedQuery()),
            queryClient.ensureQueryData(followersQuery(user))
        ]);
    }
});
```

### 7. Custom Query Options
```tsx
export const followRequestStatusQuery = (userId: string) =>
    queryOptions({
        queryKey: ['follow-request-status', userId],
        queryFn: async () => {
            const result = await getFollowRequestStatus({ data: { userId } });
            if (!result.success) {
                throw new Error('Failed to get status');
            }
            return result.body;
        },
        staleTime: 1000 * 30, // Consider data stale after 30s
        gcTime: 1000 * 60 * 5, // Garbage collect after 5 min
        retry: 2 // Retry failed requests twice
    });
```

## Common Tasks

### Creating a New Query
1. Define query function with queryOptions
2. Create custom hook using useQuery/useSuspenseQuery
3. Add error handling in queryFn
4. Export from feature's hooks file

### Implementing Pagination
1. Use infiniteQueryOptions
2. Define getNextPageParam logic
3. Handle pageParam in queryFn
4. Use fetchNextPage in component

### Adding Optimistic Updates
1. Implement onMutate to update cache
2. Store previous data for rollback
3. Handle onError to restore state
4. Invalidate on success for consistency

### Cache Management
1. Use queryClient.invalidateQueries for updates
2. Use queryClient.setQueryData for direct updates
3. Use queryClient.cancelQueries before optimistic updates
4. Configure staleTime and gcTime appropriately

## Anti-Patterns to Avoid

- ❌ Using useEffect for data fetching instead of queries
- ❌ Not handling error states in queryFn
- ❌ Forgetting to cancel queries before optimistic updates
- ❌ Over-invalidating queries causing unnecessary refetches
- ❌ Not using Suspense variants when available
- ❌ Mutating cache data directly instead of creating new objects

## Integration Guide

- **With Router**: Loaders use queryClient for prefetching
- **With React**: Hooks provide loading/error states automatically
- **With Server Functions**: queryFn calls server functions
- **With Suspense**: useSuspenseQuery for cleaner loading states
- **With Forms**: Mutations handle form submissions

## Quick Reference

```tsx
// Query template
export const dataQuery = (id: string) =>
    queryOptions({
        queryKey: ['data', id],
        queryFn: async () => {
            const result = await fetchData({ data: { id } });
            if (!result.success) throw new Error('Failed');
            return result.body;
        },
        staleTime: 1000 * 60,
        gcTime: 1000 * 60 * 10
    });

export const useData = (id: string) => useSuspenseQuery(dataQuery(id));

// Mutation template
export const useUpdateData = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: UpdateInput) => {
            const result = await updateAPI({ data });
            if (!result.success) throw new Error('Failed');
            return result.body;
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({
                queryKey: ['data', variables.id]
            });
        }
    });
};
```

## Real Examples from Codebase

- **Auth Query**: `apps/web/src/shared/lib/react-query.ts`
- **Infinite Query**: `apps/web/src/features/posts/hooks/use-posts.ts`
- **Optimistic Updates**: `apps/web/src/features/posts/hooks/use-posts.ts:useLikeToggle`
- **Mutations**: `apps/web/src/features/bands/hooks/use-bands.ts`
- **Prefetching**: `apps/web/src/routes/(main)/index.tsx`
