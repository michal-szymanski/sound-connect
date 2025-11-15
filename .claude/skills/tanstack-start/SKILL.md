---
name: tanstack-start
description: TanStack Start patterns for Sound Connect - server functions, middleware, SSR, file uploads, Cloudflare Workers deployment, and environment variables
---

# TanStack Start Skill for Sound Connect

## Core Concepts

1. **Server Functions** - Type-safe RPC-style server communication
2. **SSR with Streaming** - Progressive enhancement and fast initial loads
3. **File-Based Routing** - Convention over configuration
4. **Middleware System** - Composable request handling
5. **Cloudflare Workers** - Edge deployment with D1, R2, and Durable Objects

## Sound Connect Patterns

### 1. Server Function Definition
```tsx
// apps/web/src/shared/server-functions/users.ts
import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { apiErrorHandler, failure, success } from '@/shared/server-functions/helpers';
import { authMiddleware } from '@/shared/server-functions/middlewares';

export const getFollowers = createServerFn()
    .middleware([authMiddleware])
    .inputValidator(z.object({ userId: z.string() }))
    .handler(async ({ data, context: { env, auth } }) => {
        const response = await env.API.fetch(
            `${env.API_URL}/api/users/${data.userId}/followers`,
            {
                headers: {
                    ...(auth.cookie && { Cookie: auth.cookie })
                },
                credentials: 'include'
            }
        );

        if (!response.ok) {
            return await apiErrorHandler(response);
        }

        const json = await response.json();
        const schema = z.array(userDTOSchema);
        return success(schema.parse(json));
    });
```

### 2. Middleware Pattern
```tsx
// apps/web/src/shared/server-functions/middlewares.ts
import { createMiddleware } from '@tanstack/react-start';

export const authMiddleware = createMiddleware()
    .middleware(async ({ context, next }) => {
        const cookie = await getCookie();
        const user = await getUser(cookie);

        if (!user) {
            throw new Error('UNAUTHORIZED');
        }

        return next({
            context: {
                ...context,
                auth: { user, cookie }
            }
        });
    });
```

### 3. File Upload with Presigned URLs
```tsx
// Server function for presigned upload
export const requestPresignedUrl = createServerFn()
    .middleware([authMiddleware])
    .inputValidator(presignedUrlRequestSchema)
    .handler(async ({ data, context: { env, auth } }) => {
        const response = await env.API.fetch(
            `${env.API_URL}/api/uploads/presigned-url`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(auth.cookie && { Cookie: auth.cookie })
                },
                body: JSON.stringify(data)
            }
        );

        const result = await response.json();
        return success(result);
    });

// Usage in component
const { mutateAsync: getPresignedUrl } = useMutation({
    mutationFn: requestPresignedUrl
});
```

### 4. Environment Variables Access
```tsx
// Server function to get client-safe env vars
export const getEnvs = createServerFn()
    .handler(async ({ context: { env } }) => {
        return success({
            API_URL: env.API_URL,
            PUBLIC_R2_URL: env.PUBLIC_R2_URL,
            WEBSOCKET_URL: env.WEBSOCKET_URL
        });
    });

// Client-side usage
const { data: envs } = useEnvs();
```

### 5. Error Handling
```tsx
// Standardized error handling
export const apiErrorHandler = async (response: Response) => {
    if (response.status === 401) {
        throw new Error('UNAUTHORIZED');
    }

    try {
        const error = await response.json();
        return failure(error.message || 'Request failed');
    } catch {
        return failure(`Request failed with status ${response.status}`);
    }
};

// Helper functions for consistent returns
export const success = <T>(body: T) => ({
    success: true as const,
    body
});

export const failure = (error: string | null) => ({
    success: false as const,
    error
});
```

### 6. POST Mutations
```tsx
export const createPost = createServerFn({ method: 'POST' })
    .middleware([authMiddleware])
    .inputValidator(createPostSchema)
    .handler(async ({ data, context: { env, auth } }) => {
        const response = await env.API.fetch(
            `${env.API_URL}/api/posts`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(auth.cookie && { Cookie: auth.cookie })
                },
                body: JSON.stringify(data)
            }
        );

        if (!response.ok) {
            return await apiErrorHandler(response);
        }

        const post = await response.json();
        return success(postSchema.parse(post));
    });
```

### 7. Streaming SSR
```tsx
// Route with streaming data
export const Route = createFileRoute('/dashboard')({
    component: Dashboard,
    loader: async ({ context: { queryClient } }) => {
        // Critical data - blocks rendering
        await queryClient.ensureQueryData(authQuery());

        // Non-critical - streams in
        queryClient.prefetchQuery(dashboardStatsQuery());
        queryClient.prefetchInfiniteQuery(activityFeedQuery());

        return {};
    }
});
```

## Common Tasks

### Creating a Server Function
1. Create file in `shared/server-functions/`
2. Import createServerFn from TanStack Start
3. Add middleware if needed (auth, validation)
4. Define input validator with Zod
5. Implement handler with typed context

### Adding Authentication
1. Use authMiddleware in server function
2. Access auth context in handler
3. Pass cookies to API requests
4. Handle UNAUTHORIZED errors

### Implementing File Uploads
1. Request presigned URL from server
2. Upload directly to R2/S3
3. Confirm upload with server
4. Update UI with uploaded file URL

### Managing Environment Variables
1. Define in `.env` for local dev
2. Configure in Cloudflare Workers for production
3. Access via context.env in server functions
4. Never expose sensitive vars to client

## Anti-Patterns to Avoid

- ❌ Calling API directly from components - use server functions
- ❌ Not validating inputs with Zod schemas
- ❌ Exposing sensitive env vars to client
- ❌ Not handling auth errors properly
- ❌ Blocking SSR with non-critical data
- ❌ Using client-side fetch instead of server functions

## Integration Guide

- **With Cloudflare**: Deploys to Workers with bindings
- **With React Query**: Server functions integrate seamlessly
- **With Router**: Loaders can call server functions
- **With Zod**: Input validation for type safety
- **With R2**: File uploads via presigned URLs

## Quick Reference

```tsx
// Server function template
import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

const inputSchema = z.object({
    id: z.string(),
    data: z.object({
        // fields
    })
});

export const serverAction = createServerFn()
    .middleware([authMiddleware])
    .inputValidator(inputSchema)
    .handler(async ({ data, context: { env, auth } }) => {
        try {
            const response = await env.API.fetch(
                `${env.API_URL}/api/endpoint`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(auth.cookie && { Cookie: auth.cookie })
                    },
                    body: JSON.stringify(data)
                }
            );

            if (!response.ok) {
                return await apiErrorHandler(response);
            }

            const result = await response.json();
            return success(result);
        } catch (error) {
            return failure('Operation failed');
        }
    });
```

## Real Examples from Codebase

- **Auth Server Function**: `apps/web/src/features/auth/server-functions/auth.ts`
- **User Functions**: `apps/web/src/shared/server-functions/users.ts`
- **Upload Functions**: `apps/web/src/shared/server-functions/uploads.ts`
- **Middleware**: `apps/web/src/shared/server-functions/middlewares.ts`
- **Helpers**: `apps/web/src/shared/server-functions/helpers.ts`
