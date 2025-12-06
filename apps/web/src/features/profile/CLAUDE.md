# Profile

Rich musician profiles with 30+ fields, inline editing, completion tracking, and music portfolio.

## Overview

Comprehensive musician profiles allowing users to showcase their musical identity, availability, experience, and portfolio. Features include inline editing, completion tracking, follow system, and an embeddable music portfolio with audio samples.

## Key Components

### Profile Structure
- `user-profile.tsx` - Main profile page layout with tabs and header
- `profile-tabs.tsx` - Tab navigation for Musical Identity, Availability, Portfolio
- `profile-section.tsx` - Reusable section wrapper with edit mode
- `profile-skeleton.tsx` - Loading skeleton for profile pages

### Profile Tabs
- `tabs/musical-identity-tab.tsx` - Instruments, genres, experience, bio
- `tabs/availability-tab.tsx` - Availability status, logistics, looking for section
- `tabs/portfolio-tab.tsx` - Music samples, work examples, achievements

### Profile Sections
- `instruments-section.tsx` - Primary + 4 additional instruments with proficiency
- `genres-section.tsx` - Primary + secondary genres (up to 5 total)
- `availability-section.tsx` - 4-tier availability status with expiration date
- `logistics-section.tsx` - Location (with Mapbox geocoding), travel radius, rehearsal space, transportation
- `looking-for-section.tsx` - Seeking musicians, can offer skills, deal breakers
- `bio-section.tsx` - Bio text (max 500 chars) with character counter
- `experience-section.tsx` - Years playing, commitment level, past bands

### Music Portfolio
- `music-portfolio-section.tsx` - Main portfolio section with sample grid
- `music-sample-player.tsx` - Custom audio player with waveform visualization
- `upload-music-sample-modal.tsx` - Modal for uploading new music samples with metadata

### Profile Images
- `profile-image-upload.tsx` - Circular avatar upload component
- `editable-profile-avatar.tsx` - Inline-editable profile avatar (hover to edit)
- `editable-profile-background.tsx` - Inline-editable background/cover image (hover to edit)

### Completion & Status
- `profile-completion-banner.tsx` - Progress bar showing completion percentage
- `profile-completion-badge.tsx` - Badge displaying completion status
- `completion-badge.tsx` - Section-level completion indicator (complete/incomplete/required)

### Social
- `followers-modal.tsx` - Modal showing followers list
- `following-modal.tsx` - Modal showing following list

### Utilities
- `character-counter.tsx` - Character count display for text inputs (e.g., "245/500")

## Hooks

### Profile Management (from `use-profile.ts`)
- `useProfile` - Fetches user profile with reactive updates
- `useUpdateInstruments` - Updates instruments section
- `useUpdateGenres` - Updates genres section
- `useUpdateAvailability` - Updates availability status
- `useUpdateLogistics` - Updates location and logistics (geocodes with Mapbox)
- `useUpdateBio` - Updates bio section
- `useUpdateExperience` - Updates experience section
- `useUpdateLookingFor` - Updates seeking section
- `useCompleteSetup` - Marks profile setup as complete (triggers onboarding completion)
- `useUpdateProfileImage` - Updates profile avatar image
- `useUpdateBackgroundImage` - Updates profile background/cover image

### Music Samples (from `use-music-samples.ts`)
- `useMusicSamples` - Fetches music samples for a user
- `useCreateMusicSample` - Creates new music sample (upload audio file + metadata)
- `useUpdateMusicSample` - Updates music sample metadata (title, description, etc.)
- `useDeleteMusicSample` - Deletes music sample and associated audio file
- `useReorderMusicSamples` - Reorders music samples (drag-and-drop support)

## Server Functions

### Profile Management (`profile.ts`)
- `getProfile` - Fetches user profile by ID with all sections
- `updateInstruments` - Saves instruments with proficiency levels
- `updateGenres` - Saves primary and secondary genres
- `updateAvailability` - Saves availability status with expiration
- `updateLogistics` - Saves location (geocoded lat/long), travel radius, rehearsal space, transportation
- `updateBio` - Saves bio text
- `updateExperience` - Saves years of experience, commitment level, past bands
- `updateLookingFor` - Saves seeking information
- `completeSetup` - Marks profile setup as complete
- `updateProfileImage` - Updates profile avatar (R2 key)
- `updateBackgroundImage` - Updates background/cover image (R2 key)

### Music Samples (`music-samples.ts`)
- `getMusicSamples` - Fetches all music samples for a user (ordered by position)
- `createMusicSample` - Creates new music sample with metadata (title, description, audio file URL)
- `updateMusicSample` - Updates music sample metadata
- `deleteMusicSample` - Deletes music sample and removes file from R2
- `reorderMusicSamples` - Updates display order of music samples

### Social (in `shared/server-functions/`)
- `followUser` - Follows a user
- `unfollowUser` - Unfollows a user
- `getFollowers` - Fetches followers list
- `getFollowing` - Fetches following list

## Data Flow

### Profile Loading
1. Profile loaded via `getProfile`, displays all sections in tabbed layout
2. Each section shows completion status (complete/incomplete/required)
3. Profile completion calculated server-side (0-100%) based on filled required fields
4. Completion banner shows progress with visual indicator

### Inline Editing
1. User clicks edit icon on section → inline form appears
2. User modifies fields → clicks save
3. Hook sends update via server function
4. Query cache invalidated → UI reactively updates
5. Completion percentage recalculated

### Location Handling
1. User types location in `logistics-section.tsx`
2. Mapbox autocomplete suggests locations
3. User selects → lat/long extracted
4. `updateLogistics` saves location string + coordinates
5. Used for distance-based search and discovery matching

### Music Portfolio
1. **Upload**: User clicks "Add Sample" → `upload-music-sample-modal.tsx` opens
2. Audio file uploaded to R2 via presigned URL (`/api/uploads`)
3. User adds metadata (title, description, instrument)
4. `createMusicSample` saves sample with R2 audio key
5. Sample appears in portfolio grid

6. **Playback**: User clicks sample → `music-sample-player.tsx` loads audio
7. Waveform visualization rendered from audio data
8. Playback controls (play/pause/seek) with progress indicator

9. **Reorder**: User drags sample in portfolio → new order saved via `reorderMusicSamples`
10. **Delete**: User clicks delete → `deleteMusicSample` removes from DB and R2

### Follow System
1. User clicks follow button on profile
2. `followUser` server function creates follow relationship
3. Query cache invalidated for followers/following lists
4. Button reactively updates to "Following" state
5. Unfollowing works inversely via `unfollowUser`

## Profile Completion

### Required Fields
- Instruments (at least 1 primary)
- Genres (at least 1 primary)
- Location

### Optional Fields (boost completion %)
- Bio
- Availability status
- Experience details
- Looking for section
- Profile image
- Background image
- Music samples

### Completion Tiers
- **0-33%**: Incomplete (red badge)
- **34-66%**: Partial (yellow badge)
- **67-99%**: Nearly Complete (blue badge)
- **100%**: Complete (green badge)

## Additional Features

- **Reactive Updates**: All edits auto-update UI via query invalidation
- **Inline Editing**: No navigation required, edit sections in-place
- **Mapbox Integration**: Location autocomplete with geocoding for accurate coordinates
- **Music Portfolio**: Embed up to 10 audio samples with custom player
- **Drag-and-Drop**: Reorder music samples visually
- **Image Uploads**: Hover-to-edit pattern for profile and background images
- **Character Limits**: Real-time character counters on text inputs (bio, looking for, etc.)
- **Follow System**: Mutual following tracked for contact discovery
