# Notifications

In-app and email notification system with real-time updates.

## Key Components

- `NotificationBell` - Bell icon in header with unread count badge
- `NotificationsList` - Dropdown list of recent notifications
- `NotificationCard` - Individual notification with action buttons
- `NotificationProvider` - Context provider for notification state

## Hooks

- `useNotifications` - Fetches notifications with pagination and unread count
- `useNotificationContext` - Accesses notification context (mark read, etc.)

## Server Functions

- `getNotifications` - Fetches user's notifications (paginated)
- `markNotificationRead` - Marks notification as read
- `markAllRead` - Marks all notifications as read
- `deleteNotification` - Deletes a notification

## Data Flow

1. Notifications created by backend events (follows, comments, reactions, mentions, band applications)
2. Queued via `NotificationsQueue`, processed by queue consumer
3. Frontend polls or uses real-time updates to fetch new notifications
4. Unread count displayed in bell badge
5. User clicks notification → marked as read → navigates to related content
6. Email notifications sent based on user settings
