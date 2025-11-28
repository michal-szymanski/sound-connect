# Profile

Rich musician profiles with 30+ fields, inline editing, and completion tracking.

## Key Components

- `ProfileSection` - Reusable section wrapper with edit mode
- `InstrumentsSection` - Primary + 4 additional instruments
- `GenresSection` - Primary + secondary genres (up to 5)
- `AvailabilitySection` - 4-tier availability status with expiration
- `LogisticsSection` - Location, travel radius, rehearsal space, transportation
- `LookingForSection` - Seeking musicians, can offer, deal breakers
- `BioSection` - Bio text (max 500 chars)
- `ExperienceSection` - Years playing, commitment level, past bands
- `ProfileCompletionBanner` - Progress bar and completion percentage
- `ProfileCompletionBadge` - Badge showing completion status
- `CompletionBadge` - Section-level completion indicator
- `ProfileImageUpload` - Circular avatar upload
- `FollowersModal` - Modal showing followers list
- `FollowingModal` - Modal showing following list
- `ProfileSkeleton` - Loading skeleton
- `CharacterCounter` - Character count for text inputs

## Hooks

- `useProfile` - Fetches user profile with reactive updates
- `useUpdateInstruments` - Updates instruments section
- `useUpdateGenres` - Updates genres section
- `useUpdateAvailability` - Updates availability status
- `useUpdateLogistics` - Updates location and logistics
- `useUpdateBio` - Updates bio section
- `useUpdateExperience` - Updates experience section
- `useUpdateLookingFor` - Updates seeking section

## Server Functions

- `getProfile` - Fetches user profile by ID
- `updateInstruments` - Saves instruments
- `updateGenres` - Saves genres
- `updateAvailability` - Saves availability status
- `updateLogistics` - Saves location (with Mapbox coordinates), travel radius, logistics
- `updateBio` - Saves bio
- `updateExperience` - Saves experience
- `updateLookingFor` - Saves seeking information
- `followUser` - Follows a user
- `unfollowUser` - Unfollows a user
- `getFollowers` - Fetches followers list
- `getFollowing` - Fetches following list

## Data Flow

1. Profile loaded via `getProfile`, displays all sections
2. Each section shows completion status (complete/incomplete/required)
3. User clicks edit → inline form appears → saves → cache invalidates → UI updates
4. Profile completion calculated server-side (0-100%)
5. Completion banner shows progress with visual indicator
6. Location uses Mapbox autocomplete for geocoding with lat/long storage
7. Follow/unfollow triggers cache invalidation for reactive updates
