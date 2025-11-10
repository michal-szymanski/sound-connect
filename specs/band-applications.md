# Feature: Request to Join Band

## Problem Statement

Currently, musicians have no structured way to apply to join bands. When a band posts "looking for drummer" in their profile, interested musicians must:
- Send a DM (disrupts inbox, lacks structure)
- Comment on posts (public, unprofessional)
- Have no visibility into application status

Band admins face challenges too:
- No centralized place to review interested musicians
- No standard information from applicants
- Manual back-and-forth to gather basic info (position, experience, music samples)

This creates friction in the recruitment process, leading to missed connections and inefficient hiring.

**Who has this problem?**
- Band admins actively recruiting members
- Musicians looking for bands to join

## Success Criteria

**For Musicians:**
- Can apply to bands with a single form submission
- See confirmation their application was sent
- Know when their application is accepted/rejected
- Cannot spam bands with multiple pending applications

**For Band Admins:**
- Receive notification when new applications arrive
- View all applications in one place on band profile
- See applicant profile, position applied for, message, and music links
- Can accept (auto-adds as member) or reject with one click
- Can provide optional feedback message on rejection

**Metrics:**
- 70%+ of bands with "looking for" section receive applications within 2 weeks
- 80%+ of applications get reviewed (accepted or rejected) within 7 days
- Average time from application to decision: < 3 days

## User Stories

### Musician Applying
- As a musician, I want to apply to join a band so that I can be considered for membership without sending a DM
- As a musician, I want to include a message explaining why I'm a good fit so that admins understand my background
- As a musician, I want to link to my music (YouTube/SoundCloud) so that admins can hear my playing
- As a musician, I want to specify which position I'm applying for so that admins know my intent
- As a musician, I want confirmation my application was sent so that I know it didn't fail silently
- As a musician, I want to be notified when my application is accepted/rejected so that I know the outcome

### Band Admin Reviewing
- As a band admin, I want to be notified when someone applies so that I don't miss opportunities
- As a band admin, I want to see all pending applications in one place so that I can review them systematically
- As a band admin, I want to see the applicant's profile, message, position, and music link so that I can evaluate them
- As a band admin, I want to accept an application and auto-add them as a member so that the process is seamless
- As a band admin, I want to reject an application with optional feedback so that I can decline politely
- As a band admin, I want rejected applicants blocked from re-applying during this recruitment period so that I don't see the same person repeatedly

## Scope

### In Scope (MVP)

**Application Submission:**
- "Apply to Join" button on band profile (visible when `lookingFor` field is populated)
- Application form modal with:
  - Message to band (required, textarea, 500 char max)
  - Position applying for (optional, text input, 100 char max)
  - Link to your music (optional, URL input, validated format)
- Form validation (client + server)
- One pending application per user per band (unique constraint)
- Disable button if user already applied or is already a member

**Application Review:**
- "Applications" tab on band profile (visible to admins only, shows badge count)
- Applications list showing:
  - Applicant name, profile image, link to profile
  - Position they're applying for
  - Their message
  - Link to their music (if provided)
  - Application date (relative time: "2 days ago")
  - Accept/Reject buttons
- Accept action:
  - Adds user as band member (non-admin role)
  - Updates application status to 'accepted'
  - Sends notification to applicant
  - Removes from pending list
- Reject action:
  - Opens modal with optional feedback message (textarea, 300 char max)
  - Updates application status to 'rejected'
  - Sends notification to applicant (includes feedback if provided)
  - Removes from pending list
  - Applicant blocked from re-applying during current recruitment period

**Recruitment Period Lifecycle:**
- When band updates `lookingFor` from null/empty to non-empty → starts new recruitment period
- When band updates `lookingFor` from non-empty to null/empty → ends recruitment period
  - All pending applications auto-rejected
  - All rejected applications from previous period cleared
- When new recruitment period starts, previously rejected applicants can apply again

**Notifications:**
- Band admins receive notification: "John Smith applied to join Your Band Name as Drummer"
- Applicant receives notification on acceptance: "Your application to Your Band Name has been accepted!"
- Applicant receives notification on rejection: "Your application to Your Band Name has been declined. [optional admin message]"
- Applicant receives notification when recruitment period ends: "The recruitment period for Your Band Name has ended. Your application was not selected."

**Authorization:**
- Only band admins can view/accept/reject applications
- Users cannot apply if already a member
- Users cannot apply if already have pending application
- Users cannot apply if rejected during current recruitment period
- Users can view their own application status (future: "My Applications" page, not in MVP)

### Out of Scope (Future)

**Phase 2 - Applicant Experience:**
- "My Applications" page showing all applications with statuses
- Application history tracking
- Ability to withdraw application
- Edit application after submission

**Phase 3 - Advanced Admin Features:**
- Bulk actions (accept/reject multiple)
- Application filtering/sorting (by position, date, etc.)
- "Shortlist" feature (mark favorites)
- Request additional info from applicant
- Schedule audition/interview

**Phase 4 - Enhancements:**
- Application templates for bands (standard questions)
- Skill assessments/auditions
- Multi-stage application process
- Application analytics (view count, response rate)
- Email notifications (in addition to in-app)

## User Flow

### Flow 1: Musician Applies to Band

1. Musician browses to band profile at `/bands/:id`
2. Sees band has "Looking for: Drummer, Bass Player" section populated
3. Clicks "Apply to Join" button (prominent placement near "Looking for" section)
4. Modal opens with application form:
   - **Message to band** (textarea, required, 500 char max)
     - Placeholder: "Tell the band why you're interested and what you can bring..."
   - **Position applying for** (text input, optional, 100 char max)
     - Placeholder: "e.g., Drummer, Lead Guitar"
   - **Link to your music** (URL input, optional)
     - Placeholder: "YouTube, SoundCloud, Bandcamp, etc."
5. User fills form and clicks "Submit Application"
6. Client-side validation:
   - Message is required and 1-500 chars
   - Position is max 100 chars if provided
   - Music link is valid URL format if provided
7. On validation success, submits to `POST /api/bands/:bandId/applications`
8. Server-side validation (same rules + auth checks)
9. Database checks:
   - User is not already a member
   - User does not have pending application
   - User was not rejected during current recruitment period
10. On success:
    - Application created with status 'pending'
    - Notification sent to all band admins
    - Success message shown: "Application sent! The band admins will review it soon."
    - Modal closes, "Apply to Join" button changes to "Application Pending" (disabled)
11. On error:
    - Show error message inline
    - Common errors:
      - "You're already a member of this band"
      - "You already have a pending application"
      - "You cannot re-apply during this recruitment period"
      - "Message is required and must be 1-500 characters"

### Flow 2: Band Admin Reviews Applications

1. Band admin receives notification: "John Smith applied to join Your Band Name as Drummer"
2. Admin clicks notification → redirects to `/bands/:id?tab=applications`
3. Alternatively, admin visits band profile and sees "Applications" tab with badge count (e.g., "Applications (3)")
4. Clicks "Applications" tab
5. Sees list of pending applications, sorted by newest first
6. Each application card shows:
   - Applicant profile image (40px circle)
   - Applicant name (links to `/musicians/:userId`)
   - Position: "Drummer" (if provided)
   - Message: "I've been playing drums for 10 years..." (full text, max 500 chars)
   - Music link: Clickable URL (opens in new tab)
   - Applied: "2 days ago"
   - Buttons: "Accept" (green), "Reject" (red outline)
7. **Accept Flow:**
   - Admin clicks "Accept"
   - Confirmation modal: "Accept John Smith as a member?" with "Cancel" / "Accept" buttons
   - On confirm, calls `PATCH /api/bands/:bandId/applications/:applicationId/accept`
   - Server:
     - Adds user to `bands_members` table (isAdmin: false)
     - Updates application status to 'accepted'
     - Sends notification to applicant
   - UI updates:
     - Application removed from list
     - Success toast: "John Smith added to band"
     - Badge count decrements
8. **Reject Flow:**
   - Admin clicks "Reject"
   - Modal opens: "Reject application from John Smith?"
     - Optional feedback message (textarea, 300 char max)
     - Placeholder: "You can optionally provide feedback to the applicant"
     - Checkbox: "Send feedback to applicant" (checked by default if message provided)
     - Buttons: "Cancel" / "Reject"
   - On confirm, calls `PATCH /api/bands/:bandId/applications/:applicationId/reject` with feedback message
   - Server:
     - Updates application status to 'rejected'
     - Stores feedback message
     - Sends notification to applicant (includes feedback if provided)
   - UI updates:
     - Application removed from list
     - Success toast: "Application rejected"
     - Badge count decrements

### Flow 3: Recruitment Period Ends

1. Band admin edits band profile
2. Clears "Looking for" field (changes from "Drummer" to empty)
3. Saves band profile
4. Backend detects `lookingFor` changed from non-empty to null/empty
5. Triggers recruitment period end:
   - Finds all pending applications for this band
   - Updates status to 'rejected' with reason: "Recruitment period ended"
   - Sends notification to each applicant: "The recruitment period for Your Band Name has ended."
6. Applicant sees notification and understands outcome

### Flow 4: New Recruitment Period Starts

1. Band admin edits band profile
2. Sets "Looking for: Bass Player, Vocalist"
3. Saves band profile
4. Backend detects `lookingFor` changed from null/empty to non-empty
5. Triggers new recruitment period:
   - Deletes all rejected applications from previous periods for this band
   - Previously rejected users can now apply again
6. Musicians see "Apply to Join" button is now available again

## UI Requirements

### Components Needed

**ApplyToBandModal**
- Dialog modal (ShadCN Dialog)
- Form with:
  - Textarea for message (required)
  - Input for position (optional)
  - Input for music link (optional, URL validation)
  - Character counters (e.g., "245 / 500")
  - Submit button (disabled during submission)
- Client-side validation with error messages
- Loading state during submission
- Success/error feedback

**BandApplicationsTab**
- Tab panel on band profile (ShadCN Tabs)
- Visible only to band admins
- Badge showing count of pending applications
- Empty state: "No pending applications" with icon
- Loading state: Skeleton loaders

**BandApplicationCard**
- Card component showing:
  - Avatar with link to profile
  - Name with link to profile
  - Position badge (if provided)
  - Message text (scrollable if long)
  - Music link (clickable, opens new tab)
  - Relative timestamp
  - Action buttons (Accept, Reject)
- Responsive layout (stack on mobile)

**RejectApplicationModal**
- Dialog modal (ShadCN Dialog)
- Optional feedback textarea (300 char max)
- Character counter
- Checkbox to send feedback (default checked if message provided)
- Cancel/Reject buttons

**ApplicationStatusButton**
- Replaces "Apply to Join" when user has applied
- Shows "Application Pending" (disabled, different styling)
- Tooltip: "You have a pending application to this band"

### States

**Apply to Join Button States:**
- **Default** (user not applied, not a member): "Apply to Join" - primary button, clickable
- **Pending** (user has pending application): "Application Pending" - muted button, disabled
- **Member** (user is already a member): Hidden (show "You're a member" badge instead)
- **Rejected** (user rejected during current period): "Cannot Apply" - disabled, tooltip explains

**Applications List States:**
- **Loading**: Skeleton cards (3 placeholders)
- **Empty**: Empty state illustration + "No pending applications. Applications will appear here when musicians apply."
- **Success**: List of application cards
- **Error**: Error message with retry button

**Application Card States:**
- **Default**: Normal display with Accept/Reject buttons
- **Accepting**: Accept button shows spinner, Reject disabled
- **Rejecting**: Reject button shows spinner, Accept disabled
- **Error**: Toast notification with error message

**Recruitment Period Indicator:**
- Band profile shows recruitment status:
  - **Active**: "Actively recruiting" badge (green)
  - **Inactive**: No badge, "Looking for" section empty/hidden

### Interactions

**User clicks "Apply to Join":**
- Opens ApplyToBandModal
- Focus on message textarea
- Enable submit when message is valid

**User clicks "Submit Application":**
- Validate form
- Show loading state on button
- On success: Close modal, show success toast, disable "Apply to Join" button
- On error: Show error message inline, keep modal open

**Admin clicks "Applications" tab:**
- Fetch applications from API
- Show loading state
- Display list or empty state

**Admin clicks "Accept":**
- Show confirmation modal
- On confirm: Show loading state, call API
- On success: Remove from list, show toast
- On error: Show error toast, keep in list

**Admin clicks "Reject":**
- Show RejectApplicationModal
- Admin can type feedback
- On confirm: Show loading state, call API
- On success: Remove from list, show toast
- On error: Show error toast, keep in list

**User clicks music link:**
- Open in new tab
- External link icon indicator

## API Requirements

### Endpoints

#### `POST /api/bands/:bandId/applications`

**Purpose:** Submit application to join band

**Auth:** Required (authenticated user)

**Request:**
```json
{
  "message": "I've been playing drums for 10 years...",
  "position": "Drummer",
  "musicLink": "https://youtube.com/watch?v=..."
}
```

**Validation:**
- `message`: required, string, 1-500 chars, trim whitespace
- `position`: optional, string, max 100 chars, trim whitespace
- `musicLink`: optional, string, valid URL format, max 500 chars

**Response (201 Created):**
```json
{
  "application": {
    "id": 123,
    "bandId": 456,
    "userId": "user_abc",
    "message": "I've been playing drums for 10 years...",
    "position": "Drummer",
    "musicLink": "https://youtube.com/watch?v=...",
    "status": "pending",
    "createdAt": "2025-01-15T10:30:00Z",
    "updatedAt": "2025-01-15T10:30:00Z"
  }
}
```

**Errors:**
- `400 Bad Request`:
  - "Message is required and must be 1-500 characters"
  - "Position must be max 100 characters"
  - "Music link must be a valid URL"
  - "You already have a pending application to this band"
  - "You are already a member of this band"
  - "You cannot re-apply during this recruitment period"
  - "This band is not currently recruiting"
- `401 Unauthorized`: "Authentication required"
- `404 Not Found`: "Band not found"
- `429 Too Many Requests`: "Too many applications. Please try again later."
- `500 Internal Server Error`: "Failed to submit application"

**Side Effects:**
- Creates row in `band_applications` table
- Sends notification to all band admins via Cloudflare Queue
- Rate limiting: Max 5 applications per user per hour

---

#### `GET /api/bands/:bandId/applications`

**Purpose:** List all applications for a band (admin only)

**Auth:** Required, user must be band admin

**Query Params:**
- `status`: optional, enum ('pending' | 'accepted' | 'rejected'), default: 'pending'
- `limit`: optional, number, default: 20, max: 100
- `offset`: optional, number, default: 0

**Response (200 OK):**
```json
{
  "applications": [
    {
      "id": 123,
      "bandId": 456,
      "userId": "user_abc",
      "userName": "John Smith",
      "userImage": "https://...",
      "message": "I've been playing drums for 10 years...",
      "position": "Drummer",
      "musicLink": "https://youtube.com/watch?v=...",
      "status": "pending",
      "createdAt": "2025-01-15T10:30:00Z",
      "updatedAt": "2025-01-15T10:30:00Z"
    }
  ],
  "total": 3,
  "hasMore": false
}
```

**Errors:**
- `401 Unauthorized`: "Authentication required"
- `403 Forbidden`: "You must be a band admin to view applications"
- `404 Not Found`: "Band not found"
- `500 Internal Server Error`: "Failed to fetch applications"

---

#### `PATCH /api/bands/:bandId/applications/:applicationId/accept`

**Purpose:** Accept application and add user as band member

**Auth:** Required, user must be band admin

**Request:** Empty body

**Response (200 OK):**
```json
{
  "application": {
    "id": 123,
    "status": "accepted",
    "updatedAt": "2025-01-15T11:00:00Z"
  },
  "member": {
    "id": 789,
    "userId": "user_abc",
    "bandId": 456,
    "isAdmin": false,
    "joinedAt": "2025-01-15T11:00:00Z"
  }
}
```

**Errors:**
- `400 Bad Request`: "Application has already been processed"
- `401 Unauthorized`: "Authentication required"
- `403 Forbidden`: "You must be a band admin to accept applications"
- `404 Not Found`: "Application not found"
- `500 Internal Server Error`: "Failed to accept application"

**Side Effects:**
- Updates application status to 'accepted'
- Creates row in `bands_members` table (isAdmin: false)
- Sends notification to applicant
- Transaction: Both updates must succeed or rollback

---

#### `PATCH /api/bands/:bandId/applications/:applicationId/reject`

**Purpose:** Reject application with optional feedback

**Auth:** Required, user must be band admin

**Request:**
```json
{
  "feedbackMessage": "Thank you for applying. We've decided to go with someone with more gigging experience."
}
```

**Validation:**
- `feedbackMessage`: optional, string, max 300 chars, trim whitespace

**Response (200 OK):**
```json
{
  "application": {
    "id": 123,
    "status": "rejected",
    "feedbackMessage": "Thank you for applying...",
    "updatedAt": "2025-01-15T11:00:00Z"
  }
}
```

**Errors:**
- `400 Bad Request`:
  - "Application has already been processed"
  - "Feedback message must be max 300 characters"
- `401 Unauthorized`: "Authentication required"
- `403 Forbidden`: "You must be a band admin to reject applications"
- `404 Not Found`: "Application not found"
- `500 Internal Server Error`: "Failed to reject application"

**Side Effects:**
- Updates application status to 'rejected'
- Stores feedback message
- Sends notification to applicant (includes feedback if provided)

---

#### `GET /api/users/me/applications` (Out of Scope for MVP)

**Purpose:** Get current user's applications (for future "My Applications" page)

Future endpoint - not implementing in MVP.

## Database Changes

### New Table: `band_applications`

```sql
CREATE TABLE band_applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  band_id INTEGER NOT NULL REFERENCES bands(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  position TEXT,
  music_link TEXT,
  status TEXT NOT NULL CHECK(status IN ('pending', 'accepted', 'rejected')),
  feedback_message TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,

  -- Constraints
  UNIQUE(band_id, user_id, status) WHERE status = 'pending'
);

-- Indexes
CREATE INDEX idx_band_applications_band_id ON band_applications(band_id, status, created_at DESC);
CREATE INDEX idx_band_applications_user_id ON band_applications(user_id, status);
CREATE INDEX idx_band_applications_status ON band_applications(status);
```

**Columns:**
- `id`: Auto-incrementing integer, primary key
- `band_id`: Foreign key to bands table, cascade delete
- `user_id`: Foreign key to users table, cascade delete
- `message`: Required text, 1-500 chars (application message)
- `position`: Optional text, max 100 chars (position applying for)
- `music_link`: Optional text, max 500 chars (URL to music)
- `status`: Required enum ('pending', 'accepted', 'rejected')
- `feedback_message`: Optional text, max 300 chars (admin feedback on rejection)
- `created_at`: Required text (ISO 8601 timestamp)
- `updated_at`: Required text (ISO 8601 timestamp)

**Unique Constraint:**
- `(band_id, user_id, status)` WHERE `status = 'pending'`
- Prevents multiple pending applications from same user to same band
- Allows rejected user to re-apply after recruitment period ends

**Indexes:**
- `(band_id, status, created_at DESC)`: Fast lookup for band's pending applications, sorted newest first
- `(user_id, status)`: Fast lookup for user's applications (future "My Applications" page)
- `(status)`: Fast lookup for admin dashboards showing all pending applications

### Modified Tables

**None** - This feature only requires the new `band_applications` table.

### Relations

```typescript
// Drizzle schema additions
export const bandApplicationsRelations = relations(bandApplicationsTable, ({ one }) => ({
  band: one(bandsTable, { fields: [bandApplicationsTable.bandId], references: [bandsTable.id] }),
  user: one(users, { fields: [bandApplicationsTable.userId], references: [users.id] })
}));

export const bandsRelations = relations(bandsTable, ({ many }) => ({
  // ... existing relations
  applications: many(bandApplicationsTable)
}));
```

## Edge Cases

### Application Submission Edge Cases

1. **User applies while already a member**
   - Backend checks `bands_members` table before creating application
   - Returns 400: "You are already a member of this band"
   - UI should hide "Apply to Join" button if user is member

2. **User applies with pending application**
   - Unique constraint prevents duplicate pending applications
   - Returns 400: "You already have a pending application to this band"
   - UI should show "Application Pending" instead of "Apply to Join"

3. **User applies after being rejected in current period**
   - Backend checks for rejected application during current recruitment period
   - Returns 400: "You cannot re-apply during this recruitment period"
   - UI should show "Cannot Apply" with tooltip

4. **Band stops recruiting while user is applying**
   - User opens modal, band admin clears `lookingFor` field
   - On submit, backend checks if `lookingFor` is null/empty
   - Returns 400: "This band is not currently recruiting"
   - Recruitment period end job auto-rejects pending applications

5. **Invalid music link format**
   - Client validates URL format before submission
   - Server validates again: must be valid URL, max 500 chars
   - Returns 400: "Music link must be a valid URL"

6. **Network failure during submission**
   - Client shows error toast: "Failed to submit application. Please try again."
   - User can retry submission
   - No duplicate application due to unique constraint

7. **User deletes account with pending applications**
   - `ON DELETE CASCADE` on `user_id` foreign key
   - Applications automatically deleted

8. **Band deleted while applications pending**
   - `ON DELETE CASCADE` on `band_id` foreign key
   - Applications automatically deleted

### Application Review Edge Cases

9. **Non-admin tries to view applications**
   - Backend checks `bands_members.isAdmin` for current user
   - Returns 403: "You must be a band admin to view applications"
   - UI hides "Applications" tab from non-admins

10. **Admin accepts application for user already a member**
    - Race condition: User added manually while application pending
    - Backend checks if user is already in `bands_members`
    - If yes, just update application to 'accepted', don't duplicate member
    - Returns 200 with message: "User was already a member. Application marked as accepted."

11. **Admin accepts already-processed application**
    - Race condition: Two admins accept same application simultaneously
    - Backend checks application status before processing
    - Returns 400: "Application has already been processed"

12. **Admin rejects already-processed application**
    - Same as above
    - Returns 400: "Application has already been processed"

13. **Application disappears while admin is viewing it**
    - User deletes account or band is deleted
    - Frontend shows error toast: "This application no longer exists"
    - Remove from UI list

14. **Empty applications list**
    - Show empty state: "No pending applications"
    - Helpful message: "Applications will appear here when musicians apply"

### Recruitment Period Edge Cases

15. **Band updates lookingFor from empty to filled**
    - Triggers new recruitment period
    - Backend deletes all `status = 'rejected'` applications for this band
    - Previously rejected users can apply again
    - No notifications sent

16. **Band updates lookingFor from filled to empty**
    - Ends recruitment period
    - Backend updates all `status = 'pending'` applications to 'rejected'
    - Sets `feedback_message = "Recruitment period ended"`
    - Sends notification to each rejected applicant
    - Notifications queued via Cloudflare Queue

17. **Band updates lookingFor but keeps it filled**
    - Changes from "Drummer" to "Bass Player"
    - Does NOT end recruitment period
    - Pending applications remain pending
    - Admins can reject applications that no longer match new position

18. **Band toggles lookingFor multiple times quickly**
    - Race condition: Multiple recruitment period changes
    - Use database transaction to ensure consistency
    - Last write wins for `lookingFor` value

### Notification Edge Cases

19. **All band admins have notifications disabled**
    - Still send notifications (they appear in notifications center)
    - Future: Email fallback if in-app notifications disabled

20. **Applicant has notifications disabled**
    - Still create notification row (they'll see it when they enable)
    - No real-time delivery

21. **Notification queue fails**
    - Log error to Sentry
    - Retry with exponential backoff (Cloudflare Queue handles this)
    - If retries exhausted, notification lost (acceptable for MVP)

22. **Applicant deletes account before notification delivered**
    - Notification queue job checks if user exists
    - If not, skip notification
    - Log to monitoring

### Data Integrity Edge Cases

23. **Very long message (500+ chars)**
    - Client enforces 500 char limit with character counter
    - Server validates and truncates to 500 chars
    - Returns 400 if over limit

24. **SQL injection attempt in message**
    - Drizzle ORM uses parameterized queries
    - Safe by default

25. **XSS attempt in message**
    - Frontend sanitizes message before rendering
    - Use `DOMPurify` or React's built-in XSS protection
    - Backend stores raw text, frontend sanitizes on display

26. **Concurrent accept from multiple admins**
    - Transaction with row lock on application
    - First admin's accept succeeds
    - Second admin gets 400: "Application has already been processed"

## Validation Rules

### Client-side (Immediate Feedback)

**Application Form:**
- `message`:
  - Required: "Message is required"
  - Min length 1 char: "Message cannot be empty"
  - Max length 500 chars: Character counter + "Message is too long"
  - Show char count: "245 / 500"
- `position`:
  - Optional
  - Max length 100 chars: Character counter + "Position is too long"
  - Show char count if > 50 chars: "75 / 100"
- `musicLink`:
  - Optional
  - URL format: "Please enter a valid URL"
  - Max length 500 chars: "URL is too long"

**Reject Feedback Form:**
- `feedbackMessage`:
  - Optional
  - Max length 300 chars: Character counter + "Feedback is too long"
  - Show char count: "120 / 300"

**Real-time Validation:**
- Validate on blur and on input for char limits
- Enable/disable submit button based on validation state

### Server-side (Security)

**All client-side rules PLUS:**
- Authentication: User must be logged in
- Authorization checks:
  - For apply: User not a member, no pending application, not rejected this period, band is recruiting
  - For view applications: User is band admin
  - For accept/reject: User is band admin, application exists and is pending
- Rate limiting: Max 5 applications per user per hour (Cloudflare rate limiting)
- Input sanitization:
  - Trim whitespace from all text fields
  - Validate URL format for `musicLink`
  - Reject if contains null bytes or control characters

## Error Handling

### User-Facing Errors

**Application Submission:**

| Scenario | Error Message | Action |
|----------|---------------|--------|
| Message empty | "Message is required" | Fix message field |
| Message too long | "Message must be 500 characters or less" | Reduce message length |
| Position too long | "Position must be 100 characters or less" | Reduce position length |
| Invalid URL | "Please enter a valid URL for your music link" | Fix URL format |
| Already a member | "You are already a member of this band" | OK button, close modal |
| Pending application exists | "You already have a pending application to this band" | OK button, close modal |
| Rejected this period | "You cannot re-apply during this recruitment period. Try again when they start recruiting again." | OK button, close modal |
| Band not recruiting | "This band is not currently recruiting. Check back later!" | OK button, close modal |
| Network error | "Failed to submit application. Please check your connection and try again." | Retry button |
| Server error | "Something went wrong. Please try again later." | Retry button |

**Application Review:**

| Scenario | Error Message | Action |
|----------|---------------|--------|
| Not a band admin | "You must be a band admin to view applications" | Redirect to band profile |
| Accept fails | "Failed to accept application. Please try again." | Retry button |
| Reject fails | "Failed to reject application. Please try again." | Retry button |
| Already processed | "This application has already been processed" | Remove from list |
| Application deleted | "This application no longer exists" | Remove from list |
| Network error | "Connection error. Please try again." | Retry button |

### Developer Errors (Log to Sentry, Alert)

- Database connection failure during application submission
- Transaction rollback failure during accept
- Notification queue failure (retry exhausted)
- Foreign key constraint violation (unexpected)
- Unique constraint violation (indicates race condition)

## Performance Considerations

### Expected Load
- **Peak**: 1000 applications per hour (if viral growth)
- **Typical**: 50-100 applications per hour
- **Read-heavy**: Admins view applications more than applicants submit

### Query Optimization

**Index on `(band_id, status, created_at DESC)`:**
- Query: "Get pending applications for band, newest first"
- Used in: Applications list on band profile
- Performance: < 10ms for bands with < 1000 applications

**Index on `(user_id, status)`:**
- Query: "Check if user has pending application to band"
- Used in: Application submission validation
- Performance: < 5ms

**Index on `(status)`:**
- Query: "Get all pending applications (admin dashboard)"
- Used in: Future global admin view
- Performance: < 50ms for < 10,000 pending applications

### Caching

**Not needed for MVP:**
- Applications change frequently (pending → accepted/rejected)
- Small result set (< 50 applications per band typically)
- No expensive computations

**Future optimization:**
- Cache application count per band
- Invalidate on new application or status change

### Rate Limiting

**Application Submission:**
- 5 applications per user per hour (Cloudflare rate limiting)
- Prevents spam
- Returns 429: "Too many applications. Please try again later."

**Application Review:**
- No rate limiting (admin-only, low volume)

### Database Constraints

**Unique constraint on `(band_id, user_id, status)` WHERE `status = 'pending'`:**
- Prevents duplicate pending applications
- Minimal performance impact (uses index)

**Foreign keys with `ON DELETE CASCADE`:**
- Automatic cleanup when band or user deleted
- No orphaned applications

## Testing Checklist

### Functional Tests

**Application Submission:**
- [ ] User can apply to band with all fields filled
- [ ] User can apply with only required message field
- [ ] User cannot submit with empty message
- [ ] User cannot submit with message > 500 chars
- [ ] User cannot submit with position > 100 chars
- [ ] User cannot submit with invalid music link URL
- [ ] User cannot apply if already a member
- [ ] User cannot apply if pending application exists
- [ ] User cannot apply if rejected during current period
- [ ] User cannot apply if band not recruiting (lookingFor empty)
- [ ] Success message shows on successful submission
- [ ] "Apply to Join" button changes to "Application Pending" after submission
- [ ] Band admins receive notification on new application

**Application Review:**
- [ ] Band admin sees "Applications" tab with badge count
- [ ] Non-admin does not see "Applications" tab
- [ ] Applications list shows pending applications sorted by newest first
- [ ] Application card displays all fields correctly
- [ ] Music link opens in new tab
- [ ] Applicant profile link navigates to user profile
- [ ] Accept button adds user as band member
- [ ] Accept button updates application status to 'accepted'
- [ ] Accept button sends notification to applicant
- [ ] Accept button removes application from pending list
- [ ] Reject button opens feedback modal
- [ ] Reject button with feedback sends feedback to applicant
- [ ] Reject button without feedback sends generic rejection
- [ ] Reject button updates application status to 'rejected'
- [ ] Reject button removes application from pending list
- [ ] Empty state shows when no pending applications

**Recruitment Period:**
- [ ] Setting lookingFor to non-empty starts recruitment period
- [ ] Setting lookingFor to empty ends recruitment period
- [ ] Ending recruitment period auto-rejects pending applications
- [ ] Ending recruitment period sends notifications to applicants
- [ ] Starting new period deletes old rejected applications
- [ ] Previously rejected users can apply again in new period

### Edge Case Tests

- [ ] User applies while band is deleted → 404 error
- [ ] User applies while being added as member → duplicate prevention
- [ ] Two admins accept same application → second gets error
- [ ] Admin accepts application for deleted user → error
- [ ] Band deleted while applications pending → applications deleted (cascade)
- [ ] User deleted while applications pending → applications deleted (cascade)
- [ ] Network failure during submission → error message, retry works
- [ ] Network failure during accept → error message, retry works
- [ ] Very long message (500 chars) → submits successfully
- [ ] Message with special characters (emoji, etc.) → stores and displays correctly
- [ ] XSS attempt in message → sanitized on display

### Non-Functional Tests

**Performance:**
- [ ] Application submission completes in < 500ms
- [ ] Applications list loads in < 200ms (for 50 applications)
- [ ] Accept/reject actions complete in < 300ms
- [ ] Query with index on 1000 applications completes in < 10ms

**Mobile Responsiveness:**
- [ ] Application form modal is usable on mobile (320px width)
- [ ] Application cards stack vertically on mobile
- [ ] Buttons are thumb-sized (min 44px height)
- [ ] Text is readable (min 16px font size)

**Accessibility:**
- [ ] Form fields have labels and ARIA attributes
- [ ] Error messages announced to screen readers
- [ ] Buttons have focus states
- [ ] Modal can be closed with ESC key
- [ ] Tab navigation works correctly
- [ ] Color contrast meets WCAG 2.1 AA (4.5:1 for text)

## Security Considerations

### Authentication & Authorization

- [x] **Authentication required**: All endpoints require authenticated user
- [x] **Admin-only access**: Applications list, accept, reject only accessible to band admins
- [x] **User validation**: Cannot apply as another user (user ID from session, not request)
- [x] **Band ownership check**: Admin check queries `bands_members.isAdmin` for current user

### Input Validation & Sanitization

- [x] **Input sanitization**: Trim whitespace, reject control characters
- [x] **XSS prevention**: Sanitize message before rendering (React's built-in + DOMPurify)
- [x] **SQL injection prevention**: Drizzle ORM uses parameterized queries
- [x] **URL validation**: Validate music link is valid URL format
- [x] **Length limits**: Enforce max lengths (message 500, position 100, music link 500)

### Rate Limiting

- [x] **Application submission**: Max 5 per user per hour (Cloudflare rate limiting)
- [x] **Prevent spam**: Unique constraint prevents duplicate pending applications
- [x] **Rejection blocking**: Rejected users cannot re-apply during same recruitment period

### Data Privacy

- [ ] **Sensitive data**: Application messages stored as plain text (no PII expected)
- [ ] **Admin-only access**: Only band admins can view applications (not public)
- [ ] **Notification privacy**: Notifications only sent to relevant parties (admins, applicant)

### Database Security

- [x] **Foreign key constraints**: Cascade delete prevents orphaned records
- [x] **Unique constraints**: Prevent duplicate data
- [x] **Transactions**: Accept action uses transaction (add member + update application)
- [x] **Row locking**: Prevent concurrent accepts of same application

## Rollout Plan

### Phase 1: MVP (Week 1-2)

**Build:**
- [ ] Database migration: Create `band_applications` table
- [ ] Shared types: Zod schemas in `packages/common`
- [ ] Backend API: 4 endpoints (submit, list, accept, reject)
- [ ] Frontend components: ApplyToBandModal, BandApplicationsTab, BandApplicationCard, RejectApplicationModal
- [ ] Notification integration: Queue jobs for new application, acceptance, rejection
- [ ] Recruitment period lifecycle: Auto-reject on period end, clear old rejections on new period

**Ship to:**
- [ ] 10% of bands (those with "looking for" section filled)

**Monitor:**
- [ ] Application submission rate (target: 10+ per day)
- [ ] Application review rate (target: 80% reviewed within 7 days)
- [ ] Error rate (target: < 1%)
- [ ] API response times (target: < 500ms p95)

**Success Criteria:**
- [ ] 50+ applications submitted in first week
- [ ] 70%+ applications reviewed within 7 days
- [ ] No critical bugs reported
- [ ] P95 response time < 500ms

### Phase 2: Iterate (Week 3-4)

**Based on feedback, add:**
- [ ] "My Applications" page (user can see all their applications)
- [ ] Application filtering/sorting for admins (by position, date)
- [ ] Application count on band profile (visible to public)
- [ ] Email notifications (in addition to in-app)

**Ship to:**
- [ ] 100% of users

**Monitor:**
- [ ] Engagement: % of users who apply to bands
- [ ] Conversion: % of applications that result in membership
- [ ] Satisfaction: Survey band admins on usefulness

### Phase 3: Polish (Week 5-6)

**Improvements:**
- [ ] Bulk actions (accept/reject multiple)
- [ ] Shortlist feature (admins can mark favorites)
- [ ] Application templates (bands can add custom questions)
- [ ] Application analytics (view count, response rate)

**Ship to:**
- [ ] All users

## Metrics to Track

### Key Metrics

| Metric | Definition | Target | How to Measure |
|--------|------------|--------|----------------|
| Application Submission Rate | Applications submitted per day | 50+ per day | Count rows in `band_applications` with `created_at` in last 24 hours |
| Application Review Rate | % of applications reviewed within 7 days | 80% | Count applications with `status != 'pending'` and `(updatedAt - createdAt) < 7 days` |
| Application Acceptance Rate | % of applications accepted | 30-50% | Count `status = 'accepted'` / total applications |
| Time to Review | Median time from submit to accept/reject | < 3 days | Median `(updatedAt - createdAt)` for non-pending applications |
| Re-application Rate | % of rejected users who re-apply in new period | 20%+ | Count users with multiple applications (different recruitment periods) |
| Error Rate | % of API requests that fail | < 1% | Sentry error count / total requests |
| API Response Time | P95 response time for all endpoints | < 500ms | Cloudflare Analytics |

### User Behavior Metrics

| Metric | Definition | How to Measure |
|--------|------------|----------------|
| Apply Button Click Rate | % of band profile views that click "Apply to Join" | Track click event / band profile views |
| Application Completion Rate | % of opened modals that result in submission | Track modal open vs submit events |
| Music Link Inclusion Rate | % of applications that include music link | Count applications with `music_link IS NOT NULL` |
| Feedback Inclusion Rate | % of rejections that include feedback | Count rejections with `feedback_message IS NOT NULL` |
| Application View Rate | % of applications viewed by admins before decision | Future: Track view event before accept/reject |

## Open Questions

### Product Decisions (User to Decide)

1. **Should we allow applicants to withdraw their application?**
   - **Pros**: User control, reduces clutter for admins
   - **Cons**: Adds complexity, rare use case
   - **Recommendation**: Defer to Phase 2

2. **Should we show application count publicly on band profiles?**
   - **Example**: "12 musicians have applied"
   - **Pros**: Social proof, shows band is active
   - **Cons**: May discourage applications if count is high, privacy concern
   - **Recommendation**: Ask user

3. **Should we notify all admins or just one designated admin?**
   - **Current**: All admins receive notification
   - **Alternative**: Only band creator or designated "hiring manager"
   - **Recommendation**: Keep current approach (all admins)

4. **Should rejected applicants see the reason they were rejected?**
   - **Current**: Yes, if admin provides feedback
   - **Alternative**: Always show generic message, hide specific feedback
   - **Recommendation**: Keep current (optional feedback visible to applicant)

5. **Should we send email notifications or just in-app?**
   - **Current**: In-app only
   - **Phase 2**: Add email notifications
   - **Recommendation**: In-app for MVP, email in Phase 2

### Technical Decisions (Implementation to Decide)

6. **How to handle recruitment period detection?**
   - **Option A**: Trigger function on band update (check if `lookingFor` changed)
   - **Option B**: Cron job checks daily for period changes
   - **Recommendation**: Option A (immediate, simpler)

7. **Should we soft-delete rejected applications or hard-delete?**
   - **Option A**: Keep all applications forever (status = 'rejected')
   - **Option B**: Delete rejected applications when new recruitment period starts
   - **Current implementation**: Option B (delete old rejections)
   - **Recommendation**: Option B (keeps database clean, rejected users can re-apply)

8. **How to handle concurrent accepts from multiple admins?**
   - **Option A**: Use row-level locking in transaction
   - **Option B**: Check application status before processing, return error if already processed
   - **Recommendation**: Option B (simpler, error case is rare)

## Dependencies

**Requires:**
- [ ] Notifications system fully functional (Cloudflare Queue, Durable Objects)
- [ ] Band profile pages showing "Looking for" section
- [ ] User profiles with music information

**Blocks:**
- None - This is a standalone feature

**Integrates with:**
- [ ] Notifications system (sends notifications via queue)
- [ ] Band member management (accept action adds member)
- [ ] User profiles (links to applicant profile)

---

## Implementation Summary

**Estimated Effort:** 8-10 days

**Breakdown:**
- Database migration & shared types: 1 day
- Backend API (4 endpoints + recruitment period logic): 3 days
- Frontend components (4 components + integration): 3 days
- Notification integration: 1 day
- Testing & bug fixes: 2 days

**Priority:** High (fills critical gap in band recruitment workflow)

**Owner:** To be assigned

**Dependencies:** Notifications system must be operational
