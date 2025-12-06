# Authentication

Handles user authentication, including sign up, sign in, and session management using better-auth.

## Key Components

N/A - Auth features are primarily route-based (sign-in, sign-up pages)

## Hooks

- `useAnimateOnce` - Utility hook for animating elements once on mount

## Server Functions

- `getAuth` - Fetches current session (authenticated user + permissions)
- `signIn` - Authenticates user with email/password
- `signUp` - Creates new user account with automatic email verification
- `signOut` - Ends user session and clears cookies
- `verifyEmail` - Verifies email address via token link
- `resendVerificationEmail` - Resends email verification link
- `forgotPassword` - Initiates password reset flow, sends reset email
- `resetPassword` - Completes password reset with token and new password

## Data Flow

1. User submits credentials via sign-in/sign-up forms
2. Server function calls better-auth API endpoints
3. Session is stored in cookies
4. `getSession` is called in route loaders to verify authentication
5. Protected routes redirect to sign-in if no session exists
