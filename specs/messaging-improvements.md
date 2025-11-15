# Feature: Messaging System Improvements

## Problem Statement

The current messaging system has several limitations that prevent users from connecting effectively:

1. Users can only message people they follow (mutual connections), limiting spontaneous communication
2. The conversations list shows only mutual connections, not actual conversations that have started
3. Users must navigate away from profiles to send messages, creating friction
4. Band members lack a dedicated space to coordinate and communicate
5. Messaging from band pages is not possible, requiring users to message individual members

These limitations prevent:
- Musicians from reaching out to potential collaborators they discovered
- Bands from efficiently coordinating rehearsals and gigs
- Users from initiating conversations based on profile discovery
- Natural networking and collaboration in the music community

## Success Criteria

1. Any user can initiate a conversation with any other user (unless blocked or restricted by privacy settings)
2. Conversations list displays all active conversations, ordered by recency
3. Users can message someone directly from their profile page with one click
4. Band members have a functional group chat for their band
5. Band members can access band chat directly from the band page
6. Privacy settings (who can message me) are respected in 1:1 DMs only (NOT band chats)
7. Blocking is enforced in 1:1 DMs only (NOT band chats)
8. Message delivery is real-time for all conversation types (1:1 and band chat)
9. Band chat history is restricted based on member join time (members only see messages sent after they joined)
10. Members who leave and rejoin a band get fresh history from their rejoin time

## User Stories

### Universal Messaging
- As a musician, I want to message someone whose profile I found interesting so that I can explore collaboration opportunities
- As a band leader, I want to reach out to musicians I discover so that I can invite them to audition
- As a user, I want my privacy settings respected in DMs so that I control who can contact me

### Conversations List
- As a user, I want to see all my active conversations so that I can continue past discussions
- As a user, I want conversations sorted by most recent activity so that I can prioritize responses
- As a user, I want to see both 1:1 and band conversations in one place so that I don't miss messages

### Profile Messaging
- As a user viewing someone's profile, I want to message them immediately so that I don't lose context
- As a user, I want to see if I've already messaged someone before so that I avoid duplicate conversations
- As a user, I want to be prevented from messaging blocked users so that boundaries are respected

### Band Chat
- As a band member, I want a shared chat with my bandmates so that we can coordinate schedules
- As a band admin, I want the same chat access as regular members so that communication is equal
- As a former band member, I want to lose access to band chat so that private discussions remain private
- As a new band member, I want to only see messages sent after I joined so that past private discussions remain private
- As a rejoining band member, I want fresh history from my rejoin time so that I don't see messages from when I wasn't a member
- As a band member, I don't want blocking to prevent communication with other members (admin manages membership)

## Scope

### In Scope (MVP)

**Phase 1: Universal Messaging & Conversations**
- Remove mutual follow requirement for messaging
- Update conversations list to show all active conversations (not just mutual follows)
- Respect `messagingPermission` setting ('anyone', 'followers', 'none') for 1:1 DMs only
- Respect blocked users list in 1:1 DMs only
- Update `getConversations` API to return all conversations
- Update conversations UI to display all conversations

**Phase 2: Profile Messaging Button**
- Add "Message" button to user profile pages
- Button disabled if:
  - User is blocked or blocking the viewer
  - User's privacy settings prevent messaging
  - Viewer is messaging themselves
- Clicking opens existing conversation or starts new one
- Button shows "Continue Conversation" if messages already exist

**Phase 3: Band Chat Rooms**
- Modify `ChatDurableObject` to support band rooms (roomId format: `band:${bandId}`)
- New `band_messages` table for persistent storage
- Band chat accessible from band page (members only)
- Message button on band page opens band chat
- Members can send/receive messages equally (no special admin permissions)
- **Chat history filtered by member join time**: Members only see messages sent after their `joined_at` timestamp
- Members who leave and rejoin get fresh history from their new `joined_at` timestamp
- **No blocking/privacy checks for band chats**: Admin manages membership
- System messages for member join/leave events

### Out of Scope (Future)
- Message read receipts (v2: requires per-user read status tracking)
- Typing indicators for band chat (v2: complex WebSocket broadcasting)
- Message search across conversations (v2: requires full-text search indexes)
- Message reactions/emojis (v2: nice-to-have engagement feature)
- File attachments in messages (v2: requires R2 integration)
- Message pinning in band chat (v2: admin feature)
- Notification preferences per conversation (v2: granular control)
- Archive/mute conversations (v2: inbox management)
- Message forwarding (v2: UX complexity)
- Voice/video calls (v3: requires WebRTC infrastructure)

## User Flow

### Flow 1: Messaging from User Profile

1. User visits another user's profile (`/users/:id`)
2. User sees "Message" button below profile header
3. User clicks "Message" button
4. System checks:
   - Is user blocked? → Show error toast
   - Does recipient allow messages from this user? → Show error toast with reason
   - Does conversation already exist? → Open existing conversation
   - No existing conversation? → Create new conversation
5. User is redirected to `/messages` with conversation selected
6. User can type and send messages immediately

### Flow 2: Viewing All Conversations

1. User navigates to `/messages`
2. System loads all conversations (1:1 and band chats) via `getConversations` API
3. Conversations displayed in left sidebar, sorted by most recent message
4. Each conversation shows:
   - Avatar (user or band)
   - Name
   - Last message preview
   - Timestamp
   - Unread indicator (optional: future enhancement)
5. User clicks conversation → loads in main chat window
6. User can search conversations by name (existing feature)

### Flow 3: Band Chat

1. Band member visits band page (`/bands/:id`)
2. Member sees "Band Chat" tab (only visible to members)
3. Member clicks "Band Chat" tab
4. Band chat UI loads (similar to 1:1 chat)
5. Member sees:
   - Only messages sent after they joined the band
   - System messages (e.g., "Alice joined the band") if they occurred after member's join time
   - Message input at bottom
6. Member types message and sends
7. Message broadcasts to all connected band members in real-time
8. Message persists to database

### Flow 4: Member Removed from Band

1. Admin removes member from band
2. Backend deletes member from `bands_members` table
3. Backend calls `ChatDO.removeMember(bandId, userId)` to:
   - Disconnect user's WebSocket from band chat
   - Broadcast "User X left the band" system message to remaining members
4. If removed member has `/bands/:id` page open, chat tab disappears
5. Removed member can no longer see band chat in conversations list

### Flow 5: Member Rejoins Band

1. Admin adds member back to band (or member applies and is accepted)
2. Backend inserts new row in `bands_members` table with fresh `joined_at` timestamp
3. Member can now access band chat again
4. Member only sees messages sent after their new `joined_at` timestamp (fresh history, no old messages)

## UI Requirements

### Components Needed

**1. MessageButton Component** (new)
- Location: `apps/web/src/features/chat/components/message-button.tsx`
- Props: `userId: string`, `userName: string`, `variant?: 'default' | 'outline'`
- Checks blocking status and privacy settings
- Shows appropriate button state (disabled with tooltip if can't message)
- On click: Opens chat window or redirects to `/messages`

**2. BandChatTab Component** (new)
- Location: `apps/web/src/features/bands/components/band-chat-tab.tsx`
- Similar to existing chat window but for band context
- Shows member avatars in header (stacked or list)
- Renders system messages differently (centered, gray text)
- Uses `useBandChatMessages` hook
- Fetches history with `GET /api/bands/:bandId/chat/history` (includes current user's join time filtering)

**3. ConversationListItem Component** (update)
- Location: `apps/web/src/features/chat/components/conversation-list-item.tsx`
- Add support for `conversation.type: 'user' | 'band'`
- Display band avatar and name for band conversations
- Show member count for band conversations

**4. BandChatWindow Component** (new)
- Location: `apps/web/src/features/chat/components/band-chat-window.tsx`
- Group chat UI with member list
- System message rendering
- Online status for band members (optional: future)

### States

**MessageButton States:**
- Default: "Message" button enabled, primary style
- Disabled (blocked): Button disabled, tooltip "You cannot message this user"
- Disabled (privacy): Button disabled, tooltip "This user only accepts messages from followers"
- Disabled (self): Button disabled, tooltip "You cannot message yourself"
- Existing conversation: "Continue Conversation" text
- Loading: Spinner while checking permissions

**Conversations List States:**
- Loading: Skeleton loaders for conversation items
- Empty: "No conversations yet. Message someone to get started!"
- Loaded: List of conversations with avatars, names, last message, timestamp
- Error: "Failed to load conversations. Please try again."
- Search empty: "No conversations match your search"

**Band Chat States:**
- Loading: "Loading band chat..." with spinner
- Empty: "No messages yet. Start the conversation!"
- Loaded: Message list with proper grouping
- Error: "Failed to load messages. Please try again."
- Not a member: "You must be a band member to view this chat"
- Sending: Optimistic UI for message being sent
- Failed: Retry button for failed messages

### Interactions

**Profile Page:**
- User hovers "Message" button → Shows tooltip if disabled
- User clicks "Message" button → Redirects to `/messages` with conversation selected
- User clicks disabled button → Shows toast explaining why

**Conversations List:**
- User clicks conversation → Selects conversation in main window
- User searches → Filters list in real-time
- User scrolls → Loads more conversations (pagination)
- New message arrives → Conversation jumps to top of list

**Band Chat:**
- Member types message → Character count updates
- Member presses Enter → Sends message
- Member clicks emoji button → Opens emoji picker
- System message appears → Styled differently (centered, gray)
- Member joins/leaves → Real-time update with system message

## API Requirements

### Endpoints Modified

#### `GET /api/chat/conversations`
**Purpose:** Retrieve all conversations for current user (1:1 and band chats)

**Changes:**
- Remove `is_mutual_follow` filter (line 53 in conversations-queries.ts)
- Add band conversations to results
- Join with `bands_members` table to include band chats

**Auth:** Required

**Response:**
```json
{
  "conversations": [
    {
      "id": "conv-123",
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
      }
    },
    {
      "id": "conv-789",
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

**Validation:**
- `limit`: 1-100, default 20
- `offset`: >= 0, default 0

**Errors:**
- 401: Unauthorized (no auth token)
- 500: Database error

### Endpoints Created

#### `POST /api/chat/check-messaging-permission`
**Purpose:** Check if current user can message target user (1:1 DMs only)

**Auth:** Required

**Request:**
```json
{
  "targetUserId": "user-456"
}
```

**Response:**
```json
{
  "canMessage": true,
  "reason": null
}
```

or

```json
{
  "canMessage": false,
  "reason": "blocked" | "privacy" | "self"
}
```

**Validation:**
- `targetUserId`: required, must be valid user ID

**Errors:**
- 400: Invalid user ID
- 401: Unauthorized
- 404: User not found

#### `GET /api/bands/:bandId/chat/history`
**Purpose:** Retrieve band chat message history filtered by current user's join time

**Auth:** Required

**Query Parameters:**
- `userId`: Current user's ID (for join time filtering)

**Logic:**
1. Verify user is current band member
2. Get user's `joined_at` from `bands_members` table
3. Query `band_messages` where `created_at >= joined_at`
4. Return messages in chronological order

**Response:**
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
    "createdAt": "2025-01-15T15:00:00Z"
  }
]
```

**Validation:**
- User must be a current band member
- Only returns messages created after user's `joined_at` timestamp

**Errors:**
- 401: Unauthorized
- 403: Not a band member
- 404: Band not found

#### `POST /api/bands/:bandId/chat/send`
**Purpose:** Send message to band chat (fallback for non-WebSocket)

**Auth:** Required

**Request:**
```json
{
  "content": "See you all next week!"
}
```

**Response:**
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

**Validation:**
- `content`: required, 1-1000 chars
- User must be a band member
- **No blocking/privacy checks** (different from 1:1 DMs)

**Errors:**
- 400: Invalid content
- 401: Unauthorized
- 403: Not a band member
- 404: Band not found

## ChatDurableObject Modifications

**Location:** `/packages/durable-objects/src/chat-durable-object.ts`

### Key Changes

**1. Support Both Room Types**
- Detect room type from `roomId` format:
  - 1:1 DMs: `userId1:userId2` (existing)
  - Band chats: `band:${bandId}` (new)

**2. Update `sendMessage()` method (lines 68-101)**
```typescript
async sendMessage(senderId: string, roomId: string, content: string): Promise<void> {
    this.roomId = roomId;
    await this.loadParticipants();

    if (!this.participants.has(senderId)) {
        console.error('[ChatDO] Sender not in participants - aborting');
        return;
    }

    // Detect room type
    const isBandRoom = roomId.startsWith('band:');

    if (isBandRoom) {
        // For band rooms: Only verify membership (no blocking/privacy checks)
        const bandId = parseInt(roomId.split(':')[1]);
        const isMember = await this.isBandMember(senderId, bandId);
        if (!isMember) {
            console.error('[ChatDO] User not a band member - aborting');
            return;
        }
    } else {
        // For DM rooms: Check blocking and privacy settings
        const recipientId = Array.from(this.participants).find((id) => id !== senderId);
        if (recipientId) {
            const canSend = await this.canSendMessage(senderId, recipientId);
            if (!canSend) {
                console.error('[ChatDO] Permission denied - cannot send message');
                return;
            }
        }
    }

    const message = chatMessageSchema.parse({
        id: crypto.randomUUID(),
        type: 'chat',
        content,
        roomId: this.roomId,
        senderId,
        timestamp: Date.now()
    });

    await this.storeMessage(message);
    await this.broadcastMessage(message);
}
```

**3. Update `storeMessage()` method (lines 195-234)**
```typescript
private async storeMessage(message: ChatMessage) {
    // Store in Durable Object storage for WebSocket replay
    const history = (await this.storage.get<ChatMessage[]>(MESSAGES_KEY)) || [];
    history.push(message);

    if (history.length > 1000) {
        history.splice(0, history.length - 1000);
    }

    await this.storage.put(MESSAGES_KEY, history);

    // Persist to database
    try {
        const db = drizzle(this.env.DB);
        const isBandRoom = this.roomId?.startsWith('band:');

        if (isBandRoom) {
            // Store in band_messages table
            const bandId = parseInt(this.roomId!.split(':')[1]);
            const { bandMessagesTable } = schema;

            await db.insert(bandMessagesTable).values({
                bandId,
                senderId: message.senderId,
                messageType: 'message',
                content: message.content,
                createdAt: new Date(message.timestamp).toISOString()
            });
        } else {
            // Store in messages table (existing logic)
            const { messagesTable } = schema;
            const receiverId = Array.from(this.participants).find((id) => id !== message.senderId);

            if (!receiverId) {
                console.error('[ChatDO] No receiver found for message');
                return;
            }

            await db.insert(messagesTable).values({
                senderId: message.senderId,
                receiverId: receiverId,
                content: message.content,
                createdAt: new Date(message.timestamp).toISOString()
            });
        }
    } catch (error) {
        console.error('[ChatDO] Failed to store message in database:', error);
    }
}
```

**4. Update `getRoomHistory()` method (lines 146-184)**
```typescript
async getRoomHistory(roomId: string, userId?: string): Promise<ChatMessage[]> {
    this.roomId = roomId;

    try {
        const db = drizzle(this.env.DB);
        const isBandRoom = roomId.startsWith('band:');

        if (isBandRoom) {
            // Query band_messages with member join filtering
            const bandId = parseInt(roomId.split(':')[1]);
            const { bandMessagesTable, bandsMembersTable } = schema;

            if (!userId) {
                console.error('[ChatDO] userId required for band room history');
                return [];
            }

            // Get user's join time
            const [member] = await db
                .select({ joinedAt: bandsMembersTable.joinedAt })
                .from(bandsMembersTable)
                .where(
                    and(
                        eq(bandsMembersTable.bandId, bandId),
                        eq(bandsMembersTable.userId, userId)
                    )
                )
                .limit(1);

            if (!member) {
                console.error('[ChatDO] User not a band member');
                return [];
            }

            // Get messages created after user joined
            const messages = await db
                .select()
                .from(bandMessagesTable)
                .where(
                    and(
                        eq(bandMessagesTable.bandId, bandId),
                        gte(bandMessagesTable.createdAt, member.joinedAt)
                    )
                )
                .orderBy(desc(bandMessagesTable.createdAt))
                .limit(100);

            return messages.reverse().map((msg) => ({
                id: crypto.randomUUID(),
                type: msg.messageType === 'system' ? 'system' : 'chat',
                content: msg.content,
                roomId: roomId,
                senderId: msg.senderId || 'system',
                timestamp: new Date(msg.createdAt).getTime()
            }));
        } else {
            // Query messages table for 1:1 DMs (existing logic)
            const { messagesTable } = schema;
            const [userId1, userId2] = roomId.split(':');

            if (!userId1 || !userId2) {
                console.error('[ChatDO] Invalid roomId format', { roomId });
                return [];
            }

            const messages = await db
                .select()
                .from(messagesTable)
                .where(
                    or(
                        and(eq(messagesTable.senderId, userId1), eq(messagesTable.receiverId, userId2)),
                        and(eq(messagesTable.senderId, userId2), eq(messagesTable.receiverId, userId1))
                    )
                )
                .orderBy(desc(messagesTable.createdAt))
                .limit(100);

            return messages.reverse().map((msg) => ({
                id: crypto.randomUUID(),
                type: 'chat' as const,
                content: msg.content,
                roomId: roomId,
                senderId: msg.senderId,
                timestamp: new Date(msg.createdAt).getTime()
            }));
        }
    } catch (error) {
        console.error('[ChatDO] Failed to retrieve room history:', error);
        return [];
    }
}
```

**5. Update `canSendMessage()` method (lines 103-144)**
- Keep existing implementation unchanged
- Only called for 1:1 DM rooms (not band rooms)
- Checks blocking and privacy settings

**6. Add `isBandMember()` helper method (new)**
```typescript
private async isBandMember(userId: string, bandId: number): Promise<boolean> {
    const db = drizzle(this.env.DB);
    const { bandsMembersTable } = schema;

    const [member] = await db
        .select()
        .from(bandsMembersTable)
        .where(
            and(
                eq(bandsMembersTable.userId, userId),
                eq(bandsMembersTable.bandId, bandId)
            )
        )
        .limit(1);

    return member !== undefined;
}
```

**7. Add `removeMember()` method (new)**
```typescript
async removeMember(bandId: number, userId: string): Promise<void> {
    const roomId = `band:${bandId}`;
    this.roomId = roomId;
    await this.loadParticipants();

    // Remove from participants
    this.participants.delete(userId);
    await this.saveParticipants();

    // Disconnect user's WebSocket
    try {
        const id = this.env.UserDO.idFromName(`user:${userId}`);
        const stub = this.env.UserDO.get(id);
        await stub.disconnectFromRoom(roomId);
    } catch (error) {
        console.error('[ChatDO] Failed to disconnect removed member:', error);
    }

    // Broadcast system message to remaining members
    await this.broadcastMessage({
        type: 'system',
        roomId: roomId,
        content: `User left the band`,
        userId,
        timestamp: Date.now()
    });
}
```

## Database Changes

### New Tables

#### `band_messages`
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
- `band_id`: Foreign key to bands table (CASCADE delete when band deleted)
- `sender_id`: Foreign key to users table (SET NULL when user deleted, allows viewing old messages)
- `message_type`: 'message' (user-sent) or 'system' (join/leave events)
- `content`: Message text or system message description
- `created_at`: ISO 8601 timestamp
- `updated_at`: ISO 8601 timestamp (for future edit feature)

### Modified Tables

**No modifications to existing tables required.**

The existing `bands_members` table already has:
- `joined_at` field (ISO 8601 timestamp)
- Proper indexes for efficient querying

### Indexes Needed

**New indexes (band_messages):**
- Index on `band_messages(band_id, created_at DESC)` - Performance: Load recent messages for band chat with join filtering
- Index on `band_messages.sender_id` - Performance: Query messages by sender

**Existing indexes (already in place):**
- Index on `bands_members(user_id, is_admin, joined_at)` - Performance: Check membership and get join time
- Index on `blocked_users(blocker_id, blocked_id)` - Performance: Check blocking status
- Index on `user_settings.user_id` - Performance: Check messaging permissions

## Edge Cases

### What happens when...

1. **User is blocked mid-conversation?**
   - Frontend: Conversation remains in list (preserves history) but message input disabled with "Cannot message blocked user"
   - Backend: `ChatDO.sendMessage` checks blocking status and rejects message
   - WebSocket: No new messages delivered from blocked user
   - **Note:** Only applies to 1:1 DMs, not band chats

2. **User changes privacy settings to 'none' while someone is messaging them?**
   - Existing conversations remain accessible (preserve history)
   - New messages from non-followers rejected with error
   - Sender sees toast: "This user's privacy settings prevent messaging"
   - **Note:** Only applies to 1:1 DMs, not band chats

3. **Band is deleted while members are in chat?**
   - WebSocket connections closed
   - `ChatDO` instance garbage collected
   - `band_messages` rows CASCADE deleted
   - Members see "Band no longer exists" in conversations list

4. **Member removed from band while actively chatting?**
   - `ChatDO.removeMember` disconnects WebSocket
   - Member's chat UI shows "You are no longer a member of this band"
   - Band chat removed from member's conversations list
   - Member cannot access chat history (enforced by API)

5. **Member leaves and rejoins band?**
   - New `bands_members` row created with fresh `joined_at` timestamp
   - Member can access band chat again
   - Member only sees messages sent after their new `joined_at` timestamp
   - **No access to messages sent between their leave and rejoin times**

6. **User tries to message themselves?**
   - "Message" button disabled on own profile
   - API rejects with 400 error if attempted via direct request

7. **Network fails while sending message?**
   - Optimistic UI shows message as "sending..."
   - After 5s timeout, message marked as "failed" with retry button
   - User clicks retry → Re-attempts send
   - If still fails, shows persistent error state

8. **Two users message each other simultaneously (race condition)?**
   - Both messages succeed independently
   - Conversation appears in both users' lists
   - No duplicate conversation created (roomId is deterministic: sorted user IDs)

9. **User navigates away from chat while message is sending?**
   - Message continues sending in background (WebSocket persists)
   - If send fails, user won't see error until returning to chat
   - On return, failed messages show retry button

10. **Band has 100+ members (large chat)?**
    - Load only last 100 messages initially (filtered by join time)
    - Infinite scroll to load older messages (pagination)
    - WebSocket broadcasts scale to all connected members
    - Performance: Consider limiting message history in Durable Object storage

11. **User deletes account with active conversations?**
    - `messages.sender_id` SET NULL (preserves conversation for recipient)
    - `band_messages.sender_id` SET NULL (preserves band chat history)
    - User's conversations deleted
    - Other users see "[Deleted User]" as sender name

12. **Spamming messages to non-connections?**
    - No automatic rate limiting (per requirements)
    - Users rely on blocking feature (1:1 DMs only)
    - **Note:** Band chat spam is handled by admin removing member
    - Future: Track reports and implement account-level rate limits

13. **Blocked user joins same band as blocker?**
    - Both users can send/receive messages in band chat (blocking doesn't apply)
    - Admin manages band membership if there's a conflict
    - Blocking still prevents 1:1 DMs between them

14. **Member queries history before they joined?**
    - API enforces `created_at >= joined_at` filter
    - Returns empty array or only messages after join time
    - No way to access pre-join messages

15. **System messages for user who wasn't member yet?**
    - System messages (join/leave) filtered same way as regular messages
    - Member won't see "Alice joined" if it happened before their join time
    - Only sees events that occurred during their membership

## Validation Rules

### Client-side (immediate feedback)

**MessageButton:**
- Check if user is blocked (query `blockedUsers`)
- Check if target user allows messaging (query `userSettings`)
- Disable button with tooltip if validation fails

**Message Input:**
- Content: 1-1000 characters
- Show character count
- Disable send button if empty or over limit
- Trim whitespace before sending

**Band Chat:**
- Content: 1-1000 characters
- User must be band member (check `bandMembers` list)
- Show error if not member
- **No blocking/privacy checks** (different from 1:1 DMs)

### Server-side (security)

**1:1 DM Messaging Endpoints:**
- Authentication required (verify session token)
- User ID from `c.get('user')` (never trust client)
- Check blocking status (both directions)
- Check privacy settings (`messagingPermission`)

**Band Chat Endpoints:**
- Authentication required (verify session token)
- Verify user is current band member (query `bands_members`)
- Content length: 1-1000 chars (prevent abuse)
- **No blocking checks** (admin manages membership)
- **No privacy checks** (band membership grants access)
- Rate limiting: Consider 100 messages/minute per user (future)

**Business Logic:**
- User cannot message themselves (1:1 DMs)
- User cannot message if blocked (1:1 DMs only)
- User cannot message if recipient's settings disallow (1:1 DMs only)
- User cannot access band chat if not a member
- User cannot send empty messages
- User can only see band messages sent after their `joined_at` timestamp

## Error Handling

### User-Facing Errors

**Cannot Message User (1:1 DMs only):**
- Scenario: User blocked or privacy settings prevent messaging
- Error message: "You cannot message this user" / "This user only accepts messages from followers"
- Action: Show toast, disable message button

**Not a Band Member:**
- Scenario: User tries to access band chat without membership
- Error message: "You must be a band member to view this chat"
- Action: Show empty state with explanation, hide message input

**Message Send Failed:**
- Scenario: Network error or WebSocket disconnected
- Error message: "Failed to send message"
- Action: Show retry button, keep message in input field

**Conversation Load Failed:**
- Scenario: Database error or API timeout
- Error message: "Failed to load conversations. Please try again."
- Action: Show retry button, log error to Sentry

### Developer Errors (log, alert)

**Database Connection Failure:**
- Log to console and Sentry
- Return 500 to client
- Show generic error to user

**Durable Object Invocation Error:**
- Log error details (roomId, userId, operation)
- Attempt retry (1-2 times)
- If retry fails, return 500

**WebSocket Broadcast Failure:**
- Log error (which users failed to receive)
- Continue broadcasting to other users
- Failed user will see message when reconnecting

**Invalid Message Format:**
- Log warning (schema validation failed)
- Reject message with 400 error
- Return specific validation error to client

## Performance Considerations

**Expected Load:**
- 1:1 messaging: 1000 concurrent WebSocket connections (10% of 10k DAU)
- Band chat: 50 concurrent band chats (average 5 members each)
- Messages per minute: ~500 across all conversations

**Query Optimization:**
- Index on `band_messages(band_id, created_at DESC)` for fast chat history retrieval with join filtering
- Index on `bands_members(user_id, is_admin, joined_at)` for fast membership and join time lookup
- Limit message history queries to 100 messages (pagination for older)
- Cache user settings in Durable Object to avoid repeated DB queries (1:1 DMs only)

**Caching:**
- Cache blocking status in `ChatDO` for 5 minutes (reduce DB queries, 1:1 DMs only)
- Cache user settings in `ChatDO` for 5 minutes (1:1 DMs only)
- No caching of band membership (critical security check)
- No caching of messages (real-time requirement)

**Rate Limiting:**
- No automatic rate limiting per requirements
- Monitor for abuse patterns in production
- Future: Implement account-level limits (e.g., 1000 messages/day)

**WebSocket Scaling:**
- Each `ChatDO` instance handles one chat room (1:1 or band, scales automatically)
- Each `UserDO` instance handles one user connection (scales automatically)
- Cloudflare Workers handles load balancing and scaling

## Testing Checklist

### Functional Tests

**Universal Messaging:**
- [ ] User can message any user (not blocked, privacy allows)
- [ ] User cannot message blocked users (1:1 DMs only)
- [ ] User cannot message users with privacy 'none'
- [ ] User can only message followers if privacy 'followers'
- [ ] Messages deliver in real-time

**Conversations List:**
- [ ] Shows all 1:1 conversations
- [ ] Shows all band conversations
- [ ] Sorted by most recent message
- [ ] Search filters conversations
- [ ] Pagination loads more conversations

**Profile Messaging:**
- [ ] "Message" button appears on user profiles
- [ ] Button disabled if blocked
- [ ] Button disabled if privacy prevents messaging
- [ ] Button disabled on own profile
- [ ] Clicking opens existing conversation
- [ ] Clicking creates new conversation if none exists

**Band Chat:**
- [ ] Band members can send messages
- [ ] Messages broadcast to all members
- [ ] System messages appear on join/leave
- [ ] Non-members cannot access chat
- [ ] Removed members lose access to history

**Band Chat History Filtering:**
- [ ] New member only sees messages sent after they joined
- [ ] Member who leaves and rejoins gets fresh history from rejoin time
- [ ] Member cannot query messages sent before their join time
- [ ] System messages filtered by join time
- [ ] History API enforces `created_at >= joined_at` filter

**Blocking in Band Chats:**
- [ ] Blocked users can still message each other in band chat
- [ ] Blocking only affects 1:1 DMs
- [ ] No blocking checks in band chat send logic

### Edge Case Tests

**Blocking (1:1 DMs only):**
- [ ] Cannot message blocked user
- [ ] Cannot receive messages from blocked user
- [ ] Blocking mid-conversation disables input
- [ ] Blocked users can still interact in band chats

**Privacy Settings (1:1 DMs only):**
- [ ] 'anyone' allows all messages
- [ ] 'followers' allows only followers
- [ ] 'none' blocks all messages
- [ ] Changing settings applies immediately
- [ ] Privacy settings don't affect band chats

**Band Member Removal:**
- [ ] Removed member disconnected from chat
- [ ] Removed member cannot access history
- [ ] Remaining members see system message

**Band Member Rejoin:**
- [ ] Rejoining member gets new `joined_at` timestamp
- [ ] Rejoining member only sees messages from rejoin time forward
- [ ] Rejoining member cannot see messages from previous membership
- [ ] Rejoining member cannot see messages sent during absence

**Network Failures:**
- [ ] Failed messages show retry button
- [ ] Retry succeeds after network recovery
- [ ] WebSocket reconnects automatically

### Non-Functional Tests

**Performance:**
- [ ] Message send latency < 100ms (WebSocket)
- [ ] Conversation list loads < 500ms
- [ ] Band chat history loads < 500ms (with join filtering)
- [ ] Supports 100+ member band chats

**Mobile Responsive:**
- [ ] Message button renders on mobile
- [ ] Conversations list scrolls on mobile
- [ ] Chat input resizes for keyboard
- [ ] Emoji picker fits mobile screen

**Accessibility:**
- [ ] Message button keyboard navigable
- [ ] Screen reader announces messages
- [ ] Chat input has proper ARIA labels
- [ ] Focus management in conversations list

## Security Considerations

- [x] **Authentication required:** All messaging endpoints verify session token
- [x] **Authorization:** User ID from server context (`c.get('user')`), never trusted from client
- [x] **Input sanitization:** Zod schema validates message content, strips HTML/scripts
- [x] **Rate limiting:** Not implemented per requirements, rely on blocking (1:1 DMs) or admin removal (band chats)
- [x] **Sensitive data:** Messages stored in database (D1), not exposed to unauthorized users
- [x] **Blocking enforcement:** Checked in `ChatDO.canSendMessage` for 1:1 DMs only (NOT band chats)
- [x] **Privacy enforcement:** Checked in `ChatDO.canSendMessage` for 1:1 DMs only (NOT band chats)
- [x] **Band chat access control:** History filtered by member `joined_at` timestamp (enforced in API and ChatDO)
- [x] **Member join time enforcement:** Cannot query messages sent before membership period
- [x] **WebSocket security:** User ID verified in request header, not trusted from message payload
- [x] **Database security:** Foreign keys with CASCADE/SET NULL for data integrity
- [x] **Durable Object security:** Each instance scoped to single room, no cross-contamination

## Rollout Plan

### Phase 1: Universal Messaging & Conversations (Week 1)
**Build:**
- Remove mutual follow filter in `getConversations` query
- Update `ConversationsResponse` Zod schema to include band conversations
- Modify `ChatDO.canSendMessage` to only apply to 1:1 DMs (check room type first)
- Update frontend conversations list to handle mixed conversation types

**Ship:**
- Deploy to production (all users)
- Monitor error rates and message delivery success

**Metrics:**
- Conversation creation rate (expect increase)
- Message delivery success rate (target 99.9%)
- Privacy setting usage (% users with 'followers'/'none')

### Phase 2: Profile Messaging Button (Week 2)
**Build:**
- Create `MessageButton` component with permission checks
- Add `POST /api/chat/check-messaging-permission` endpoint
- Integrate button into user profile page
- Handle edge cases (blocking, privacy, self)

**Ship:**
- Deploy to production (all users)
- A/B test button placement (below header vs in sticky toolbar)

**Metrics:**
- Button click rate
- Conversation initiation rate from profiles
- Error rate (blocked/privacy errors)

### Phase 3: Band Chat Rooms (Week 2-3)
**Build:**
- Modify `ChatDurableObject` to support band rooms (detect `band:${bandId}` format)
- Add `band_messages` table with migration
- Add `isBandMember()`, `removeMember()` helper methods to ChatDO
- Update `sendMessage()`, `storeMessage()`, `getRoomHistory()` to handle both room types
- Create band chat API endpoints with join time filtering
- Build `BandChatTab` component
- Implement member join/leave system messages
- Add band chat to conversations list

**Ship:**
- Deploy to 10% of bands (beta test)
- Gather feedback from active bands
- Monitor performance with large bands (50+ members)
- Ship to 100% of bands

**Metrics:**
- Band chat adoption rate (% bands with messages)
- Messages per band per day
- Member engagement (% members sending messages)
- Performance (message latency, WebSocket connection stability)
- History filtering accuracy (% queries correctly filtered by join time)

## Metrics to Track

### Engagement Metrics
- **Conversation creation rate:** New conversations per day (expect +50% after universal messaging)
- **Messages sent per user per day:** Average messages sent (target: maintain or increase)
- **Band chat adoption:** % of bands with >5 messages (target: 30% within 1 month)
- **Profile messaging CTR:** % of profile views that result in message click (target: 5-10%)

### Technical Metrics
- **Message delivery success rate:** % messages successfully delivered via WebSocket (target: 99.9%)
- **API error rate:** % of API requests that return 4xx/5xx (target: <1%)
- **WebSocket connection stability:** Average connection duration before disconnect (target: >10 minutes)
- **Band chat performance:** Average message latency for bands with 50+ members (target: <200ms)
- **History query performance:** Average query time for band chat history with join filtering (target: <100ms)

### Privacy & Safety Metrics
- **Privacy setting usage:** % users with 'followers'/'none' settings (baseline metric)
- **Block rate:** Blocks per user per month (expect slight increase initially)
- **Spam reports:** User reports of unwanted messages (monitor for abuse)
- **Band member removal rate:** Removals per band per month (monitor for conflicts)

## Open Questions

1. **Should band chat support @mentions?** (who decides: product)
   - Would increase engagement but adds complexity
   - Consider for v2 after MVP proves value

2. **Should we show "typing..." indicators in band chat?** (who decides: product)
   - Nice UX but complex WebSocket broadcasting
   - Consider for v2 based on user feedback

3. **Should removed band members see a tombstone ("You were removed") in conversations list?** (who decides: product)
   - Helps avoid confusion ("where did my chat go?")
   - May be negative UX for removed members
   - **Decision:** Show tombstone for 24 hours, then remove from list

4. **Should band admins be able to delete messages in band chat?** (who decides: product)
   - Useful for moderation
   - Adds complexity and permission checks
   - Consider for v2 with moderation tools

5. **Should we implement message threading in band chat?** (who decides: product)
   - Would help organize complex discussions
   - Significantly more complex UI/UX
   - Defer to v3 after validating basic chat usage

6. **Should there be a retention limit for band chat history?** (who decides: product/engineering)
   - Could improve performance and reduce storage costs
   - Example: Only keep last 1000 messages per band
   - Consider for v2 based on usage patterns

## Dependencies

**Required Before Starting:**
- None (all dependencies already in place)

**Blocks:**
- None

**Nice to Have (Parallel Work):**
- Notification system integration (notify users of new messages when offline)
- Push notifications for mobile (future mobile app)

---

**Estimated Effort:** 9 days (1.5 sprints)
- Phase 1: 2 days (backend + frontend updates, simpler than before)
- Phase 2: 2 days (component + integration)
- Phase 3: 5 days (ChatDO modifications + table + UI + testing, no new DO class)

**Savings from architecture simplification:** 3 days (no need to create new BandDurableObject class, reuse existing ChatDO)

**Priority:** High (key activation & retention feature)

**Owner:** Backend/Frontend (coordinated implementation, no system-architect needed for shared types)
