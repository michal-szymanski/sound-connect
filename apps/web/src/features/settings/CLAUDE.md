# Settings

User settings for account management, privacy controls, notifications, and data export.

## Key Components

- `SettingsTabs` - Tabbed interface (Account/Privacy/Notifications/Data & Account)
- `AccountTab` - Email update, password change, account creation date
- `PrivacyTab` - Profile visibility, search visibility, messaging/follow permissions, block management
- `NotificationsTab` - Global email toggle + granular per-type controls
- `DataTab` - Export user data, delete account
- `BlockedUsersList` - List of blocked users with unblock action

## Hooks

- `useSettings` - Fetches user settings
- `useUpdateEmail` - Updates email address
- `useUpdatePassword` - Changes password
- `useUpdatePrivacySettings` - Updates privacy settings
- `useUpdateNotificationSettings` - Updates notification preferences
- `useBlockUser` - Blocks a user
- `useUnblockUser` - Unblocks a user
- `useExportData` - Exports all user data as JSON
- `useDeleteAccount` - Deletes user account

## Server Functions

- `getSettings` - Fetches user settings
- `updateEmail` - Updates email address
- `updatePassword` - Changes password with current password verification
- `updatePrivacySettings` - Updates profile visibility, search visibility, messaging/follow permissions
- `updateNotificationSettings` - Updates email notification preferences
- `getBlockedUsers` - Fetches blocked users list
- `blockUser` - Blocks a user
- `unblockUser` - Unblocks a user
- `exportUserData` - Generates JSON export of all user data
- `deleteAccount` - Deletes account with password confirmation

## Data Flow

1. **Privacy**: Settings enforced across platform (profile visibility, search exclusion, messaging/follow permissions)
2. **Blocked Users**: Cannot view profile, send messages, or see content in feed
3. **Notifications**: Global toggle + per-type controls (follows, comments, reactions, mentions, band applications)
4. **Data Export**: Generates JSON with profile, posts, comments, messages, bands
5. **Account Deletion**: Requires password confirmation, irreversible
