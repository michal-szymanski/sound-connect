# Messaging System Improvements - API Contracts

This document defines the API contracts and integration points for the messaging system improvements. Both backend and frontend agents should implement according to these specifications.

## Shared Types Location

All shared types are defined in `packages/common/src/types/`:
- **conversations.ts** - Updated to support both user and band conversations
- **band-messages.ts** - Band messaging-specific types and schemas
- **models.ts** - Updated WebSocket message types to include system messages

## Room ID Format

The system uses deterministic room IDs to identify chat rooms:

**DM Rooms (existing):**
- Format: `{userId1}:{userId2}` where userIds are sorted alphabetically
- Example: `alice123:bob456`
- Used for 1:1 direct messages

**Band Rooms (new):**
- Format: `band:{bandId}`
- Example: `band:42`
- Used for band group chats

**Detection:**
```typescript
const isBandRoom = roomId.startsWith('band:');
const bandId = isBandRoom ? parseInt(roomId.split(':')[1]) : null;
```

## API Endpoints

### 1. GET /api/chat/conversations

**Purpose:** Retrieve all conversations for current user (both 1:1 DMs and band chats)

**Auth:** Required (session token)

**Query Parameters:**
- `limit` (optional): Number of conversations to return (default: 20, max: 100)
- `offset` (optional): Pagination offset (default: 0)

**Request Example:**
```
GET /api/chat/conversations?limit=20&offset=0
```

**Response Schema:** `conversationsResponseSchema`

**Response Example:**
```json
{
  "conversations": [
    {
      "type": "user",
      "partnerId": "user-456",
      "partner": {
        "id": "user-456",
        "name": "Alice Smith",
        "image": "https://..."
      },
      "lastMessage": {
        "content": "See you at rehearsal!",
        "senderId": "user-456",
        "createdAt": "2025-01-15T10:30:00Z"
      },
      "isMutualFollow": true
    },
    {
      "type": "band",
      "bandId": 42,
      "band": {
        "id": 42,
        "name": "The Rockers",
        "image": "https://...",
        "memberCount": 5
      },
      "lastMessage": {
        "content": "Gig next Friday confirmed!",
        "senderId": "user-123",
        "senderName": "Bob Jones",
        "createdAt": "2025-01-15T11:00:00Z"
      }
    }
  ],
  "total": 15
}
```

**Backend Requirements:**
- Remove `is_mutual_follow` filter from query
- Query both DM conversations AND band conversations
- For band conversations:
  - Join with `bands_members` table to find bands current user belongs to
  - Get last message from `band_messages` table
  - Include band info (name, image, member count)
- Sort all conversations by most recent message timestamp
- Apply pagination

**Frontend Requirements:**
- Handle discriminated union type (`type: 'user' | 'band'`)
- Render appropriate UI for each conversation type
- Show band icon/image for band conversations
- Display member count for band conversations

---

### 2. POST /api/chat/check-messaging-permission

**Purpose:** Check if current user can message a target user (1:1 DMs only)

**Auth:** Required

**Request Schema:** `checkMessagingPermissionRequestSchema`

**Request Example:**
```json
{
  "targetUserId": "user-456"
}
```

**Response Schema:** `checkMessagingPermissionResponseSchema`

**Response Example (Can Message):**
```json
{
  "canMessage": true,
  "reason": null
}
```

**Response Example (Cannot Message):**
```json
{
  "canMessage": false,
  "reason": "blocked"
}
```

**Possible Reasons:**
- `"blocked"` - User is blocked or blocking the target user
- `"privacy"` - Target user's privacy settings prevent messaging
- `"self"` - Cannot message yourself

**Backend Requirements:**
- Validate `targetUserId` exists
- Check if current user is target user (return `reason: 'self'`)
- Check blocking in both directions (blocker → blocked, blocked → blocker)
- Check target user's `messagingPermission` setting:
  - `'anyone'` → allow
  - `'followers'` → check if current user follows target
  - `'none'` → deny
- Return appropriate `canMessage` boolean and `reason`

**Frontend Requirements:**
- Call this endpoint before showing message button or opening chat
- Disable message button if `canMessage: false`
- Show tooltip with appropriate message based on `reason`
- Handle loading and error states

---

### 3. GET /api/bands/:bandId/chat/history

**Purpose:** Retrieve band chat history filtered by current user's join time

**Auth:** Required

**Path Parameters:**
- `bandId`: Band ID

**Query Parameters:**
- `limit` (optional): Number of messages to return (default: 100, max: 500)
- `offset` (optional): Pagination offset (default: 0)

**Request Example:**
```
GET /api/bands/42/chat/history?limit=100&offset=0
```

**Response Schema:** `bandChatHistoryResponseSchema` (array of `bandMessageSchema`)

**Response Example:**
```json
[
  {
    "id": "msg-123",
    "type": "message",
    "content": "Great practice today!",
    "senderId": "user-456",
    "senderName": "Alice Smith",
    "senderImage": "https://...",
    "createdAt": "2025-01-15T14:30:00Z"
  },
  {
    "id": "msg-124",
    "type": "system",
    "content": "Bob Jones joined the band",
    "senderId": null,
    "createdAt": "2025-01-15T15:00:00Z"
  }
]
```

**Backend Requirements:**
- Verify current user is a member of the band (query `bands_members`)
- Get user's `joined_at` timestamp from `bands_members`
- Query `band_messages` where `band_id = :bandId AND created_at >= :joinedAt`
- Order by `created_at ASC` (chronological)
- Include sender info (name, image) for regular messages
- Apply pagination
- Return 403 if user is not a band member

**Frontend Requirements:**
- Call this endpoint when opening band chat
- Display messages in chronological order
- Render system messages differently (centered, gray text, no avatar)
- Render regular messages with sender avatar and name
- Handle pagination (infinite scroll for older messages)
- Show empty state if no messages

---

### 4. POST /api/bands/:bandId/chat/send

**Purpose:** Send message to band chat (fallback for non-WebSocket clients)

**Auth:** Required

**Path Parameters:**
- `bandId`: Band ID

**Request Schema:** `sendBandMessageSchema`

**Request Example:**
```json
{
  "content": "See you all next week!"
}
```

**Response Schema:** `bandMessageSchema`

**Response Example:**
```json
{
  "id": "msg-125",
  "type": "message",
  "content": "See you all next week!",
  "senderId": "user-789",
  "senderName": "Charlie Brown",
  "senderImage": "https://...",
  "createdAt": "2025-01-15T16:00:00Z"
}
```

**Backend Requirements:**
- Verify current user is a member of the band
- Validate `content` length (1-1000 chars)
- Create message in `band_messages` table
- Broadcast message to all connected band members via WebSocket
- **NO blocking checks** (band membership is the only permission check)
- **NO privacy setting checks** (band chat bypasses privacy settings)
- Return 403 if user is not a band member
- Return 400 if content is invalid

**Frontend Requirements:**
- Use WebSocket for sending messages (preferred)
- Use this endpoint as fallback if WebSocket unavailable
- Validate content length client-side
- Show optimistic UI while sending
- Handle retry on failure

---

## WebSocket Protocol

### Message Types

The WebSocket protocol supports the following message types (defined in `webSocketMessageTypes`):
- `'chat'` - Regular chat message (DM or band)
- `'system'` - System message (join/leave events)
- `'subscribe'` - Subscribe to a room
- `'unsubscribe'` - Unsubscribe from a room
- `'user-joined'` - User joined notification
- `'user-left'` - User left notification
- `'online-status'` - User online/offline status

### Sending Messages

**Client → Server (via UserDurableObject):**
```json
{
  "type": "chat",
  "content": "Hello everyone!",
  "roomId": "band:42"
}
```

**Schema:** `newChatMessageSchema`

### Receiving Messages

**Server → Client (broadcast):**

**Regular Message:**
```json
{
  "id": "uuid-here",
  "type": "chat",
  "content": "Hello everyone!",
  "roomId": "band:42",
  "senderId": "user-123",
  "timestamp": 1705330800000
}
```

**Schema:** `chatMessageSchema`

**System Message:**
```json
{
  "id": "uuid-here",
  "type": "system",
  "content": "Alice Smith joined the band",
  "roomId": "band:42",
  "userId": "user-456",
  "timestamp": 1705330800000
}
```

**Schema:** `systemMessageSchema`

### Subscribing to Rooms

**Client → Server:**
```json
{
  "type": "subscribe",
  "roomId": "band:42"
}
```

**Schema:** `subscribeMessageSchema`

### Unsubscribing from Rooms

**Client → Server:**
```json
{
  "type": "unsubscribe",
  "roomId": "band:42"
}
```

**Schema:** `unsubscribeMessageSchema`

---

## ChatDurableObject Interface

The `ChatDurableObject` class needs to be updated to support both DM and band room types.

### Key Methods

#### `sendMessage(senderId: string, roomId: string, content: string): Promise<void>`

**Behavior:**
1. Detect room type from `roomId` format
2. Load participants
3. **If band room:**
   - Verify sender is a band member (query `bands_members`)
   - **Skip blocking checks**
   - **Skip privacy setting checks**
4. **If DM room:**
   - Verify sender is a participant
   - Check blocking status (both directions)
   - Check privacy settings
5. Create message with UUID
6. Store message (DM → `messages` table, Band → `band_messages` table)
7. Broadcast to all connected participants

#### `storeMessage(message: ChatMessage | SystemMessage): Promise<void>`

**Behavior:**
1. Store in Durable Object storage (WebSocket replay)
2. Persist to database:
   - **If band room:** Insert into `band_messages` table
   - **If DM room:** Insert into `messages` table
3. Handle errors gracefully

#### `getRoomHistory(roomId: string, userId?: string): Promise<ChatMessage[]>`

**Behavior:**
1. Detect room type
2. **If band room:**
   - Require `userId` parameter
   - Query user's `joined_at` timestamp from `bands_members`
   - Return messages where `created_at >= joined_at`
   - Limit to 100 most recent messages
3. **If DM room:**
   - Return last 100 messages between participants
4. Return messages in chronological order (oldest to newest)

#### `isBandMember(userId: string, bandId: number): Promise<boolean>` (new)

**Behavior:**
1. Query `bands_members` table
2. Check if user has active membership
3. Return boolean

#### `removeMember(bandId: number, userId: string): Promise<void>` (new)

**Behavior:**
1. Remove user from participants
2. Disconnect user's WebSocket from room
3. Broadcast system message to remaining members
4. Store system message in database

---

## Database Schema

### New Table: `band_messages`

```sql
CREATE TABLE band_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  band_id INTEGER NOT NULL REFERENCES bands(id) ON DELETE CASCADE,
  sender_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  message_type TEXT NOT NULL CHECK(message_type IN ('message', 'system')),
  content TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT
);

CREATE INDEX idx_band_messages_band_created ON band_messages(band_id, created_at DESC);
CREATE INDEX idx_band_messages_sender ON band_messages(sender_id);
```

**Columns:**
- `id`: Auto-incrementing primary key
- `band_id`: Foreign key to bands (CASCADE delete)
- `sender_id`: Foreign key to users (SET NULL on delete, preserves history)
- `message_type`: `'message'` or `'system'`
- `content`: Message text or system message description
- `created_at`: ISO 8601 timestamp
- `updated_at`: ISO 8601 timestamp (for future edit feature)

**Indexes:**
- `idx_band_messages_band_created`: Fast retrieval of recent messages with join filtering
- `idx_band_messages_sender`: Query messages by sender

### Existing Tables (No Changes)

The following tables already exist and support the required functionality:
- `bands_members` - Has `joined_at` field for filtering chat history
- `messages` - Existing DM messages table
- `blocked_users` - Blocking functionality (DM only)
- `user_settings` - Privacy settings (DM only)

---

## Business Logic Rules

### Blocking (DM Only)
- Blocking checks ONLY apply to 1:1 DMs
- Blocked users can still interact in band chats
- Admin manages band membership, not blocking

### Privacy Settings (DM Only)
- Privacy settings (`messagingPermission`) ONLY apply to 1:1 DMs
- Band chat bypasses privacy settings
- Membership in band grants messaging access

### Band Chat Access
- Only current band members can:
  - View chat history
  - Send messages
  - Receive real-time messages
- Members only see messages sent after their `joined_at` timestamp
- Members who leave and rejoin get fresh history from new `joined_at`

### Message History Filtering
- **Critical:** Always filter band chat history by user's `joined_at` timestamp
- Members CANNOT query messages sent before they joined
- System messages are also filtered by timestamp

---

## Frontend Components Needed

### 1. MessageButton Component
- **Location:** `apps/web/src/features/chat/components/message-button.tsx`
- **Props:** `userId: string`, `userName: string`, `variant?: 'default' | 'outline'`
- **Behavior:**
  - Check messaging permission via API
  - Disable if blocked/privacy prevents messaging
  - Show tooltip explaining why disabled
  - On click: Navigate to `/messages` with conversation selected

### 2. BandChatTab Component
- **Location:** `apps/web/src/features/bands/components/band-chat-tab.tsx`
- **Behavior:**
  - Load chat history via API (filtered by join time)
  - Subscribe to WebSocket room
  - Display messages with proper styling
  - Render system messages differently
  - Message input at bottom

### 3. ConversationListItem Component (update)
- **Location:** `apps/web/src/features/chat/components/conversation-list-item.tsx`
- **Changes:**
  - Handle `type: 'user' | 'band'` discriminated union
  - Display band avatar/icon for band conversations
  - Show member count for bands

### 4. BandMessageButton Component
- **Location:** `apps/web/src/features/bands/components/band-message-button.tsx`
- **Props:** `bandId: number`, `bandName: string`
- **Behavior:**
  - Show button to open band chat
  - Navigate to band chat tab
  - Only visible to band members

---

## Error Handling

### Client-Side Errors

**Cannot Message User (DM only):**
- Show toast: "You cannot message this user"
- Disable message button
- Display tooltip with reason

**Not a Band Member:**
- Show empty state: "You must be a band member to view this chat"
- Hide message input
- Provide CTA to join band (if applicable)

**Message Send Failed:**
- Show retry button
- Keep message in input field
- Display error message

### Server-Side Errors

**400 Bad Request:**
- Invalid content (empty, too long)
- Invalid user ID
- Return validation error details

**401 Unauthorized:**
- Missing or invalid session token
- Redirect to login

**403 Forbidden:**
- Not a band member (band chat endpoints)
- Return clear error message

**404 Not Found:**
- Band not found
- User not found

**500 Internal Server Error:**
- Database connection failure
- Durable Object invocation error
- Log to Sentry, show generic error to user

---

## Performance Considerations

### Caching
- **DO NOT cache** band membership (critical security check)
- Cache blocking status in ChatDO for 5 minutes (DM only)
- Cache user settings in ChatDO for 5 minutes (DM only)

### Query Optimization
- Use index `idx_band_messages_band_created` for fast history retrieval
- Use index `idx_bands_members_user_bands` for membership checks
- Limit history queries to 100 messages (pagination for more)

### WebSocket Scaling
- Each ChatDO instance handles one room (DM or band)
- Cloudflare Workers automatically scales instances
- No manual scaling needed

---

## Testing Requirements

### Backend Tests
- [ ] Band chat history filtered by join time
- [ ] System messages filtered by join time
- [ ] Non-members cannot access band chat
- [ ] Blocking doesn't affect band chat
- [ ] Privacy settings don't affect band chat
- [ ] Removed members lose access to history
- [ ] Rejoining members get fresh history

### Frontend Tests
- [ ] MessageButton disabled when blocked
- [ ] MessageButton disabled when privacy prevents
- [ ] Conversations list shows both user and band conversations
- [ ] Band chat displays only messages after join time
- [ ] System messages render differently
- [ ] WebSocket reconnects after network failure

---

## Integration Points

### Backend → Frontend
- Backend exposes REST endpoints defined above
- Backend broadcasts WebSocket messages using defined schemas
- Frontend consumes endpoints using shared Zod schemas for validation

### Frontend → Backend
- Frontend calls endpoints with validated payloads (Zod schemas)
- Frontend sends WebSocket messages using defined schemas
- Backend validates all incoming data with same Zod schemas

### Type Safety
- All types inferred from Zod schemas in `packages/common`
- Both apps use identical validation
- TypeScript enforces type safety at compile time
- Zod enforces validation at runtime

---

## Summary

This API contract defines clear boundaries between frontend and backend:
- **Backend** implements REST endpoints, WebSocket handling, and database operations
- **Frontend** implements UI components, WebSocket client, and user interactions
- **Shared types** in `packages/common` ensure type safety across the stack
- **Validation** happens on both sides using identical Zod schemas

Both agents should implement according to these specifications to ensure seamless integration.
