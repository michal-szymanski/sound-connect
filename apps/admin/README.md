# Sound Connect Admin Dashboard

Admin dashboard for Sound Connect built with Tanstack Start, React, and Cloudflare Workers.

## Structure

```
apps/admin/
├── wrangler.jsonc              # Cloudflare Workers config
├── vite.config.ts              # Vite configuration
├── app.config.ts               # Tanstack Start config
├── package.json                # Dependencies
├── tsconfig.json               # TypeScript config
├── .gitignore                  # Git ignore rules
├── src/
│   ├── routes/                 # File-based routes
│   │   ├── __root.tsx         # Root layout
│   │   ├── index.tsx          # Dashboard page
│   │   ├── login.tsx          # Login page
│   │   └── users/             # User management
│   │       ├── index.tsx      # User list
│   │       └── $userId.tsx    # User detail
│   ├── shared/
│   │   ├── server-functions/  # Server-side functions
│   │   │   ├── middlewares.ts # Auth middleware
│   │   │   ├── helpers.ts     # Helper functions
│   │   │   ├── auth.ts        # Auth server functions
│   │   │   └── admin.ts       # Admin API functions
│   │   ├── hooks/
│   │   │   └── use-admin-session.ts
│   │   ├── lib/
│   │   │   ├── auth-client.ts # Better-auth client
│   │   │   └── utils.ts       # Utility functions
│   │   └── components/
│   │       ├── layout.tsx     # App layout
│   │       └── ui/            # ShadCN components
│   ├── styles/
│   │   └── globals.css        # Global styles
│   ├── router.tsx             # Router configuration
│   ├── entry-client.tsx       # Client entry point
│   └── entry-server.tsx       # Server entry point
└── README.md
```

## Features

### Authentication
- Email/password login
- Admin role enforcement
- Session management via better-auth
- Cookie-based authentication

### Dashboard
- Total users count
- Recent signups (last 7 days)

### User Management
- User list with search
- Pagination (10 users per page)
- User detail view
- Edit user (name, email, role)
- Delete user with confirmation

## Development

### Prerequisites
- Node.js 18+
- pnpm package manager
- Cloudflare Workers account

### Setup

1. Install dependencies:
```bash
cd apps/admin
pnpm install
```

2. Start development server:
```bash
pnpm dev
```

The admin dashboard will be available at `http://localhost:3001`

### Admin User Creation

To create an admin user, update a user's role directly in the database:

```sql
UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';
```

Or use the test admin user (if seeded):
- Email: `t1@asd.asd`
- Password: `aaaaaaaa`

## API Communication

The admin app communicates with the API worker through:

1. **Service Binding**: `env.API` binding to `sound-connect-api` worker
2. **Server Functions**: All API calls go through Tanstack Start server functions
3. **Cookie Forwarding**: Session cookies are forwarded to API via service binding

### Server Function Pattern

```typescript
export const getUsers = createServerFn({ method: 'GET' })
    .middleware([adminAuthMiddleware])
    .inputValidator(schema)
    .handler(async ({ data, context: { env, auth } }) => {
        const response = await env.API.fetch(`${env.API_URL}/api/admin/users`, {
            headers: {
                ...(auth.cookie && { Cookie: auth.cookie })
            }
        });
        // ...
    });
```

## Routes

### Public Routes
- `/login` - Admin login page

### Protected Routes (require admin role)
- `/` - Dashboard with stats
- `/users` - User list with search and pagination
- `/users/:userId` - User detail and edit page

## Middleware

### `envMiddleware`
- Validates Cloudflare environment
- Ensures API binding and URL are available

### `authMiddleware`
- Retrieves session from cookies or API
- Throws error if not authenticated
- Adds `auth` context with user, session, cookie

### `adminAuthMiddleware`
- Extends `authMiddleware`
- Checks if user role is 'admin'
- Redirects to `/login` if not admin

## Technology Stack

- **Framework**: Tanstack Start (React + SSR)
- **Routing**: Tanstack Router (file-based)
- **State Management**: Tanstack Query
- **Styling**: TailwindCSS + CSS variables
- **UI Components**: ShadCN (copied from main app)
- **Authentication**: Better-auth (admin plugin)
- **Runtime**: Cloudflare Workers
- **Build Tool**: Vite

## Deployment

### Production Build

```bash
pnpm build
```

### Deploy to Cloudflare

```bash
pnpm deploy
```

### Environment Variables

Set in `wrangler.jsonc`:

```json
{
    "vars": {
        "API_URL": "https://sound-connect-api-production.workers.dev",
        "ADMIN_URL": "https://sound-connect-admin-production.workers.dev"
    },
    "services": [
        {
            "binding": "API",
            "service": "sound-connect-api-production"
        }
    ]
}
```

## Security

- Admin-only access enforced at middleware level
- All routes except `/login` require admin role
- Cookie-based session management
- HTTPS-only in production
- HttpOnly cookies with SameSite protection

## Future Enhancements

- Ban/suspend users
- User activity logs
- System metrics and monitoring
- Email user notifications
- Bulk user operations
- Export user data
