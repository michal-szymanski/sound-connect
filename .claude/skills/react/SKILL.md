---
name: react
description: |
  React component patterns and hooks for Sound Connect. Use when creating React components, custom hooks, managing local state, handling forms, or working with React Context. Triggers: "React component", "hooks", "useState", "useEffect", "state management", "form handling", "useRef", "useCallback", "useMemo".
---

# React Patterns for Sound Connect

## File Organization

### Components
- Location: `apps/web/src/features/{feature}/components/`
- Naming: kebab-case files (e.g., `band-form.tsx`, `bio-section.tsx`)
- Export: Named exports via feature `index.ts` barrel files

### Hooks
- Feature hooks: `apps/web/src/features/{feature}/hooks/use-{name}.ts`
- Shared hooks: `apps/web/src/shared/hooks/use-{name}.ts`
- Export multiple related hooks from one file

### Barrel Exports
Each feature has an `index.ts` that exports components, hooks, and server functions:

```typescript
export { BandForm } from './components/band-form';
export { useBand, useCreateBand } from './hooks/use-bands';
export { createBand, getBand } from './server-functions/bands';
```

## Props Typing

ALWAYS use `type Props` (never `interface`):

```typescript
type Props = {
    initialData?: Partial<UpdateBandInput>;
    onSubmit: (data: CreateBandInput | UpdateBandInput) => void;
    isLoading: boolean;
};

export function BandForm({ initialData, onSubmit, isLoading }: Props) {
    // ...
}
```

For children, use `React.PropsWithChildren`:

```typescript
type Props = React.PropsWithChildren<{
    auth: { user: User; accessToken: string };
}>;
```

## State Management

### Local State (useState)
Use for form data and UI state:

```typescript
const [formData, setFormData] = useState<CreateBandInput>({
    name: initialData?.name || '',
    description: initialData?.description || ''
});
const [errors, setErrors] = useState<Record<string, string>>({});
```

### Server State Management

For data fetching, mutations, and cache management, see the **tanstack** skill which covers:
- useQuery, useSuspenseQuery, useInfiniteQuery
- useMutation with cache invalidation
- Optimistic updates
- Query key conventions

### React Context (Real-time Features)
Use for WebSocket connections and global real-time state:

```typescript
type ChatContext = {
    subscribeToRoom: (roomId: string) => void;
    sendMessage: (roomId: string, content: string) => void;
    status: 'connecting' | 'open' | 'error' | 'closed';
};

const Context = createContext<ChatContext | undefined>(undefined);

export const ChatProvider = ({ children, auth, envs }: Props) => {
    const ws = useRef<WebSocket | null>(null);
    const [status, setStatus] = useState<ChatStatus>('connecting');

    const sendMessage = useCallback((roomId: string, content: string) => {
        if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({ type: 'chat', content, roomId }));
        }
    }, []);

    return <Context.Provider value={{ sendMessage, status }}>{children}</Context.Provider>;
};

export const useChat = (): ChatContext => {
    const context = useContext(Context);
    if (!context) {
        throw new Error('useChat must be used within a ChatProvider');
    }
    return context;
};
```

## Common Hooks

### useRef
Use for mutable values that don't trigger re-renders:

```typescript
const ws = useRef<WebSocket | null>(null);
const inputRef = useRef<HTMLInputElement>(null);
```

### useCallback
Use for memoizing callbacks passed to child components:

```typescript
const handleSubmit = useCallback((data: FormData) => {
    onSubmit(data);
}, [onSubmit]);
```

### useMemo
Use for expensive computations:

```typescript
const filteredItems = useMemo(() => {
    return items.filter(item => item.name.includes(searchTerm));
}, [items, searchTerm]);
```

### useEffect
Use for side effects and subscriptions:

```typescript
useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
}, []);
```

## Form Handling

### With react-hook-form + zodResolver
For complex forms with validation feedback:

```typescript
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const formSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8).max(128)
});

const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '', password: '' }
});

const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const result = await signIn({ data: values });
    if (!result.success) {
        form.setError('email', { message: result.body.message });
    }
};

return (
    <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                            <Input {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </form>
    </Form>
);
```

### With useState + Manual Zod Validation
For simpler forms:

```typescript
const [formData, setFormData] = useState<CreateBandInput>({ name: '', description: '' });
const [errors, setErrors] = useState<Record<string, string>>({});

const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = createBandInputSchema.safeParse(formData);

    if (!result.success) {
        const fieldErrors: Record<string, string> = {};
        result.error.issues.forEach((issue) => {
            const path = issue.path[0];
            if (path) fieldErrors[path.toString()] = issue.message;
        });
        setErrors(fieldErrors);
        return;
    }

    setErrors({});
    onSubmit(result.data);
};
```

## Key Rules

1. **No comments in code** - Code should be self-documenting
2. **Use `type` not `interface`** - Unless declaration merging is required
3. **Named exports only** - No default exports
4. **Kebab-case file names** - e.g., `band-form.tsx`, `use-bands.ts`
5. **Props type always named `Props`** - Consistent naming
6. **Toast for user feedback** - Import from `sonner`
7. **Never modify `src/shared/components/ui/`** - ShadCN auto-generated

## Latest React Documentation

For up-to-date React documentation, use Context7 MCP:

1. Resolve library ID:
```
mcp__context7__resolve-library-id with libraryName: "react"
```

2. Fetch documentation:
```
mcp__context7__get-library-docs with the resolved library ID and topic (e.g., "hooks", "context")
```

## Key File Locations

- Components: `apps/web/src/features/{feature}/components/`
- Hooks: `apps/web/src/features/{feature}/hooks/`
- Shared hooks: `apps/web/src/shared/hooks/`
- Providers: `apps/web/src/shared/components/providers/`
- UI components: `apps/web/src/shared/components/ui/` (do not modify)
- Server functions: `apps/web/src/features/{feature}/server-functions/`
