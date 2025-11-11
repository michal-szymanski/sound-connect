# Feature: Band Discovery Feed

## Problem Statement

Musicians currently have to manually search for bands using the `/bands/search` page, which requires active effort and assumes musicians know what they're looking for. Many musicians miss relevant opportunities because:

1. **Discovery Friction**: Manual search requires multiple filter selections before seeing results
2. **Missed Opportunities**: Bands looking for their exact instrument/genre/location go unnoticed
3. **Low Engagement**: Without proactive discovery, musicians visit the platform less frequently
4. **Application Volume**: Bands struggle to get applications because musicians don't see their "looking for" posts

**Who has this problem?**
- **Musicians** seeking bands who want a personalized feed showing relevant opportunities
- **Bands** actively recruiting who want to maximize visibility to qualified candidates

## Success Criteria

1. **Engagement**: 40%+ of active musicians visit the discovery feed within their first week
2. **Application Volume**: 5-10x increase in band applications submitted from discovery feed vs manual search
3. **Match Quality**: 60%+ click-through rate on top 3 recommendations (users click to view band profile)
4. **Retention**: Musicians who use discovery feed return 2x more frequently than those who only use manual search
5. **Technical Performance**: Discovery feed loads in < 800ms (real-time scoring with proper indexing)

## User Stories

- As a musician actively looking for bands, I want to see bands that match my instruments/genres/location immediately upon visiting the discovery page, so that I can quickly find relevant opportunities without manual filtering
- As a musician, I want to understand why each band was recommended to me (match reasons), so that I can prioritize which profiles to explore
- As a musician, I want to see how far away each band is from my location, so that I can assess travel feasibility
- As a band admin, I want my band to appear in discovery feeds of musicians who match our "looking for" criteria, so that we get more qualified applications
- As a musician, I want to quickly apply to bands directly from the discovery feed, so that I can act on opportunities without friction
- As a product manager, I want to track which match factors (instrument/genre/distance) lead to applications, so that we can optimize the scoring algorithm over time

## Scope

### In Scope (MVP)

1. **Discovery Feed Page** (`/discover/bands`)
   - Card-based layout showing matched bands
   - Display: band image, name, genre, location, distance, "looking for" snippet, match score indicator
   - Pagination (12 bands per page)
   - Empty state with CTA to complete profile if user has insufficient profile data
   - Sort by match score (descending)

2. **Real-Time Match Scoring Algorithm**
   - Calculate scores on-the-fly (no caching for MVP)
   - Match factors:
     - **Instrument match**: User's primary + additional instruments vs band's "looking for" text
     - **Genre match**: User's primary + secondary genres vs band's primary genre
     - **Location proximity**: Distance between user and band (haversine formula)
     - **Availability status**: Only show bands with non-empty "looking for" field
   - Scoring weights (tunable):
     - Primary instrument match: 50 points
     - Additional instrument match: 25 points
     - Primary genre match: 30 points
     - Secondary genre match: 15 points
     - Distance-based: 20 points (<10mi), 10 points (<25mi), 5 points (<50mi), 0 points (>50mi)
   - Minimum score threshold: 20 points (don't show bands with < 20 points)

3. **Match Reason Display**
   - Show top 2 match reasons on each band card (e.g., "Looking for Bass Guitar • Rock • 8 miles away")
   - Visual indicators for match strength (e.g., color-coded score badge)

4. **API Endpoint** (`GET /api/discover/bands`)
   - Returns paginated list of bands sorted by match score
   - Includes match metadata (score, reasons, distance)
   - Query params: `page`, `limit`

5. **Analytics Tracking**
   - Track page views on discovery feed
   - Track band card clicks (view profile from discovery feed)
   - Track applications submitted from discovery feed (source tracking)
   - Track match factor correlation with application rate (instrument/genre/distance)
   - Store analytics in database for analysis

6. **Navigation Integration**
   - Add "Discover Bands" link to main navigation sidebar
   - Add "Discover Bands" card to home page (right sidebar or main feed)

### Out of Scope (Future)

1. **Filters on Discovery Feed**: No user-controlled filters in MVP (pure algorithmic feed to maximize simplicity)
2. **Saved/Bookmarked Bands**: No ability to save bands for later (future feature)
3. **"Not Interested" Feedback**: No ability to dismiss bands and improve algorithm (future ML feature)
4. **Push Notifications**: No "New band matches you" notifications (future engagement feature)
5. **Discovery Feed for Bands**: Reciprocal feed showing "Musicians looking for bands" (future feature)
6. **Advanced Scoring**: No ML-based scoring or collaborative filtering (future optimization)
7. **Cache/Precomputation**: No score caching or batch jobs (add if performance issues arise)
8. **Personalization Settings**: No user preferences for weighting factors (trust the algorithm)

## User Flow

### Happy Path: Discovering and Applying to a Band

1. **Entry**:
   - Musician clicks "Discover Bands" in main navigation sidebar
   - OR clicks "Discover Bands" card on home page

2. **Discovery Feed Loads** (`/discover/bands`):
   - Backend calculates match scores for all bands with non-empty "looking for" field
   - Returns top 12 bands sorted by score
   - Page displays band cards in grid layout (3 columns on desktop, 1 on mobile)

3. **Viewing Matches**:
   - Each card shows:
     - Band profile image (circular avatar)
     - Band name
     - Primary genre tag
     - Location and distance (e.g., "Chicago, IL • 12 miles away")
     - "Looking for" snippet (truncated to 100 chars)
     - Match score badge (e.g., "85% Match" with color gradient)
     - Top 2 match reasons (e.g., "🎸 Bass Guitar • 🎵 Rock")
   - Musician scans cards to find interesting opportunities

4. **Exploring Band**:
   - Musician clicks on band card
   - Navigates to band profile page (`/bands/:id`)
   - Views full band details, posts, members

5. **Applying to Band**:
   - Musician clicks "Apply to Join" button on band profile
   - Fills out application form (message, position, music link)
   - Submits application
   - **Analytics**: Application tracked with `source: 'discovery'` to measure conversion

6. **Pagination**:
   - If musician wants more options, scrolls to bottom and clicks "Load More" or pagination controls
   - Loads next 12 bands with next-highest match scores

### Alternative Path: Incomplete Profile

1. **Entry**: Musician with incomplete profile visits `/discover/bands`
2. **Empty State Displayed**:
   - Message: "Complete your profile to discover band opportunities"
   - Explanation: "We need your instruments, genres, and location to find bands looking for you"
   - CTA button: "Complete Profile" (links to `/settings` or profile edit)
3. **Profile Completion**: Musician adds required fields
4. **Redirect**: Musician returns to `/discover/bands` and sees matches

### Alternative Path: No Matches Found

1. **Entry**: Musician visits `/discover/bands`
2. **Empty State Displayed**:
   - Message: "No bands match your profile right now"
   - Explanation: "Check back later or expand your search"
   - CTA button: "Search All Bands" (links to `/bands/search`)
3. **Fallback**: Musician uses manual search with broader criteria

## UI Requirements

### Components Needed

1. **`BandDiscoveryFeed`** (page component)
   - Fetches bands from `/api/discover/bands`
   - Displays grid of `BandDiscoveryCard` components
   - Handles loading, empty, and error states
   - Implements pagination controls

2. **`BandDiscoveryCard`** (card component)
   - Displays band information (image, name, genre, location, distance, looking_for)
   - Shows match score badge with color gradient (green for >70, yellow for 50-70, gray for <50)
   - Shows match reason tags (top 2 reasons)
   - Clickable - navigates to `/bands/:id`
   - Uses ShadCN Card component

3. **`MatchScoreBadge`** (badge component)
   - Visual indicator of match strength
   - Color gradient based on score: >70 (green), 50-70 (yellow), <50 (gray)
   - Displays percentage (e.g., "85%")
   - Uses ShadCN Badge component

4. **`MatchReasonTag`** (tag component)
   - Small tag showing match reason (e.g., "🎸 Bass Guitar", "🎵 Rock", "📍 8 mi")
   - Color-coded by type: instrument (blue), genre (purple), location (gray)
   - Uses ShadCN Badge component

5. **`EmptyDiscoveryState`** (empty state component)
   - Shown when no matches found or profile incomplete
   - Displays appropriate message and CTA
   - Uses ShadCN Alert component

### States

**Loading State**:
- Show skeleton cards (12 placeholders)
- Display loading spinner or shimmer effect
- No user interaction allowed while loading

**Empty State (Incomplete Profile)**:
- Alert box with info icon
- Heading: "Complete your profile to discover band opportunities"
- Description: "We need your instruments, genres, and location to find bands looking for you"
- Primary button: "Complete Profile" (links to profile settings)

**Empty State (No Matches)**:
- Alert box with search icon
- Heading: "No bands match your profile right now"
- Description: "Try checking back later or search all bands manually"
- Primary button: "Search All Bands" (links to `/bands/search`)

**Error State**:
- Alert box with error icon
- Heading: "Failed to load band recommendations"
- Description: "Something went wrong. Please try again."
- Primary button: "Retry" (refetches data)

**Success State**:
- Grid of band cards (3 columns desktop, 2 tablet, 1 mobile)
- Pagination controls at bottom
- Page indicator (e.g., "Showing 1-12 of 48 matches")

### Interactions

**User clicks band card**:
- Navigate to `/bands/:id`
- Track analytics event: `band_discovery_click` with band_id, match_score, source: 'discovery'

**User clicks "Load More" / pagination**:
- Fetch next page of results
- Append to existing cards OR replace (depending on UX preference - recommend replace for cleaner experience)
- Scroll to top of results

**User clicks match reason tag**:
- No action (tags are informational, not interactive)

**User clicks "Complete Profile" CTA**:
- Navigate to `/settings` (or inline profile edit modal)

**User clicks "Search All Bands" CTA**:
- Navigate to `/bands/search`

## API Requirements

### `GET /api/discover/bands`

**Purpose**: Returns paginated list of bands matched to current user's profile, sorted by match score

**Auth**: Required (user must be logged in)

**Query Parameters**:
```typescript
{
  page?: number;    // Default: 1
  limit?: number;   // Default: 12, max: 50
}
```

**Request Validation**:
- `page`: Integer, min 1
- `limit`: Integer, min 1, max 50
- User must be authenticated
- User must have profile with required fields (primaryInstrument, primaryGenre, city)

**Response** (200 OK):
```typescript
{
  bands: Array<{
    id: number;
    name: string;
    profileImageUrl: string | null;
    primaryGenre: string;
    city: string;
    state: string | null;
    country: string | null;
    lookingFor: string;
    distanceMiles: number;
    matchScore: number;              // 0-100
    matchReasons: Array<{
      type: 'instrument' | 'genre' | 'location';
      label: string;                 // e.g., "Bass Guitar", "Rock", "8 miles away"
      points: number;                // Points contributed to match score
    }>;
    followerCount: number;
    memberCount: number;
  }>;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalResults: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}
```

**Response** (400 Bad Request):
```typescript
{
  error: string;  // "Invalid page or limit parameter" | "Profile incomplete"
  missingFields?: string[];  // If profile incomplete: ["primaryInstrument", "city"]
}
```

**Response** (401 Unauthorized):
```typescript
{
  error: "Authentication required"
}
```

**Response** (500 Internal Server Error):
```typescript
{
  error: "Failed to fetch band recommendations"
}
```

**Scoring Algorithm** (server-side logic):

```typescript
function calculateMatchScore(user, band) {
  let score = 0;
  const reasons = [];

  // 1. Instrument Match (max 50 points)
  const userInstruments = [
    user.primaryInstrument,
    ...user.additionalInstruments.map(ai => ai.instrument)
  ];
  const lookingForLower = band.lookingFor.toLowerCase();

  for (const instrument of userInstruments) {
    if (lookingForLower.includes(instrument.toLowerCase())) {
      const points = instrument === user.primaryInstrument ? 50 : 25;
      score += points;
      reasons.push({ type: 'instrument', label: instrument, points });
      break; // Only count once for highest match
    }
  }

  // 2. Genre Match (max 30 points)
  const userGenres = [user.primaryGenre, ...user.secondaryGenres];
  if (userGenres.includes(band.primaryGenre)) {
    const points = band.primaryGenre === user.primaryGenre ? 30 : 15;
    score += points;
    reasons.push({ type: 'genre', label: band.primaryGenre, points });
  }

  // 3. Distance Match (max 20 points)
  if (user.latitude && user.longitude && band.latitude && band.longitude) {
    const distance = haversineDistance(
      user.latitude, user.longitude,
      band.latitude, band.longitude
    );

    let points = 0;
    if (distance < 10) points = 20;
    else if (distance < 25) points = 10;
    else if (distance < 50) points = 5;

    if (points > 0) {
      score += points;
      reasons.push({
        type: 'location',
        label: `${Math.round(distance)} miles away`,
        points
      });
    }
  }

  return { score, reasons };
}
```

**Query Optimization**:
- Eager load band follower counts and member counts (avoid N+1 queries)
- Filter bands with `lookingFor IS NOT NULL AND lookingFor != ''` at database level
- Index on `bands.looking_for` to speed up non-null checks
- Calculate distances in application code (SQLite doesn't have haversine function)
- Limit to bands within user's travel_radius + 50 miles for performance

**Performance Target**: < 800ms response time for 1000 active bands

### Analytics Tracking Endpoint

*Note: Analytics are tracked client-side via existing analytics system (if available) or stored in database.*

**Events to Track**:

1. **`band_discovery_page_view`**
   - Triggered when user lands on `/discover/bands`
   - Data: `user_id`, `timestamp`, `profile_complete` (boolean)

2. **`band_discovery_card_click`**
   - Triggered when user clicks on band card
   - Data: `user_id`, `band_id`, `match_score`, `match_reasons`, `position_in_feed` (1-12), `timestamp`

3. **`band_discovery_application`**
   - Triggered when user submits application from a band found via discovery
   - Data: `user_id`, `band_id`, `match_score`, `application_id`, `timestamp`

4. **`band_discovery_pagination`**
   - Triggered when user navigates to next/previous page
   - Data: `user_id`, `page_number`, `timestamp`

**Database Table** (if analytics stored in DB):

```sql
CREATE TABLE discovery_analytics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  event_type TEXT NOT NULL,  -- 'page_view', 'card_click', 'application', 'pagination'
  band_id INTEGER,           -- NULL for page_view
  match_score INTEGER,       -- 0-100
  match_reasons TEXT,        -- JSON array
  position_in_feed INTEGER,  -- 1-12
  page_number INTEGER,       -- For pagination events
  created_at TEXT NOT NULL
);

CREATE INDEX idx_discovery_analytics_user_id ON discovery_analytics(user_id);
CREATE INDEX idx_discovery_analytics_event_type ON discovery_analytics(event_type);
CREATE INDEX idx_discovery_analytics_band_id ON discovery_analytics(band_id);
```

## Database Changes

### New Tables

#### `discovery_analytics` (Analytics Tracking)

```sql
CREATE TABLE discovery_analytics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,  -- 'page_view' | 'card_click' | 'application' | 'pagination'
  band_id INTEGER REFERENCES bands(id) ON DELETE CASCADE,
  match_score INTEGER,       -- 0-100, NULL for page_view
  match_reasons TEXT,        -- JSON string: [{"type": "instrument", "label": "Bass", "points": 50}]
  position_in_feed INTEGER,  -- 1-12 for card clicks
  page_number INTEGER,       -- For pagination events
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_discovery_analytics_user_id ON discovery_analytics(user_id);
CREATE INDEX idx_discovery_analytics_event_type ON discovery_analytics(event_type);
CREATE INDEX idx_discovery_analytics_band_id ON discovery_analytics(band_id);
CREATE INDEX idx_discovery_analytics_created_at ON discovery_analytics(created_at);
```

**Purpose**: Track all discovery feed interactions for algorithm optimization and product analytics

**Indexes**:
- `user_id`: Fast queries for per-user analytics
- `event_type`: Fast filtering by event type
- `band_id`: Fast queries for per-band analytics
- `created_at`: Time-based queries (e.g., last 7 days)

### Modified Tables

**No modifications to existing tables required.**

*Note: `bands` table already has `looking_for` field. No schema changes needed, but we should ensure an index exists for queries filtering on non-null `looking_for`.*

### New Indexes

#### `bands` Table Index (if not already exists)

```sql
-- Speed up queries filtering bands with non-empty looking_for
CREATE INDEX idx_bands_looking_for ON bands(looking_for) WHERE looking_for IS NOT NULL AND looking_for != '';
```

**Purpose**: Partial index to speed up discovery queries that filter for bands actively recruiting

**Impact**: Improves query performance from O(n) to O(log n) when filtering bands with `looking_for IS NOT NULL`

## Edge Cases

### What happens when...

1. **User has incomplete profile (missing instruments/genres/location)?**
   - API returns 400 error with `missingFields` array
   - Frontend shows "Complete your profile" empty state
   - User clicks "Complete Profile" → navigates to settings

2. **User has complete profile but no bands match (score < 20)?**
   - API returns empty `bands` array with `totalResults: 0`
   - Frontend shows "No matches found" empty state
   - User clicks "Search All Bands" → navigates to manual search

3. **User is in remote location with no nearby bands?**
   - Distance scoring contributes 0 points (but instrument/genre still count)
   - Bands with instrument/genre matches still appear (minimum score: 20)
   - If no matches at all, show "No matches found" empty state

4. **Band's "looking for" field is empty or null?**
   - Band is excluded from discovery results (filtered at database level)
   - Band doesn't appear in any user's discovery feed

5. **Band's "looking for" text doesn't clearly mention instruments?**
   - Instrument match scoring may miss the band (algorithm limitation)
   - Genre/location matches may still surface the band (partial match)
   - Future improvement: NLP/keyword extraction on "looking for" text

6. **User has no additional instruments (only primary)?**
   - Scoring works normally with just primary instrument
   - Max instrument score: 50 points (vs 75 if additional instruments matched)

7. **User has no secondary genres (only primary)?**
   - Scoring works normally with just primary genre
   - Max genre score: 30 points (vs 45 if secondary genres matched)

8. **Multiple bands have identical match scores?**
   - Sort by `createdAt` DESC (newer bands first) as tiebreaker
   - Ensures consistent ordering across requests

9. **User paginates beyond available results?**
   - API returns empty `bands` array for pages beyond `totalPages`
   - Frontend disables "Next" button on last page

10. **Request fails (timeout, database error)?**
    - API returns 500 error
    - Frontend shows error state with "Retry" button
    - User clicks "Retry" → refetches data

11. **User has travel_radius set to very small value (e.g., 5 miles)?**
    - Distance scoring only awards points for bands within travel_radius + 50 miles buffer
    - User may see fewer results but still get some recommendations
    - If no matches, show "No matches found" empty state

12. **Band location is missing (no lat/long)?**
    - Distance scoring contributes 0 points for that band
    - Band can still appear if instrument/genre matches are strong enough

13. **User applies to band from discovery feed, then revisits feed?**
    - Band still appears in feed (no automatic filtering of applied bands)
    - Band profile page shows "Application Pending" status when user visits
    - Future enhancement: Filter out applied bands or deprioritize them

14. **User is not logged in?**
    - API returns 401 Unauthorized
    - Frontend redirects to login page

15. **User logs in on multiple devices simultaneously?**
    - Discovery feed may return different results if profile was updated on another device
    - Each device fetches fresh data on page load (no cross-device state sync)

## Validation Rules

### Client-Side (Immediate Feedback)

1. **Profile Completeness Check** (before rendering discovery page):
   - Required fields: `primaryInstrument`, `primaryGenre`, `city`
   - If missing, show "Complete profile" empty state immediately (no API call)

2. **Pagination Validation**:
   - `page`: Must be positive integer
   - `limit`: Must be positive integer, max 50
   - Disable "Next" button if on last page
   - Disable "Previous" button if on first page

### Server-Side (Security & Business Logic)

1. **Authentication**:
   - User must be logged in (check session/JWT)
   - User ID must match authenticated user (can't request another user's recommendations)

2. **Profile Completeness**:
   - Query user profile from database
   - Validate required fields: `primaryInstrument`, `primaryGenre`, `city`
   - Return 400 error if incomplete with list of missing fields

3. **Pagination Validation**:
   - `page`: Must be integer, min 1, max 1000 (prevent abuse)
   - `limit`: Must be integer, min 1, max 50 (prevent excessive data transfer)
   - Return 400 error if invalid

4. **Band Filtering**:
   - Only include bands where `looking_for IS NOT NULL AND looking_for != ''`
   - Only include bands with valid location data (city, state, country)

5. **Rate Limiting**:
   - Max 30 requests per minute per user (prevent abuse)
   - Return 429 Too Many Requests if exceeded

## Error Handling

### User-Facing Errors

| Scenario | Error Message | Action |
|----------|---------------|--------|
| Profile incomplete | "Complete your profile to discover bands. We need your instruments, genres, and location." | Show CTA: "Complete Profile" |
| No matches found | "No bands match your profile right now. Check back later or try manual search." | Show CTA: "Search All Bands" |
| Network timeout | "Failed to load recommendations. Please check your connection and try again." | Show CTA: "Retry" |
| Server error (500) | "Something went wrong on our end. Please try again in a few moments." | Show CTA: "Retry" |
| Rate limit exceeded (429) | "You're checking too frequently. Please wait a moment before refreshing." | Show countdown timer |
| Unauthorized (401) | "Please log in to discover bands." | Redirect to login |

### Developer Errors (Log, Don't Display)

| Scenario | Log Message | Alert |
|----------|-------------|-------|
| Database query fails | `[ERROR] Discovery feed query failed: ${error.message}` | Sentry alert |
| Distance calculation error | `[WARN] Failed to calculate distance for band ${bandId}: ${error}` | Log only (skip distance scoring) |
| Missing geocoding data | `[WARN] Band ${bandId} missing lat/long, skipping distance scoring` | Log only |
| Invalid match_reasons JSON | `[ERROR] Failed to parse match_reasons for analytics: ${error}` | Sentry alert |

## Performance Considerations

### Expected Load
- **Active users**: 10,000 DAU
- **Discovery feed visits**: 30% of DAU = 3,000 visits/day = ~2 requests/minute (peak: 10 req/min)
- **Bands in database**: 1,000-10,000 bands
- **Query complexity**: O(n) where n = number of bands (must calculate score for each band)

### Query Optimization

1. **Filter Early** (database level):
   - Only fetch bands with `looking_for IS NOT NULL AND looking_for != ''`
   - Only fetch bands with valid location data (for distance calculation)
   - Reduces dataset by ~50% before scoring

2. **Eager Loading**:
   - Load follower counts and member counts in single query (avoid N+1)
   - Use `COUNT` subqueries or join with aggregations

3. **Limit Result Set**:
   - Only calculate scores for top 100 bands (sorted by some heuristic)
   - Then sort by score and paginate
   - Trade-off: May miss some high-scoring bands if heuristic is poor
   - Alternative: Calculate all scores in parallel (Go-style concurrency)

4. **Index Usage**:
   - Index on `bands.looking_for` (partial index WHERE looking_for IS NOT NULL)
   - Index on `bands.primary_genre` (existing)
   - Index on `bands.latitude, bands.longitude` (existing)

5. **Caching** (Future Enhancement):
   - Cache match scores for 15 minutes per user
   - Invalidate cache when user updates profile or bands are added/updated
   - Reduces load by ~80% for repeat visitors

### Rate Limiting
- **Per-user limit**: 30 requests/minute
- **Global limit**: 200 requests/minute (burst protection)
- **Implementation**: Cloudflare Workers rate limiting or in-memory counter

### Performance Target
- **Response time**: < 800ms for 1,000 bands (p95)
- **Database query time**: < 300ms
- **Scoring computation**: < 400ms (in-memory calculation)
- **Network overhead**: < 100ms

### Monitoring
- Track p50, p95, p99 response times
- Alert if p95 > 1000ms
- Track query execution time separately
- Log slow queries (> 500ms) for optimization

## Testing Checklist

### Functional Tests

- [ ] User with complete profile sees discovery feed with matched bands
- [ ] User with incomplete profile sees "Complete profile" empty state
- [ ] User with no matches sees "No matches found" empty state
- [ ] Bands are sorted by match score (highest first)
- [ ] Match score badge displays correct percentage and color
- [ ] Match reasons display top 2 factors (instrument, genre, distance)
- [ ] Distance is calculated correctly (within 1 mile accuracy)
- [ ] Clicking band card navigates to band profile page
- [ ] Pagination controls work (next/previous, page numbers)
- [ ] "Complete Profile" CTA navigates to settings
- [ ] "Search All Bands" CTA navigates to band search

### Edge Case Tests

- [ ] User with only primary instrument (no additional) sees correct matches
- [ ] User with only primary genre (no secondary) sees correct matches
- [ ] User in remote location (no nearby bands) sees matches based on genre/instrument
- [ ] Band with empty "looking for" field does NOT appear in results
- [ ] Band with missing location data (no lat/long) appears but without distance scoring
- [ ] Multiple bands with identical scores are sorted consistently (by createdAt DESC)
- [ ] Paginating beyond last page returns empty results
- [ ] Paginating with page=0 returns error
- [ ] Paginating with limit>50 returns error
- [ ] Unauthenticated user is redirected to login

### API Tests

- [ ] `GET /api/discover/bands` returns 200 with valid response structure
- [ ] `GET /api/discover/bands?page=2&limit=12` returns correct page
- [ ] `GET /api/discover/bands` returns 400 if profile incomplete
- [ ] `GET /api/discover/bands` returns 401 if unauthenticated
- [ ] `GET /api/discover/bands` returns 429 if rate limit exceeded
- [ ] Match score calculation is correct for various scenarios (unit tests)
- [ ] Distance calculation matches expected haversine results
- [ ] Bands with empty "looking for" are filtered out

### Performance Tests

- [ ] Discovery feed loads in < 800ms with 1,000 bands (p95)
- [ ] Database query executes in < 300ms
- [ ] Page is responsive (TBT < 200ms, LCP < 2.5s)
- [ ] No N+1 queries (check query logs)
- [ ] Rate limiting works correctly (429 after 30 requests/minute)

### Analytics Tests

- [ ] `band_discovery_page_view` event fires on page load
- [ ] `band_discovery_card_click` event fires when clicking band card
- [ ] `band_discovery_application` event fires when applying from discovery feed
- [ ] `band_discovery_pagination` event fires when navigating pages
- [ ] Analytics data is stored correctly in database
- [ ] Match reasons are stored as valid JSON

### Accessibility Tests

- [ ] Keyboard navigation works (tab through cards, enter to open)
- [ ] Screen reader announces match score and reasons
- [ ] Color contrast meets WCAG 2.1 AA (match score badges)
- [ ] Focus indicators are visible on all interactive elements

### Mobile Tests

- [ ] Discovery feed is responsive (1 column on mobile, 3 on desktop)
- [ ] Cards are touch-friendly (min 44x44px touch targets)
- [ ] Pagination controls are accessible on small screens
- [ ] Page loads quickly on 3G connection (< 3s)

## Security Considerations

- [x] **Authentication Required**: Only logged-in users can access discovery feed
- [x] **Authorization**: Users can only request their own recommendations (enforced via `c.get('user')`)
- [x] **Input Sanitization**: Validate and sanitize all query parameters (page, limit)
- [x] **Rate Limiting**: 30 requests/minute per user to prevent abuse
- [x] **SQL Injection Prevention**: Use parameterized queries (Drizzle ORM handles this)
- [x] **XSS Prevention**: Sanitize band "looking_for" text before displaying (React escapes by default)
- [x] **Data Exposure**: Only expose public band data (no private fields like admin emails)
- [x] **Privacy**: Don't reveal which users viewed which bands (analytics are aggregate only)
- [x] **CSRF Protection**: API requires authentication token (Cloudflare Workers session)

## Rollout Plan

### Phase 1: MVP Launch (Week 1-2)

**Build**:
1. Implement match scoring algorithm with real-time calculation
2. Build `GET /api/discover/bands` endpoint
3. Create discovery feed UI components
4. Add analytics tracking
5. Write unit tests and E2E tests
6. Deploy to staging and QA

**Ship**:
- Deploy to production
- Enable for 100% of users (no gradual rollout needed for low-risk feature)
- Announce in app and email newsletter

**Monitor**:
- Track error rates (aim for < 1%)
- Track response times (aim for < 800ms p95)
- Track engagement: page views, click-through rate, application rate

### Phase 2: Optimize Algorithm (Week 3-4)

**Based on analytics data**:
1. Analyze which match factors correlate with applications (instrument vs genre vs distance)
2. Adjust scoring weights to optimize conversion
3. Identify false positives (low CTR) and false negatives (missed matches)
4. Tune minimum score threshold (currently 20 points)

**A/B Test**:
- Test different scoring weights (50/30/20 vs 60/25/15 vs 40/40/20)
- Measure impact on application rate and CTR
- Roll out winning variant

### Phase 3: Performance & Scale (Week 5-6)

**If performance issues arise**:
1. Implement score caching (15-minute TTL per user)
2. Add background job to precompute scores daily
3. Optimize database queries (add indexes, denormalize data)

**If dataset grows (>10k bands)**:
1. Limit scoring to top 500 bands by heuristic (genre + location filter first)
2. Consider moving to dedicated search service (Algolia, Meilisearch)

### Phase 4: Feature Enhancements (Future)

**User Feedback**:
- Add filters (genre, distance)
- Add "Not Interested" feedback to improve algorithm
- Add "Save for Later" bookmarking
- Add push notifications for new matches

**Reciprocal Discovery**:
- Build "Musicians Looking for Bands" feed for band admins
- Show band admins which musicians match their "looking for" criteria

## Metrics to Track

### Product Metrics (Primary)

1. **Discovery Feed Adoption**:
   - Definition: % of active musicians who visit `/discover/bands` in their first week
   - Target: 40%+
   - Measurement: `COUNT(DISTINCT user_id WHERE event_type='page_view') / COUNT(DISTINCT active_users)`

2. **Application Conversion Rate**:
   - Definition: % of discovery feed visitors who submit at least one application
   - Target: 15%+
   - Measurement: `COUNT(DISTINCT user_id WHERE event_type='application') / COUNT(DISTINCT user_id WHERE event_type='page_view')`

3. **Click-Through Rate (CTR)**:
   - Definition: % of band cards clicked (top 3 recommendations)
   - Target: 60%+
   - Measurement: `COUNT(event_type='card_click' WHERE position_in_feed <= 3) / COUNT(page_views) / 3`

4. **Application Volume Increase**:
   - Definition: Applications from discovery vs manual search
   - Target: 5-10x more applications from discovery
   - Measurement: `COUNT(applications WHERE source='discovery') / COUNT(applications WHERE source='search')`

### Engagement Metrics (Secondary)

5. **Repeat Visit Rate**:
   - Definition: % of users who visit discovery feed 3+ times in 30 days
   - Target: 25%+
   - Measurement: `COUNT(user_id WHERE visit_count >= 3) / COUNT(DISTINCT user_id)`

6. **Average Cards Viewed**:
   - Definition: Avg number of band cards viewed per session
   - Target: 12+ (at least one full page)
   - Measurement: `AVG(position_in_feed)` across all card_click events

7. **Pagination Depth**:
   - Definition: Avg number of pages viewed per session
   - Target: 1.5+ (users explore beyond first page)
   - Measurement: `AVG(MAX(page_number))` per user session

### Quality Metrics (Optimization)

8. **Match Factor Correlation**:
   - Definition: Which match factors lead to applications?
   - Measurement: Correlation analysis between `match_reasons` and `application` events
   - Use to: Optimize scoring weights

9. **Score Distribution**:
   - Definition: Distribution of match scores across all recommendations
   - Target: Bell curve with peak at 50-70 points
   - Measurement: Histogram of `match_score` values

10. **False Negative Rate**:
    - Definition: % of manual search applications that should've been in discovery feed
    - Measurement: Cross-check applied bands from search vs their match scores
    - Use to: Lower minimum score threshold if too many missed matches

### Technical Metrics (Performance)

11. **Response Time**:
    - Definition: p50, p95, p99 latency for `/api/discover/bands`
    - Target: p95 < 800ms
    - Alert: If p95 > 1000ms for 5 minutes

12. **Error Rate**:
    - Definition: % of requests that return 4xx or 5xx errors
    - Target: < 1%
    - Alert: If > 2% for 5 minutes

13. **Cache Hit Rate** (future):
    - Definition: % of requests served from cache vs computed
    - Target: 80%+ (when caching is implemented)

### Dashboard

**Weekly Report**:
- Discovery feed visits (total, unique users)
- Applications from discovery (count, conversion rate)
- CTR (overall, top 3 cards)
- Average match score of applied bands
- p95 response time
- Error rate

**Monthly Analysis**:
- Cohort retention (repeat visit rate)
- Match factor correlation (which factors drive applications)
- A/B test results (if running experiments)

## Open Questions

### Product Decisions (User to Decide)

1. **Should we show bands where user has already applied?**
   - Option A: Show all matches (user may reapply if rejected)
   - Option B: Hide applied bands (cleaner feed, but may miss opportunities)
   - Option C: Show with "Applied" badge (user awareness, less clutter)
   - **Recommendation**: Option C (show with badge)

2. **Should we allow users to "hide" bands from their feed?**
   - Option A: No hiding (simplest)
   - Option B: "Not Interested" button (improves algorithm over time)
   - **Recommendation**: Option A for MVP, Option B for Phase 4

3. **Should we show match score as percentage or label?**
   - Option A: Percentage (e.g., "85% Match")
   - Option B: Label (e.g., "Great Match", "Good Match", "Fair Match")
   - **Recommendation**: Option A (more transparent, easier to understand)

4. **Should we sort by match score only, or combine with recency?**
   - Option A: Pure match score (best matches first)
   - Option B: Weighted by recency (e.g., 80% score + 20% recency)
   - **Recommendation**: Option A for MVP (users trust pure algorithmic ranking)

### Technical Decisions (Implementation to Decide)

1. **Cache strategy: TTL vs invalidation-based?**
   - Option A: No caching (simplest, always fresh)
   - Option B: 15-minute TTL (balance freshness and performance)
   - Option C: Invalidation on profile update (complex, best UX)
   - **Recommendation**: Option A for MVP, Option B if performance issues

2. **Should we limit scoring to top N bands or score all?**
   - Option A: Score all bands (accurate but slower for large datasets)
   - Option B: Heuristic filter first (e.g., genre + location), then score top 500
   - **Recommendation**: Option A for MVP (< 10k bands is manageable)

3. **Analytics storage: Database vs external service?**
   - Option A: Store in D1 database (simplest, sufficient for analytics)
   - Option B: Send to external analytics service (e.g., Mixpanel, Segment)
   - **Recommendation**: Option A for MVP (keeps everything in-house)

## Dependencies

### Requires (Blockers)

1. **User profiles must have complete data**:
   - Instruments (primary + additional)
   - Genres (primary + secondary)
   - Location (city, lat/long)
   - Users without this data cannot use discovery feed

2. **Bands must have "looking for" field populated**:
   - Bands with empty "looking for" are excluded
   - Band admins should be prompted to fill this field

3. **Geocoding must be working**:
   - Distance calculation requires lat/long for users and bands
   - Fallback: Show bands without distance if geocoding fails

### Enables (Unlocks)

1. **Reciprocal Band Discovery**:
   - Once we have user discovery feed, we can build "Musicians looking for bands" feed for band admins
   - Reuses same scoring logic in reverse

2. **Personalized Notifications**:
   - "New bands match your profile" push notifications
   - Requires discovery feed to be built first

3. **Recommendation Engine**:
   - Discovery feed provides data for training recommendation models
   - Analytics track which factors predict successful applications

---

**Estimated Effort**: 8-10 days (1 backend dev + 1 frontend dev)

**Priority**: High (key retention and activation feature)

**Owner**: [To be assigned]
