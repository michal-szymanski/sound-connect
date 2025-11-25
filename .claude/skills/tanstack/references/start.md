# Tanstack Start Reference

Server functions and middleware patterns for Sound Connect frontend.

## Server Function Organization

Server functions are organized by feature in `src/features/{feature}/server-functions/`:

```
features/
├── bands/server-functions/
│   ├── bands.ts              # Band CRUD, members, follows
│   └── band-applications.ts  # Applications workflow
├── posts/server-functions/
│   ├── posts.ts              # Post CRUD, feed, reactions
│   └── comments.ts           # Comment CRUD
├── auth/server-functions/
│   └── auth.ts               # Sign in/out, session
├── profile/server-functions/
│   └── profile.ts            # Profile updates
├── chat/server-functions/
│   └── chat.ts               # Messaging
└── search/server-functions/
    ├── profile-search.ts     # Musician search
    └── band-search.ts        # Band search
```

Shared helpers live in `src/shared/server-functions/`:
- `helpers.ts` - Response helpers, error handlers, cookie management
- `middlewares.ts` - Auth and env middleware

## createServerFn Pattern

Server functions proxy requests to the API backend with authentication.

### Basic Structure

```tsx
import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { authMiddleware } from '@/shared/server-functions/middlewares';
import { apiErrorHandler, success, failure } from '@/shared/server-functions/helpers';
import { bandSchema } from '@sound-connect/common/types/bands';

export const getBand = createServerFn()
    .middleware([authMiddleware])
    .inputValidator(z.object({ bandId: z.number() }))
    .handler(async ({ data, context: { env, auth } }) => {
        try {
            const response = await env.API.fetch(
                `${env.API_URL}/api/bands/${data.bandId}`,
                {
                    method: 'GET',
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
            return success(bandSchema.parse(json));
        } catch (error) {
            console.error('getBand error:', error);
            return failure({ status: 500, message: 'An unexpected error occurred' });
        }
    });
```

### POST/Mutation Pattern

```tsx
export const createBand = createServerFn({ method: 'POST' })
    .middleware([authMiddleware])
    .inputValidator(createBandInputSchema)
    .handler(async ({ data, context: { env, auth } }) => {
        try {
            const response = await env.API.fetch(`${env.API_URL}/api/bands`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(auth.cookie && { Cookie: auth.cookie })
                },
                body: JSON.stringify(data),
                credentials: 'include'
            });

            if (!response.ok) {
                return await apiErrorHandler(response);
            }

            const json = await response.json();
            return success(bandSchema.parse(json));
        } catch (error) {
            console.error('createBand error:', error);
            return failure({ status: 500, message: 'An unexpected error occurred' });
        }
    });
```

### DELETE Pattern

```tsx
export const deleteBand = createServerFn({ method: 'POST' })
    .middleware([authMiddleware])
    .inputValidator(z.object({ bandId: z.number() }))
    .handler(async ({ data, context: { env, auth } }) => {
        try {
            const response = await env.API.fetch(
                `${env.API_URL}/api/bands/${data.bandId}`,
                {
                    method: 'DELETE',
                    headers: {
                        ...(auth.cookie && { Cookie: auth.cookie })
                    },
                    credentials: 'include'
                }
            );

            if (!response.ok) {
                return await apiErrorHandler(response);
            }

            return success(null);
        } catch (error) {
            console.error('deleteBand error:', error);
            return failure({ status: 500, message: 'An unexpected error occurred' });
        }
    });
```

### Query Params Pattern

```tsx
export const getBandPosts = createServerFn()
    .middleware([authMiddleware])
    .inputValidator(z.object({
        bandId: z.number(),
        page: z.number().optional(),
        limit: z.number().optional()
    }))
    .handler(async ({ data, context: { env, auth } }) => {
        try {
            const searchParams = new URLSearchParams();
            if (data.page) searchParams.set('page', data.page.toString());
            if (data.limit) searchParams.set('limit', data.limit.toString());

            const response = await env.API.fetch(
                `${env.API_URL}/api/bands/${data.bandId}/posts?${searchParams.toString()}`,
                {
                    method: 'GET',
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
            return success(bandPostsResponseSchema.parse(json));
        } catch (error) {
            console.error('getBandPosts error:', error);
            return failure({ status: 500, message: 'An unexpected error occurred' });
        }
    });
```

## Middleware Chain

Middleware runs in order, each adding to the context.

### envMiddleware

Provides Cloudflare environment bindings.

```tsx
// middlewares.ts
import { createMiddleware } from '@tanstack/react-start';
import { env } from 'cloudflare:workers';

export const envMiddleware = createMiddleware().server(async ({ next }) => {
    if (!env || !env.API || !env.API_URL) {
        console.error('[Env Middleware] Cloudflare env missing');
        throw new Error('Cloudflare environment not properly configured');
    }

    return await next({
        context: { env }
    });
});
```

### authMiddleware

Requires authentication, provides session and user.

```tsx
type Auth = {
    session: Session;
    user: User;
    cookie: string | undefined;
    accessToken: string | undefined;
};

export const authMiddleware = createMiddleware()
    .middleware([envMiddleware])  // Chain envMiddleware
    .server(async ({ next, context: { env } }) => {
        const sessionData = await getSessionData(env);

        if (!sessionData) {
            throw new Error('UNAUTHORIZED');
        }

        const cookie = getSessionCookie();
        const auth: Auth = {
            session: sessionData.session,
            user: sessionData.user,
            cookie,
            accessToken: sessionData.accessToken
        };

        return await next({
            context: { env, auth }
        });
    });
```

### Using Middleware

```tsx
// Authenticated route - has env and auth
export const getBand = createServerFn()
    .middleware([authMiddleware])
    .handler(async ({ context: { env, auth } }) => {
        // env.API, env.API_URL available
        // auth.user, auth.cookie, auth.accessToken available
    });

// Public route - env only
export const getEnvs = createServerFn()
    .middleware([envMiddleware])
    .handler(async ({ context: { env } }) => {
        // Only env available, no auth
    });
```

## Response Helpers

### success() and failure()

Standard response format for all server functions.

```tsx
// helpers.ts
import type { ServerFunctionError, ServerFunctionSuccess } from '@/common/types/server-functions';

export const success = <T>(body: T): ServerFunctionSuccess<T> => {
    return { success: true, body };
};

export const failure = <E = null>(body: E): ServerFunctionError<E> => {
    return { success: false, body };
};

// Usage
return success(bandSchema.parse(json));
return success(null);  // For DELETE operations
return failure({ status: 500, message: 'An unexpected error occurred' });
```

### apiErrorHandler

Parses API error responses.

```tsx
export const apiErrorHandler = async (response: Response) => {
    try {
        const status = response.status;
        const errorBody = await response.text();

        console.error(errorBody);

        let message: string;

        try {
            const json = JSON.parse(errorBody);
            const parsed = apiErrorSchema.parse(json);
            message = parsed.message;
        } catch {
            message = errorBody;
        }

        return failure({ status, message });
    } catch (error) {
        console.error(error);
        return failure(null);
    }
};
```

## Input Validation

Always validate inputs with Zod schemas from `packages/common`.

```tsx
import { createBandInputSchema } from '@sound-connect/common/types/bands';

export const createBand = createServerFn({ method: 'POST' })
    .middleware([authMiddleware])
    .inputValidator(createBandInputSchema)  // Validates data before handler
    .handler(async ({ data }) => {
        // data is typed and validated
    });

// Inline validation for simple cases
.inputValidator(z.object({
    bandId: z.number(),
    userId: z.string()
}))

// Extending existing schemas
.inputValidator(updateBandInputSchema.extend({ bandId: z.number() }))
```

## Response Schema Validation

Parse API responses with Zod to ensure type safety.

```tsx
.handler(async ({ data, context: { env, auth } }) => {
    const response = await env.API.fetch(...);

    if (!response.ok) {
        return await apiErrorHandler(response);
    }

    const json = await response.json();
    return success(bandWithMembersSchema.parse(json));  // Validates response
});
```

## Calling Server Functions

From hooks and components:

```tsx
// In hooks (use-bands.ts)
export const useBand = (bandId: number) => {
    return useQuery({
        queryKey: ['band', bandId],
        queryFn: async () => {
            const result = await getBand({ data: { bandId } });
            if (!result.success) {
                throw new Error(result.body?.message || 'Failed to load band');
            }
            return result.body;
        }
    });
};

// In mutations
export const useCreateBand = () => {
    return useMutation({
        mutationFn: async (data: CreateBandInput) => {
            const result = await createBand({ data });
            if (!result.success) {
                throw new Error(result.body?.message || 'Failed to create band');
            }
            return result.body;
        }
    });
};

// In loaders (route files)
loader: async () => {
    const result = await getAuth();
    const authData = result.success
        ? result.body
        : { user: null, accessToken: undefined };
    return authData;
}
```

## HTTP Method Mapping

| Server Function Method | API Method | Use Case |
|------------------------|------------|----------|
| `createServerFn()` (default GET) | GET | Read operations |
| `createServerFn({ method: 'POST' })` | POST, PATCH, DELETE | Mutations |

Note: Server functions always use POST to the server function endpoint. The `method` option affects how the function is called, but the actual API call method is specified in the `fetch` call.
