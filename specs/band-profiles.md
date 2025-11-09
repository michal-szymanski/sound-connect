# Feature: Band/Group Profiles - Complete Implementation

## Problem Statement

Sound Connect is a professional network for musicians, with the core use case: **Bands find musicians, musicians find bands**. Currently, musicians can create profiles and connect, but bands have no full presence on the platform. While basic band CRUD operations exist, bands cannot post content, be followed, or fully participate in the social ecosystem. This breaks the core value proposition.

Musicians looking for bands can't see band activity or updates. Bands looking for members can't build a following or maintain an active presence. This feature completes the band profiles implementation by adding social features (posts, follows, messaging) and integrating bands into the platform's social graph.

## Success Criteria

**MVP Success:**
- Bands can create and publish posts (text + media) to their feed
- Users can follow/unfollow bands
- Band posts appear in followers' home feeds
- Users can message band admins directly from band profile
- Band-related notifications work (new follower, post reactions, etc.)
- Band follower count displays on profile
- Bands are searchable (already implemented)
- Band members are displayed (already implemented)
- Band admin can manage band info (already implemented)

**Non-Functional:**
- Band posts load within 500ms
- Following/unfollowing is instant (optimistic updates)
- No breaking changes to existing band functionality

## Current State Analysis

### Already Implemented
1. **Database Schema:**
   - `bands` table with all necessary fields (name, description, genre, location, lookingFor, etc.)
   - `bands_members` table with admin tracking
   - `bands_followers` table (schema exists, not used in UI)

2. **Backend API:**
   - `POST /api/bands` - Create band
   - `GET /api/bands/:id` - Get band details
   - `PATCH /api/bands/:id` - Update band
   - `DELETE /api/bands/:id` - Delete band
   - `POST /api/bands/:id/members` - Add member
   - `DELETE /api/bands/:id/members/:userId` - Remove member
   - `GET /api/users/:userId/bands` - Get user's bands

3. **Frontend:**
   - `/bands/search` - Band search page with filters
   - `/bands/new` - Band creation page
   - `/bands/$id` - Band detail page
   - Band components (BandForm, BandHeader, BandMemberCard, etc.)

4. **Shared Types:**
   - `packages/common/types/bands.ts` - All band types and Zod schemas
   - `packages/common/types/band-search.ts` - Search types

### Missing Features (This Spec)

1. **Band Posts/Feed**
   - Bands can't create posts
   - No band feed page
   - Band posts don't show in home feed

2. **Band Following**
   - Schema exists, but no UI to follow/unfollow
   - No follower count display
   - No followers list

3. **Band Messaging**
   - No way to message band admin from profile

4. **Band Notifications**
   - No notifications for band followers
   - No notifications for band admins

5. **Band Integration**
   - Posts system assumes only users post (need to support bands)
   - Notifications system doesn't handle band entities
   - Home feed doesn't include band posts

## User Stories

### Band Admin Stories
- As a band admin, I want to create posts on behalf of the band so that I can share updates, looking-for-member posts, and show announcements
- As a band admin, I want to see who follows our band so that I can understand our audience
- As a band admin, I want to receive notifications when someone follows our band
- As a band admin, I want to receive notifications when someone reacts to or comments on band posts
- As a band admin, I want to receive messages from interested musicians

### Musician Stories
- As a musician, I want to follow bands I'm interested in so that I see their updates in my feed
- As a musician, I want to see a band's post history to understand their activity level and style
- As a musician, I want to message a band admin directly to express interest in joining
- As a musician, I want to react to and comment on band posts
- As a musician, I want to see how many followers a band has to gauge their popularity
- As a musician, I want to see band posts in my home feed mixed with posts from users I follow

## Scope

### In Scope (MVP)

1. **Band Posts:**
   - Band admins can create posts (text + media) on behalf of the band
   - Band posts display author as the band (not individual admin)
   - Band posts appear on band profile feed tab
   - Band posts appear in followers' home feeds
   - Users can react to and comment on band posts (existing system)

2. **Band Following:**
   - Users can follow/unfollow bands from band profile
   - Follower count displays on band profile
   - Followers list modal (simple list of users)
   - "Following" badge shows when user follows a band

3. **Band Messaging:**
   - "Message" button on band profile opens DM with band admin
   - If multiple admins, message goes to the first admin (by join date)
   - Message thread shows band name as context

4. **Band Notifications:**
   - Band admins receive notification when someone follows the band
   - Band admins receive notifications for reactions/comments on band posts
   - Users receive notifications for reactions/comments on their comments on band posts (existing system)

5. **UI Updates:**
   - Band profile page gets "Posts" tab
   - Band profile shows follower count
   - Follow/Unfollow button on band header
   - Message button on band header
   - Home feed supports band posts

### Out of Scope (Future)

- Multiple admins receiving the same notification (only first admin for MVP)
- Band-to-band following (bands following other bands)
- Band-initiated messages (only users can initiate)
- Scheduled posts
- Post analytics for bands
- Pinned posts
- Band verification badges
- Post drafts
- Multiple admin message routing (goes to first admin only)
- Band activity feed (separate from posts, like "added new member")
- Band settings page (use existing edit form)
- Band cover photo (profile image only)
- Band audio/video players (use SoundCloud links in bio/posts)
- Event calendar integration

## Database Changes

### Existing Schema (No Changes Needed)

The database schema already supports all MVP features:

```sql
-- bands table (already exists, no changes)
CREATE TABLE bands (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    primary_genre TEXT,
    city TEXT,
    state TEXT,
    country TEXT,
    latitude INTEGER,
    longitude INTEGER,
    looking_for TEXT,
    profile_image_url TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT
);

-- bands_members table (already exists, no changes)
CREATE TABLE bands_members (
    id INTEGER PRIMARY KEY,
    user_id TEXT NOT NULL,
    band_id INTEGER NOT NULL REFERENCES bands(id) ON DELETE CASCADE,
    is_admin INTEGER NOT NULL, -- boolean
    joined_at TEXT NOT NULL
);

-- bands_followers table (already exists, no changes)
CREATE TABLE bands_followers (
    id INTEGER PRIMARY KEY,
    follower_id TEXT NOT NULL,
    band_id INTEGER NOT NULL REFERENCES bands(id),
    created_at TEXT NOT NULL
);
```

### Schema Extensions Needed

#### 1. Extend `posts` table to support band authors

**Current:**
```sql
CREATE TABLE posts (
    id INTEGER PRIMARY KEY,
    user_id TEXT NOT NULL, -- Currently only users
    content TEXT NOT NULL,
    status TEXT DEFAULT 'pending' NOT NULL,
    moderation_reason TEXT,
    moderated_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT
);
```

**Required Changes:**
Add columns to support band posts:
- `author_type` - 'user' or 'band'
- `band_id` - Reference to bands table (nullable)

**Migration:**
```sql
ALTER TABLE posts ADD COLUMN author_type TEXT DEFAULT 'user' NOT NULL;
ALTER TABLE posts ADD COLUMN band_id INTEGER REFERENCES bands(id) ON DELETE CASCADE;

-- Update Drizzle schema validation
-- All existing posts have author_type='user'
-- New band posts will have author_type='band' and band_id set
```

**Validation Rules:**
- If `author_type = 'user'`, then `user_id` must be set, `band_id` must be NULL
- If `author_type = 'band'`, then `band_id` must be set, `user_id` is the admin who created it (for audit)
- Index on `(author_type, band_id)` for band feed queries

#### 2. Extend `notifications` table to support band entities

**Current:**
```sql
CREATE TABLE notifications (
    id INTEGER PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'follow_request', 'follow_accepted', 'comment', 'reaction', 'mention'
    actor_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    entity_id TEXT,
    entity_type TEXT, -- 'post', 'comment', 'message', 'band'
    content TEXT NOT NULL,
    seen INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
);
```

**Already Supports Bands!**
- `entity_type` enum includes 'band'
- Can handle "User X followed your band" by setting `entity_type='band'` and `entity_id=<band_id>`

**No changes needed** - existing schema is sufficient.

### Indexes Needed

Add indexes for performance:

```sql
-- Posts by band (for band feed)
CREATE INDEX idx_posts_band_id ON posts(band_id) WHERE author_type = 'band';
CREATE INDEX idx_posts_author_type ON posts(author_type, created_at DESC);

-- Band followers (for follower count, follow check)
CREATE INDEX idx_bands_followers_band_id ON bands_followers(band_id);
CREATE INDEX idx_bands_followers_user_band ON bands_followers(follower_id, band_id);

-- Already exists: idx_bands_members_user_bands on (user_id, is_admin, joined_at)
```

## API Requirements

### New Endpoints

#### 1. `POST /api/bands/:id/posts`
**Purpose:** Band admin creates a post on behalf of the band
**Auth:** Required (must be band admin)
**Request:**
```json
{
  "content": "We're looking for a bass player! See our 'Looking For' section for details.",
  "media": [
    { "type": "image", "key": "band-photo.jpg" }
  ]
}
```
**Response:**
```json
{
  "id": 123,
  "authorType": "band",
  "bandId": 5,
  "userId": "admin-user-id",
  "content": "...",
  "status": "pending",
  "createdAt": "2025-01-09T12:00:00Z",
  "band": {
    "id": 5,
    "name": "The Rockers",
    "profileImageUrl": "..."
  },
  "media": [...]
}
```
**Validation:**
- User must be band admin (check `bands_members` where `is_admin=true`)
- Content: required, 1-5000 chars
- Media: optional, max 4 items (same as user posts)
**Errors:**
- 403: Not a band admin
- 404: Band not found
- 400: Invalid content or media

#### 2. `GET /api/bands/:id/posts`
**Purpose:** Get posts created by the band
**Auth:** Optional
**Query Params:**
- `page`: number (default 1)
- `limit`: number (default 20, max 50)
**Response:**
```json
{
  "posts": [...], // Array of posts with band info
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3,
    "hasMore": true
  }
}
```
**Validation:**
- Band must exist
**Errors:**
- 404: Band not found

#### 3. `POST /api/bands/:id/follow`
**Purpose:** Follow a band
**Auth:** Required
**Request:** Empty body
**Response:**
```json
{
  "followerId": "user-id",
  "bandId": 5,
  "createdAt": "2025-01-09T12:00:00Z"
}
```
**Validation:**
- User cannot follow their own band (if they're a member)
- Cannot follow same band twice (idempotent - return 200 if already following)
**Errors:**
- 404: Band not found
- 400: Already following (if strict mode) or User is band member

#### 4. `DELETE /api/bands/:id/follow`
**Purpose:** Unfollow a band
**Auth:** Required
**Request:** Empty body
**Response:** 204 No Content
**Validation:**
- Idempotent (return 204 even if not following)
**Errors:**
- 404: Band not found

#### 5. `GET /api/bands/:id/followers`
**Purpose:** Get list of users following the band
**Auth:** Optional
**Query Params:**
- `page`: number (default 1)
- `limit`: number (default 50, max 100)
**Response:**
```json
{
  "followers": [
    {
      "userId": "user-id",
      "name": "John Doe",
      "profileImageUrl": "...",
      "createdAt": "2025-01-09T12:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 120,
    "totalPages": 3,
    "hasMore": true
  }
}
```
**Errors:**
- 404: Band not found

#### 6. `GET /api/bands/:id/followers/count`
**Purpose:** Get follower count for a band
**Auth:** Optional
**Response:**
```json
{
  "count": 120
}
```
**Errors:**
- 404: Band not found

#### 7. `GET /api/bands/:id/is-following`
**Purpose:** Check if current user follows the band
**Auth:** Required
**Response:**
```json
{
  "isFollowing": true
}
```
**Errors:**
- 404: Band not found

### Modified Endpoints

#### `GET /api/posts` (Home Feed)
**Changes Needed:**
- Include posts where `author_type='band'` AND `band_id IN (followed bands)`
- Return band info in post object when `author_type='band'`

**Updated Response:**
```json
{
  "posts": [
    {
      "id": 123,
      "authorType": "band",
      "bandId": 5,
      "userId": "admin-who-created-it",
      "content": "...",
      "band": {
        "id": 5,
        "name": "The Rockers",
        "profileImageUrl": "..."
      }
    },
    {
      "id": 124,
      "authorType": "user",
      "userId": "user-id",
      "user": {
        "id": "user-id",
        "name": "John Doe",
        "profileImageUrl": "..."
      }
    }
  ]
}
```

#### `GET /api/notifications`
**Changes Needed:**
- Support band-related notifications:
  - `type: 'follow'`, `entityType: 'band'`, `entityId: '<band_id>'` - "User X followed your band"
  - `type: 'reaction'`, `entityType: 'post'`, `entityId: '<post_id>'` where post is band post - "User X reacted to your band's post"
  - `type: 'comment'`, `entityType: 'post'`, `entityId: '<post_id>'` where post is band post - "User X commented on your band's post"

**No schema changes needed** - existing notification types support this.

## Frontend Requirements

### New Pages

#### 1. Band Profile with Posts Tab
**Location:** `/bands/$id` (enhance existing)
**Changes:**
- Add tab navigation: "About" | "Posts" | "Members"
- "About" tab: Existing content (bio, looking for, location)
- "Posts" tab: Feed of band posts
- "Members" tab: Existing member list
- Add follower count below band name
- Add Follow/Unfollow button in header
- Add Message button in header

#### 2. Band Followers Modal
**Trigger:** Click follower count
**Content:**
- List of users following the band
- User avatar, name, primary instrument
- Link to user profile
- Pagination (50 per page)
- Close button

### New Components

#### 1. `BandPostComposer`
**Location:** `features/bands/components/band-post-composer.tsx`
**Props:**
```ts
type Props = {
  bandId: number;
  bandName: string;
  onPostCreated?: (post: Post) => void;
}
```
**Features:**
- Same UI as regular post composer
- Shows "Posting as [Band Name]" indicator
- Text input (5000 char max)
- Media upload (up to 4 images/videos)
- Submit button
- Validation and error handling

#### 2. `BandPostFeed`
**Location:** `features/bands/components/band-post-feed.tsx`
**Props:**
```ts
type Props = {
  bandId: number;
}
```
**Features:**
- Displays band posts in reverse chronological order
- Reuses existing Post component
- Infinite scroll pagination
- Loading skeletons
- Empty state: "No posts yet. Share updates with your followers!"

#### 3. `BandFollowButton`
**Location:** `features/bands/components/band-follow-button.tsx`
**Props:**
```ts
type Props = {
  bandId: number;
  initialIsFollowing: boolean;
  followerCount: number;
}
```
**Features:**
- Toggle button: "Follow" / "Following"
- Optimistic updates
- Hover state on "Following" shows "Unfollow"
- Updates follower count locally

#### 4. `BandFollowersModal`
**Location:** `features/bands/components/band-followers-modal.tsx`
**Props:**
```ts
type Props = {
  bandId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
```
**Features:**
- Modal with follower list
- User cards with avatar, name, instrument
- Pagination controls
- Loading state

#### 5. `BandMessageButton`
**Location:** `features/bands/components/band-message-button.tsx`
**Props:**
```ts
type Props = {
  bandId: number;
  bandName: string;
}
```
**Features:**
- Button: "Message Band"
- Fetches first band admin (by join date)
- Opens chat with admin
- Shows band context in chat UI

### Modified Components

#### 1. `Post` Component
**Changes:**
- Support `authorType: 'band'`
- If band post, show band avatar and name
- Link to band profile instead of user profile
- Show "Posted by [Band Name]" instead of user

#### 2. `HomeFeed`
**Changes:**
- Fetch posts from followed users AND followed bands
- Render band posts with band info
- Sort mixed feed by `createdAt` desc

#### 3. `BandHeader`
**Changes:**
- Add follower count display: "120 followers"
- Add Follow/Unfollow button (only show if not admin)
- Add Message button (only show if not member)
- Make follower count clickable → opens followers modal

#### 4. `Notification` Component
**Changes:**
- Support band-related notifications
- If `entityType='band'`, link to band profile
- Show band avatar for band notifications

## Shared Code (packages/common)

### New Types

#### `packages/common/src/types/band-posts.ts`
```ts
import { z } from 'zod';

export const createBandPostInputSchema = z.object({
  content: z.string().min(1).max(5000),
  media: z.array(z.object({
    type: z.enum(['image', 'video']),
    key: z.string()
  })).max(4).optional()
});

export type CreateBandPostInput = z.infer<typeof createBandPostInputSchema>;

export const bandPostSchema = z.object({
  id: z.number(),
  authorType: z.literal('band'),
  bandId: z.number(),
  userId: z.string(), // Admin who created it
  content: z.string(),
  status: z.enum(['pending', 'approved', 'rejected']),
  createdAt: z.string(),
  band: z.object({
    id: z.number(),
    name: z.string(),
    profileImageUrl: z.string().nullable()
  }),
  media: z.array(z.object({
    id: z.number(),
    type: z.enum(['image', 'video']),
    key: z.string()
  })).optional()
});

export type BandPost = z.infer<typeof bandPostSchema>;
```

#### `packages/common/src/types/band-follows.ts`
```ts
import { z } from 'zod';

export const bandFollowerSchema = z.object({
  userId: z.string(),
  name: z.string(),
  profileImageUrl: z.string().nullable(),
  primaryInstrument: z.string().nullable(),
  createdAt: z.string()
});

export type BandFollower = z.infer<typeof bandFollowerSchema>;

export const bandFollowersResponseSchema = z.object({
  followers: z.array(bandFollowerSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
    hasMore: z.boolean()
  })
});

export type BandFollowersResponse = z.infer<typeof bandFollowersResponseSchema>;

export const bandFollowerCountSchema = z.object({
  count: z.number()
});

export type BandFollowerCount = z.infer<typeof bandFollowerCountSchema>;

export const isFollowingBandSchema = z.object({
  isFollowing: z.boolean()
});

export type IsFollowingBand = z.infer<typeof isFollowingBandSchema>;
```

### Modified Types

#### `packages/common/src/types/posts.ts`
**Add:**
```ts
export const authorTypeEnum = ['user', 'band'] as const;

// Update postSchema to support band posts
export const postSchema = z.object({
  id: z.number(),
  authorType: z.enum(authorTypeEnum),
  userId: z.string(), // User who created (or admin for band posts)
  bandId: z.number().nullable().optional(),
  content: z.string(),
  status: z.enum(['pending', 'approved', 'rejected']),
  createdAt: z.string(),
  // Conditional fields based on authorType
  user: z.object({
    id: z.string(),
    name: z.string(),
    profileImageUrl: z.string().nullable()
  }).optional(),
  band: z.object({
    id: z.number(),
    name: z.string(),
    profileImageUrl: z.string().nullable()
  }).optional(),
  media: z.array(...).optional(),
  reactions: z.array(...).optional(),
  comments: z.array(...).optional()
});
```

## User Flow

### Flow 1: Band Admin Creates Post

1. Admin navigates to band profile (`/bands/:id`)
2. Admin clicks "Posts" tab
3. Admin sees post composer at top: "Share an update with your followers"
4. Admin types post content: "We're looking for a bass player! Check out our 'Looking For' section."
5. (Optional) Admin uploads band photo
6. Admin clicks "Post"
7. System validates (admin check, content length)
8. Post is created with `author_type='band'`, `status='pending'`
9. Post appears in band feed (pending approval)
10. Post goes to moderation queue (existing system)
11. Once approved, post appears in followers' home feeds

### Flow 2: User Follows Band

1. User views band profile (`/bands/:id`)
2. User sees "Follow" button in header
3. User clicks "Follow"
4. Button optimistically changes to "Following"
5. Follower count increments by 1
6. System creates `bands_followers` record
7. System sends notification to band admins: "User X followed [Band Name]"
8. User now sees band posts in home feed

### Flow 3: User Messages Band

1. User views band profile
2. User clicks "Message" button
3. System fetches first band admin (by join date)
4. Chat modal opens with admin user
5. Chat shows context: "Messaging about [Band Name]"
6. User sends message: "Hi! I'm interested in joining your band as a bass player."
7. Admin receives message notification (existing system)
8. Admin can reply through normal messaging

### Flow 4: User Views Band Followers

1. User on band profile clicks "120 followers"
2. Modal opens showing list of followers
3. List displays user avatars, names, instruments
4. User can click on follower to view their profile
5. User can paginate through all followers
6. User closes modal

### Flow 5: Band Post Appears in Home Feed

1. User A follows Band X
2. Band admin creates post
3. Post is moderated and approved (existing system)
4. User A opens home feed (`/`)
5. Feed query fetches:
   - Posts from followed users
   - Posts from followed bands
6. Posts are mixed and sorted by `created_at` desc
7. User A sees band post with band avatar/name
8. User A can react, comment (existing system)

## Edge Cases

### 1. Band Post Authorship
**Case:** Band has multiple admins. Who "owns" the post?
**Solution:** Post has `user_id` (admin who created) and `band_id`. Post appears as "from the band" but audit trail shows which admin created it.

### 2. Messaging Multiple Admins
**Case:** Band has 3 admins. Who receives the message?
**Solution (MVP):** Message goes to first admin by join date. Future: Message all admins.

### 3. Admin Leaves Band
**Case:** Admin creates band post, then leaves band. What happens?
**Solution:** Post remains. It's a band post, not personal. `user_id` is for audit only.

### 4. User Follows Band They're Member Of
**Case:** User is band member and tries to follow band.
**Solution:** Disable follow button for members. Show "You're a member" instead.

### 5. Band Deleted With Posts
**Case:** Band is deleted. What happens to band posts?
**Solution:** Cascade delete (ON DELETE CASCADE). Posts are deleted with band.

### 6. User Already Following Band
**Case:** User clicks "Follow" twice.
**Solution:** Idempotent. Second click does nothing, returns 200. UI prevents double-click.

### 7. Follower Count Race Condition
**Case:** Two users follow simultaneously. Count might be wrong.
**Solution:** Count is queried from DB (COUNT(*)), not cached. Always accurate.

### 8. Band Post Moderation
**Case:** Band posts need moderation?
**Solution:** Yes. Same moderation queue as user posts. Status 'pending' → 'approved'/'rejected'.

### 9. Notifications to Multiple Admins
**Case:** Band has 3 admins. Who gets notified?
**Solution (MVP):** All admins get notification. Query `bands_members WHERE band_id=X AND is_admin=true`.

### 10. Empty Band Feed
**Case:** Band has no posts yet.
**Solution:** Show empty state: "No posts yet. Share updates with your followers!"

### 11. User Unfollows, Then Re-follows
**Case:** User unfollows band, then follows again. Follower count?
**Solution:** New `bands_followers` record created. Count is accurate (DB query).

### 12. Band Profile Without Admin
**Case:** All admins leave band (edge case, shouldn't happen with current validation).
**Solution:** Existing validation prevents last admin removal. Band must have ≥1 admin.

### 13. Post Author Type Migration
**Case:** Existing posts have no `author_type`.
**Solution:** Migration sets default `author_type='user'` for all existing posts.

### 14. Mobile Responsive Band Tabs
**Case:** "About | Posts | Members" tabs on small screen.
**Solution:** Use ShadCN Tabs component (already responsive). Horizontal scroll if needed.

### 15. Following Band From Search Results
**Case:** Can user follow band from search page?
**Solution (MVP):** No. Must go to band profile. Future: Add follow button to search cards.

## Validation Rules

### Client-Side (Immediate Feedback)

#### Band Post Creation
- Content: required, 1-5000 chars
- Media: optional, max 4 items, each <10MB
- Must be band admin (disable composer if not)

#### Follow Band
- User must be logged in (show "Sign in to follow")
- User cannot follow if member (disable button)

#### Message Band
- User must be logged in

### Server-Side (Security)

#### `POST /api/bands/:id/posts`
- User must be band admin (query `bands_members`)
- Band must exist
- Content: required, 1-5000 chars
- Media: valid keys, exist in storage
- Rate limit: 10 posts per band per hour

#### `POST /api/bands/:id/follow`
- User must be logged in
- Band must exist
- User cannot follow if band member
- Idempotent (unique constraint on `bands_followers(follower_id, band_id)`)

#### `DELETE /api/bands/:id/follow`
- User must be logged in
- Band must exist
- Idempotent (no error if not following)

#### `GET /api/bands/:id/followers`
- Band must exist
- Pagination: `page >= 1`, `limit 1-100`

## Error Handling

### User-Facing Errors

#### Band Post Creation
- **No admin permission:** "Only band admins can create posts. Contact the band admin."
- **Content too long:** "Post content must be 5000 characters or less."
- **Media upload fail:** "Failed to upload media. Please try again."
- **Network error:** "Couldn't create post. Check your connection and retry."

#### Following Band
- **Already following:** Prevent re-follow (idempotent, no error shown)
- **Not logged in:** "Sign in to follow bands."
- **Band not found:** "Band not found."
- **Network error:** "Couldn't follow band. Please try again."

#### Messaging Band
- **Not logged in:** "Sign in to message this band."
- **No admins found:** "This band has no admins. Cannot send message."

### Developer Errors (Log, Alert)

- DB connection failure on post creation
- Geocoding service timeout
- Moderation queue push failure
- Notification send failure
- Invalid band ID in URL (non-numeric)

## Performance Considerations

### Expected Load
- Band posts: 100 new posts/day across all bands
- Follows: 500 follows/day
- Follower count queries: 1000/day

### Query Optimization

#### Band Feed Query
```sql
SELECT * FROM posts
WHERE author_type = 'band' AND band_id = ?
ORDER BY created_at DESC
LIMIT 20 OFFSET 0;
```
**Index:** `idx_posts_band_id` (already planned)

#### Home Feed Query (Mixed)
```sql
-- Get followed users
SELECT user_id FROM users_followers WHERE followed_user_id = ?;

-- Get followed bands
SELECT band_id FROM bands_followers WHERE follower_id = ?;

-- Get posts
SELECT * FROM posts
WHERE
  (author_type = 'user' AND user_id IN (<followed_users>))
  OR
  (author_type = 'band' AND band_id IN (<followed_bands>))
ORDER BY created_at DESC
LIMIT 20 OFFSET 0;
```
**Indexes:**
- `idx_posts_author_type` (already planned)
- `idx_posts_band_id` (already planned)
- `idx_bands_followers_user_band` (already planned)

#### Follower Count Query
```sql
SELECT COUNT(*) FROM bands_followers WHERE band_id = ?;
```
**Index:** `idx_bands_followers_band_id` (already planned)

### Caching
- Follower count: Cache for 5 minutes (Cloudflare Workers Cache API)
- Band posts feed: Cache for 1 minute
- Home feed: No cache (real-time)

### Rate Limiting
- Band post creation: 10 posts per hour per band (Cloudflare Durable Objects)
- Follow/unfollow: 100 actions per hour per user
- Follower list: 100 requests per minute per band

## Testing Checklist

### Functional Tests

#### Band Posts
- [ ] Band admin can create text post
- [ ] Band admin can create post with media
- [ ] Non-admin cannot create band post (composer hidden)
- [ ] Band post appears in band feed
- [ ] Band post appears in followers' home feeds
- [ ] Users can react to band posts
- [ ] Users can comment on band posts

#### Band Following
- [ ] User can follow band
- [ ] User can unfollow band
- [ ] Follower count updates correctly
- [ ] "Follow" button changes to "Following"
- [ ] Band members cannot follow their own band
- [ ] Following is idempotent (no error on double-follow)

#### Band Messaging
- [ ] "Message" button opens chat with admin
- [ ] Message shows band context
- [ ] Admin receives message notification

#### Band Notifications
- [ ] Admin receives notification when band is followed
- [ ] Admin receives notification when band post is reacted to
- [ ] Admin receives notification when band post is commented on

#### UI/UX
- [ ] Band profile tabs work (About, Posts, Members)
- [ ] Follower count is clickable
- [ ] Followers modal displays correctly
- [ ] Empty state shows when band has no posts
- [ ] Loading skeletons display during fetch

### Edge Case Tests
- [ ] Band deleted → posts cascade delete
- [ ] Admin leaves → posts remain
- [ ] User unfollows → count decrements
- [ ] Post author type defaults to 'user' for existing posts
- [ ] Multiple admins all receive notifications

### Non-Functional Tests
- [ ] Band feed loads in <500ms
- [ ] Follow/unfollow is instant (optimistic update)
- [ ] Home feed with mixed posts renders correctly
- [ ] Mobile responsive (tabs, follow button)
- [ ] Accessible (keyboard nav, screen reader)

### Integration Tests
- [ ] Band post moderation works (posts-queue-consumer)
- [ ] Notifications sent correctly (notifications-queue-consumer)
- [ ] WebSocket notifications for band admins

## Security Considerations

- [x] **Authentication Required:** All write operations require auth
- [x] **Authorization:** Only admins can create band posts, manage members
- [x] **Input Sanitization:** All user input validated and sanitized (Zod)
- [x] **Rate Limiting:** Prevent spam (10 posts/hour per band)
- [x] **SQL Injection:** Drizzle ORM prevents SQL injection
- [x] **XSS Protection:** Content sanitized before rendering
- [x] **CSRF Protection:** Hono CSRF middleware (existing)
- [x] **Cascading Deletes:** Prevent orphaned data (ON DELETE CASCADE)

## Rollout Plan

### Phase 1: Backend Foundation (Week 1)
**Goal:** Database and API ready

1. **Database Migration:**
   - Add `author_type` and `band_id` columns to `posts`
   - Add indexes for band posts and follows
   - Run migration locally + production
   - **Owner:** database-architect → backend

2. **API Endpoints:**
   - Implement all 7 new endpoints (band posts, follows, followers)
   - Update `GET /api/posts` to support band posts
   - Update notifications to support band entities
   - **Owner:** backend

3. **Shared Types:**
   - Create `band-posts.ts` and `band-follows.ts` in `packages/common`
   - Update `posts.ts` to support `authorType`
   - **Owner:** system-architect

4. **Testing:**
   - Unit tests for all queries
   - Integration tests for API endpoints
   - **Owner:** backend

**Metrics:** All tests pass, API endpoints respond <200ms

### Phase 2: Frontend Implementation (Week 2)
**Goal:** UI complete and functional

1. **Band Profile Enhancements:**
   - Add tabs (About, Posts, Members)
   - Add Follow button
   - Add Message button
   - Add follower count (clickable)
   - **Owner:** frontend

2. **Band Post Components:**
   - `BandPostComposer`
   - `BandPostFeed`
   - Update `Post` component for band posts
   - **Owner:** frontend

3. **Following Components:**
   - `BandFollowButton`
   - `BandFollowersModal`
   - **Owner:** frontend

4. **Home Feed Updates:**
   - Fetch band posts
   - Render mixed feed (users + bands)
   - **Owner:** frontend

5. **Notifications:**
   - Update notification component for band notifications
   - WebSocket integration
   - **Owner:** frontend

**Metrics:** All UI functional, no console errors

### Phase 3: Testing & Polish (Week 3)
**Goal:** Production-ready

1. **E2E Tests:**
   - Band admin creates post flow
   - User follows band flow
   - User messages band flow
   - Notifications flow
   - **Owner:** test-expert

2. **Performance Testing:**
   - Load test band feed queries
   - Load test home feed with mixed posts
   - Verify <500ms page loads
   - **Owner:** devops

3. **Accessibility Audit:**
   - Keyboard navigation
   - Screen reader support
   - WCAG 2.1 AA compliance
   - **Owner:** frontend

4. **Bug Fixes:**
   - Address issues from testing
   - **Owner:** frontend/backend

5. **Deployment:**
   - Deploy backend to production
   - Deploy frontend to production
   - Run migration in production
   - Monitor errors
   - **Owner:** devops

**Metrics:**
- All E2E tests pass
- 0 critical bugs
- <500ms page loads
- WCAG AA compliance

### Phase 4: Monitor & Iterate (Ongoing)
**Goal:** Ensure stability and gather feedback

1. **Monitoring:**
   - Track band post creation rate
   - Track follow/unfollow rate
   - Track API error rates
   - Track page load times
   - **Owner:** devops

2. **User Feedback:**
   - Gather feedback from band admins
   - Gather feedback from musicians
   - Identify pain points
   - **Owner:** product

3. **Iteration:**
   - Fix bugs as reported
   - Optimize slow queries
   - Improve UX based on feedback
   - **Owner:** frontend/backend

## Metrics to Track

### Engagement Metrics
- **Band post creation rate:** Target 50 posts/week (avg 7/day)
- **Band follow rate:** Target 200 follows/week
- **Reaction rate on band posts:** Target 10% of views
- **Comment rate on band posts:** Target 3% of views

### Performance Metrics
- **Band feed load time:** Target <500ms (p95)
- **Home feed load time (mixed):** Target <800ms (p95)
- **Follow/unfollow response time:** Target <200ms (p95)
- **API error rate:** Target <1%

### User Metrics
- **% of bands with posts:** Target 30% of bands post within 30 days
- **% of users following bands:** Target 50% of users follow ≥1 band
- **Avg followers per band:** Target 10
- **Avg band posts per month:** Target 4

## Open Questions

1. **Should bands be able to follow users?**
   - Decision: Out of scope for MVP. Future feature.
   - Owner: Product

2. **Should all admins receive messages, or just one?**
   - Decision: MVP sends to first admin. Future: All admins.
   - Owner: Product

3. **Should we show "Posted by [Admin Name] on behalf of [Band]" or just "[Band]"?**
   - Decision: Just show band. Audit trail exists in DB.
   - Owner: Designer

4. **Should bands have a separate "Updates" tab vs "Posts"?**
   - Decision: Just "Posts" for MVP. No separate activity feed.
   - Owner: Product

5. **Should band posts have different moderation rules than user posts?**
   - Decision: Same moderation. May adjust in future based on abuse.
   - Owner: Product

6. **Should we support band-to-band following?**
   - Decision: Out of scope for MVP.
   - Owner: Product

7. **Should follower list show "mutual follows" indicator?**
   - Decision: Out of scope for MVP. Future enhancement.
   - Owner: Designer

## Dependencies

### Required Before This Feature
- [x] Band CRUD operations exist (already implemented)
- [x] User posts/feed exist (already implemented)
- [x] Notifications system exists (already implemented)
- [x] Messaging system exists (already implemented)
- [x] Moderation queue exists (already implemented)

### Blocks These Features
- Band analytics (need posts first)
- Scheduled band posts (need posts first)
- Band-specific search filters in home feed (need posts first)

---

**Estimated Effort:** 2-3 weeks (1 backend, 1-2 frontend, 0.5 testing)
**Priority:** High (Core feature, blocks user value)
**Owner:** System Architect → Backend + Frontend agents
**Target Ship Date:** End of Month 1 (3 weeks from start)
