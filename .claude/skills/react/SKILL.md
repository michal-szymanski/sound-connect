---
name: react
description: React patterns and conventions for Sound Connect - component architecture, hooks, state management, optimistic updates, and performance optimization with TanStack Start
---

# React Skill for Sound Connect

## Core Concepts

1. **Component-First Architecture** - Features are organized in self-contained folders with components, hooks, and server functions
2. **Suspense-First Data Loading** - Use React Suspense with TanStack Query for data fetching
3. **Type-Safe Props** - Always define Props type for components, never use FC or FunctionComponent
4. **Server Components Integration** - Leverage TanStack Start's server functions for data fetching
5. **Optimistic Updates** - Use mutations with optimistic UI updates for real-time feel

## Sound Connect Patterns

### 1. Component Organization
```tsx
// Always use named exports from feature folders
// apps/web/src/features/posts/components/post.tsx
import { FeedItem } from '@/common/types/models';

type Props = {
    item: FeedItem;
};

export function Post({ item }: Props) {
    // Component logic
}
```

### 2. Custom Hooks Pattern
```tsx
// Feature-specific hooks in dedicated files
// apps/web/src/features/posts/hooks/use-posts.ts
export const useLikeToggle = (postId: number, currentUser: User | null) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (isLiked: boolean) => {
            // API call
        },
        onMutate: async (isLiked: boolean) => {
            // Optimistic update
            await queryClient.cancelQueries({ queryKey: ['feed-infinite'] });
            // Update cache
        }
    });
};
```

### 3. Conditional Rendering
```tsx
// Use early returns for loading/error states
function RouteComponent() {
    const { data, isLoading, error } = useBand(bandId);

    if (isLoading) {
        return <BandSkeleton />;
    }

    if (error || !data) {
        return (
            <Alert variant="destructive">
                <AlertDescription>{error?.message}</AlertDescription>
            </Alert>
        );
    }

    // Main render
    return <BandContent band={data} />;
}
```

### 4. State Management
```tsx
// Local state for UI concerns
const [isModalOpen, setIsModalOpen] = useState(false);
const [formData, setFormData] = useState<CreateBandInput>({
    name: initialData?.name || '',
    description: initialData?.description || ''
});

// Server state via TanStack Query
const { data: auth } = useAuth();
const { data: band } = useBand(bandId);
```

### 5. Event Handlers
```tsx
// Inline for simple handlers
<Button onClick={() => setIsModalOpen(true)}>Open</Button>

// Named functions for complex logic
const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = schema.safeParse(formData);
    if (!result.success) {
        setErrors(mapErrors(result.error));
        return;
    }
    onSubmit(result.data);
};
```

### 6. Effect Management
```tsx
// Scroll-based pagination example
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
```

### 7. Memoization
```tsx
// Only use when necessary for expensive computations
const sortedBands = useMemo(() => {
    return bands.sort((a, b) => b.matchScore - a.matchScore);
}, [bands]);

// Callback memoization for child components
const handleLike = useCallback(() => {
    if (!canLike || !auth?.user) return;
    likeMutation.mutate(isLiked);
}, [canLike, auth?.user, likeMutation, isLiked]);
```

## Common Tasks

### Creating a New Feature Component
1. Create feature folder: `apps/web/src/features/[feature-name]/`
2. Add components subfolder: `components/`
3. Create component file with Props type
4. Export from feature index

### Adding Loading States
1. Create skeleton component in same feature folder
2. Use Suspense boundary in route component
3. Return skeleton from loading check

### Implementing Optimistic Updates
1. Use `onMutate` to update cache immediately
2. Save previous data for rollback
3. Handle error with `onError` to restore
4. Invalidate queries on success

## Anti-Patterns to Avoid

- ❌ Using `React.FC` or `FunctionComponent` - use explicit Props type
- ❌ Defining components inside other components
- ❌ Using `useEffect` for data fetching - use TanStack Query
- ❌ Mutating state directly - always create new objects/arrays
- ❌ Over-using `useMemo` and `useCallback` - profile first
- ❌ Using index as key in dynamic lists - use stable IDs

## Integration Guide

- **With TanStack Query**: All server state managed via hooks
- **With TanStack Router**: Components receive route params via props
- **With Server Functions**: Data fetching through createServerFn
- **With ShadCN**: Use UI components from `@/shared/components/ui/`
- **With Zod**: Validate forms and API responses

## Quick Reference

```tsx
// Component template
type Props = {
    data: DataType;
    onAction: (id: string) => void;
};

export function ComponentName({ data, onAction }: Props) {
    // Hooks at top
    const { data: auth } = useAuth();
    const [state, setState] = useState(false);

    // Early returns for edge cases
    if (!data) return null;

    // Event handlers
    const handleClick = () => {
        onAction(data.id);
    };

    // Main render
    return (
        <div className="component-class">
            {/* Content */}
        </div>
    );
}
```

## Real Examples from Codebase

- **Complex Component**: `apps/web/src/features/posts/components/post.tsx`
- **Custom Hooks**: `apps/web/src/features/posts/hooks/use-posts.ts`
- **Form Handling**: `apps/web/src/features/bands/components/band-form.tsx`
- **Optimistic Updates**: `apps/web/src/features/posts/hooks/use-posts.ts:useLikeToggle`
- **Loading States**: `apps/web/src/routes/(main)/bands/$id.tsx`
