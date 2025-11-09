# Band Profiles Implementation Plan

## Overview
This document defines the implementation requirements for backend and frontend agents to implement the Band Profiles feature per the specification at `/Users/michal.szymanski/Projects/sound-connect/specs/band-profiles.md`.

## Shared Code (COMPLETED)
✅ Created by system-architect:
- `/Users/michal.szymanski/Projects/sound-connect/packages/common/src/types/band-posts.ts` - Band post types and schemas
- `/Users/michal.szymanski/Projects/sound-connect/packages/common/src/types/band-follows.ts` - Band follow types and schemas
- Updated `/Users/michal.szymanski/Projects/sound-connect/packages/common/src/types/drizzle.ts` - Added `authorType` and `bandId` to post schemas
- Updated `/Users/michal.szymanski/Projects/sound-connect/packages/common/src/types/posts.ts` - Added user post creation schema

## Database Schema (COMPLETED)
✅ Updated by system-architect:
- `/Users/michal.szymanski/Projects/sound-connect/packages/drizzle/src/schema.ts`:
  - Added `authorType` and `bandId` columns to `postsTable`
  - Added indexes: `idx_posts_author_type`, `idx_posts_band_id`
  - Added indexes to `bandsFollowersTable`: `idx_bands_followers_band_id`, `idx_bands_followers_follower_band`
  - Added cascade delete for band posts and followers
  - Added posts relation to bands

## Backend Implementation Requirements

### Prerequisites
1. Generate database migration: `pnpm db:generate`
2. Apply migration locally: `pnpm --filter @sound-connect/api db:migrate:local`
3. Update Zod schemas in `packages/common/src/types/drizzle.ts` to match database changes

### API Endpoints to Implement

All endpoints must use the shared schemas from `packages/common` for validation.

#### 1. Band Posts Endpoints

**POST /bands/:id/posts**
- **Auth**: Required (must be band admin)
- **Schema**: Use `createBandPostInputSchema` from `packages/common/src/types/band-posts.ts`
- **Logic**:
  - Verify user is band admin via `bands_members` table where `is_admin=true`
  - Create post with `author_type='band'`, `band_id`, `user_id` (admin who created it)
  - Set `status='pending'` for moderation
  - Insert media records if provided
  - Send to moderation queue (existing system)
- **Response**: Return `BandPost` per `bandPostSchema`
- **Errors**: 403 if not admin, 404 if band not found, 400 for invalid input

**GET /bands/:id/posts**
- **Auth**: Optional
- **Query**: `page` (default 1), `limit` (default 20, max 50)
- **Logic**:
  - Query posts where `author_type='band'` AND `band_id=:id`
  - Order by `created_at DESC`
  - Include band info and media
  - Return pagination metadata
- **Response**: `BandPostsResponse` per `bandPostsResponseSchema`
- **Errors**: 404 if band not found

#### 2. Band Following Endpoints

**POST /bands/:id/follow**
- **Auth**: Required
- **Logic**:
  - Check user is not band member (query `bands_members`)
  - Insert into `bands_followers` (idempotent - return 200 if already following)
  - Send notification to all band admins (query `bands_members WHERE is_admin=true`)
- **Response**: `FollowBandResponse` per `followBandResponseSchema`
- **Errors**: 404 if band not found, 400 if user is band member

**DELETE /bands/:id/follow**
- **Auth**: Required
- **Logic**:
  - Delete from `bands_followers` where `follower_id=userId` AND `band_id=:id`
  - Idempotent (return 204 even if not following)
- **Response**: 204 No Content
- **Errors**: 404 if band not found

**GET /bands/:id/followers**
- **Auth**: Optional
- **Query**: `page` (default 1), `limit` (default 50, max 100)
- **Logic**:
  - Query `bands_followers` joined with `users` and `user_profiles`
  - Include: `userId`, `name`, `profileImageUrl`, `primaryInstrument`, `createdAt`
  - Order by `created_at DESC`
- **Response**: `BandFollowersResponse` per `bandFollowersResponseSchema`
- **Errors**: 404 if band not found

**GET /bands/:id/followers/count**
- **Auth**: Optional
- **Logic**: `SELECT COUNT(*) FROM bands_followers WHERE band_id=:id`
- **Response**: `BandFollowerCount` per `bandFollowerCountSchema`
- **Errors**: 404 if band not found

**GET /bands/:id/is-following**
- **Auth**: Required
- **Logic**: Check if record exists in `bands_followers` for current user and band
- **Response**: `IsFollowingBand` per `isFollowingBandSchema`
- **Errors**: 404 if band not found

#### 3. Modified Endpoints

**GET /posts (Home Feed)**
- **Current**: Only returns posts from followed users
- **Required Changes**:
  - Also fetch posts from followed bands
  - Query: `SELECT band_id FROM bands_followers WHERE follower_id=currentUserId`
  - Include posts where `(author_type='user' AND user_id IN followedUsers) OR (author_type='band' AND band_id IN followedBands)`
  - For band posts, include band info (id, name, profileImageUrl)
  - Mix and sort by `created_at DESC`
- **Response**: Include both user posts and band posts with appropriate author info

**GET /api/notifications**
- **Current**: Supports band entity type but not fully implemented
- **Required Changes**:
  - When band is followed: Create notification with `type='follow_request'`, `entityType='band'`, `entityId=bandId`
  - When band post is reacted to: Send to all band admins
  - When band post is commented on: Send to all band admins
  - Ensure band info is included in notification response

### Implementation Notes

- All dates must use ISO 8601 format (existing pattern)
- Use `c.get('user')` to get current user ID (never trust frontend)
- Use Zod schemas for all validation
- Rate limiting: 10 posts per hour per band (use existing patterns)
- Cascade delete: Band deletion deletes posts and followers (already in schema)
- Media handling: Use existing media upload patterns

### Testing Requirements

- Unit tests for all queries
- Integration tests for all endpoints
- Test authorization (admin checks, member checks)
- Test edge cases (already following, not admin, etc.)
- Invoke code-quality-enforcer after implementation

## Frontend Implementation Requirements

### Prerequisites
- Backend API endpoints must be deployed and available

### Pages to Enhance

#### 1. Band Profile Page (`/bands/$id`)

**Current State**: Basic band info, members list, edit capability
**Required Changes**:
- Add tab navigation: "About" | "Posts" | "Members"
  - "About" tab: Existing bio, looking for, location content
  - "Posts" tab: New `BandPostFeed` component + `BandPostComposer` (if admin)
  - "Members" tab: Existing member list
- Add follower count below band name (clickable → opens modal)
- Add `BandFollowButton` in header (only if not member)
- Add `BandMessageButton` in header (only if not member)

### Components to Create

#### 1. `BandPostComposer`
**Location**: `apps/web/src/features/bands/components/band-post-composer.tsx`
**Props**:
```typescript
type Props = {
  bandId: number;
  bandName: string;
  onPostCreated?: (post: BandPost) => void;
}
```
**Requirements**:
- Similar UI to regular post composer
- Show "Posting as [Band Name]" indicator
- Text input (5000 char max) with validation using `createBandPostInputSchema`
- Media upload (up to 4 images/videos) - reuse existing media upload logic
- Server function to call `POST /bands/:id/posts`
- Tanstack Query mutation with optimistic updates
- Error handling and validation

#### 2. `BandPostFeed`
**Location**: `apps/web/src/features/bands/components/band-post-feed.tsx`
**Props**:
```typescript
type Props = {
  bandId: number;
}
```
**Requirements**:
- Fetch posts from `GET /bands/:id/posts`
- Tanstack Query with pagination (infinite scroll)
- Reuse existing `Post` component (must support `authorType='band'`)
- Loading skeletons
- Empty state: "No posts yet. Share updates with your followers!"

#### 3. `BandFollowButton`
**Location**: `apps/web/src/features/bands/components/band-follow-button.tsx`
**Props**:
```typescript
type Props = {
  bandId: number;
  initialIsFollowing: boolean;
  initialFollowerCount: number;
}
```
**Requirements**:
- Toggle button: "Follow" / "Following"
- Optimistic updates (instant UI feedback)
- Hover state on "Following" shows "Unfollow"
- Updates follower count locally
- Server function to call `POST/DELETE /bands/:id/follow`
- Tanstack Query mutation

#### 4. `BandFollowersModal`
**Location**: `apps/web/src/features/bands/components/band-followers-modal.tsx`
**Props**:
```typescript
type Props = {
  bandId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
```
**Requirements**:
- ShadCN Dialog component
- Fetch from `GET /bands/:id/followers`
- Display user cards: avatar, name, primary instrument
- Link to user profiles
- Pagination controls (50 per page)
- Loading state

#### 5. `BandMessageButton`
**Location**: `apps/web/src/features/bands/components/band-message-button.tsx`
**Props**:
```typescript
type Props = {
  bandId: number;
  bandName: string;
  bandMembers: BandMember[];
}
```
**Requirements**:
- Button: "Message Band"
- Find first admin by `joinedAt` (earliest)
- Open chat with admin (reuse existing chat modal/page)
- Show band context in chat UI: "Messaging about [Band Name]"

### Components to Modify

#### 1. `Post` Component
**Location**: `apps/web/src/features/posts/components/post.tsx` (or similar)
**Required Changes**:
- Accept `authorType` prop ('user' | 'band')
- If `authorType='band'`:
  - Show band avatar and name (from `post.band`)
  - Link to `/bands/${post.bandId}` instead of user profile
  - Display "Posted by [Band Name]"
- If `authorType='user'`:
  - Existing behavior (user avatar, name, profile link)

#### 2. `HomeFeed`
**Location**: `apps/web/src/features/feed/components/home-feed.tsx` (or similar)
**Required Changes**:
- Fetch posts from updated `GET /posts` endpoint
- Handle mixed feed (user posts + band posts)
- Render with `Post` component (supports both types)
- Sort by `createdAt` DESC (already handled by API)

#### 3. `BandHeader`
**Location**: `apps/web/src/features/bands/components/band-header.tsx` (or similar)
**Required Changes**:
- Add follower count display: "{count} followers" (clickable)
- Add `BandFollowButton` (conditional: hide if user is member)
- Add `BandMessageButton` (conditional: hide if user is member)
- Fetch follower count from `GET /bands/:id/followers/count`
- Fetch is-following state from `GET /bands/:id/is-following`

#### 4. `Notification` Component
**Location**: `apps/web/src/features/notifications/components/notification.tsx` (or similar)
**Required Changes**:
- Support `entityType='band'`
- If band notification, link to `/bands/${entityId}`
- Show band-specific notification text:
  - "User X followed your band"
  - "User X reacted to your band's post"
  - "User X commented on your band's post"

### Implementation Notes

- Use ShadCN components for all UI
- Follow existing patterns for Tanstack Query hooks
- Use existing media upload logic
- Ensure accessibility (WCAG 2.1 AA)
- Mobile responsive (test on small screens)
- Optimistic updates for better UX
- Loading states and error handling
- Invoke code-quality-enforcer after implementation

### Testing Requirements

- E2E tests for:
  - Band admin creating post
  - User following/unfollowing band
  - User messaging band
  - Band posts appearing in home feed
- Accessibility audit (keyboard nav, screen reader)
- Mobile responsive testing

## API Contracts

All API contracts are defined via shared Zod schemas in `packages/common`. Both backend and frontend MUST use the same schemas for validation.

### Request Schemas
- `createBandPostInputSchema` - Creating band posts
- `createUserPostInputSchema` - Creating user posts

### Response Schemas
- `bandPostSchema` - Single band post
- `bandPostsResponseSchema` - Paginated band posts
- `followBandResponseSchema` - Follow confirmation
- `bandFollowerSchema` - Single follower
- `bandFollowersResponseSchema` - Paginated followers
- `bandFollowerCountSchema` - Follower count
- `isFollowingBandSchema` - Following status

### Database Schemas
- `postSchema` - Updated to include `authorType` and `bandId`
- `createPostSchema` - Database insert schema

## Type Safety Verification

System architect must verify:
- [ ] Backend validates requests with shared schemas
- [ ] Frontend validates requests with shared schemas
- [ ] API responses match response schemas
- [ ] Database schema matches Zod schemas
- [ ] No type errors in TypeScript compilation
- [ ] Zod schemas in `packages/common/src/types/drizzle.ts` match database schema

## Next Steps

**For Backend Agent:**
1. Generate and apply database migration
2. Update Zod schemas in drizzle.ts
3. Implement all API endpoints per requirements above
4. Write tests
5. Invoke code-quality-enforcer

**For Frontend Agent:**
1. Wait for backend deployment
2. Implement all components per requirements above
3. Update existing components
4. Write E2E tests
5. Invoke code-quality-enforcer

**For DevOps Agent** (after all implementation):
1. Deploy backend to production
2. Deploy frontend to production
3. Apply database migration in production
4. Monitor for errors
