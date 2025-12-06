# Chat

Real-time direct messaging system using WebSocket connections and Durable Objects.

## Overview

The chat feature supports both direct messages (DM) between users and band group messaging. Messages are sent via WebSocket connections to Durable Objects for real-time communication, with message history stored in D1 database.

## Key Components

### Core Chat UI
- `chat-window.tsx` - Individual chat window with message input, emoji picker, and virtualized message list
- `chat-windows-ui.tsx` - Manager component that renders multiple chat windows, handles minimized states, and summary button
- `message-bubble.tsx` - Individual message display with timestamp and sender info

### Message List & Interaction
- `virtualized-message-list.tsx` - Virtualized message list for performance with large conversations
- `date-divider.tsx` - Date separators between message groups
- `scroll-to-bottom-button.tsx` - Auto-scroll button that appears when scrolled up
- `message-status-indicator.tsx` - Shows message send status (sending/sent/error)
- `message-skeleton.tsx` - Loading skeleton while messages are fetching

### Chat Controls
- `message-button.tsx` - Button to initiate/open chat window
- `minimized-chat-button.tsx` - Minimized chat window display in bottom-right
- `summary-button.tsx` - Summary button showing count of hidden minimized chats

## Hooks

### Conversation Management
- `useConversations` (from `use-conversations.ts`) - Fetches list of user's conversations (DM + band chats)
- `useConversationMetadata` (from `use-conversation-metadata.ts`) - Fetches conversation partner/band details
  - `usePrefillConversationMetadata` - Prefills metadata cache
  - `parseRoomId` - Parses room ID to extract user/band identifier
  - `fetchConversationMetadata` - Server-side metadata fetcher

### Message Queries
- `useChatMessages` (from `use-chat-queries.ts`) - Fetches message history for a conversation
- `useSendMessage` (from `use-chat-queries.ts`) - Sends message with optimistic updates and retry logic
- `useMarkMessagesAsRead` (from `use-chat-queries.ts`) - Marks messages as read
- `useInvalidateChatMessages` (from `use-chat-queries.ts`) - Invalidates message cache
- `useGetRoomId` (from `use-chat-queries.ts`) - Generates room ID from user IDs

### Band Messaging
- `useBandMessages` (from `use-band-messages.ts`) - Fetches band chat message history
- `useSendBandMessage` (from `use-band-messages.ts`) - Sends message to band chat

### Utilities
- `useContacts` (from `use-contacts.ts`) - Fetches mutual followers as contact list
- `useMessagingPermission` (from `use-messaging-permission.ts`) - Checks if user can message another user (respects privacy settings)

## Server Functions

### Direct Messaging (`chat.ts`)
- `getChatHistory` - Fetches message history for a room (DM or band chat)
- `getConversations` - Fetches user's conversation list with latest message and unread count
- `markMessagesAsRead` - Marks all messages in a room as read

### Band Messaging (`band-messages.ts`)
- `getBandChatHistory` - Fetches message history for a band chat room
- `sendBandMessage` - Sends message to band chat (stored in database, broadcasted via WebSocket)

### Permissions (`messaging-permissions.ts`)
- `checkMessagingPermission` - Checks if current user can send messages to target user based on privacy settings

## Data Flow

### Direct Messaging (DM)
1. User opens messages page → `useConversations` loads conversation list
2. User clicks conversation → Chat window opens
3. `useChatMessages` fetches message history from `getChatHistory`
4. WebSocket connection established to Durable Object (via global chat store)
5. User sends message → `useSendMessage` adds optimistic update
6. Message sent via WebSocket to Durable Object
7. Durable Object broadcasts to all participants
8. Real-time message received via WebSocket, query cache updated
9. Conversation list auto-updates with latest message

### Band Messaging
1. User opens band page → Band chat available to members
2. `useBandMessages` fetches chat history via `getBandChatHistory`
3. `useSendBandMessage` sends message via `sendBandMessage` server function
4. Message stored in database and broadcasted to band members via WebSocket
5. Real-time updates via WebSocket connection to band's Durable Object

### Permission Checks
- Before allowing message sending, `useMessagingPermission` checks via `checkMessagingPermission`
- Respects user privacy settings (e.g., "only followers can message me")
- Returns `canMessage` boolean and `reason` string if denied

## Room ID Format

- **Direct Message:** `dm:{userId1}-{userId2}` (sorted alphabetically)
- **Band Chat:** `band:{bandId}`

## Additional Features

- **Optimistic Updates:** Messages appear instantly before server confirmation
- **Retry Logic:** Failed messages can be retried by user
- **Unread Counts:** Conversation list shows unread message count per conversation
- **Multi-Window:** Users can have up to 5 chat windows open simultaneously
- **Minimized Chats:** Chats can be minimized to bottom-right corner
- **Virtualization:** Message lists use virtualization for performance with 1000+ messages
- **Emoji Picker:** Integrated emoji picker in message input
