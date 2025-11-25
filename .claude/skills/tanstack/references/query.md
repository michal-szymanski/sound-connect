# Tanstack Query Reference

Data fetching and caching patterns for Sound Connect frontend.

## Hook Organization

Hooks are organized by feature in `src/features/{feature}/hooks/`:

```
features/
├── bands/hooks/use-bands.ts          # Band CRUD, members, follows
├── posts/hooks/use-posts.ts          # Feed, reactions, comments
├── profile/hooks/use-profile.ts      # Profile updates
├── chat/hooks/use-conversations.ts   # Messaging
└── settings/hooks/use-settings.ts    # User settings
```

Shared queries live in `src/shared/lib/react-query.ts`.

## Query Key Conventions

Use consistent array-based keys with entity type and identifier:

```tsx
// Entity queries
['band', bandId]              // Single band
['user-bands', userId]        // User's bands list
['profile', userId]           // User profile

// Related data
['band-posts', bandId]        // Band's posts
['band-followers', bandId]    // Band's followers
['is-following-band', bandId] // Following status

// Paginated/infinite
['feed-infinite']             // Main feed
['comments', postId]          // Post comments

// Status checks
['follow-request-status', userId]
```

## useQuery - Standard Data Fetching

For data that needs loading states in the component.

```tsx
export const useBand = (bandId: number) => {
    return useQuery({
        queryKey: ['band', bandId],
        queryFn: async () => {
            const result = await getBand({ data: { bandId } });
            if (!result.success) {
                throw new Error(result.body?.message || 'Failed to load band');
            }
            return result.body;
        },
        staleTime: 5 * 60 * 1000  // 5 minutes
    });
};

// Usage in component
function BandPage({ bandId }: { bandId: number }) {
    const { data: band, isLoading, error } = useBand(bandId);

    if (isLoading) return <BandSkeleton />;
    if (error) return <ErrorAlert message={error.message} />;
    if (!band) return <NotFound />;

    return <BandProfile band={band} />;
}
```

## useSuspenseQuery - SSR/Prefetched Data

For data prefetched in loaders. No loading state needed.

```tsx
// Query factory for loader
export const userBandsQuery = (userId: string) => ({
    queryKey: ['user-bands', userId],
    queryFn: async () => {
        const result = await getUserBands({ data: { userId } });
        if (!result.success) {
            throw new Error(result.body?.message || 'Failed to load bands');
        }
        return result.body;
    },
    staleTime: 5 * 60 * 1000
});

// Hook using suspense
export const useUserBands = (userId: string) => {
    return useSuspenseQuery(userBandsQuery(userId));
};

// Route with loader
export const Route = createFileRoute('/(main)/bands/')({
    loader: async ({ context: { queryClient, user } }) => {
        await queryClient.ensureQueryData(userBandsQuery(user.id));
    }
});

// Component - data is guaranteed to exist
function BandsPage() {
    const { data: auth } = useAuth();
    const { data: bands } = useUserBands(auth.user.id);
    // No loading check needed - data is prefetched
    return <BandsList bands={bands} />;
}
```

## useInfiniteQuery - Paginated Data

For infinite scroll or paginated lists.

```tsx
// Offset-based pagination (feed)
export const feedQuery = () =>
    infiniteQueryOptions({
        queryKey: ['feed-infinite'],
        queryFn: async ({ pageParam }) => {
            const result = await getFeedPaginated({
                data: { limit: 10, offset: pageParam }
            });
            if (result.success) return result.body;
            return [];
        },
        initialPageParam: 0,
        getNextPageParam: (lastPage, allPages) => {
            if (lastPage.length < 10) return undefined;
            return allPages.length * 10;
        }
    });

export const useFeed = () => useInfiniteQuery(feedQuery());

// Page-based pagination (band posts)
export const useBandPosts = (bandId: number) => {
    return useInfiniteQuery({
        queryKey: ['band-posts', bandId],
        queryFn: async ({ pageParam = 1 }) => {
            const result = await getBandPosts({
                data: { bandId, page: pageParam, limit: 20 }
            });
            if (!result.success) {
                throw new Error(result.body?.message || 'Failed to load posts');
            }
            return result.body;
        },
        initialPageParam: 1,
        getNextPageParam: (lastPage) => {
            return lastPage.pagination.hasMore
                ? lastPage.pagination.page + 1
                : undefined;
        },
        staleTime: 1 * 60 * 1000
    });
};

// Usage with infinite scroll
function Feed() {
    const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useFeed();
    const feed = data?.pages.flat() ?? [];

    useEffect(() => {
        const handleScroll = () => {
            if (isFetchingNextPage || !hasNextPage) return;

            const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
            const isNearBottom = scrollTop + clientHeight >= scrollHeight - 1000;

            if (isNearBottom) {
                fetchNextPage();
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

    return (
        <>
            {feed.map((item) => <Post key={item.post.id} item={item} />)}
            {isFetchingNextPage && <PostSkeleton />}
        </>
    );
}
```

## useMutation - Create/Update/Delete

For operations that modify server state.

### Basic Mutation

```tsx
export const useCreateBand = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    return useMutation({
        mutationFn: async (data: CreateBandInput) => {
            const result = await createBand({ data });
            if (!result.success) {
                throw new Error(result.body?.message || 'Failed to create band');
            }
            return result.body;
        },
        onSuccess: (band) => {
            queryClient.invalidateQueries({ queryKey: ['user-bands'] });
            toast.success('Band created successfully');
            navigate({ to: `/bands/${band.id}` });
        },
        onError: (error: Error) => {
            toast.error(error.message);
        }
    });
};
```

### Mutation with Multiple Invalidations

```tsx
export const useUpdateBand = (bandId: number) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: UpdateBandInput) => {
            const result = await updateBand({ data: { ...data, bandId } });
            if (!result.success) {
                throw new Error(result.body?.message || 'Failed to update band');
            }
            return result.body;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['band', bandId] });
            queryClient.invalidateQueries({ queryKey: ['user-bands'] });
            toast.success('Band updated successfully');
        },
        onError: (error: Error) => {
            toast.error(error.message);
        }
    });
};
```

## Optimistic Updates

For instant UI feedback before server confirmation.

```tsx
export const useFollowBand = (bandId: number) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            const result = await followBand({ data: { bandId } });
            if (!result.success) {
                throw new Error(result.body?.message || 'Failed to follow band');
            }
            return result.body;
        },
        onMutate: async () => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: ['is-following-band', bandId] });
            await queryClient.cancelQueries({ queryKey: ['band-follower-count', bandId] });

            // Snapshot previous values
            const previousIsFollowing = queryClient.getQueryData(['is-following-band', bandId]);
            const previousCount = queryClient.getQueryData(['band-follower-count', bandId]);

            // Optimistically update
            queryClient.setQueryData(['is-following-band', bandId], { isFollowing: true });
            queryClient.setQueryData(
                ['band-follower-count', bandId],
                (old: { count: number } | undefined) => ({
                    count: (old?.count ?? 0) + 1
                })
            );

            // Return rollback data
            return { previousIsFollowing, previousCount };
        },
        onError: (error: Error, _variables, context) => {
            // Rollback on error
            if (context?.previousIsFollowing) {
                queryClient.setQueryData(['is-following-band', bandId], context.previousIsFollowing);
            }
            if (context?.previousCount) {
                queryClient.setQueryData(['band-follower-count', bandId], context.previousCount);
            }
            toast.error(error.message);
        },
        onSettled: () => {
            // Refetch to ensure consistency
            queryClient.invalidateQueries({ queryKey: ['is-following-band', bandId] });
            queryClient.invalidateQueries({ queryKey: ['band-follower-count', bandId] });
        }
    });
};
```

### Complex Optimistic Updates (Feed)

```tsx
export const useLikeToggle = (postId: number, currentUser: User | null) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (isLiked: boolean) => {
            const result = isLiked
                ? await unlikePost({ data: { postId } })
                : await likePost({ data: { postId } });
            if (!result.success) throw new Error('Failed to update like status');
            return result;
        },
        onMutate: async (isLiked: boolean) => {
            await queryClient.cancelQueries({ queryKey: ['feed-infinite'] });
            const previousFeedData = queryClient.getQueryData(['feed-infinite']);

            // Update infinite query data
            queryClient.setQueryData(
                ['feed-infinite'],
                (old: { pages: FeedItem[][]; pageParams: number[] } | undefined) => {
                    if (!old || !currentUser) return old;

                    return {
                        ...old,
                        pages: old.pages.map((page) =>
                            page.map((item) => {
                                if (item.post.id !== postId) return item;

                                if (isLiked) {
                                    return {
                                        ...item,
                                        reactions: item.reactions.filter(
                                            (r) => r.userId !== currentUser.id
                                        )
                                    };
                                } else {
                                    return {
                                        ...item,
                                        reactions: [
                                            ...item.reactions,
                                            {
                                                id: Date.now(),
                                                userId: currentUser.id,
                                                postId,
                                                createdAt: new Date().toISOString()
                                            }
                                        ]
                                    };
                                }
                            })
                        )
                    };
                }
            );

            return { previousFeedData };
        },
        onError: (error, _variables, context) => {
            if (context?.previousFeedData) {
                queryClient.setQueryData(['feed-infinite'], context.previousFeedData);
            }
            toast.error('Failed to update like status');
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['feed-infinite'] });
        }
    });
};
```

## Query Options & Factories

Use `queryOptions` for reusable query configs and loader prefetching.

```tsx
import { queryOptions } from '@tanstack/react-query';

// Query factory
export const authQuery = (data?: { user: User | null; accessToken: string | undefined }) =>
    queryOptions({
        queryKey: ['user'],
        queryFn: async () => {
            if (data) return data;
            const result = await getAuth();
            if (result.success) return result.body;
            return { user: null, accessToken: undefined };
        }
    });

// Use in loader
loader: async ({ context: { queryClient } }) => {
    await queryClient.ensureQueryData(authQuery());
}

// Use with hook
export const useAuth = () => useSuspenseQuery(authQuery());
```

## Conditional Queries

```tsx
export const useComments = (postId: number, enabled: boolean = true) =>
    useQuery({
        ...commentsQuery(postId),
        enabled
    });

// Usage - only fetch when expanded
const [showComments, setShowComments] = useState(false);
const { data: comments } = useComments(postId, showComments);
```

## StaleTime Reference

| Data Type | staleTime | Rationale |
|-----------|-----------|-----------|
| Static data (envs) | Infinity | Never changes |
| User profile | 5 minutes | Rarely changes |
| Band data | 5 minutes | Moderately static |
| Feed posts | 1 minute | Updates frequently |
| Follow status | 30 seconds | UI-critical, quick sync |
