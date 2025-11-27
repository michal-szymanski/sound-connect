# Authentication

Handles user authentication, including sign up, sign in, and session management using better-auth.

## Key Components
N/A - Auth features are primarily route-based (sign-in, sign-up pages)

## Hooks
- `useAnimateOnce` - Utility hook for animating elements once on mount

## Server Functions
- `getSession` - Fetches current user session from better-auth
- `signIn` - Authenticates user with email/password
- `signUp` - Creates new user account
- `signOut` - Ends user session

## Data Flow
1. User submits credentials via sign-in/sign-up forms
2. Server function calls better-auth API endpoints
3. Session is stored in cookies
4. `getSession` is called in route loaders to verify authentication
5. Protected routes redirect to sign-in if no session exists
