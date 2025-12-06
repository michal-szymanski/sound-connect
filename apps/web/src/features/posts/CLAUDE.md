# Posts

Social feed with posts, comments, reactions, and media uploads.

## Overview

The posts feature provides a hybrid discovery feed that blends content from followed users/bands (60%) with personalized discovery posts (40%). Users can create posts with text, images, videos, and audio, comment on posts, and react with likes.

## Key Components

### Post Display
- `post.tsx` - Main post card with author info, content, media, actions (like, comment, share)
- `post-skeleton.tsx` - Loading skeleton for posts
- `post-modal.tsx` - Full-screen modal view of a post with comments
- `post-dialog.tsx` - Dialog for creating/editing posts

### Media
- `media-grid.tsx` - Grid layout for displaying post images/videos
- `media-lightbox.tsx` - Full-screen lightbox for viewing media
- `carousel-dots.tsx` - Pagination dots for media carousels
- `post-media-upload.tsx` - Media upload component with drag-and-drop support
- `audio-player.tsx` - Custom audio player for music samples
- `video-player.tsx` - Custom video player with controls
- `audio-playlist.tsx` - Playlist component for multiple audio files

### Comments & Interactions
- `comment-item.tsx` - Individual comment display with nested replies
- `likes-dialog.tsx` - Modal showing users who liked a post
- `delete-post-dialog.tsx` - Confirmation dialog for post deletion

## Hooks

### Feed & Posts
- `useFeed` (from `use-posts.ts`) - Infinite scroll feed with pagination
- `feedQuery` (from `use-posts.ts`) - Query options factory for feed
- `usePost` (from `use-posts.ts`) - Fetches single post by ID (suspense query)
- `postQuery` (from `use-posts.ts`) - Query options factory for single post

### Reactions
- `useReactions` (from `use-posts.ts`) - Fetches reactions for a post
- `useLikeToggle` (from `use-posts.ts`) - Toggles like on post with optimistic updates

### Comments
- `useComments` (from `use-posts.ts`) - Fetches comments for a post
- `commentsQuery` (from `use-posts.ts`) - Query options factory for comments
- `useCreateComment` (from `use-posts.ts`) - Creates new comment with nested reply support
- `useCommentLikeToggle` (from `use-posts.ts`) - Toggles like on comment

### Post Management
- `useUpdatePost` (from `use-posts.ts`) - Updates post content and media (supports media removal/addition)
- `useDeletePost` (from `use-posts.ts`) - Deletes post with optimistic UI updates

## Server Functions

### Feed & Post Retrieval (`posts.ts`)
- `getFeed` - Fetches complete feed (non-paginated)
- `getFeedPaginated` - Fetches feed with pagination (limit/offset)
- `getPosts` - Fetches all posts by a specific user
- `getPost` - Fetches single post by ID with full details

### Post Creation & Management (`posts.ts`)
- `addPost` - Creates new post with text and media
- `updatePost` - Updates existing post (content, media edits)
- `deletePost` - Deletes user's own post

### Reactions (`posts.ts`)
- `getReactions` - Fetches all reactions for a post
- `likePost` - Adds like reaction to post
- `unlikePost` - Removes like reaction from post
- `getPostLikes` - Fetches like data for a post
- `getPostLikesUsers` - Fetches list of users who liked a post

### Comments (`comments.ts`)
- `getComments` - Fetches all comments for a post (includes nested replies)
- `createComment` - Creates comment on post (supports parent comment for nesting)
- `likeComment` - Adds like to comment
- `unlikeComment` - Removes like from comment

## Data Flow

### Feed Algorithm
1. **Hybrid Blending**: 60% followed content + 40% discovery content
2. **Discovery Scoring**: Matches users/bands by:
   - Instrument compatibility (50 pts primary, 25 pts secondary)
   - Genre overlap (30 pts primary, 15 pts secondary)
   - Location proximity (5-20 pts based on distance)
   - Recency boost (newer posts ranked higher)
3. **Pagination**: Infinite scroll loads 10 posts per page

### Post Creation
1. User composes post in `post-dialog.tsx`
2. Media uploaded via `post-media-upload.tsx` to R2 (presigned URLs)
3. `addPost` server function creates post in database
4. Post queued for moderation in `posts-queue-consumer`
5. Published to followers' feeds

### Comments
1. User writes comment via `comment-item.tsx` input
2. `useCreateComment` sends to `createComment` server function
3. Supports nested replies via `parentCommentId` parameter
4. Real-time comment section updates via query invalidation

### Reactions
1. User clicks like button
2. `useLikeToggle` performs optimistic update (instant UI feedback)
3. Backend syncs like state via `likePost`/`unlikePost`
4. On error, optimistic update reverted

### Post Editing
1. User clicks edit button → `post-dialog.tsx` opens in edit mode
2. Can modify content and media (remove existing, add new)
3. `useUpdatePost` sends changes via `updatePost` server function
4. Media updates: `mediaKeysToKeep` (existing to retain) + `newMediaKeys` (newly uploaded)
5. Query cache invalidated to show updated post

## Media Support

### Supported Formats
- **Images**: JPEG, PNG, WebP, GIF
- **Videos**: MP4, WebM, MOV
- **Audio**: MP3, WAV, OGG (for music samples)

### Upload Flow
1. Files uploaded via presigned URLs to R2 `temp/` folder
2. Upload confirmed via `/api/uploads/confirm`
3. Files moved to permanent location (`posts/{postId}/media-{n}.{ext}`)
4. R2 keys stored in database
5. Temporary files auto-deleted after 24 hours (R2 lifecycle rule)

### Media Display
- **Grid Layout**: Up to 4 images/videos in responsive grid
- **Lightbox**: Full-screen view with swipe gestures
- **Audio Player**: Waveform visualization for music samples
- **Video Player**: Custom controls with play/pause/seek

## Additional Features

- **Optimistic Updates**: Likes and deletes update UI instantly before server confirmation
- **Infinite Scroll**: Feed loads more posts as user scrolls
- **Nested Comments**: Supports reply threads (parent-child relationships)
- **Post Editing**: Authors can edit content and media after publishing
- **Draft Support**: Posts saved locally before publishing (future enhancement)
- **Content Moderation**: Queue-based moderation system scans posts before going live
