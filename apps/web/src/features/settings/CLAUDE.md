# Settings

User settings for account management, privacy controls, notifications, and data export.

## Key Components

- `account-settings.tsx` - Email update, password change, username update, account creation date
- `privacy-settings.tsx` - Profile visibility, search visibility, messaging/follow permissions, block management
- `notification-settings.tsx` - Global email toggle + granular per-type controls (follows, comments, reactions, etc.)
- `data-account-settings.tsx` - Export user data, delete account with confirmation

## Hooks

- `useAccountInfo` - Fetches account information (email, username, created date)
- `useUpdateEmail` - Updates email address
- `useUpdatePassword` - Changes password with current password verification
- `useCheckUsernameAvailability` - Checks if username is available (debounced)
- `useUpdateUsername` - Updates username
- `usePrivacySettings` - Fetches privacy settings
- `useUpdatePrivacySettings` - Updates privacy settings
- `useNotificationSettings` - Fetches notification preferences
- `useUpdateNotificationSettings` - Updates notification preferences
- `useBlockedUsers` - Fetches blocked users list
- `useBlockUser` - Blocks a user
- `useUnblockUser` - Unblocks a user
- `useExportData` - Exports all user data as JSON
- `useDeleteAccount` - Deletes user account permanently

## Server Functions

- `getAccountInfo` - Fetches account information (email, username, account creation date)
- `updateEmail` - Updates email address
- `updatePassword` - Changes password with current password verification
- `checkUsernameAvailability` - Checks if username is available (returns boolean)
- `updateUsername` - Updates username (if available)
- `getPrivacySettings` - Fetches privacy settings
- `updatePrivacySettings` - Updates profile visibility, search visibility, messaging/follow permissions
- `getNotificationSettings` - Fetches notification preferences
- `updateNotificationSettings` - Updates email notification preferences (global + per-type)
- `getBlockedUsers` - Fetches blocked users list
- `blockUser` - Blocks a user
- `unblockUser` - Unblocks a user
- `exportData` - Generates JSON export of all user data (profile, posts, comments, messages, bands)
- `deleteAccount` - Deletes account permanently with password confirmation

## Data Flow

1. **Privacy**: Settings enforced across platform (profile visibility, search exclusion, messaging/follow permissions)
2. **Blocked Users**: Cannot view profile, send messages, or see content in feed
3. **Notifications**: Global toggle + per-type controls (follows, comments, reactions, mentions, band applications)
4. **Data Export**: Generates JSON with profile, posts, comments, messages, bands
5. **Account Deletion**: Requires password confirmation, irreversible
