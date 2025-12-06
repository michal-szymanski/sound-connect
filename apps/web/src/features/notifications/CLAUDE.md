# Notifications

In-app and email notification system with real-time updates.

## Key Components

- `notifications-button.tsx` - Bell icon in header with unread count badge and dropdown

## Hooks

**Note:** Notification hooks are implemented using Tanstack Query directly within components. No dedicated hook files exist.

## Server Functions

- `getNotifications` - Fetches user's notifications (paginated, sorted by created date)
- `markNotificationAsSeen` - Marks single notification as seen (updates UI badge)
- `markAllNotificationsAsSeen` - Marks all notifications as seen
- `markNotificationsAsRead` - Batch marks multiple notifications as read
- `deleteNotification` - Deletes a single notification

## Data Flow

1. Notifications created by backend events (follows, comments, reactions, mentions, band applications)
2. Queued via `NotificationsQueue`, processed by queue consumer
3. Frontend polls or uses real-time updates to fetch new notifications
4. Unread count displayed in bell badge
5. User clicks notification → marked as read → navigates to related content
6. Email notifications sent based on user settings
