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

## Hooks
- `useBands` - Fetches all bands user belongs to
- `useBandApplications` - Fetches pending applications for a band (admins only)

## Server Functions
- `getBand` - Fetches band profile by ID
- `createBand` - Creates new band
- `updateBand` - Updates band profile
- `deleteBand` - Deletes band (admins only)
- `addBandMember` - Adds user to band (admins only)
- `removeBandMember` - Removes member from band (admins only)
- `getUserBands` - Fetches all bands for current user
- `followBand` - Follows a band
- `unfollowBand` - Unfollows a band
- `getBandFollowers` - Fetches band followers list
- `getBandFollowStatus` - Checks if user follows band
- `applyToBand` - Submits application to join band
- `getBandApplications` - Fetches pending applications (admins)
- `acceptBandApplication` - Accepts application and adds as member
- `rejectBandApplication` - Rejects application with optional feedback
- `getBandApplicationStatus` - Checks user's application status

## Data Flow
1. **Profile**: Bands loaded via `getBand`, displayed in tabbed interface (Posts/About/Members/Applications)
2. **Members**: Admins can add/remove members, prevent removing last admin
3. **Followers**: Users follow bands, follower count updates reactively
4. **Applications**: Users apply → admins review → accept (adds member) or reject (with feedback)
5. **Posts**: Admins create posts on behalf of band, displayed in feed
