# Posts

Social feed with posts, comments, reactions, and media uploads.

## Key Components
- `PostFeed` - Infinite scroll feed with hybrid discovery algorithm
- `PostCard` - Post display with author, content, media, actions
- `PostComposer` - Post creation form with media upload
- `CommentSection` - Comment thread with nested replies
- `CommentInput` - Comment composer
- `ReactionButton` - Like/heart reaction with count
- `PostMediaGallery` - Grid display for post images/videos
- `SuggestedBadge` - Badge for discovery posts (sparkle icon)

## Hooks
- `usePosts` - Fetches posts for a user or band profile
- `useDiscoveryFeed` - Fetches hybrid feed (followed + discovery)
- `useCreatePost` - Creates new post
- `useDeletePost` - Deletes a post
- `useComments` - Fetches comments for a post
- `useCreateComment` - Creates new comment
- `useReaction` - Toggles reaction on post

## Server Functions
- `getPosts` - Fetches posts by user or band
- `getDiscoveryFeed` - Fetches hybrid feed with smart blending
- `createPost` - Creates post (text, images, videos)
- `deletePost` - Deletes user's post
- `getComments` - Fetches comments for a post
- `createComment` - Creates comment on post
- `toggleReaction` - Adds/removes reaction

## Data Flow
1. **Feed**: Hybrid algorithm blends followed posts (60%) + discovery posts (40%)
2. **Discovery Scoring**: Matches users/bands by instrument, genre, location, with recency boost
3. **Post Creation**: User composes → uploads media to R2 → queue moderates → published
4. **Comments**: Real-time comment section with nested threading
5. **Reactions**: Optimistic updates with backend sync
6. **Media**: Uploads via presigned URLs to R2, displayed in gallery
