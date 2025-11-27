# Chat

Real-time direct messaging system using WebSocket connections and Durable Objects.

## Key Components
- `ChatSidebar` - List of conversations with search
- `ChatWindow` - Message thread display with scrolling
- `MessageInput` - Message composer with emoji picker
- `MessageBubble` - Individual message display
- `ConversationCard` - Conversation preview in sidebar

## Hooks
- `useChat` - Manages WebSocket connection and message state
- `useConversations` - Fetches conversation list
- `useMessages` - Fetches message history for a conversation

## Server Functions
- `getConversations` - Fetches user's conversation list
- `getMessages` - Fetches message history for a conversation
- `createConversation` - Starts new conversation
- `sendMessage` - Sends message via WebSocket to Durable Object

## Data Flow
1. User opens messages page, conversations load via `getConversations`
2. User selects conversation, `useChat` establishes WebSocket connection to Durable Object
3. Message history loads via `getMessages`
4. User sends message → WebSocket → Durable Object → broadcasts to all participants
5. Real-time updates received via WebSocket, messages added to local state
6. Conversation list updates with latest message preview
