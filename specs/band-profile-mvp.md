# Feature: Band Profile MVP

## Problem Statement

**Problem:** The core value proposition "bands find musicians, musicians find bands" is currently broken because bands don't exist on the platform. Musicians can create profiles, but bands have no way to establish a presence or describe who they're looking for.

**Who has this problem:**
- Band leaders who want to recruit musicians
- Musicians looking to join bands
- Existing band members who want their band represented on the platform

**Impact:** Without band profiles, 50% of the platform's core matchmaking functionality is missing.

## Success Criteria

**How we know this feature works:**
- Band leaders can successfully create a band profile with all required information
- Band profiles display correctly with all information and member list
- Only admins can modify band information or manage members
- City geocoding converts location text to coordinates for future search
- Band membership appears on user profiles
- Mobile responsive on all screen sizes
- Form validation prevents invalid submissions
- All code passes Prettier, ESLint, TypeScript checks

**Success looks like:**
- 10+ bands created in first week
- Average 2+ members per band
- 20+ band profile views per day

## User Stories

1. **As a band leader**, I want to create a band profile so musicians can discover my band and learn about us
2. **As a band leader**, I want to describe what musicians we're looking for so we attract the right candidates
3. **As a band leader**, I want to add/remove band members so our roster is always accurate
4. **As a musician**, I want to view band profiles so I can learn about bands and see if they're looking for members
5. **As a musician**, I want to see my band memberships on my profile so others know what bands I'm in
6. **As a band member**, I want to be listed on my band's profile so people know I'm part of the band

## Scope

### In Scope (MVP)

**Band Creation:**
- Create band with required fields: Name, Bio, City/State, Primary Genre, "Looking For" description
- Band creator automatically becomes admin
- City geocoding (converts "Chicago, IL" → latitude/longitude)

**Band Profile View:**
- Display all band information (name, bio, location, genre, looking_for)
- Show list of all band members with links to their profiles
- Show join date for each member
- Show admin badge for admin members

**Member Management:**
- Add members directly by user ID (no invitation flow for MVP)
- Remove members from band (admin only)
- Band creator is automatically admin

**Permissions:**
- Only admins can edit band profile
- Only admins can add/remove members
- Regular members are view-only (just appear on profile)

**User Profile Integration:**
- Add "Bands" section to user profiles
- Show all bands user is a member of
- Link to band profiles

**Navigation:**
- "Create Band" link in main navigation
- Link to user's bands from profile

### Out of Scope (Future Features)

**Explicitly deferred to later:**
- Band search/discovery page (separate feature after MVP)
- Multiple genres (just primary genre for now)
- Structured position postings (use free-text "looking for" for MVP)
- Band images/photos (reuse default avatars)
- Band achievements/history timeline
- Rehearsal schedules
- Social media links integration
- Invitation system (direct add for MVP)
- Soft delete / band archiving
- Multiple admin roles (moderator, etc.)
- Member permissions beyond view-only
- Band activity feed
- Band statistics

**Why deferred:**
- Keep MVP minimal to ship fast and validate demand
- Add complexity only after users demonstrate need
- Focus on core use case: bands exist and can be discovered

## User Flow

### Flow 1: Create Band (Band Leader)

1. User clicks "Create Band" in navigation
2. System shows band creation form
3. User fills in required fields:
   - Band name (text input, required, 1-100 chars)
   - Bio (textarea, required, 1-500 chars)
   - City (text input with autocomplete, required)
   - State (text input, required)
   - Primary Genre (dropdown, required, from predefined list)
   - Looking For (textarea, optional, 0-500 chars, e.g., "Looking for bassist and drummer")
4. User clicks "Create Band"
5. System validates input (client-side + server-side)
6. System geocodes city/state to lat/lng
7. System creates band with user as admin
8. System redirects to band profile page
9. User sees success message: "Band created successfully!"

### Flow 2: View Band Profile (Any User)

1. User navigates to `/bands/:id` (from link, search result, user profile, etc.)
2. System loads band data and members
3. User sees:
   - Band name (large heading)
   - Location (city, state)
   - Primary genre badge
   - Bio paragraph
   - "Looking For" section (if populated)
   - "Members" section with list of members:
     - Member avatar
     - Member name (linked to profile)
     - Joined date ("Member since Nov 2025")
     - Admin badge (if admin)
4. If user is admin: User sees "Edit Band" button
5. If user is admin: User sees "Add Member" and "Remove" buttons

### Flow 3: Edit Band Profile (Admin Only)

1. Admin clicks "Edit Band" button on band profile
2. System shows inline editing form (similar to user profile edit)
3. Admin modifies fields (bio, location, genre, looking_for)
4. Admin clicks "Save"
5. System validates input
6. System geocodes location if changed
7. System updates band
8. System shows updated profile
9. User sees success message: "Band updated successfully!"

### Flow 4: Add Band Member (Admin Only)

1. Admin clicks "Add Member" button on band profile
2. System shows modal with user search
3. Admin searches for user by name or email
4. System shows matching users
5. Admin clicks user to add
6. System validates:
   - User exists
   - User is not already a member
   - Current user is admin
7. System adds user to band (not as admin)
8. System updates member list
9. User sees new member in list
10. System shows success message: "Member added successfully!"

### Flow 5: Remove Band Member (Admin Only)

1. Admin clicks "Remove" button next to member
2. System shows confirmation modal: "Remove [name] from [band]?"
3. Admin confirms
4. System validates:
   - Current user is admin
   - Not removing the last admin
5. System removes user from band
6. System updates member list
7. Member disappears from list
8. System shows success message: "Member removed successfully!"

### Flow 6: View User's Bands (On User Profile)

1. User navigates to any user profile
2. System loads user data including band memberships
3. User sees "Bands" section showing:
   - Band name (linked to band profile)
   - User's role (Admin or Member)
   - Joined date
4. If no bands: Show empty state: "Not in any bands yet"

## UI Requirements

### Components Needed

**BandForm Component** (create and edit)
- Name input field
- Bio textarea (with character counter)
- City autocomplete input
- State input
- Genre dropdown (single select)
- Looking For textarea (optional, with character counter)
- Submit button
- Cancel button (edit mode)

**BandProfileView Component**
- Band header (name, location, genre)
- Bio section
- Looking For section (if populated)
- Members list (BandMembersList)
- Edit button (admin only)
- Add Member button (admin only)

**BandMembersList Component**
- List of members with:
  - Avatar (reuse UserAvatar component)
  - Name (linked)
  - Joined date
  - Admin badge
  - Remove button (admin only, not on self if last admin)

**AddMemberModal Component**
- Search input
- User results list
- Add button per user
- Cancel button

**UserBandsList Component** (for user profile)
- List of bands user is in
- Band name (linked)
- Role badge (Admin/Member)
- Joined date
- Empty state if no bands

**Navigation Updates**
- Add "Create Band" link to main nav (desktop and mobile)

### States

**Band Creation Form:**
- **Loading state:** Disable form, show spinner on submit button: "Creating..."
- **Validation error state:** Show inline error messages below invalid fields (red text)
- **Success state:** Redirect to band profile + toast notification
- **Network error state:** Show error message: "Failed to create band. Please try again." + retry button

**Band Profile View:**
- **Loading state:** Show skeleton loaders for band info and member list
- **Empty state (no members):** Show message: "No members yet. Add members to get started."
- **Empty state (no looking_for):** Don't show "Looking For" section
- **Error state:** Show error message: "Failed to load band profile." + retry button
- **Not found state:** Show 404 page: "Band not found"

**Edit Band Form:**
- **Loading state:** Disable form, show spinner on save button: "Saving..."
- **Validation error state:** Show inline errors
- **Success state:** Update view + toast notification
- **Error state:** Show error message + keep form open for retry

**Add Member Modal:**
- **Searching state:** Show spinner in search results area
- **No results state:** Show message: "No users found matching '[query]'"
- **Adding state:** Disable add buttons, show spinner on clicked button: "Adding..."
- **Error state:** Show error message: "Failed to add member." + retry

**User Profile Bands Section:**
- **Loading state:** Show skeleton loaders
- **Empty state:** Show message: "Not in any bands yet" + "Create Band" CTA button
- **Error state:** Show error message: "Failed to load bands."

### Interactions

**Band Creation:**
- User types in form → Validate on blur (show errors immediately)
- User types in city → Show autocomplete suggestions (debounced)
- User clicks submit → Validate all fields → Show loading → Create band → Redirect

**Band Profile:**
- User clicks "Edit Band" → Switch to edit mode (inline editing)
- Admin clicks "Add Member" → Open modal
- Admin clicks "Remove" → Show confirmation modal → Remove on confirm
- User clicks member name → Navigate to user profile
- User clicks genre badge → Future: filter by genre (no-op for MVP)

**Add Member Modal:**
- User types in search → Debounce 300ms → Search API
- User clicks user card → Add member → Show success → Close modal
- User clicks outside modal → Close without adding
- User presses ESC → Close modal

**User Profile:**
- User clicks band name → Navigate to band profile
- User sees empty state → Clicks "Create Band" → Navigate to band creation form

### Responsive Design

**Mobile (< 768px):**
- Stack form fields vertically
- Full-width buttons
- Collapse member cards to vertical layout
- Show mobile-optimized navigation

**Tablet (768px - 1024px):**
- 2-column form layout where appropriate
- Side-by-side buttons
- Grid layout for members (2 columns)

**Desktop (> 1024px):**
- 2-column form layout
- Horizontal member cards
- Grid layout for members (3-4 columns)

## API Requirements

### Endpoints Needed

#### `POST /api/bands`

**Purpose:** Create a new band

**Auth:** Required (JWT token)

**Request:**
```json
{
  "name": "The Rock Band",
  "description": "We play classic rock covers...",
  "city": "Chicago",
  "state": "IL",
  "country": "USA",
  "primaryGenre": "rock",
  "lookingFor": "Looking for experienced bassist"
}
```

**Validation:**
- `name`: required, string, 1-100 chars, unique per user (user can't create duplicate band names)
- `description`: required, string, 1-500 chars
- `city`: required, string, 1-100 chars
- `state`: required, string, 1-100 chars
- `country`: optional, string, default "USA"
- `primaryGenre`: required, string, must be valid genre from enum
- `lookingFor`: optional, string, 0-500 chars

**Response (201):**
```json
{
  "id": "band_123",
  "name": "The Rock Band",
  "description": "We play classic rock covers...",
  "city": "Chicago",
  "state": "IL",
  "country": "USA",
  "latitude": 41.8781,
  "longitude": -87.6298,
  "primaryGenre": "rock",
  "lookingFor": "Looking for experienced bassist",
  "profileImageUrl": null,
  "createdAt": "2025-11-08T10:00:00.000Z",
  "updatedAt": "2025-11-08T10:00:00.000Z"
}
```

**Errors:**
- `400`: Invalid input (specific validation errors in response)
- `401`: Unauthorized (missing or invalid token)
- `409`: Conflict (band name already exists for this user)
- `500`: Server error (geocoding failed, database error)

**Side Effects:**
- Creates band in `music_groups` table
- Geocodes city/state to latitude/longitude
- Adds creator as admin in `music_groups_members` table

---

#### `GET /api/bands/:id`

**Purpose:** Get band details with members

**Auth:** Optional (public endpoint, but some features require auth)

**Response (200):**
```json
{
  "id": "band_123",
  "name": "The Rock Band",
  "description": "We play classic rock covers...",
  "city": "Chicago",
  "state": "IL",
  "country": "USA",
  "latitude": 41.8781,
  "longitude": -87.6298,
  "primaryGenre": "rock",
  "lookingFor": "Looking for experienced bassist",
  "profileImageUrl": null,
  "createdAt": "2025-11-08T10:00:00.000Z",
  "updatedAt": "2025-11-08T10:00:00.000Z",
  "members": [
    {
      "userId": "user_1",
      "name": "John Doe",
      "profileImageUrl": "https://...",
      "isAdmin": true,
      "joinedAt": "2025-11-08T10:00:00.000Z"
    }
  ],
  "isUserAdmin": true
}
```

**Errors:**
- `404`: Band not found
- `500`: Server error

**Notes:**
- `isUserAdmin` only present if user is authenticated
- `members` array sorted by: admins first, then by joinedAt ascending

---

#### `PATCH /api/bands/:id`

**Purpose:** Update band information

**Auth:** Required (must be band admin)

**Request (all fields optional):**
```json
{
  "name": "The New Rock Band",
  "description": "Updated bio...",
  "city": "Los Angeles",
  "state": "CA",
  "country": "USA",
  "primaryGenre": "alternative",
  "lookingFor": "No longer looking"
}
```

**Validation:** Same as POST (but all optional)

**Response (200):**
```json
{
  "id": "band_123",
  "name": "The New Rock Band",
  ...
}
```

**Errors:**
- `400`: Invalid input
- `401`: Unauthorized
- `403`: Forbidden (not a band admin)
- `404`: Band not found
- `500`: Server error

**Side Effects:**
- Updates band in `music_groups` table
- Re-geocodes location if city/state changed
- Updates `updatedAt` timestamp

---

#### `DELETE /api/bands/:id`

**Purpose:** Delete band (hard delete)

**Auth:** Required (must be band admin)

**Response (204):** No content

**Errors:**
- `401`: Unauthorized
- `403`: Forbidden (not a band admin)
- `404`: Band not found
- `500`: Server error

**Side Effects:**
- Deletes band from `music_groups` table
- Cascades delete to `music_groups_members` (removes all member associations)

---

#### `POST /api/bands/:id/members`

**Purpose:** Add member to band

**Auth:** Required (must be band admin)

**Request:**
```json
{
  "userId": "user_2"
}
```

**Validation:**
- `userId`: required, string, must be valid user ID
- User must not already be a member

**Response (201):**
```json
{
  "userId": "user_2",
  "musicGroupId": "band_123",
  "isAdmin": false,
  "joinedAt": "2025-11-08T11:00:00.000Z"
}
```

**Errors:**
- `400`: Invalid input (user already member)
- `401`: Unauthorized
- `403`: Forbidden (not a band admin)
- `404`: Band or user not found
- `500`: Server error

**Side Effects:**
- Adds user to `music_groups_members` table
- Sets `isAdmin` to false (only creator is admin for MVP)

---

#### `DELETE /api/bands/:id/members/:userId`

**Purpose:** Remove member from band

**Auth:** Required (must be band admin)

**Validation:**
- Cannot remove last admin (must have at least one admin)
- User must be a member of the band

**Response (204):** No content

**Errors:**
- `400`: Cannot remove last admin
- `401`: Unauthorized
- `403`: Forbidden (not a band admin)
- `404`: Band or member not found
- `500`: Server error

**Side Effects:**
- Removes user from `music_groups_members` table

---

#### `GET /api/users/:userId/bands`

**Purpose:** Get all bands user is a member of

**Auth:** Optional (public endpoint)

**Response (200):**
```json
{
  "bands": [
    {
      "id": "band_123",
      "name": "The Rock Band",
      "primaryGenre": "rock",
      "city": "Chicago",
      "state": "IL",
      "profileImageUrl": null,
      "isAdmin": true,
      "joinedAt": "2025-11-08T10:00:00.000Z"
    }
  ]
}
```

**Errors:**
- `404`: User not found
- `500`: Server error

**Notes:**
- Returns empty array if user has no bands
- Sorted by: admin bands first, then by joinedAt descending

## Database Changes

### Modified Tables

**Update `music_groups` table:**

```sql
-- Add new columns to existing music_groups table
ALTER TABLE music_groups ADD COLUMN description TEXT;
ALTER TABLE music_groups ADD COLUMN primary_genre TEXT;
ALTER TABLE music_groups ADD COLUMN city TEXT;
ALTER TABLE music_groups ADD COLUMN state TEXT;
ALTER TABLE music_groups ADD COLUMN country TEXT DEFAULT 'USA';
ALTER TABLE music_groups ADD COLUMN latitude REAL;
ALTER TABLE music_groups ADD COLUMN longitude REAL;
ALTER TABLE music_groups ADD COLUMN looking_for TEXT;
ALTER TABLE music_groups ADD COLUMN profile_image_url TEXT;
```

**Update `music_groups_members` table:**

```sql
-- Add joined_at column to track when member joined
ALTER TABLE music_groups_members ADD COLUMN joined_at TEXT NOT NULL DEFAULT (datetime('now'));
```

**Existing columns (keep as-is):**
- `music_groups.id` (TEXT PRIMARY KEY)
- `music_groups.name` (TEXT NOT NULL)
- `music_groups.created_at` (TEXT)
- `music_groups.updated_at` (TEXT)
- `music_groups_members.user_id` (TEXT)
- `music_groups_members.music_group_id` (TEXT)
- `music_groups_members.is_admin` (INTEGER/BOOLEAN)

### Indexes Needed

**Add indexes for performance:**

```sql
-- Index for searching bands by genre
CREATE INDEX idx_music_groups_primary_genre ON music_groups(primary_genre);

-- Index for location-based queries (future)
CREATE INDEX idx_music_groups_location ON music_groups(latitude, longitude);

-- Index for finding user's bands (already exists via FK)
-- music_groups_members(user_id) should already be indexed

-- Index for finding band members (already exists via FK)
-- music_groups_members(music_group_id) should already be indexed
```

**Why:**
- `primary_genre`: Enable fast filtering by genre in future search feature
- `latitude, longitude`: Enable fast location radius queries in future search feature
- User/band foreign keys: Already indexed for fast lookups

### Data Migration

**Migration steps:**
1. Add new columns to `music_groups` (nullable initially)
2. Add new column to `music_groups_members` with default value
3. Create new indexes
4. No data backfill needed (tables currently empty or minimal)

**Rollback plan:**
- Drop added columns
- Drop added indexes
- Restore from backup if needed

## Edge Cases

### What happens when...

**1. User tries to create band with duplicate name?**
- Scenario: User creates "The Rock Band", then tries to create another "The Rock Band"
- Handling: Allow it (different bands can have same name, identified by ID)
- Note: No unique constraint on name

**2. Geocoding fails for city/state?**
- Scenario: User enters "Fakeville, XX" that geocoding API can't resolve
- Handling:
  - Return 400 error: "Could not find location. Please check city and state."
  - Don't create band
  - User must enter valid location
- Alternative: Store null lat/lng and allow creation (flag for manual review)

**3. User tries to add themselves as member?**
- Scenario: Admin searches for their own name and clicks add
- Handling: Return 400 error: "You are already a member of this band."

**4. User tries to add user who is already a member?**
- Scenario: Admin tries to add same user twice
- Handling: Return 400 error: "[Name] is already a member of this band."

**5. Admin tries to remove themselves when they're the last admin?**
- Scenario: Only admin in band clicks "Remove" on themselves
- Handling: Return 400 error: "Cannot remove the last admin. Add another admin first or delete the band."

**6. User views band profile that doesn't exist?**
- Scenario: User navigates to `/bands/invalid_id`
- Handling: Show 404 page: "Band not found"

**7. Non-admin tries to edit band?**
- Scenario: Regular member tries to access edit functionality
- Handling: Don't show edit buttons in UI. If they bypass and hit API, return 403 error.

**8. User deletes band while another user is viewing it?**
- Scenario: User A viewing band, User B (admin) deletes it
- Handling:
  - User A's page shows stale data until refresh
  - On refresh: Show 404 page
  - No real-time update needed for MVP

**9. Two admins try to remove same member simultaneously?**
- Scenario: Race condition on DELETE /api/bands/:id/members/:userId
- Handling:
  - First request succeeds (204)
  - Second request fails (404 member not found)
  - Acceptable for MVP (rare case)

**10. User searches for member to add but no results?**
- Scenario: Admin searches for "xyz" in add member modal
- Handling: Show empty state: "No users found matching 'xyz'"

**11. Band has no members (all removed)?**
- Scenario: Hypothetically possible if last admin removed
- Handling: Prevent this via validation (cannot remove last admin)

**12. User has no bands?**
- Scenario: New user views another user's profile who has no bands
- Handling: Show empty state: "Not in any bands yet"

**13. API request times out?**
- Scenario: Geocoding API slow, database slow, network issues
- Handling:
  - Show error message: "Request timed out. Please try again."
  - Retry button
  - Log error for monitoring

**14. User enters very long text in bio or looking_for?**
- Scenario: User pastes 10,000 characters
- Handling:
  - Client-side validation: Show error before submit
  - Server-side validation: Return 400 if > 500 chars
  - Truncate display with "Read more" link (future enhancement)

**15. User enters HTML/script tags in text fields?**
- Scenario: XSS attempt
- Handling:
  - Sanitize on display (escape HTML entities)
  - Store as-is in database
  - Use React's built-in XSS protection (textContent, not innerHTML)

**16. User is member of 50+ bands?**
- Scenario: Edge case of very active user
- Handling:
  - Show all on user profile (paginate if > 20 in future)
  - Performance acceptable for MVP (simple JOIN query)

**17. Band has 100+ members?**
- Scenario: Large band or music collective
- Handling:
  - Show all on band profile (paginate if > 50 in future)
  - Performance acceptable for MVP

## Validation Rules

### Client-Side (Immediate Feedback)

**Band Creation/Edit Form:**
- `name`:
  - Required
  - Min 1 char, max 100 chars
  - Error: "Band name is required" or "Band name must be 100 characters or less"
- `description`:
  - Required
  - Min 1 char, max 500 chars
  - Error: "Bio is required" or "Bio must be 500 characters or less"
- `city`:
  - Required
  - Min 1 char, max 100 chars
  - Error: "City is required"
- `state`:
  - Required
  - Min 1 char, max 100 chars
  - Error: "State is required"
- `primaryGenre`:
  - Required
  - Must be valid genre from enum
  - Error: "Please select a genre"
- `lookingFor`:
  - Optional
  - Max 500 chars
  - Error: "Looking for must be 500 characters or less"

**Add Member:**
- `userId`:
  - Required
  - Must be valid format
  - Error: "Please select a user"

### Server-Side (Security)

**All client validations PLUS:**
- Authentication: Verify JWT token is valid and not expired
- Authorization:
  - Create band: User must be authenticated
  - Edit band: User must be band admin
  - Add/remove member: User must be band admin
  - Delete band: User must be band admin
- Business logic:
  - User cannot add duplicate member
  - User cannot remove last admin
  - Band name uniqueness per user (optional, not enforced for MVP)
- Rate limiting:
  - Band creation: Max 5 per hour per user (prevent spam)
  - Member add/remove: Max 20 per hour per band (prevent abuse)

## Error Handling

### User-Facing Errors

**Band Creation:**
- **Invalid input** → "Please fix the errors above" (inline field errors)
- **Geocoding failed** → "Could not find location. Please check city and state." + Action: Fix city/state
- **Network error** → "Failed to create band. Please try again." + Action: Retry button
- **Rate limit** → "Too many bands created. Please try again later." + Action: Wait

**Band Profile View:**
- **Not found** → "Band not found" 404 page + Action: Go home
- **Network error** → "Failed to load band. Please try again." + Action: Retry button

**Edit Band:**
- **Invalid input** → Inline field errors
- **Not authorized** → "You don't have permission to edit this band." + Action: Go back
- **Network error** → "Failed to update band. Please try again." + Action: Retry button

**Add Member:**
- **User not found** → "User not found. Please try a different search."
- **Already member** → "[Name] is already a member of this band."
- **Network error** → "Failed to add member. Please try again." + Action: Retry

**Remove Member:**
- **Last admin** → "Cannot remove the last admin. Add another admin first or delete the band."
- **Network error** → "Failed to remove member. Please try again." + Action: Retry

### Developer Errors (Log + Alert)

**Critical (alert on-call):**
- Database connection failure
- Geocoding API completely down
- Authentication service failure

**Warning (log only):**
- Slow geocoding API response (> 2s)
- High rate of validation errors (possible attack)
- Unusual member add/remove patterns

**Info (log only):**
- Band created
- Member added/removed
- Band updated

## Performance Considerations

### Expected Load
- Bands created: 10-50 per day initially
- Band profile views: 100-500 per day initially
- Member operations: 20-100 per day initially

### Query Optimization

**Band Profile Query:**
```sql
-- Single query to get band + members
SELECT
  mg.*,
  mgm.user_id, mgm.is_admin, mgm.joined_at,
  u.name, u.profile_image_url
FROM music_groups mg
LEFT JOIN music_groups_members mgm ON mg.id = mgm.music_group_id
LEFT JOIN users u ON mgm.user_id = u.id
WHERE mg.id = ?
ORDER BY mgm.is_admin DESC, mgm.joined_at ASC
```

**User's Bands Query:**
```sql
-- Single query to get user's bands
SELECT
  mg.*,
  mgm.is_admin, mgm.joined_at
FROM music_groups_members mgm
JOIN music_groups mg ON mgm.music_group_id = mg.id
WHERE mgm.user_id = ?
ORDER BY mgm.is_admin DESC, mgm.joined_at DESC
```

### Caching Strategy

**For MVP (no caching):**
- Acceptable performance with direct DB queries
- Add caching in future if needed

**Future (post-MVP):**
- Cache band profiles in Cloudflare KV (TTL: 5 minutes)
- Invalidate cache on band update
- Cache user's bands list (TTL: 1 minute)

### Geocoding Optimization

**Use existing geocoding logic from user profiles:**
- Reuse same API endpoint and caching strategy
- Debounce geocoding requests (already implemented)
- Cache geocoding results (already implemented)

### Rate Limiting

**Prevent abuse:**
- Band creation: 5 per hour per user
- Member add: 10 per hour per band
- Member remove: 10 per hour per band
- API queries: 100 per minute per user (general rate limit)

## Testing Checklist

### Functional Tests

**Band Creation:**
- [ ] User can create band with all required fields
- [ ] Band creator automatically becomes admin
- [ ] City geocoding converts to lat/lng correctly
- [ ] Form validation shows errors for invalid input
- [ ] Success redirects to band profile page

**Band Profile View:**
- [ ] Band information displays correctly
- [ ] Member list displays with correct info
- [ ] Admin badge shows for admins
- [ ] Edit button only shows for admins
- [ ] Add/remove buttons only show for admins

**Edit Band:**
- [ ] Admin can update all fields
- [ ] Changes persist after save
- [ ] Location geocoding updates if city/state changed
- [ ] Non-admins cannot edit (403 error)

**Member Management:**
- [ ] Admin can add members
- [ ] Added member appears in list
- [ ] Admin can remove members (except last admin)
- [ ] Removed member disappears from list
- [ ] Cannot add duplicate member

**User Profile Integration:**
- [ ] User's bands appear on profile
- [ ] Admin badge shows for admin bands
- [ ] Empty state shows if no bands
- [ ] Clicking band navigates to band profile

### Edge Case Tests

**Error Handling:**
- [ ] Invalid band ID shows 404 page
- [ ] Geocoding failure shows error message
- [ ] Network errors show retry option
- [ ] Cannot remove last admin (validation error)
- [ ] Unauthorized access returns 403

**Input Validation:**
- [ ] Empty required fields show errors
- [ ] Text exceeding max length shows errors
- [ ] HTML/script tags are sanitized on display

**Concurrency:**
- [ ] Concurrent member add/remove handled gracefully
- [ ] Viewing deleted band shows 404 after refresh

### Non-Functional Tests

**Performance:**
- [ ] Band profile loads in < 1s
- [ ] Member search returns results in < 500ms
- [ ] Geocoding completes in < 2s

**Responsive Design:**
- [ ] Mobile layout works (< 768px)
- [ ] Tablet layout works (768px - 1024px)
- [ ] Desktop layout works (> 1024px)
- [ ] Touch interactions work on mobile

**Accessibility:**
- [ ] Keyboard navigation works (tab through form)
- [ ] Screen reader announces errors
- [ ] Form labels are properly associated
- [ ] Color contrast meets WCAG 2.1 AA
- [ ] Focus indicators visible

## Security Considerations

### Authentication & Authorization

- [x] **Authentication required:** Band creation, edit, member management
- [x] **Authorization checks:**
  - Only admins can edit band
  - Only admins can add/remove members
  - Users can only delete bands they admin
- [x] **Token validation:** Verify JWT on every authenticated request
- [x] **User ID trust:** Always use `c.get('user')` from token, never trust frontend

### Input Sanitization

- [x] **XSS prevention:**
  - Escape all user input on display
  - Use React's built-in XSS protection (textContent)
  - Never use `dangerouslySetInnerHTML` for user content
- [x] **SQL injection prevention:**
  - Use parameterized queries (Drizzle ORM)
  - Never concatenate user input into SQL
- [x] **Validation:**
  - Validate all input server-side (don't trust client)
  - Validate data types, lengths, formats
  - Validate business rules (e.g., user exists)

### Rate Limiting

- [x] **Prevent abuse:**
  - Band creation: 5 per hour per user
  - Member operations: 10 per hour per band
  - API queries: 100 per minute per user (general)

### Data Privacy

- [x] **Public data:** Band profiles are public (anyone can view)
- [x] **Private data:** None in MVP (no sensitive band info)
- [x] **User consent:** Users added to bands without notification in MVP (acceptable for direct add pattern)

### OWASP Top 10

- [x] **A01 Broken Access Control:** Authorization checks on all write operations
- [x] **A03 Injection:** Parameterized queries, input validation
- [x] **A05 Security Misconfiguration:** Proper error handling (don't leak stack traces)
- [x] **A07 XSS:** Input sanitization, React XSS protection
- [x] **A09 Logging:** Log security events (failed auth, rate limits)

## Rollout Plan

### Phase 1: MVP (Week 1)

**Day 1-2: Database & API**
- Create database migration
- Implement all API endpoints
- Add validation and error handling
- Write API tests

**Day 3-4: Frontend Core**
- Create band creation form
- Create band profile view
- Add member management UI
- Implement user profile integration

**Day 5-6: Polish & Testing**
- Add loading/error states
- Mobile responsive design
- Accessibility improvements
- E2E testing

**Day 7: Launch**
- Deploy to production
- Monitor for errors
- Announce feature to users

**Success metrics:**
- 5+ bands created in first 24 hours
- No critical bugs reported
- API response times < 1s

### Phase 2: Iterate (Week 2-3)

**Based on user feedback:**
- Improve member search UX
- Add member invitation system (if requested)
- Improve mobile experience (if issues reported)
- Add band images (if requested)

**Ship to:**
- 100% of users (already shipped in Phase 1)

**Monitor:**
- Band creation rate
- Member add/remove activity
- Profile view engagement
- Error rates

### Phase 3: Future Enhancements

**After MVP validated:**
- Band search/discovery page (separate feature)
- Multiple genres support
- Position postings system
- Band achievements/timeline
- Social media integration
- Band analytics dashboard

## Metrics to Track

### User Engagement

**Band Creation:**
- **Definition:** Number of bands created per day/week/month
- **Target:** 10+ bands in first week, 50+ in first month
- **Track:** Database query COUNT on music_groups table

**Band Profile Views:**
- **Definition:** Number of unique band profile page views per day
- **Target:** 20+ views per day in first week
- **Track:** Analytics event on page load

**Member Operations:**
- **Definition:** Number of members added/removed per day
- **Target:** 2+ members added per band on average
- **Track:** Database query COUNT on music_groups_members table

### User Success

**Bands with Multiple Members:**
- **Definition:** Percentage of bands with 2+ members
- **Target:** 60%+ of bands have multiple members
- **Track:** Database query: bands with member count > 1

**User Band Membership:**
- **Definition:** Percentage of users who are in at least one band
- **Target:** 30%+ of active users in a band
- **Track:** Database query: users with band count > 0

### Technical Health

**API Performance:**
- **Definition:** Average response time for band endpoints
- **Target:** < 500ms for GET, < 1s for POST/PATCH
- **Track:** Cloudflare Workers analytics

**Error Rate:**
- **Definition:** Percentage of API requests that fail (4xx, 5xx)
- **Target:** < 1% error rate
- **Track:** Cloudflare Workers logs

**Geocoding Success:**
- **Definition:** Percentage of successful geocoding requests
- **Target:** > 95% success rate
- **Track:** Log geocoding failures

## Open Questions

**RESOLVED:**
1. ~~How should member addition work?~~ → Direct add (no invitation flow for MVP)
2. ~~Should members have any permissions?~~ → View only (only admins can edit)
3. ~~What happens when band is deleted?~~ → Hard delete (permanent removal)
4. ~~Should user profiles show bands?~~ → Yes, add "Bands" section

**NONE REMAINING** - All questions resolved for MVP scope.

## Dependencies

### Blocks
- Band search feature (needs bands to exist first)
- Position postings feature (needs bands to exist first)

### Blocked By
- None (can be built independently)

### Requires
- Existing geocoding logic from user profiles (already implemented)
- Existing authentication system (already implemented)
- Existing database infrastructure (already implemented)

### Tech Stack
- **Frontend:** Tanstack Start, React, ShadCN, Tailwind
- **Backend:** Hono, Cloudflare Workers, Drizzle ORM, D1
- **Shared:** Zod schemas in packages/common

---

**Estimated Effort:** 5-7 days (1 developer)

**Priority:** High (core feature, 50% of value proposition)

**Owner:** To be assigned

**Status:** Spec complete, ready for implementation
