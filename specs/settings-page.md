# Feature: Settings Page

## Problem Statement

Sound Connect currently has an empty placeholder settings page. Users need a comprehensive settings interface to manage their account, privacy, notification preferences, and control their experience on the platform. Without proper settings, users cannot:
- Control who can see their profile and contact them
- Manage notification preferences (especially email notifications)
- Update account credentials (email, password)
- Exercise their data rights (export data, delete account)
- Block or mute other users
- Control their visibility in search results

This lack of control creates privacy concerns, notification fatigue, and limits user agency over their account and data.

**Who has this problem?** All musicians on the platform, especially:
- Privacy-conscious users who want to control their visibility
- Users receiving unwanted messages or contact
- Users overwhelmed by notifications
- Users who want to update their credentials or leave the platform

## Success Criteria

**The feature is successful when:**
1. Users can access and navigate the settings page easily
2. Users can update their email address and password
3. Users can control who sees their profile (public, followers only, private)
4. Users can control who can message them and follow them
5. Users can block and unblock users
6. Users can toggle their visibility in musician search results
7. Users can configure email notification preferences for all notification types
8. Users can export their data in a machine-readable format (JSON)
9. Users can delete their account with proper confirmation
10. All settings changes persist and take effect immediately
11. Privacy settings are enforced across the platform (search, profiles, messaging)
12. Email notifications respect user preferences

## User Stories

### Account Management
- As a user, I want to update my email address so that I receive notifications at my current email
- As a user, I want to change my password so that I can maintain account security
- As a user, I want to see when my account was created and last updated for audit purposes

### Privacy Controls
- As a user, I want to set my profile visibility (public, followers only, private) so that I control who can see my information
- As a user, I want to hide my profile from search results so that I'm not discoverable by strangers
- As a user, I want to control who can follow me (anyone, followers I approve, no one) so that I manage my network
- As a user, I want to control who can message me (anyone, followers only, no one) so that I avoid unwanted contact
- As a user, I want to block users who are harassing me so that they cannot see my content or contact me
- As a user, I want to view and manage my blocked users list so that I can unblock if needed

### Notification Preferences
- As a user, I want to enable/disable email notifications globally so that I can reduce inbox clutter
- As a user, I want to configure which notification types trigger emails (follows, comments, reactions, mentions, band applications) so that I only receive important alerts
- As a user, I want in-app notifications to remain unaffected by email settings so that I still see activity in the app

### Data Rights (GDPR Compliance)
- As a user, I want to export all my data (profile, posts, comments, messages) so that I can keep a copy or migrate elsewhere
- As a user, I want to delete my account and all associated data so that I can leave the platform
- As a user, I want clear warnings about the consequences of account deletion so that I don't lose data accidentally

## Scope

### In Scope (MVP)

**Account Settings:**
- Update email address (with verification)
- Change password
- View account creation date and last active date

**Privacy Settings:**
- Profile visibility control (public, followers only, private)
- Search visibility toggle (appear in musician search: yes/no)
- Who can follow me (anyone, approval required, no one)
- Who can message me (anyone, followers only, no one)
- Block/unblock users
- View blocked users list

**Notification Preferences:**
- Enable/disable email notifications globally
- Granular email notification controls per type:
  - Follow requests/accepted
  - Comments on my posts
  - Reactions to my posts/comments
  - Mentions in posts/comments
  - Band applications (for band admins)
  - Band application responses (accepted/rejected)
- Note: In-app notifications always enabled

**Data & Account:**
- Export data (JSON format with all user data)
- Delete account (with confirmation and password re-entry)

**UI/UX:**
- Tabbed interface for organizing settings sections
- Inline validation for form fields
- Clear success/error feedback
- Confirmation modals for destructive actions
- Loading states during save operations

### Out of Scope (Future)

**Phase 2:**
- Mute users/bands (hide their content without blocking)
- Report users/content (moderation system)
- Two-factor authentication (2FA)
- Push notification preferences (requires mobile app)
- Connected accounts (OAuth providers)
- Session management (view active sessions, log out devices)
- Custom notification schedules (quiet hours)
- Email digest preferences (daily/weekly summaries)

**Phase 3:**
- Dark mode preference (frontend-only, deferred)
- Language preferences (i18n)
- Accessibility settings (text size, contrast)
- Data portability (export to other platforms)
- Account suspension (temporary disable)

## User Flow

### Settings Page Access
1. User clicks "Settings" in navigation menu
2. User lands on `/settings` page, "Account" tab selected by default
3. User sees tabbed interface: Account | Privacy | Notifications | Data & Account

### Account Settings Flow
1. User navigates to "Account" tab (default)
2. User sees current email, password change fields, account info
3. **Update Email:**
   - User enters new email
   - User clicks "Save Email"
   - System sends verification email to new address
   - System shows "Verification email sent" message
   - User verifies email via link
   - Email updated, user sees success message
4. **Change Password:**
   - User enters current password
   - User enters new password (twice for confirmation)
   - User clicks "Change Password"
   - System validates passwords match and meet requirements
   - Password updated, user sees success message

### Privacy Settings Flow
1. User navigates to "Privacy" tab
2. User sees sections: Profile Visibility, Search & Discovery, Messaging & Following, Blocked Users
3. **Profile Visibility:**
   - User selects radio option: Public / Followers Only / Private
   - System saves automatically (or explicit "Save" button)
   - System shows success feedback
4. **Search Visibility:**
   - User toggles "Appear in musician search results"
   - System saves toggle state
5. **Messaging & Following:**
   - User selects "Who can message me": Anyone / Followers Only / No One
   - User selects "Who can follow me": Anyone / Approval Required / No One
   - System saves selections
6. **Blocked Users:**
   - User sees list of blocked users (name, profile image, date blocked)
   - User clicks "Unblock" on a user
   - System shows confirmation modal
   - User confirms, user unblocked
   - Empty state: "You haven't blocked anyone"

### Notification Preferences Flow
1. User navigates to "Notifications" tab
2. User sees global toggle: "Enable email notifications"
3. **Disable All:**
   - User toggles off "Enable email notifications"
   - All granular options disabled (grayed out)
   - System saves preference
4. **Enable Granular:**
   - User toggles on "Enable email notifications"
   - User sees checkboxes for each notification type:
     - [ ] Follow requests and acceptances
     - [ ] Comments on my posts
     - [ ] Reactions to my content
     - [ ] Mentions in posts or comments
     - [ ] Band applications received (if band admin)
     - [ ] Band application responses
   - User checks/unchecks notification types
   - System saves preferences
5. User sees note: "In-app notifications are always enabled"

### Data & Account Flow
1. User navigates to "Data & Account" tab
2. User sees sections: Export Data, Delete Account
3. **Export Data:**
   - User sees explanation: "Download all your data including profile, posts, comments, messages, and bands"
   - User clicks "Export My Data"
   - System generates export (may take a few seconds)
   - System provides download link for JSON file
   - User downloads file
4. **Delete Account:**
   - User sees warning: "This action is permanent and cannot be undone"
   - User clicks "Delete My Account"
   - System shows confirmation modal with:
     - "Are you sure?" message
     - List of what will be deleted
     - Password re-entry field
     - "Cancel" and "Delete Account" buttons
   - User enters password and confirms
   - System validates password
   - System deletes account and all data
   - User logged out and redirected to homepage

### Block User Flow (from profile)
1. User views another user's profile
2. User clicks "Block User" button (in dropdown menu)
3. System shows confirmation modal
4. User confirms block
5. System blocks user:
   - Blocked user cannot see user's profile
   - Blocked user cannot message user
   - Blocked user's content hidden from user's feed
   - User cannot see blocked user's content
6. User sees success message
7. User can unblock from Settings > Privacy > Blocked Users

## UI Requirements

### Components Needed

**SettingsLayout:**
- Tabbed navigation (Account, Privacy, Notifications, Data & Account)
- Responsive layout (sidebar tabs on desktop, dropdown on mobile)
- Active tab indicator
- Main content area for tab content

**AccountSettings:**
- Email update form with validation
- Password change form (current, new, confirm)
- Read-only account info display (created date, last active)
- Success/error toast notifications

**PrivacySettings:**
- Radio group for profile visibility
- Toggle for search visibility
- Select/radio for message permissions
- Select/radio for follow permissions
- Blocked users list with unblock action
- Section headings and descriptions

**NotificationSettings:**
- Global email toggle with description
- Checkbox group for notification types (disabled when global off)
- Section for future push notifications (grayed out)
- Help text explaining in-app notifications always on

**DataAccountSettings:**
- Export data section with button and description
- Delete account section with danger styling
- Confirmation modal for account deletion
- Password input field in delete modal

**BlockedUserCard:**
- User avatar, name, date blocked
- "Unblock" button
- Empty state component

**ConfirmationModal:**
- Reusable modal for destructive actions
- Custom title, message, action button text
- Password input (optional)
- Loading state during action

### States

**Loading State:**
- Show skeleton loaders for settings sections while fetching
- Disable form inputs during save operations
- Show spinner on action buttons (Save, Export, Delete)

**Empty State:**
- Blocked users: "You haven't blocked anyone"
- Message: "No blocked users to display"

**Error State:**
- Form validation errors inline below fields
- Toast notification for save errors
- Modal error message for failed actions (e.g., wrong password)

**Success State:**
- Toast notification for successful saves
- Inline success message for email verification sent
- Confirmation message after export download
- Redirect after account deletion

**Disabled State:**
- Granular notification checkboxes when global toggle is off
- Form inputs during save operations
- Delete button until password entered

### Interactions

**Tab Navigation:**
- User clicks tab → Tab content loads, URL updates to `/settings?tab=privacy`
- User refreshes page → Correct tab selected based on URL param

**Auto-save vs Explicit Save:**
- **Auto-save:** Toggles, radio buttons, checkboxes (instant feedback)
- **Explicit save:** Email, password forms (validation required)

**Form Validation:**
- Email: Valid email format, not already in use
- Password: Min 8 characters, includes number, uppercase, lowercase
- Current password: Must match existing password
- Confirm password: Must match new password
- Inline validation as user types (debounced)
- Disable submit until valid

**Block/Unblock:**
- Block user → Confirmation modal → Block → Success toast
- Unblock user → Confirmation modal → Unblock → Success toast

**Export Data:**
- Click "Export" → Loading spinner → Download link appears → User downloads

**Delete Account:**
- Click "Delete" → Modal opens → User enters password → Loading → Account deleted → Logout → Redirect

## API Requirements

### Endpoints Needed

#### `PATCH /api/users/me/email`
**Purpose:** Update user's email address
**Auth:** Required
**Request:**
```json
{
  "email": "newemail@example.com"
}
```
**Response:**
```json
{
  "message": "Verification email sent to newemail@example.com"
}
```
**Validation:**
- Email: required, valid email format
- Email not already in use by another user
**Errors:**
- 400: Invalid email format
- 409: Email already in use
- 401: Not authenticated
- 500: Server error (email send failure)
**Side Effects:**
- Sends verification email to new address
- Creates verification token in database
- Email not updated until verified

---

#### `PATCH /api/users/me/password`
**Purpose:** Change user's password
**Auth:** Required
**Request:**
```json
{
  "currentPassword": "oldpass123",
  "newPassword": "newpass123"
}
```
**Response:**
```json
{
  "message": "Password updated successfully"
}
```
**Validation:**
- Current password: required, must match existing
- New password: required, min 8 chars, includes number, uppercase, lowercase
**Errors:**
- 400: Invalid password format or current password incorrect
- 401: Not authenticated
- 500: Server error
**Side Effects:**
- Updates password hash in accounts table
- Invalidates all other sessions (optional security measure)

---

#### `GET /api/users/me/settings/privacy`
**Purpose:** Get user's privacy settings
**Auth:** Required
**Request:** None (GET request)
**Response:**
```json
{
  "profileVisibility": "public" | "followers_only" | "private",
  "searchVisibility": true,
  "messagingPermission": "anyone" | "followers" | "none",
  "followPermission": "anyone" | "approval" | "none"
}
```
**Errors:**
- 401: Not authenticated
- 500: Server error

---

#### `PATCH /api/users/me/settings/privacy`
**Purpose:** Update user's privacy settings
**Auth:** Required
**Request:**
```json
{
  "profileVisibility": "followers_only",
  "searchVisibility": false,
  "messagingPermission": "followers",
  "followPermission": "approval"
}
```
**Response:**
```json
{
  "message": "Privacy settings updated",
  "settings": {
    "profileVisibility": "followers_only",
    "searchVisibility": false,
    "messagingPermission": "followers",
    "followPermission": "approval"
  }
}
```
**Validation:**
- profileVisibility: one of "public", "followers_only", "private"
- searchVisibility: boolean
- messagingPermission: one of "anyone", "followers", "none"
- followPermission: one of "anyone", "approval", "none"
**Errors:**
- 400: Invalid field values
- 401: Not authenticated
- 500: Server error
**Side Effects:**
- Privacy enforced across platform immediately
- If searchVisibility = false, user excluded from musician search results
- If profileVisibility = private, only user can see full profile

---

#### `GET /api/users/me/settings/notifications`
**Purpose:** Get user's notification preferences
**Auth:** Required
**Response:**
```json
{
  "emailEnabled": true,
  "followNotifications": true,
  "commentNotifications": true,
  "reactionNotifications": false,
  "mentionNotifications": true,
  "bandApplicationNotifications": true,
  "bandResponseNotifications": true
}
```
**Errors:**
- 401: Not authenticated
- 500: Server error

---

#### `PATCH /api/users/me/settings/notifications`
**Purpose:** Update user's notification preferences
**Auth:** Required
**Request:**
```json
{
  "emailEnabled": false,
  "followNotifications": true,
  "commentNotifications": true,
  "reactionNotifications": false,
  "mentionNotifications": true,
  "bandApplicationNotifications": true,
  "bandResponseNotifications": true
}
```
**Response:**
```json
{
  "message": "Notification preferences updated",
  "settings": { ... }
}
```
**Validation:**
- All fields: boolean
**Errors:**
- 400: Invalid field values
- 401: Not authenticated
- 500: Server error
**Side Effects:**
- Notification queue consumer checks preferences before sending emails
- In-app notifications unaffected

---

#### `GET /api/users/me/blocked`
**Purpose:** Get list of blocked users
**Auth:** Required
**Response:**
```json
{
  "blockedUsers": [
    {
      "id": "user123",
      "name": "John Doe",
      "image": "https://...",
      "blockedAt": "2025-11-10T12:00:00Z"
    }
  ]
}
```
**Errors:**
- 401: Not authenticated
- 500: Server error

---

#### `POST /api/users/:userId/block`
**Purpose:** Block a user
**Auth:** Required
**Request:** None (POST with no body)
**Response:**
```json
{
  "message": "User blocked successfully"
}
```
**Validation:**
- Cannot block yourself
- User must exist
**Errors:**
- 400: Cannot block yourself or invalid user
- 404: User not found
- 401: Not authenticated
- 500: Server error
**Side Effects:**
- Creates entry in blocked_users table
- Blocked user cannot see blocker's profile
- Blocked user cannot message blocker
- Blocker does not see blocked user's content in feed

---

#### `DELETE /api/users/:userId/block`
**Purpose:** Unblock a user
**Auth:** Required
**Request:** None (DELETE request)
**Response:**
```json
{
  "message": "User unblocked successfully"
}
```
**Errors:**
- 404: User not blocked or doesn't exist
- 401: Not authenticated
- 500: Server error
**Side Effects:**
- Removes entry from blocked_users table
- Blocked user can now interact normally

---

#### `POST /api/users/me/export`
**Purpose:** Export all user data
**Auth:** Required
**Request:** None (POST with no body)
**Response:**
```json
{
  "downloadUrl": "https://sound-connect-assets.r2.dev/exports/user123-2025-11-10.json",
  "expiresAt": "2025-11-11T12:00:00Z"
}
```
**Errors:**
- 401: Not authenticated
- 500: Server error
**Side Effects:**
- Generates JSON export of all user data:
  - Profile information
  - Posts and comments
  - Messages (sent/received)
  - Band memberships
  - Followers/following
  - Notifications
- Uploads export to R2 bucket (temp/ folder)
- Returns presigned URL valid for 24 hours
**Format:**
```json
{
  "user": { ... },
  "profile": { ... },
  "posts": [ ... ],
  "comments": [ ... ],
  "messages": [ ... ],
  "bands": [ ... ],
  "exportedAt": "2025-11-10T12:00:00Z"
}
```

---

#### `DELETE /api/users/me`
**Purpose:** Delete user account and all associated data
**Auth:** Required
**Request:**
```json
{
  "password": "userpassword123"
}
```
**Response:**
```json
{
  "message": "Account deleted successfully"
}
```
**Validation:**
- Password: required, must match current password
**Errors:**
- 400: Incorrect password
- 401: Not authenticated
- 500: Server error
**Side Effects:**
- Deletes user account and cascades to:
  - User profile
  - Posts (soft delete: mark as deleted, or hard delete)
  - Comments (soft delete or cascade)
  - Messages (cascade delete)
  - Notifications (cascade)
  - Band memberships (remove user from bands)
  - Followers/following relationships (cascade)
  - Sessions (cascade)
  - Upload sessions (cascade)
- If user is last admin of a band, prevent deletion (or transfer ownership)
- Logs out user
- Invalidates all sessions

## Database Changes

### New Tables

#### `user_settings`
Stores user privacy and notification preferences

```sql
CREATE TABLE user_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

  -- Privacy settings
  profile_visibility TEXT NOT NULL DEFAULT 'public' CHECK(profile_visibility IN ('public', 'followers_only', 'private')),
  search_visibility INTEGER NOT NULL DEFAULT 1, -- boolean: 1 = visible in search, 0 = hidden
  messaging_permission TEXT NOT NULL DEFAULT 'anyone' CHECK(messaging_permission IN ('anyone', 'followers', 'none')),
  follow_permission TEXT NOT NULL DEFAULT 'anyone' CHECK(follow_permission IN ('anyone', 'approval', 'none')),

  -- Notification settings
  email_enabled INTEGER NOT NULL DEFAULT 1, -- boolean: global email toggle
  follow_notifications INTEGER NOT NULL DEFAULT 1, -- boolean
  comment_notifications INTEGER NOT NULL DEFAULT 1,
  reaction_notifications INTEGER NOT NULL DEFAULT 1,
  mention_notifications INTEGER NOT NULL DEFAULT 1,
  band_application_notifications INTEGER NOT NULL DEFAULT 1,
  band_response_notifications INTEGER NOT NULL DEFAULT 1,

  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX idx_user_settings_search_visibility ON user_settings(search_visibility);
CREATE INDEX idx_user_settings_profile_visibility ON user_settings(profile_visibility);
```

#### `blocked_users`
Stores user blocking relationships

```sql
CREATE TABLE blocked_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  blocker_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_at TEXT NOT NULL,

  UNIQUE(blocker_id, blocked_id)
);

CREATE INDEX idx_blocked_users_blocker ON blocked_users(blocker_id);
CREATE INDEX idx_blocked_users_blocked ON blocked_users(blocked_id);
```

### Modified Tables

**No existing tables need modification.** All new functionality is added via new tables.

### Indexes Needed

**Existing in schema above:**
- `idx_user_settings_user_id` - Fast lookup of settings by user
- `idx_user_settings_search_visibility` - Filter users in search by visibility
- `idx_user_settings_profile_visibility` - Enforce profile visibility checks
- `idx_blocked_users_blocker` - Get all users blocked by a user
- `idx_blocked_users_blocked` - Check if a user is blocked

### Default Settings

When a user signs up, create default settings:
```sql
INSERT INTO user_settings (user_id, created_at, updated_at) VALUES (?, datetime('now'), datetime('now'));
```
All columns have DEFAULT values, so omitting them uses safe defaults.

## Edge Cases

### Account Settings

**Email update edge cases:**
1. User enters email already in use → Show error "Email already registered"
2. User enters invalid email format → Show error "Invalid email address"
3. Verification email not received → Provide "Resend verification" button
4. User verifies email after it expired → Show error, allow re-request
5. User changes email multiple times before verifying → Only latest verification is valid

**Password change edge cases:**
1. User enters wrong current password → Show error "Current password incorrect"
2. New password doesn't meet requirements → Show inline validation errors
3. New password same as current → Allow (no restriction)
4. User forgets current password → Provide "Forgot password?" link

### Privacy Settings

**Profile visibility edge cases:**
1. User sets profile to "private" → Profile page shows "This profile is private" to others
2. User sets profile to "followers_only" → Non-followers see limited info
3. User is "private" but has public posts → Posts remain visible in feed (user choice)
4. User sets search visibility to false → User still appears in "followers" and "following" lists
5. User blocks someone, then changes to "public" → Blocked user still cannot see profile

**Messaging/following edge cases:**
1. User sets messaging to "none" → Existing conversations remain, but cannot send new messages
2. User sets follow to "approval" → New follows become "pending" requests
3. User sets follow to "none" → New follow attempts show "User is not accepting followers"
4. User changes from "approval" to "anyone" → All pending requests auto-approved

**Block/unblock edge cases:**
1. User blocks someone in a conversation → Conversation hidden from both sides
2. User blocks a band admin who invited them → Invitation revoked
3. User blocks someone who follows them → Follow relationship removed
4. User blocks then unblocks → Previous interactions (follows, messages) not restored
5. User tries to block themselves → Prevented by validation
6. User blocks someone who already blocked them → Both blocks active (independent)

### Notification Preferences

**Email notification edge cases:**
1. User disables email globally → All granular settings ignored
2. User re-enables email → Previous granular settings restored
3. User has no email verified → Email notifications disabled automatically
4. User changes email → Notifications sent to new email after verification
5. Email delivery fails (bounced) → System logs failure, marks email as undeliverable

**Notification type edge cases:**
1. Band admin disables "band application" emails → Still sees in-app notifications
2. User disables all notifications but re-enables one → Only that one sends emails
3. User receives notification before disabling type → Already-sent notifications remain

### Data & Account

**Export data edge cases:**
1. User has no data (new account) → Export contains empty arrays
2. User has large dataset (1000+ posts) → Export may take several seconds, show loading
3. Export download link expires → User must re-request export
4. User exports, then deletes content → Export contains data at time of export (stale)

**Delete account edge cases:**
1. User is last admin of a band → Prevent deletion, show error "Transfer band ownership first"
2. User enters wrong password → Show error "Incorrect password"
3. User is mid-conversation → Messages deleted, conversations removed
4. User deletes account, then tries to sign up with same email → Allowed (email freed up)
5. User clicks delete accidentally → Confirmation modal prevents accidental deletion
6. Deletion fails mid-process → Rollback transaction, account remains intact
7. User has pending band applications → Applications deleted (applicants notified?)

### Privacy Enforcement

**When user is blocked:**
1. Blocked user tries to view blocker's profile → 403 Forbidden or "Profile not found"
2. Blocked user tries to message blocker → Error "Cannot send message"
3. Blocked user's posts do not appear in blocker's feed
4. Blocker's posts do not appear in blocked user's feed
5. Blocked user cannot see blocker in search results
6. Blocked user cannot follow blocker

**When profile is private:**
1. Non-follower visits profile → See limited info (name, image, "This profile is private")
2. Non-follower tries to message → Blocked by messaging_permission check
3. Private user's posts still visible in feed (user's choice to post publicly)

**When search visibility is off:**
1. User excluded from `/musicians` search results
2. User still appears in followers/following lists
3. User's profile still accessible via direct URL (if public/followers_only)

## Validation Rules

### Client-side (immediate feedback)

**Email:**
- Required
- Valid email format (regex)
- Max 255 characters

**Password:**
- Current password: required (min 8 chars for UI consistency)
- New password: required, min 8 chars, max 100 chars
- Must include: uppercase, lowercase, number
- Confirm password: must match new password

**Privacy Settings:**
- profileVisibility: one of ["public", "followers_only", "private"]
- searchVisibility: boolean
- messagingPermission: one of ["anyone", "followers", "none"]
- followPermission: one of ["anyone", "approval", "none"]

**Notification Settings:**
- All fields: boolean

**Account Deletion:**
- Password: required

### Server-side (security)

**All client-side validations PLUS:**

**Email:**
- Email not already in use (DB query)
- User is authenticated (auth check)

**Password:**
- Current password matches hash in DB
- New password hashed before storage

**Privacy Settings:**
- Enum validation (strict check)
- User authenticated

**Block/Unblock:**
- Cannot block self
- User exists
- Not already blocked (for block action)
- Is blocked (for unblock action)

**Delete Account:**
- Password matches DB
- User is not last admin of any bands (prevent deletion)

## Error Handling

### User-Facing Errors

**Email Update:**
- "Invalid email address" → Fix input, try again
- "Email already in use" → Use different email
- "Failed to send verification email" → Retry, or contact support

**Password Change:**
- "Current password incorrect" → Re-enter correct password
- "New password does not meet requirements" → Fix password (show requirements)
- "Passwords do not match" → Re-enter confirm password

**Privacy Settings:**
- "Failed to save settings" → Retry, or reload page

**Block/Unblock:**
- "Cannot block yourself" → Prevented by UI (shouldn't occur)
- "User not found" → Refresh page
- "Failed to block user" → Retry

**Export Data:**
- "Failed to generate export" → Retry, or contact support
- "Download link expired" → Re-request export

**Delete Account:**
- "Incorrect password" → Re-enter password
- "Cannot delete account: You are the last admin of [Band Name]" → Transfer ownership or delete band first
- "Failed to delete account" → Contact support

### Developer Errors (log, alert)

**Database errors:**
- Foreign key constraint violation (shouldn't happen with proper validation)
- Unique constraint violation (email already in use)

**Email service errors:**
- SMTP connection failure
- Email rate limit exceeded
- Invalid recipient address (bounced email)

**R2 errors:**
- Upload failure (export generation)
- Presigned URL generation failure

**Transaction errors:**
- Account deletion rollback (partial failure)

**All logged with:**
- Error message
- User ID
- Endpoint
- Timestamp
- Stack trace

## Performance Considerations

**Expected Load:**
- Settings page access: Low (< 5% of users daily)
- Email notification checks: High (every notification, thousands/day)
- Block checks: Medium (every profile view, message attempt)

**Query Optimization:**

**Email notifications (high volume):**
- Index on `user_settings.email_enabled` and notification type columns
- Cache notification settings in memory (Redis) for active users
- TTL: 5 minutes

**Block checks (medium volume):**
- Index on `blocked_users.blocker_id` and `blocked_users.blocked_id`
- Cache blocked user IDs per user (Redis)
- TTL: 10 minutes
- Invalidate cache on block/unblock

**Privacy checks (high volume):**
- Index on `user_settings.profile_visibility` and `search_visibility`
- Cache privacy settings per user (Redis)
- TTL: 5 minutes

**Settings page load (low volume):**
- Single query to fetch all settings: `SELECT * FROM user_settings WHERE user_id = ?`
- No caching needed (low traffic)

**Export data (rare):**
- Async job: Queue export generation
- Notify user when ready (email or in-app notification)
- Store export in R2 temp/ folder (24hr lifecycle)

**Rate Limiting:**
- Email update: Max 3 attempts per hour (prevent abuse)
- Password change: Max 5 attempts per hour
- Export data: Max 1 per day per user
- Delete account: Max 3 attempts per hour (wrong password)

## Testing Checklist

### Functional Tests

**Account Settings:**
- [ ] User can update email address
- [ ] Verification email sent on email update
- [ ] Email updated after verification link clicked
- [ ] User can change password successfully
- [ ] Password change requires correct current password
- [ ] Account creation date displays correctly
- [ ] Last active date displays correctly

**Privacy Settings:**
- [ ] User can set profile visibility (public, followers only, private)
- [ ] User can toggle search visibility
- [ ] User can set messaging permissions
- [ ] User can set follow permissions
- [ ] Settings save successfully
- [ ] Settings persist after page reload

**Notification Settings:**
- [ ] User can toggle global email notifications
- [ ] Granular settings disabled when global off
- [ ] User can toggle individual notification types
- [ ] Settings save successfully
- [ ] Notification preferences respected by email sender

**Block/Unblock:**
- [ ] User can block another user
- [ ] Blocked user cannot view blocker's profile
- [ ] Blocked user cannot message blocker
- [ ] User can unblock a blocked user
- [ ] Blocked users list displays correctly
- [ ] Empty state shows when no blocked users

**Data Export:**
- [ ] User can request data export
- [ ] Export generates all user data in JSON format
- [ ] Download link works
- [ ] Export includes: profile, posts, comments, messages, bands

**Account Deletion:**
- [ ] User can delete account with correct password
- [ ] Incorrect password prevents deletion
- [ ] Confirmation modal displays
- [ ] Account and all data deleted after confirmation
- [ ] User logged out after deletion
- [ ] Last admin of band cannot delete account

### Edge Case Tests

**Account Settings:**
- [ ] Email already in use shows error
- [ ] Invalid email format rejected
- [ ] Weak password rejected
- [ ] Password mismatch shows error
- [ ] Verification link expires after time limit

**Privacy Settings:**
- [ ] Private profile hides content from non-followers
- [ ] Followers-only profile shows content to followers
- [ ] Search visibility off excludes from search results
- [ ] Messaging "none" prevents new messages
- [ ] Follow "approval" requires approval for new follows

**Blocking:**
- [ ] Cannot block self
- [ ] Block removes follow relationship
- [ ] Block hides messages from both sides
- [ ] Unblock restores normal interaction
- [ ] Block applies to profile, messages, feed

**Notifications:**
- [ ] Global off disables all email notifications
- [ ] Individual type toggles work when global on
- [ ] In-app notifications unaffected by email settings
- [ ] Email not sent when user disables type

**Data & Account:**
- [ ] Export with no data returns empty arrays
- [ ] Export link expires after 24 hours
- [ ] Delete with wrong password fails
- [ ] Delete cascades to all related data
- [ ] Last band admin cannot delete (or transfers ownership)

### Non-Functional Tests

**Performance:**
- [ ] Settings page loads in < 500ms
- [ ] Save operations complete in < 200ms
- [ ] Export generates in < 5 seconds (typical dataset)
- [ ] Block check adds < 10ms to profile load
- [ ] Notification preference check adds < 5ms to email send

**Accessibility:**
- [ ] Keyboard navigation works across all tabs
- [ ] Screen reader announces form errors
- [ ] Focus management in modals (trap focus)
- [ ] ARIA labels on all form controls
- [ ] Color contrast meets WCAG 2.1 AA

**Mobile Responsive:**
- [ ] Tabs collapse to dropdown on mobile
- [ ] Forms are touch-friendly
- [ ] Modals fit on small screens
- [ ] Buttons are large enough for touch (min 44x44px)

**Security:**
- [ ] Password change requires re-authentication
- [ ] Email verification uses secure tokens
- [ ] Delete account requires password re-entry
- [ ] Privacy settings enforced server-side
- [ ] Rate limiting prevents abuse

## Security Considerations

**Authentication:**
- [x] All settings endpoints require authentication
- [x] User can only modify their own settings (no userId param, use `c.get('user')`)

**Authorization:**
- [x] User can only block/unblock (no admin override)
- [x] User can only export their own data
- [x] User can only delete their own account

**Input Validation:**
- [x] Email validated (format, uniqueness)
- [x] Password validated (strength requirements)
- [x] Enum fields validated (privacy settings)
- [x] SQL injection prevented (parameterized queries)
- [x] XSS prevented (sanitize inputs)

**Sensitive Data:**
- [x] Passwords hashed (bcrypt via better-auth)
- [x] Verification tokens time-limited (15 minutes)
- [x] Export data access-controlled (presigned URLs)
- [x] Account deletion requires password (prevent takeover deletion)

**Rate Limiting:**
- [x] Email update: 3/hour
- [x] Password change: 5/hour
- [x] Export data: 1/day
- [x] Delete account: 3/hour

**Privacy Enforcement:**
- [x] Block checks on every profile view
- [x] Block checks on message send
- [x] Privacy checks on profile access
- [x] Search visibility enforced in queries

**Audit Logging:**
- [x] Log email changes
- [x] Log password changes
- [x] Log account deletions
- [x] Log privacy setting changes (optional)

## Rollout Plan

### Phase 1: MVP (Settings Page Foundation)

**Week 1-2: Build Core Features**
- [ ] Database migrations (user_settings, blocked_users tables)
- [ ] API endpoints (account, privacy, notifications, data)
- [ ] Frontend settings page layout (tabs, forms)
- [ ] Account settings (email, password)
- [ ] Privacy settings (profile visibility, search, messaging, following)
- [ ] Notification settings (email preferences)

**Week 3: Data & Blocking**
- [ ] Block/unblock functionality
- [ ] Blocked users list
- [ ] Data export (JSON generation)
- [ ] Account deletion

**Week 4: Integration & Testing**
- [ ] Privacy enforcement (profile access, search exclusion, message blocking)
- [ ] Email notification filtering (check preferences)
- [ ] E2E tests (Playwright)
- [ ] Bug fixes and polish

**Ship to 100% of users:**
- Monitor error rates
- Monitor settings save success rates
- Monitor block/unblock usage

### Phase 2: Enhancements (After MVP Feedback)

**Based on user feedback:**
- Mute functionality (hide content without blocking)
- Session management (view active sessions, log out devices)
- Report user/content (moderation system)
- Email notification batching (daily/weekly digests)

### Phase 3: Advanced Features

- Two-factor authentication (2FA)
- Connected accounts (OAuth providers)
- Push notification preferences (mobile app)
- Custom notification schedules (quiet hours)
- Dark mode preference

## Metrics to Track

**Adoption Metrics:**
- **Settings page visits:** % of users visiting settings (target: > 30% within first month)
- **Settings changed:** % of users modifying any setting (target: > 15%)
- **Most changed settings:** Which settings are adjusted most (understand priorities)

**Privacy Metrics:**
- **Profile visibility changes:** How many users change from default "public"
- **Search visibility off:** % of users hiding from search (target: < 10%, flag if higher)
- **Messaging restrictions:** % of users limiting messaging (target: < 20%)
- **Blocked users:** Average blocks per user, distribution (flag abuse)

**Notification Metrics:**
- **Email opt-outs:** % of users disabling email notifications (target: < 30%)
- **Granular preferences:** Which notification types are disabled most
- **Email delivery rate:** % of emails successfully delivered (target: > 95%)

**Data Rights Metrics:**
- **Data exports:** Number of exports per week (expect low, spike = issue?)
- **Account deletions:** Deletion rate (target: < 2% monthly, flag if higher)
- **Deletion reasons:** Survey at deletion (why are they leaving?)

**Security Metrics:**
- **Password changes:** Frequency (spike = breach?)
- **Failed password attempts:** Rate of "incorrect password" errors
- **Blocked user abuse:** Users blocking > 10 people (potential harassment victim)

**Performance Metrics:**
- **Settings page load time:** p50, p95, p99 (target: p95 < 500ms)
- **Save operation latency:** p50, p95, p99 (target: p95 < 200ms)
- **Export generation time:** p50, p95 (target: p95 < 10 seconds)
- **Privacy check latency:** Impact on profile views (target: < 10ms added)

## Open Questions

**Product Decisions:**
1. **What happens to a user's posts when they delete their account?**
   - Option A: Hard delete (posts disappear)
   - Option B: Soft delete (posts remain but show "Deleted User")
   - Option C: User chooses at deletion time
   - **Recommendation:** Option B (preserve conversation context)

2. **Should private users' posts be hidden from public feed?**
   - Current spec: Posts remain public (user's choice to post)
   - Alternative: Private profile = all posts hidden
   - **Recommendation:** Keep current spec (explicit control)

3. **What happens to band applications when user is blocked?**
   - Option A: Applications remain (professional context)
   - Option B: Applications deleted (full block)
   - **Recommendation:** Option A (band admin decision independent of block)

4. **Should we allow users to download data for deleted content?**
   - Export only includes current data, or also deleted posts/comments?
   - **Recommendation:** Current data only (simpler, GDPR compliant)

5. **Should last admin of band be allowed to delete account if they delete the band first?**
   - Currently blocked. Should we allow if they delete band in same flow?
   - **Recommendation:** Require separate band deletion first (clarity)

**Technical Decisions:**
1. **Email verification flow: Send verification on save or allow unverified email?**
   - Option A: Email not updated until verified (more secure)
   - Option B: Email updated immediately, verification for notifications (better UX)
   - **Recommendation:** Option A (security > UX)

2. **Notification preferences: Store in DB or cache-first?**
   - Current spec: DB storage, cache for performance
   - Alternative: Cache as source of truth (faster reads, risk of cache loss)
   - **Recommendation:** DB storage with cache (durability)

3. **Export format: Single JSON file or multiple files (zip)?**
   - Current spec: Single JSON
   - Alternative: ZIP with separate CSVs (media/, posts.csv, etc.)
   - **Recommendation:** Single JSON for MVP, ZIP for future

4. **Account deletion: Soft delete or hard delete?**
   - Option A: Soft delete (mark as deleted, retain in DB)
   - Option B: Hard delete (remove all data)
   - **Recommendation:** Hard delete for GDPR compliance, soft delete posts (context)

5. **Privacy enforcement: Check on every request or cache permissions?**
   - Current spec: Cache with 5-minute TTL
   - Alternative: Check DB on every request (more secure, slower)
   - **Recommendation:** Cache with TTL (balance performance and security)

---

**Estimated Effort:** 3-4 weeks (1 developer)
**Priority:** High (Core feature, blocks user control and privacy compliance)
**Owner:** TBD (Frontend + Backend collaboration)
**Dependencies:**
- None (standalone feature)
- Nice to have: Email service configured (for verification and notifications)
