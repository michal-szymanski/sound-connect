# Feature: Enhanced Musician Profiles

## Problem Statement

Musicians using Sound Connect need rich, detailed profiles to effectively find band members and showcase their skills. The current profile only includes basic user information (name, email, image). Musicians need to communicate:
- What instruments they play and skill levels
- Musical genres and influences
- Availability for rehearsals/gigs
- Experience level and credentials
- What they're looking for in a band
- Location and logistics (travel radius, rehearsal space)

Without these details, musicians waste time messaging unsuitable matches or miss great opportunities because their profile doesn't communicate their value.

**Who has this problem?**
- Band leaders recruiting musicians (need to filter by skill, commitment, location)
- Musicians seeking bands (need to showcase experience and preferences)
- All users who want to assess compatibility before reaching out

## Success Criteria

1. Users can complete a comprehensive profile in under 5 minutes
2. Profile displays are scannable on mobile devices (80% of musicians browse on phones)
3. Profiles show completion percentage, encouraging users to fill in details
4. Users can edit any profile section inline without navigating away from profile view
5. All profile data validates on both client and server
6. Profile updates are reflected in real-time across all views
7. Minimal required fields (location, primary instrument, primary genre) allow quick signup
8. Profile data structure supports future search/filter implementation (Phase 2)

## User Stories

- As a band leader, I want to see a musician's experience level and availability so I can quickly determine if they're a good fit before messaging
- As a musician looking for bands, I want to showcase multiple instruments with skill levels so bands know my full capabilities
- As any user, I want to update my profile sections independently so I can keep information current without editing everything at once
- As a new user, I want a minimal signup flow so I can start exploring quickly, then complete my profile progressively
- As a serious musician, I want to communicate my commitment level and goals so I attract like-minded collaborators
- As any user, I want to see my profile completion percentage so I'm motivated to add more details

## Scope

### In Scope (MVP)

1. **Database schema** for all profile fields
2. **API endpoints** for updating profile sections
3. **Profile view page** with inline editing per section
4. **Profile completion indicator** (percentage badge)
5. **Validation** for all fields (client + server)
6. **Mobile-responsive UI** for all profile sections
7. **Multi-instrument support** with primary/secondary designation
8. **Fixed genre list** with enum-based validation
9. **Availability statuses** with expiration for "actively looking"
10. **Location and logistics** fields (city, travel radius, has space/car)

### Out of Scope (Future)

- **Audio/video uploads** (deferred until v2)
- **Profile search/filtering** (spec defines data structure, implementation in separate phase)
- **Profile verification badges** (requires admin review system)
- **Skill endorsements** (social proof from other users)
- **Integration with streaming services** (Spotify, Apple Music links)
- **Calendar integration** for availability
- **Public vs private profile fields** (all fields are public in MVP)
- **Profile analytics** (who viewed your profile)

## User Flow

### Initial Profile Setup (New User)

1. User signs up (existing auth flow)
2. System redirects to profile setup wizard (first-time only)
3. User fills minimal required fields:
   - Location (city)
   - Primary instrument
   - Primary genre
4. User clicks "Complete Later" or "Continue"
5. If "Continue", user sees optional sections to fill
6. User lands on home feed with profile completion banner (if < 100%)

### Editing Existing Profile

1. User navigates to their profile page (or another user's profile if viewing)
2. Profile displays in "view mode" with edit icons per section (own profile only)
3. User clicks "Edit" icon on a section (e.g., "Instruments")
4. Section expands to inline edit form
5. User modifies fields, clicks "Save" or "Cancel"
6. On "Save":
   - Client validates with Zod schema
   - If valid, sends PATCH request to API
   - Server validates and updates database
   - UI updates optimistically, shows success toast
   - Profile completion percentage updates
7. On "Cancel", form reverts to view mode without saving
8. User can edit multiple sections independently

### Viewing Another User's Profile

1. User clicks on another user's name/avatar
2. System loads profile view page (read-only, no edit icons)
3. Profile displays all completed sections
4. Empty sections show nothing (no "Not provided" placeholders)
5. User can follow, message, or return to feed

## UI Requirements

### Components Needed

1. **ProfileHeader** - Avatar, name, location, last active, completion badge
2. **ProfileSection** - Reusable wrapper with view/edit states
3. **InstrumentsSection** - Display/edit instruments with skill levels
4. **GenresSection** - Display/edit primary/secondary genres
5. **ExperienceSection** - Years playing, gigging level, past bands
6. **AvailabilitySection** - Status, commitment, schedule, rehearsal frequency
7. **LogisticsSection** - Travel radius, has space/car, contact preferences
8. **LookingForSection** - What user seeks, what they offer, deal breakers
9. **BioSection** - Musical journey, goals, influences
10. **CompletionBadge** - Circular progress indicator with percentage
11. **EditButton** - Icon button to toggle edit mode
12. **InlineEditForm** - Generic form wrapper with Save/Cancel

### Profile Sections Layout

```
┌─────────────────────────────────────────┐
│ [Avatar] Name                           │
│          @username                      │
│          📍 Chicago, IL                  │
│          🟢 Active 2h ago               │
│          [70% Complete] [Follow] [Msg]  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 🎸 Instruments              [Edit ✏️]   │
│ Primary: Bass Guitar (10 years)         │
│ Also plays: Guitar (5 years),           │
│            Vocals (3 years)             │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 🎵 Genres & Style           [Edit ✏️]   │
│ Primary: Progressive Rock               │
│ Also: Jazz Fusion, Metal                │
│ Influences: Tool, Primus, Dream Theater │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 📅 Availability             [Edit ✏️]   │
│ Status: 🟢 Actively Looking             │
│ Commitment: Professional                │
│ Available: Tue/Thu evenings, weekends   │
│ Rehearsal: 2-3x per week                │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 🎓 Experience               [Edit ✏️]   │
│ Gigging: Touring (5+ years)             │
│ Past Bands: The Wavelengths (2018-2022),│
│            Local Heroes (2015-2017)     │
│ Studio: Yes, recording experience       │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 🚗 Logistics                [Edit ✏️]   │
│ Travel: Up to 30 miles                  │
│ Rehearsal Space: Yes, equipped studio   │
│ Transportation: Has car                 │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 🎯 Looking For              [Edit ✏️]   │
│ Seeking: Original prog/metal band,      │
│          serious commitment, gigging    │
│ Can offer: Solid bass skills, gear,     │
│           rehearsal space, transport    │
│ Deal breakers: No cover bands           │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 📝 About                    [Edit ✏️]   │
│ Been playing bass for 10+ years,        │
│ toured regionally with The Wavelengths. │
│ Looking to join established original    │
│ band with album/touring plans.          │
│ Age: 30-35                              │
└─────────────────────────────────────────┘
```

### Edit Mode Example (Instruments Section)

```
┌─────────────────────────────────────────┐
│ 🎸 Instruments                          │
│                                         │
│ Primary Instrument *                    │
│ [Dropdown: Bass Guitar    ▼]            │
│                                         │
│ Years Playing Primary *                 │
│ [Number input: 10]                      │
│                                         │
│ Additional Instruments                  │
│ [+ Add Instrument]                      │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Instrument: [Guitar      ▼]         │ │
│ │ Years: [5]  [Remove ❌]             │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Instrument: [Vocals      ▼]         │ │
│ │ Years: [3]  [Remove ❌]             │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Seeking to Play (in bands)              │
│ ☑ Bass Guitar                           │
│ ☐ Guitar                                │
│ ☐ Vocals                                │
│                                         │
│ [Cancel] [Save Changes]                 │
└─────────────────────────────────────────┘
```

### States

#### View Mode (Default)
- Show completed fields only
- Display edit icons for own profile
- No edit icons for other users' profiles
- Empty sections are hidden (not shown with "N/A")

#### Edit Mode (Per Section)
- Section expands to inline form
- Pre-filled with current values
- Save/Cancel buttons at bottom
- Other sections remain in view mode

#### Loading State
- Skeleton loaders for each section
- Disable edit buttons during save
- Show spinner on Save button during API call

#### Empty State
- Own profile: "Complete your [section] to help musicians find you"
- Other profiles: Section not displayed

#### Error State
- Inline validation errors below fields (red text)
- Toast notification for API errors
- Form remains in edit mode on error

#### Success State
- Section collapses to view mode
- Green toast: "[Section] updated successfully"
- Profile completion percentage updates

### Interactions

#### Inline Editing Flow
1. User clicks "Edit ✏️" button
2. Section animates to expanded edit form
3. Focus moves to first input field
4. User edits fields with live validation
5. User clicks "Save" → Validate → API call → Update UI
6. User clicks "Cancel" → Revert changes → Collapse to view mode

#### Multi-Instrument Management
1. User clicks "+ Add Instrument"
2. New instrument row appears
3. User selects instrument from dropdown
4. User enters years of experience
5. User can remove with "❌" button
6. Limit: Maximum 5 instruments

#### Genre Selection
1. User selects primary genre (required, single-select dropdown)
2. User selects 0-3 secondary genres (multi-select dropdown)
3. "Other" option triggers text input for custom genre
4. User types musical influences in text area

#### Availability Status with Expiration
1. User selects status: "Actively Looking", "Open to Offers", "Not Looking", "Just Browsing"
2. If "Actively Looking", expiration date picker appears
3. User sets expiration (7 days, 30 days, 90 days, custom)
4. Backend auto-resets status when expiration passes
5. UI shows countdown: "Actively looking (23 days left)"

#### Profile Completion Calculation
- Each section has weighted value (total = 100%)
- Required fields: 40% (location, primary instrument, primary genre)
- Optional sections: 60% distributed across 7 sections (~8.5% each)
- Real-time update as user completes fields
- Badge color: Red (0-33%), Yellow (34-66%), Green (67-100%)

#### Responsive Behavior
- Desktop: Sections in 2-column grid
- Tablet: Single column, full width
- Mobile: Single column, edit forms push other sections down

## API Requirements

### Endpoints Overview

All endpoints require authentication. User ID comes from `c.get('user')` (never from request body).

### `PATCH /api/users/profile/instruments`

**Purpose:** Update user's instruments and skill levels

**Auth:** Required (Bearer token)

**Request:**
```json
{
  "primaryInstrument": "bass_guitar",
  "yearsPlayingPrimary": 10,
  "additionalInstruments": [
    { "instrument": "guitar", "years": 5 },
    { "instrument": "vocals", "years": 3 }
  ],
  "seekingToPlay": ["bass_guitar"]
}
```

**Response:**
```json
{
  "success": true,
  "profileCompletion": 75
}
```

**Validation:**
- `primaryInstrument`: required, must be in `InstrumentEnum`
- `yearsPlayingPrimary`: required, integer, min 0, max 70
- `additionalInstruments`: optional, array, max 4 items
- `additionalInstruments[].instrument`: must be in `InstrumentEnum`, cannot duplicate `primaryInstrument`
- `additionalInstruments[].years`: integer, min 0, max 70
- `seekingToPlay`: optional, array of instruments from `InstrumentEnum`

**Errors:**
- 400: Invalid input (specific validation error in message)
- 401: Unauthorized (no auth token)
- 500: Database error

### `PATCH /api/users/profile/genres`

**Purpose:** Update user's musical genres and influences

**Auth:** Required

**Request:**
```json
{
  "primaryGenre": "progressive_rock",
  "secondaryGenres": ["jazz_fusion", "metal"],
  "influences": "FFO: Tool, Primus, Dream Theater"
}
```

**Response:**
```json
{
  "success": true,
  "profileCompletion": 78
}
```

**Validation:**
- `primaryGenre`: required, must be in `GenreEnum`
- `secondaryGenres`: optional, array, max 3 items, must be in `GenreEnum`, cannot include `primaryGenre`
- `influences`: optional, string, max 500 chars

**Errors:**
- 400: Invalid input
- 401: Unauthorized
- 500: Database error

### `PATCH /api/users/profile/availability`

**Purpose:** Update availability status and schedule

**Auth:** Required

**Request:**
```json
{
  "status": "actively_looking",
  "statusExpiresAt": "2025-12-31T23:59:59.999Z",
  "commitmentLevel": "professional",
  "weeklyAvailability": "Tuesday/Thursday evenings, weekends",
  "rehearsalFrequency": "2-3x_per_week"
}
```

**Response:**
```json
{
  "success": true,
  "profileCompletion": 82
}
```

**Validation:**
- `status`: required, enum: `actively_looking`, `open_to_offers`, `not_looking`, `just_browsing`
- `statusExpiresAt`: optional (required if status = `actively_looking`), ISO 8601 date string, must be future date
- `commitmentLevel`: optional, enum: `hobbyist`, `serious_amateur`, `professional`
- `weeklyAvailability`: optional, string, max 200 chars
- `rehearsalFrequency`: optional, enum: `1x_per_week`, `2-3x_per_week`, `4+_per_week`, `flexible`

**Errors:**
- 400: Invalid input (e.g., "statusExpiresAt required when status is actively_looking")
- 401: Unauthorized
- 500: Database error

### `PATCH /api/users/profile/experience`

**Purpose:** Update gigging experience and credentials

**Auth:** Required

**Request:**
```json
{
  "giggingLevel": "touring",
  "pastBands": "The Wavelengths (2018-2022), Local Heroes (2015-2017)",
  "hasStudioExperience": true
}
```

**Response:**
```json
{
  "success": true,
  "profileCompletion": 85
}
```

**Validation:**
- `giggingLevel`: optional, enum: `beginner`, `local`, `regional`, `touring`, `professional`
- `pastBands`: optional, string, max 500 chars
- `hasStudioExperience`: optional, boolean

**Errors:**
- 400: Invalid input
- 401: Unauthorized
- 500: Database error

### `PATCH /api/users/profile/logistics`

**Purpose:** Update location and travel logistics

**Auth:** Required

**Request:**
```json
{
  "city": "Chicago",
  "state": "IL",
  "country": "USA",
  "travelRadius": 30,
  "hasRehearsalSpace": true,
  "hasTransportation": true
}
```

**Response:**
```json
{
  "success": true,
  "profileCompletion": 88
}
```

**Validation:**
- `city`: required, string, max 100 chars
- `state`: optional, string, max 50 chars (required for USA/Canada)
- `country`: required, string, max 50 chars
- `travelRadius`: optional, integer, min 0, max 500 (miles)
- `hasRehearsalSpace`: optional, boolean
- `hasTransportation`: optional, boolean

**Errors:**
- 400: Invalid input (e.g., "state required for USA")
- 401: Unauthorized
- 500: Database error

### `PATCH /api/users/profile/looking-for`

**Purpose:** Update what user seeks and offers

**Auth:** Required

**Request:**
```json
{
  "seeking": "Original prog/metal band, serious commitment, gigging opportunities",
  "canOffer": "Solid bass skills, professional gear, rehearsal space, reliable transportation",
  "dealBreakers": "No cover bands, original music only"
}
```

**Response:**
```json
{
  "success": true,
  "profileCompletion": 92
}
```

**Validation:**
- `seeking`: optional, string, max 500 chars
- `canOffer`: optional, string, max 500 chars
- `dealBreakers`: optional, string, max 300 chars

**Errors:**
- 400: Invalid input
- 401: Unauthorized
- 500: Database error

### `PATCH /api/users/profile/bio`

**Purpose:** Update bio, goals, and personal info

**Auth:** Required

**Request:**
```json
{
  "bio": "Been playing bass for 10+ years, toured regionally with The Wavelengths. Looking to join established original band with album/touring plans.",
  "musicalGoals": "Record an album, tour nationally",
  "ageRange": "30-35"
}
```

**Response:**
```json
{
  "success": true,
  "profileCompletion": 100
}
```

**Validation:**
- `bio`: optional, string, max 500 chars
- `musicalGoals`: optional, string, max 300 chars
- `ageRange`: optional, string, max 20 chars

**Errors:**
- 400: Invalid input
- 401: Unauthorized
- 500: Database error

### `GET /api/users/:userId/profile`

**Purpose:** Fetch complete user profile with all sections

**Auth:** Required

**Request:** None (userId in URL params)

**Response:**
```json
{
  "id": "user_123",
  "name": "Alex Johnson",
  "image": "https://...",
  "lastActiveAt": "2025-11-07T10:30:00.000Z",
  "profileCompletion": 95,
  "instruments": {
    "primaryInstrument": "bass_guitar",
    "yearsPlayingPrimary": 10,
    "additionalInstruments": [
      { "instrument": "guitar", "years": 5 },
      { "instrument": "vocals", "years": 3 }
    ],
    "seekingToPlay": ["bass_guitar"]
  },
  "genres": {
    "primaryGenre": "progressive_rock",
    "secondaryGenres": ["jazz_fusion", "metal"],
    "influences": "FFO: Tool, Primus, Dream Theater"
  },
  "availability": {
    "status": "actively_looking",
    "statusExpiresAt": "2025-12-31T23:59:59.999Z",
    "commitmentLevel": "professional",
    "weeklyAvailability": "Tuesday/Thursday evenings, weekends",
    "rehearsalFrequency": "2-3x_per_week"
  },
  "experience": {
    "giggingLevel": "touring",
    "pastBands": "The Wavelengths (2018-2022), Local Heroes (2015-2017)",
    "hasStudioExperience": true
  },
  "logistics": {
    "city": "Chicago",
    "state": "IL",
    "country": "USA",
    "travelRadius": 30,
    "hasRehearsalSpace": true,
    "hasTransportation": true
  },
  "lookingFor": {
    "seeking": "Original prog/metal band, serious commitment, gigging opportunities",
    "canOffer": "Solid bass skills, professional gear, rehearsal space, reliable transportation",
    "dealBreakers": "No cover bands, original music only"
  },
  "bio": {
    "bio": "Been playing bass for 10+ years...",
    "musicalGoals": "Record an album, tour nationally",
    "ageRange": "30-35"
  }
}
```

**Errors:**
- 404: User not found
- 401: Unauthorized
- 500: Database error

### `POST /api/users/profile/complete-setup`

**Purpose:** Mark initial profile setup as complete (redirects to feed)

**Auth:** Required

**Request:**
```json
{
  "skipOptional": true
}
```

**Response:**
```json
{
  "success": true,
  "profileCompletion": 40
}
```

**Validation:**
- `skipOptional`: optional, boolean (if true, user completed only required fields)

**Errors:**
- 400: Required fields not completed (city, primaryInstrument, primaryGenre)
- 401: Unauthorized
- 500: Database error

## Database Changes

### New Table: `user_profiles`

```sql
CREATE TABLE user_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

  -- Instruments
  primary_instrument TEXT,
  years_playing_primary INTEGER,
  seeking_to_play TEXT,

  -- Genres
  primary_genre TEXT,
  secondary_genres TEXT,
  influences TEXT,

  -- Availability
  status TEXT,
  status_expires_at TEXT,
  commitment_level TEXT,
  weekly_availability TEXT,
  rehearsal_frequency TEXT,

  -- Experience
  gigging_level TEXT,
  past_bands TEXT,
  has_studio_experience INTEGER,

  -- Logistics
  city TEXT,
  state TEXT,
  country TEXT,
  travel_radius INTEGER,
  has_rehearsal_space INTEGER,
  has_transportation INTEGER,

  -- Looking For
  seeking TEXT,
  can_offer TEXT,
  deal_breakers TEXT,

  -- Bio
  bio TEXT,
  musical_goals TEXT,
  age_range TEXT,

  -- Meta
  profile_completion INTEGER NOT NULL DEFAULT 0,
  setup_completed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT
);

CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_status ON user_profiles(status);
CREATE INDEX idx_user_profiles_primary_genre ON user_profiles(primary_genre);
CREATE INDEX idx_user_profiles_city ON user_profiles(city);
```

**Column Details:**

- `user_id`: Foreign key to users table, unique (one profile per user)
- `primary_instrument`: Enum string, one of `InstrumentEnum`
- `years_playing_primary`: Integer (0-70)
- `seeking_to_play`: JSON array string (e.g., `["bass_guitar", "guitar"]`)
- `primary_genre`: Enum string, one of `GenreEnum`
- `secondary_genres`: JSON array string (max 3 items)
- `influences`: Text (max 500 chars)
- `status`: Enum string (`actively_looking`, `open_to_offers`, `not_looking`, `just_browsing`)
- `status_expires_at`: ISO 8601 date string (nullable)
- `commitment_level`: Enum string (`hobbyist`, `serious_amateur`, `professional`)
- `weekly_availability`: Text (max 200 chars)
- `rehearsal_frequency`: Enum string (`1x_per_week`, `2-3x_per_week`, `4+_per_week`, `flexible`)
- `gigging_level`: Enum string (`beginner`, `local`, `regional`, `touring`, `professional`)
- `past_bands`: Text (max 500 chars)
- `has_studio_experience`: Boolean (0 or 1)
- `city`: Text (max 100 chars)
- `state`: Text (max 50 chars)
- `country`: Text (max 50 chars)
- `travel_radius`: Integer (miles, 0-500)
- `has_rehearsal_space`: Boolean (0 or 1)
- `has_transportation`: Boolean (0 or 1)
- `seeking`: Text (max 500 chars)
- `can_offer`: Text (max 500 chars)
- `deal_breakers`: Text (max 300 chars)
- `bio`: Text (max 500 chars)
- `musical_goals`: Text (max 300 chars)
- `age_range`: Text (max 20 chars)
- `profile_completion`: Integer (0-100)
- `setup_completed`: Boolean (0 or 1, tracks if initial wizard completed)
- `created_at`: ISO 8601 date string
- `updated_at`: ISO 8601 date string (nullable)

### New Table: `user_additional_instruments`

```sql
CREATE TABLE user_additional_instruments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  instrument TEXT NOT NULL,
  years INTEGER NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX idx_user_additional_instruments_user_id ON user_additional_instruments(user_id);
CREATE INDEX idx_user_additional_instruments_instrument ON user_additional_instruments(instrument);
```

**Column Details:**

- `user_id`: Foreign key to users table
- `instrument`: Enum string, one of `InstrumentEnum`
- `years`: Integer (0-70)
- `created_at`: ISO 8601 date string

### Modified Table: `users`

Add `last_active_at` column to existing users table:

```sql
ALTER TABLE users ADD COLUMN last_active_at TEXT;
```

**Migration Strategy:**
- Add column with default NULL
- Backfill with `updated_at` value for existing users
- Update `last_active_at` on every authenticated API request (middleware)

### Enums (Defined in TypeScript)

```typescript
export const InstrumentEnum = [
  'guitar', 'bass_guitar', 'drums', 'keyboards', 'vocals',
  'saxophone', 'trumpet', 'trombone', 'violin', 'cello',
  'flute', 'clarinet', 'harmonica', 'banjo', 'mandolin',
  'ukulele', 'percussion', 'synth', 'dj', 'production'
] as const;

export const GenreEnum = [
  'rock', 'pop', 'jazz', 'blues', 'country', 'folk',
  'metal', 'punk', 'hardcore', 'indie', 'alternative',
  'progressive_rock', 'psychedelic', 'classic_rock',
  'electronic', 'edm', 'house', 'techno', 'dubstep',
  'hip_hop', 'rap', 'rnb', 'soul', 'funk', 'disco',
  'reggae', 'ska', 'latin', 'salsa', 'bossa_nova',
  'classical', 'opera', 'jazz_fusion', 'bebop', 'swing',
  'bluegrass', 'gospel', 'experimental', 'ambient', 'world'
] as const;

export const AvailabilityStatusEnum = [
  'actively_looking',
  'open_to_offers',
  'not_looking',
  'just_browsing'
] as const;

export const CommitmentLevelEnum = [
  'hobbyist',
  'serious_amateur',
  'professional'
] as const;

export const RehearsalFrequencyEnum = [
  '1x_per_week',
  '2-3x_per_week',
  '4+_per_week',
  'flexible'
] as const;

export const GiggingLevelEnum = [
  'beginner',
  'local',
  'regional',
  'touring',
  'professional'
] as const;
```

### Indexes Rationale

- `user_id`: Fast lookup for profile fetch (JOIN with users table)
- `status`: Future search filter (find "actively looking" musicians)
- `primary_genre`: Future search filter (find musicians by genre)
- `city`: Future search filter (find local musicians)
- `instrument` (additional_instruments): Future search filter (find bassists)

## Edge Cases

### 1. User has no profile data

**Scenario:** New user has never filled out profile

**Handling:**
- `GET /api/users/:userId/profile` returns empty profile with user basic info (name, image, id)
- All profile sections return `null` or empty objects
- Profile completion = 0%
- UI shows "Complete your profile" banner

### 2. Availability status expiration

**Scenario:** User set "actively looking" with expiration date that has passed

**Handling:**
- Backend cron job (Cloudflare Scheduled Worker) runs daily
- Finds profiles where `status = 'actively_looking'` AND `status_expires_at < NOW()`
- Updates `status` to `open_to_offers`
- Clears `status_expires_at`
- UI shows "Your actively looking status expired" notification

**Alternative (on-read):**
- When fetching profile, check if expiration passed
- If expired, auto-update status and return updated data
- Simpler, no cron needed

### 3. Duplicate instruments

**Scenario:** User tries to add primary instrument to additional instruments

**Handling:**
- Client-side validation prevents selecting primary instrument in additional list
- Server-side validation rejects if `additionalInstruments` includes `primaryInstrument`
- Return 400: "Additional instruments cannot include your primary instrument"

### 4. Invalid enum values

**Scenario:** Client sends invalid genre/instrument (e.g., "rockabilly" not in GenreEnum)

**Handling:**
- Zod validation fails on server
- Return 400: "Invalid value for primaryGenre. Must be one of: [list]"
- Client uses TypeScript enums, prevents this in normal use
- Protects against direct API calls

### 5. Concurrent profile updates

**Scenario:** User edits profile in two browser tabs, saves different sections

**Handling:**
- Each PATCH endpoint updates only its fields (not full profile replacement)
- Last write wins for same field
- No conflict if editing different sections
- Profile completion recalculates on every update

### 6. User changes primary instrument

**Scenario:** User changes primary instrument from "bass" to "guitar"

**Handling:**
- Update `primary_instrument` and `years_playing_primary`
- Check if old primary instrument is in `additionalInstruments`
- If not, optionally prompt user: "Add bass to additional instruments?"
- Update `seeking_to_play` if it included old primary instrument

### 7. Profile fetch fails (network error)

**Scenario:** API request times out or returns 500

**Handling:**
- Client shows error toast: "Failed to load profile. Retry?"
- Retry button triggers new fetch
- After 3 retries, show persistent error with "Go back" button
- Log error for monitoring

### 8. User deletes account

**Scenario:** User deletes account (handled by existing auth system)

**Handling:**
- Foreign key `ON DELETE CASCADE` automatically deletes profile
- Also deletes additional instruments (CASCADE)
- No orphaned data

### 9. State/province required for certain countries

**Scenario:** User enters city "Toronto" without state/province

**Handling:**
- Client validates: If country = "USA" or "Canada", state is required
- Server validates same rule
- Return 400: "State/province required for [country]"

### 10. User enters unrealistic values

**Scenario:** User enters 90 years playing guitar

**Handling:**
- Validation enforces max 70 years
- Return 400: "Years playing cannot exceed 70"
- Client HTML input has `max="70"` attribute

### 11. Too many additional instruments

**Scenario:** User tries to add 6th additional instrument

**Handling:**
- Client disables "+ Add Instrument" button at 4 additional (5 total including primary)
- Server validation: `additionalInstruments.length <= 4`
- Return 400: "Maximum 4 additional instruments allowed"

### 12. Empty required fields in setup

**Scenario:** User clicks "Complete Setup" without filling city/instrument/genre

**Handling:**
- Client validates before API call, shows inline errors
- Server validates, returns 400: "Required fields missing: city, primaryInstrument, primaryGenre"
- User cannot proceed until fields filled

### 13. User views own profile vs another user's profile

**Scenario:** Rendering logic differs for own vs others' profiles

**Handling:**
- Backend sends same profile data regardless
- Client checks `currentUser.id === profileUser.id`
- If match, show edit buttons and completion badge
- If different, hide edit UI, show "Follow" and "Message" buttons

### 14. Profile completion calculation edge cases

**Scenario:** User fills required fields (40%) then adds 1 optional section (8.5%)

**Handling:**
- Backend recalculates on every PATCH
- Formula: `40 (required) + sum of completed optional sections (8.5 each)`
- Completed section = at least one field filled in that section
- Return updated `profileCompletion` in every PATCH response

### 15. Very long text in free-form fields

**Scenario:** User pastes 1000-char essay in "bio" field (max 500)

**Handling:**
- Client `maxLength` attribute truncates at 500
- Client shows character counter: "450/500"
- Server validation enforces max length
- Return 400: "Bio cannot exceed 500 characters"

## Validation Rules

### Client-Side (Immediate Feedback)

All validations use Zod schemas defined in `packages/common/src/types/profile.ts`.

**Instruments:**
- `primaryInstrument`: required, dropdown selection
- `yearsPlayingPrimary`: required, number input, min 0, max 70
- `additionalInstruments`: array, max 4 items
- `additionalInstruments[].instrument`: required, dropdown, cannot duplicate primary
- `additionalInstruments[].years`: required, number, min 0, max 70
- `seekingToPlay`: array of checkboxes, optional

**Genres:**
- `primaryGenre`: required, dropdown selection
- `secondaryGenres`: array, max 3 items, multi-select dropdown, cannot include primary
- `influences`: optional, textarea, max 500 chars, character counter

**Availability:**
- `status`: required, radio buttons
- `statusExpiresAt`: required if status = "actively_looking", date picker, must be future date
- `commitmentLevel`: optional, dropdown
- `weeklyAvailability`: optional, textarea, max 200 chars
- `rehearsalFrequency`: optional, dropdown

**Experience:**
- `giggingLevel`: optional, dropdown
- `pastBands`: optional, textarea, max 500 chars
- `hasStudioExperience`: optional, checkbox (boolean)

**Logistics:**
- `city`: required, text input, max 100 chars
- `state`: conditionally required (if country = USA/Canada), text input, max 50 chars
- `country`: required, dropdown or autocomplete, max 50 chars
- `travelRadius`: optional, number input, min 0, max 500, unit = miles
- `hasRehearsalSpace`: optional, checkbox (boolean)
- `hasTransportation`: optional, checkbox (boolean)

**Looking For:**
- `seeking`: optional, textarea, max 500 chars
- `canOffer`: optional, textarea, max 500 chars
- `dealBreakers`: optional, textarea, max 300 chars

**Bio:**
- `bio`: optional, textarea, max 500 chars
- `musicalGoals`: optional, textarea, max 300 chars
- `ageRange`: optional, text input, max 20 chars

### Server-Side (Security + Business Logic)

All client-side validations repeated on server (never trust client).

**Additional server validations:**
- User ID from `c.get('user')`, never from request body
- Check user exists before updating profile
- Validate enum values against TypeScript const arrays
- SQL injection prevention (Drizzle parameterized queries)
- Rate limiting: Max 20 profile updates per user per hour
- Sanitize HTML in text fields (prevent XSS)

## Error Handling

### User-Facing Errors

**Validation Errors:**
- **Scenario:** User enters invalid data
- **Message:** Inline below field (e.g., "Years playing cannot exceed 70")
- **Action:** Fix input, form remains in edit mode

**Required Field Missing:**
- **Scenario:** User tries to save with empty required field
- **Message:** "This field is required"
- **Action:** Fill field, then save

**API Error (400):**
- **Scenario:** Server rejects request (validation failed)
- **Message:** Toast: "[Field] is invalid: [reason]"
- **Action:** Retry after fixing, form remains in edit mode

**API Error (401):**
- **Scenario:** Session expired
- **Message:** Toast: "Session expired. Please log in again."
- **Action:** Redirect to login page

**API Error (404):**
- **Scenario:** User not found (rare, only on profile fetch)
- **Message:** "User not found"
- **Action:** Redirect to home page

**API Error (500):**
- **Scenario:** Database error, network timeout
- **Message:** Toast: "Something went wrong. Please try again."
- **Action:** Retry button, if fails 3x show persistent error

**Network Error:**
- **Scenario:** No internet connection
- **Message:** Toast: "No internet connection. Check your network."
- **Action:** Retry when online

### Developer Errors (Log + Alert)

**Database Connection Failure:**
- Log error with stack trace
- Return 500 to client
- Alert monitoring system (Cloudflare Workers Analytics)

**Invalid Enum Value:**
- Log warning: "Invalid enum value received: [value]"
- Return 400 to client
- Track in error monitoring

**Unexpected Data Format:**
- Log error: "Unexpected data format in [field]"
- Return 500 to client
- Alert monitoring

**Profile Completion Calculation Error:**
- Log error, use fallback value (0%)
- Continue request, don't block user
- Alert monitoring for investigation

## Performance Considerations

### Expected Load

- **Profile views:** 100-1000 per minute (high traffic during peak hours)
- **Profile updates:** 10-50 per minute (lower frequency)
- **Initial setup:** 5-20 per minute (new user signups)

### Query Optimization

**Profile Fetch (`GET /api/users/:userId/profile`):**
- Single query joining `users`, `user_profiles`, `user_additional_instruments`
- Indexes on `user_id` ensure fast lookup
- Expected query time: < 10ms

**Profile Update (`PATCH /api/users/profile/*`):**
- Transaction: UPDATE `user_profiles` + calculate completion + optional INSERT/DELETE additional instruments
- Expected query time: < 20ms

**Additional Instruments:**
- Separate table avoids JSON parsing overhead
- Max 4 rows per user, negligible JOIN cost

### Caching Strategy

**Profile data:**
- Cache full profile response in Cloudflare KV for 5 minutes
- Invalidate cache on any PATCH to profile
- Cache key: `profile:${userId}`

**Static data (enums):**
- Cache instrument/genre lists in browser localStorage
- No API calls needed for dropdowns

### Rate Limiting

**Profile updates:**
- Max 20 PATCH requests per user per hour
- Prevents abuse, allows legitimate editing
- Return 429: "Too many requests. Try again in [X] minutes."

**Profile views:**
- No rate limit (read-only, cached)

### Database Connection Pooling

- Cloudflare Workers reuse D1 connections
- No manual pool management needed

### Bundle Size

- Profile edit forms use code splitting
- Load edit UI only when user clicks "Edit"
- Estimated JS bundle: +30KB (gzipped)

## Testing Checklist

### Functional Tests

**Profile Creation:**
- [ ] New user can complete initial setup with minimal required fields
- [ ] Profile is created in database with correct user_id
- [ ] Profile completion calculates as 40% after required fields only

**Profile Viewing:**
- [ ] User can view own profile with all completed sections
- [ ] User can view another user's profile (read-only)
- [ ] Empty sections are hidden, not shown as "N/A"
- [ ] Profile completion badge displays correct percentage and color

**Inline Editing:**
- [ ] User can click "Edit" button to expand section
- [ ] Form pre-fills with current values
- [ ] User can save changes successfully
- [ ] User can cancel without saving, reverts to view mode
- [ ] Multiple sections can be edited independently

**Instruments Section:**
- [ ] User can set primary instrument and years
- [ ] User can add up to 4 additional instruments
- [ ] User cannot add primary instrument to additional list
- [ ] User can remove additional instruments
- [ ] User can select which instruments they seek to play

**Genres Section:**
- [ ] User can select primary genre (required)
- [ ] User can select 0-3 secondary genres
- [ ] User cannot select primary genre in secondary list
- [ ] User can enter musical influences (free text)

**Availability Section:**
- [ ] User can set availability status
- [ ] "Actively Looking" requires expiration date
- [ ] Expiration date must be in future
- [ ] User can set commitment level and schedule

**Experience Section:**
- [ ] User can set gigging level
- [ ] User can enter past bands (free text)
- [ ] User can toggle studio experience checkbox

**Logistics Section:**
- [ ] User can enter city (required)
- [ ] State/province required for USA/Canada
- [ ] User can enter travel radius
- [ ] User can toggle rehearsal space and transportation

**Looking For Section:**
- [ ] User can enter seeking, can offer, deal breakers (all free text)
- [ ] Character limits enforced (500/500/300)

**Bio Section:**
- [ ] User can enter bio, musical goals, age range
- [ ] Character limits enforced

**API Responses:**
- [ ] All PATCH endpoints return updated profile completion
- [ ] GET endpoint returns complete profile with all sections
- [ ] Responses match Zod schemas

### Edge Case Tests

**Empty States:**
- [ ] New user with no profile shows empty state
- [ ] Profile with only required fields shows only those sections

**Validation Errors:**
- [ ] Invalid enum values rejected (400)
- [ ] Out-of-range numbers rejected (400)
- [ ] Missing required fields rejected (400)
- [ ] Duplicate instruments rejected (400)

**Expiration Handling:**
- [ ] Expired "actively looking" status auto-resets to "open to offers"
- [ ] UI shows countdown for active expiration

**Concurrent Updates:**
- [ ] Two tabs editing different sections doesn't conflict
- [ ] Two tabs editing same section: last write wins

**Character Limits:**
- [ ] Text fields truncate at max length
- [ ] Character counters update in real-time

**Special Characters:**
- [ ] Emoji in bio/influences saved and displayed correctly
- [ ] HTML in text fields is sanitized (no XSS)

**Network Errors:**
- [ ] Failed API call shows error toast
- [ ] Retry button works after failure

**Session Expiration:**
- [ ] Expired session redirects to login
- [ ] User can return to profile after re-login

### Non-Functional Tests

**Performance:**
- [ ] Profile fetch completes in < 100ms
- [ ] Profile update completes in < 200ms
- [ ] Page renders with skeleton loaders, no layout shift

**Mobile Responsive:**
- [ ] All sections display correctly on mobile (320px width)
- [ ] Edit forms are usable on small screens
- [ ] Touch targets are at least 44px (iOS accessibility)

**Accessibility:**
- [ ] All form inputs have labels
- [ ] Keyboard navigation works (tab through form)
- [ ] Screen reader announces section changes
- [ ] Error messages are associated with inputs (aria-describedby)
- [ ] Color contrast meets WCAG AA standards

**Cross-Browser:**
- [ ] Works in Chrome, Firefox, Safari, Edge
- [ ] Date picker works across browsers

**Data Persistence:**
- [ ] Profile changes persist after page refresh
- [ ] Profile changes visible immediately in other views (e.g., user card in feed)

## Security Considerations

### Authentication & Authorization

- [ ] All endpoints require authentication (Bearer token)
- [ ] User can only edit their own profile (user ID from `c.get('user')`)
- [ ] User can view any profile (read-only)
- [ ] Session validation on every request

### Input Sanitization

- [ ] HTML tags stripped from text fields (prevent XSS)
- [ ] SQL injection prevented by Drizzle parameterized queries
- [ ] Special characters escaped in database

### Rate Limiting

- [ ] Max 20 profile updates per user per hour
- [ ] Rate limit tracked per user ID (not IP, to allow mobile + desktop)

### Data Privacy

- [ ] No sensitive data in profile (email, phone in separate settings)
- [ ] All profile fields are public (no private/public toggle in MVP)
- [ ] User can delete profile by deleting account (CASCADE)

### CSRF Protection

- [ ] API uses Bearer tokens (not cookies), CSRF not applicable
- [ ] All mutations use POST/PATCH (not GET)

### Content Moderation

- [ ] Free-text fields (bio, influences, etc.) flagged for review if contain profanity (future)
- [ ] User-generated content logged for audit (who, when, what changed)

## Rollout Plan

### Phase 1: MVP (Weeks 1-3)

**Week 1: Backend + Database**
- Create database schema and migrations
- Implement all PATCH endpoints
- Implement GET profile endpoint
- Write server-side validation and error handling
- Write unit tests for API logic

**Week 2: Frontend UI**
- Build profile view page with sections
- Build inline edit forms for each section
- Implement client-side validation
- Build profile completion calculation
- Add loading/error states

**Week 3: Integration + Testing**
- Connect frontend to API endpoints
- Test end-to-end flows
- Fix bugs and edge cases
- Mobile responsive testing
- Accessibility testing

**Deployment:**
- Ship to 10% of users (feature flag)
- Monitor error rates, performance metrics
- Gather user feedback

### Phase 2: Iterate (Week 4)

**Based on feedback:**
- Improve UI based on user confusion points
- Add tooltips/help text for unclear fields
- Optimize slow queries (if any)
- Add missing edge case handling

**Deployment:**
- Ship to 100% of users
- Monitor adoption (% of users completing profiles)

### Phase 3: Search Integration (Weeks 5-6)

**Separate spec required, depends on:**
- Profile data structure (defined in this spec)
- Search UI/UX design
- Elasticsearch or D1 full-text search
- Filter performance optimization

**Example filters:**
- By genre, location (city + radius), instruments, availability status
- Sort by: last active, profile completion, distance

### Phase 4: Polish (Week 7+)

**Nice-to-haves:**
- Profile preview mode (see how profile looks to others)
- "Save as draft" for incomplete sections
- Profile tips ("Add past bands to increase credibility")
- Profile analytics (views, impressions)
- Rich text editor for bio (bold, italics, links)

## Metrics to Track

### Engagement Metrics

- **Profile completion rate:** % of users with 100% complete profiles
  - **Target:** 60% within 30 days of signup
- **Avg profile completion:** Mean completion percentage across all users
  - **Target:** 75%
- **Time to complete profile:** From signup to 100% completion
  - **Target:** < 10 minutes

### Feature Adoption

- **% users who complete initial setup:** Completed minimal required fields
  - **Target:** 95%
- **% users who edit profile post-setup:** Returned to update profile
  - **Target:** 40% within 7 days
- **Most edited sections:** Which sections users update most
  - **Hypothesis:** Availability, Looking For (dynamic info)

### Quality Metrics

- **Validation errors per save:** How often users hit validation errors
  - **Target:** < 0.5 errors per save attempt
- **API error rate:** 4xx/5xx errors on profile endpoints
  - **Target:** < 1%
- **Profile fetch latency (p95):** 95th percentile response time
  - **Target:** < 150ms

### Business Impact

- **Messaging rate:** Do complete profiles lead to more messages sent?
  - **Hypothesis:** Users with >80% completion send 2x more messages
- **Follow rate:** Do complete profiles get more followers?
  - **Hypothesis:** 100% profiles get 3x more followers
- **User retention:** Do complete profiles improve 7-day retention?
  - **Hypothesis:** 100% profiles have 20% higher retention

## Open Questions

### Product Decisions

1. **Should age range be required?**
   - **Decision needed from:** Product/User Research
   - **Options:** Required, optional, remove entirely
   - **Tradeoff:** Privacy vs matchmaking accuracy

2. **Should we allow "Other" for genres/instruments?**
   - **Decision needed from:** Product
   - **Current decision:** Fixed list only (easier to search)
   - **Reconsider if:** Many user requests for missing genres

3. **What happens to expired "actively looking" status?**
   - **Decision needed from:** Product
   - **Current decision:** Auto-reset to "open to offers"
   - **Alternative:** Prompt user to renew status

4. **Should profile completion be visible to other users?**
   - **Decision needed from:** Product/UX
   - **Current decision:** Visible only to profile owner
   - **Tradeoff:** Encourages completion vs. may discourage contacting "incomplete" profiles

### Technical Decisions

5. **Use Cloudflare Scheduled Worker or on-read expiration check?**
   - **Decision needed from:** Tech Lead
   - **Current decision:** On-read (simpler, no cron)
   - **Tradeoff:** Slightly stale data vs. infrastructure complexity

6. **Cache profile data in KV or rely on D1 performance?**
   - **Decision needed from:** Backend Team
   - **Current decision:** Cache in KV for 5 min
   - **Reconsider if:** D1 queries consistently < 50ms

7. **Store additional instruments in JSON or separate table?**
   - **Decision needed from:** Database Architect
   - **Current decision:** Separate table (easier to query for search)
   - **Tradeoff:** 1 extra JOIN vs. JSON parsing overhead

8. **Client-side or server-side profile completion calculation?**
   - **Decision needed from:** Backend Team
   - **Current decision:** Server-side (single source of truth)
   - **Tradeoff:** Consistent but requires API call to see updated %

## Dependencies

### Must Be Completed First

- Existing user authentication system (already complete)
- Database migration system (Drizzle, already complete)
- API routing and middleware (Hono, already complete)

### Blocks These Features

- **Advanced search/filtering:** Requires profile data structure defined here
- **Recommendations engine:** Needs profile data to match musicians
- **Profile verification badges:** Needs complete profiles to verify
- **Skill endorsements:** Needs instruments/experience data

### External Dependencies

- None (all functionality self-contained)

---

## Estimated Effort

**Backend:** 5 days
- Database schema & migrations: 1 day
- API endpoints & validation: 2 days
- Error handling & edge cases: 1 day
- Testing: 1 day

**Frontend:** 7 days
- Profile view layout: 1 day
- Inline edit forms (7 sections): 3 days
- Validation & error handling: 1 day
- Profile completion logic: 0.5 days
- Mobile responsive: 1 day
- Accessibility & polish: 0.5 days
- Testing: 1 day

**Integration & QA:** 2 days
- End-to-end testing: 1 day
- Bug fixes: 1 day

**Total:** 14 days (3 weeks with buffer)

**Priority:** High (core feature, blocks search/matching functionality)

**Owner:** To be assigned
