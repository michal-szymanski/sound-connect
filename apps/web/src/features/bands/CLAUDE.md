# Bands

Manages band profiles, including creation, editing, members, followers, applications, and band posts.

## Key Components

- `BandHeader` - Band profile header with image, name, genre, location
- `BandForm` - Form for creating/editing band profile
- `BandFollowButton` - Follow/unfollow button with state management
- `BandMessageButton` - Starts conversation with band admins
- `BandMemberCard` - Displays band member with admin badge
- `AddMemberModal` - Search and add users as band members
- `BandApplicationCard` - Application card with accept/reject actions
- `BandApplicationsList` - List of pending band applications
- `ApplyToBandButton` - Apply button with status (pending/declined)
- `ApplyToBandModal` - Application form with message and position
- `RejectApplicationModal` - Rejection dialog with optional feedback
- `BandPostComposer` - Post creation form (admins only)
- `BandPostFeed` - Feed of posts by the band
- `BandFollowersModal` - Modal showing band followers list
- `BandImageUpload` - Square image upload for band profile
- `UserBandsSection` - Grid of bands user belongs to
- `UserBandCard` - Band card for user's bands list
- `band-profile.tsx` - Main band profile page with tabs
- `editable-band-avatar.tsx` - Inline-editable band profile image (hover to edit)
- `editable-band-background.tsx` - Inline-editable band background/cover image (hover to edit)

## Hooks

- `useBands` - Fetches all bands user belongs to
- `useBandApplications` - Fetches pending applications for a band (admins only)

## Server Functions

### Band Management (`bands.ts`)
- `getBand` - Fetches band profile by ID with members and metadata
- `createBand` - Creates new band (creator becomes admin)
- `updateBand` - Updates band profile (name, bio, genre, etc.)
- `deleteBand` - Deletes band and all associated data (admins only)
- `addBandMember` - Adds user to band (admins only)
- `removeBandMember` - Removes member from band (admins only)
- `getUserBands` - Fetches all bands for current user
- `updateBandProfileImage` - Updates band profile image (R2 key)
- `updateBandBackgroundImage` - Updates band background/cover image (R2 key)

### Band Posts (`bands.ts`)
- `createBandPost` - Creates post on behalf of band (admins only)
- `getBandPosts` - Fetches all posts by the band (paginated)

### Band Following (`bands.ts`)
- `followBand` - Follows a band
- `unfollowBand` - Unfollows a band
- `getBandFollowers` - Fetches list of band followers
- `getBandFollowerCount` - Fetches total follower count
- `getIsFollowingBand` - Checks if current user follows band (boolean)

### Band Applications (`band-applications.ts`)
- `submitBandApplication` - Submits application to join band with message
- `getBandApplications` - Fetches pending applications for band (admins only)
- `acceptBandApplication` - Accepts application and adds user as member
- `rejectBandApplication` - Rejects application with optional feedback message
- `getUserApplicationStatus` - Checks current user's application status for a band

## Data Flow

1. **Profile**: Bands loaded via `getBand`, displayed in tabbed interface (Posts/About/Members/Applications)
2. **Members**: Admins can add/remove members, prevent removing last admin
3. **Followers**: Users follow bands, follower count updates reactively
4. **Applications**: Users apply → admins review → accept (adds member) or reject (with feedback)
5. **Posts**: Admins create posts on behalf of band, displayed in feed
