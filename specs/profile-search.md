# Feature: Advanced Profile Search (Musician Discovery)

## Problem Statement

Musicians using Sound Connect need a way to discover other musicians based on specific criteria (instruments, location, genres, availability). Currently, there is no dedicated discovery mechanism, forcing users to manually browse profiles or rely on connections they already have. This makes it difficult for:

- Band leaders to find musicians with specific instruments/skills in their area
- Musicians looking for bands to discover opportunities matching their preferences
- New users to build their network and find relevant connections

The lack of a discovery feature significantly limits the platform's core value proposition: helping musicians connect through music.

## Success Criteria

1. Users can filter musicians by instruments, location with radius, genres, and availability status
2. Search results display in a visual card grid showing key profile information
3. Location-based search calculates distance accurately using geocoding
4. Results are relevant (match all selected filters with proper ranking)
5. Page loads quickly (< 1s for initial load, < 500ms for filter changes)
6. Mobile-responsive with accessible filter controls
7. Users can navigate to profiles and initiate messages from search results
8. Graceful degradation when geocoding fails (falls back to text matching)

**Measurable Success:**
- 50%+ of weekly active users perform at least one search
- 30%+ click-through rate from search results to profiles
- 15%+ of profile views from search lead to messages or connections

## User Stories

- As a band leader, I want to search for bassists in Chicago within 25 miles so that I can find local musicians to audition
- As a guitarist looking for opportunities, I want to filter by "actively looking" status and rock/metal genres so that I see only serious opportunities
- As a new user, I want to browse musicians with similar interests so that I can start building my network
- As a mobile user, I want to easily apply filters from my phone so that I can search while on the go
- As a user in a small town, I want to search by instrument only (no location filter) so that I can see all relevant musicians regardless of location

## Scope

### In Scope (MVP)

- Dedicated `/musicians` discovery page
- Filter by:
  - Instruments (multi-select, searchable dropdown) - matches primary OR additional instruments
  - Location (city input + radius in miles: 5, 10, 25, 50, 100)
  - Genres (multi-select checkboxes) - matches primary OR secondary genres
  - Availability status (multi-select checkboxes)
- "Search Musicians" button to apply filters
- Default search: show all profiles sorted by last active
- Paginated results (12 per page)
- Visual card grid displaying:
  - Profile image (with fallback)
  - Name and primary instrument
  - Location (city, state)
  - Primary genre + up to 2 secondary genres
  - Availability status badge (color-coded)
  - Profile completion percentage
  - "View Profile" and "Message" buttons
- Responsive layout (1 column mobile, 3-4 columns desktop)
- Filter sidebar (desktop) / collapsible drawer (mobile)
- Geocoding cache to store city → lat/lng conversions
- Graceful fallback when geocoding fails (text-based city matching)
- Ranking: Primary instrument matches ranked higher than additional instrument matches
- Empty state ("No musicians match your filters")
- Loading states for initial load and filter changes
- "Find Musicians" link in main navigation

### Out of Scope (Future Iterations)

- Saved searches
- Search history
- Email/push notifications for new matches
- Map view of results
- Distance-based sorting (beyond filtering by radius)
- Advanced filters (experience level, age range, equipment owned)
- "Similar musicians" recommendations
- Search analytics dashboard for users
- Keyword search in bio/description
- Export search results

## User Flow

1. User clicks "Find Musicians" in main navigation
2. Page loads at `/musicians` with default results (all profiles, sorted by last active)
3. User interacts with filters:
   - Selects instruments from searchable dropdown (e.g., "Bass Guitar", "Vocals")
   - Enters city name and selects radius (e.g., "Chicago" + "25 miles")
   - Selects genres from checkboxes (e.g., "Rock", "Metal", "Blues")
   - Selects availability statuses (e.g., "Actively Looking", "Open to Offers")
4. User clicks "Search Musicians" button
5. System validates input, applies filters, and displays results
6. User browses results in card grid
7. User can:
   - Click "View Profile" to see full profile
   - Click "Message" to start conversation
   - Scroll down to load more results (pagination)
   - Modify filters and search again

### Edge Case Flows

**No location provided:**
- Location filter is optional
- If omitted, show all users regardless of location

**Geocoding fails (API timeout, invalid city, rate limit):**
- Fall back to exact text matching on city name (no radius)
- Show warning: "Location search unavailable, showing city name matches only"

**No results:**
- Display empty state: "No musicians match your filters. Try broadening your search criteria."
- Suggest: Remove some filters or increase radius

**User has no location in profile:**
- If location filter is NOT applied: Include them in results
- If location filter IS applied: Exclude them from results

**Slow geocoding:**
- Show loading skeleton for results while geocoding
- Cache result immediately after successful geocoding

## UI Requirements

### Components Needed

**Page Layout:**
- `/musicians` route component
- Two-column layout (filters + results) on desktop
- Single-column with drawer on mobile

**Filter Sidebar/Drawer:**
- `ProfileSearchFilters` component
  - Instruments multi-select (searchable dropdown using ShadCN Combobox)
  - Location input (text) + radius select (dropdown)
  - Genres multi-select (checkboxes in scrollable container)
  - Availability status multi-select (checkboxes)
  - "Search Musicians" button (primary CTA)
  - "Clear Filters" button (secondary, resets all)
- Mobile: Collapsible drawer with "Filters" button to open/close

**Results Grid:**
- `ProfileSearchResults` component
  - Responsive grid (1 col mobile, 2-3 cols tablet, 3-4 cols desktop)
  - Pagination controls at bottom
  - Results count ("42 musicians found")
- `ProfileSearchCard` component (see below)

**Search Result Card (`ProfileSearchCard`):**
- Profile image (circular, 80x80, with fallback to initials)
- Name (text-lg, font-semibold)
- Primary instrument label (text-sm, muted)
- Location (city, state) (text-sm, with location icon)
- Genre tags (max 3, badge style)
- Availability status badge (color-coded, positioned top-right):
  - "Actively Looking" → Green
  - "Open to Offers" → Blue
  - "Not Looking" → Gray
  - "Just Browsing" → Yellow
- Profile completion bar/percentage (if < 100%)
- Action buttons:
  - "View Profile" (secondary button)
  - "Message" (primary button)

### States

**Loading State:**
- Show skeleton cards (12 placeholders) while fetching results
- Disable filter controls during search

**Empty State:**
- Icon: Search with magnifying glass and empty folder
- Heading: "No musicians match your filters"
- Description: "Try broadening your search criteria or removing some filters."
- Action: "Clear All Filters" button

**Error State:**
- Icon: Alert triangle
- Heading: "Unable to load search results"
- Description: Error message (e.g., "Network error. Please try again.")
- Action: "Retry Search" button

**Success State:**
- Display results grid with count ("42 musicians found")
- Show pagination if more than 12 results

**Geocoding Fallback State:**
- Show warning banner: "Location search is temporarily unavailable. Showing results based on city name only."
- Continue displaying results with text-based city matching

### Interactions

**Filter Application:**
- User modifies filters → No immediate search (wait for button click)
- User clicks "Search Musicians" → Apply filters, show loading, fetch results

**Clear Filters:**
- User clicks "Clear Filters" → Reset all filter values to defaults, trigger search

**Pagination:**
- User scrolls to bottom → "Load More" button appears
- User clicks "Load More" → Fetch next page, append to results

**View Profile:**
- User clicks "View Profile" on card → Navigate to `/profile/[userId]`

**Message:**
- User clicks "Message" on card → Navigate to `/messages` with conversation started (or new message modal)

**Mobile Drawer:**
- User taps "Filters" button → Drawer slides up from bottom
- User applies filters and clicks "Search" → Drawer closes, results update

**Accessibility:**
- All interactive elements keyboard-navigable (Tab order: filters → search button → results → pagination)
- Filter inputs have proper labels and ARIA attributes
- Screen reader announces results count after search
- Focus management: After search, focus moves to results heading
- Color contrast meets WCAG 2.1 AA (4.5:1 for text, 3:1 for UI components)

## API Requirements

### Endpoints Needed

#### `GET /api/profiles/search`

**Purpose:** Search for musician profiles with filters

**Auth:** Optional (public endpoint, but may show different results for authenticated users in future)

**Query Parameters:**

```typescript
{
  instruments?: string[];        // Array of instrument names (e.g., ["bass_guitar", "vocals"])
  genres?: string[];             // Array of genre names (e.g., ["rock", "metal"])
  city?: string;                 // City name for location search (e.g., "Chicago")
  radius?: number;               // Search radius in miles (5, 10, 25, 50, 100)
  availabilityStatus?: string[]; // Array of statuses (e.g., ["actively_looking", "open_to_offers"])
  page?: number;                 // Page number (default: 1)
  limit?: number;                // Results per page (default: 12, max: 50)
}
```

**Response (200 OK):**

```json
{
  "results": [
    {
      "userId": "user123",
      "name": "John Doe",
      "email": "john@example.com",
      "image": "https://...",
      "primaryInstrument": "bass_guitar",
      "yearsPlayingPrimary": 10,
      "primaryGenre": "rock",
      "secondaryGenres": ["metal", "blues"],
      "status": "actively_looking",
      "city": "Chicago",
      "state": "IL",
      "country": "USA",
      "profileCompletion": 85,
      "distance": 12.5,  // Only if location filter applied
      "matchedInstrumentType": "primary"  // "primary" or "additional"
    },
    // ... more results
  ],
  "pagination": {
    "page": 1,
    "limit": 12,
    "total": 42,
    "totalPages": 4,
    "hasMore": true
  }
}
```

**Validation:**
- `instruments`: Optional, each value must be in InstrumentEnum
- `genres`: Optional, each value must be in GenreEnum
- `city`: Optional, min 2 chars, max 100 chars
- `radius`: Optional, one of [5, 10, 25, 50, 100]
- `availabilityStatus`: Optional, each value must be in AvailabilityStatusEnum
- `page`: Optional, positive integer, default 1
- `limit`: Optional, integer between 1-50, default 12
- If `radius` provided, `city` is required
- If `city` provided without `radius`, default radius to 25 miles

**Errors:**

- `400 Bad Request`: Invalid query parameters
  - "Invalid instrument: must be one of [...]"
  - "Invalid genre: must be one of [...]"
  - "Invalid radius: must be one of [5, 10, 25, 50, 100]"
  - "Radius requires city to be provided"
- `429 Too Many Requests`: Rate limit exceeded (100 requests per minute per IP)
- `500 Internal Server Error`: Database or geocoding service failure

**Performance Considerations:**
- Use database indexes on: `primary_instrument`, `primary_genre`, `city`, `status`
- Cache geocoding results for 30 days
- Limit results to 50 per page maximum
- Use EXPLAIN to optimize query plan

#### `GET /api/geocoding/lookup`

**Purpose:** Convert city name to latitude/longitude coordinates (internal API, called by profiles/search)

**Auth:** Internal only (not exposed publicly)

**Query Parameters:**

```typescript
{
  city: string;    // City name (e.g., "Chicago, IL")
}
```

**Response (200 OK):**

```json
{
  "city": "Chicago",
  "state": "IL",
  "country": "USA",
  "latitude": 41.8781,
  "longitude": -87.6298,
  "cached": true
}
```

**Errors:**
- `400 Bad Request`: Missing or invalid city parameter
- `404 Not Found`: City not found in geocoding service
- `429 Too Many Requests`: Geocoding API rate limit
- `500 Internal Server Error`: Geocoding service failure

**Fallback Strategy:**
- If geocoding fails → Return `null` to trigger text-based fallback
- Log error for monitoring

## Database Changes

### New Table: `geocoding_cache`

**Purpose:** Cache city name → lat/lng conversions to reduce external API calls and improve performance

**Schema:**

```sql
CREATE TABLE geocoding_cache (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  city TEXT NOT NULL,
  state TEXT,
  country TEXT,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX idx_geocoding_cache_location ON geocoding_cache(city, state, country);
CREATE INDEX idx_geocoding_cache_created_at ON geocoding_cache(created_at);
```

**Drizzle Schema (packages/drizzle/src/schema.ts):**

```typescript
export const geocodingCacheTable = sqliteTable(
  'geocoding_cache',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    city: text('city').notNull(),
    state: text('state'),
    country: text('country'),
    latitude: real('latitude').notNull(),
    longitude: real('longitude').notNull(),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull()
  },
  (table) => ({
    locationIdx: index('idx_geocoding_cache_location').on(table.city, table.state, table.country),
    createdAtIdx: index('idx_geocoding_cache_created_at').on(table.createdAt)
  })
);
```

**Cache Strategy:**
- TTL: 30 days (refresh stale entries on demand)
- Lookup order: Cache first → External API → Fallback to text matching
- Eviction: Delete entries older than 90 days (periodic cleanup job)

### Modified Tables: None

All required columns already exist in `user_profiles` table:
- `primary_instrument`
- `primary_genre`
- `secondary_genres`
- `status` (availability status)
- `city`, `state`, `country`

### Indexes Needed: Already Exist

From schema.ts, these indexes are already defined:
- `idx_user_profiles_status` → For availability status filtering
- `idx_user_profiles_primary_genre` → For genre filtering
- `idx_user_profiles_city` → For location filtering

Additional index to consider adding:
- `idx_user_additional_instruments_instrument` → Already exists for additional instruments filtering

## Query Strategy

### Search Query Logic

**Base Query:**
```sql
SELECT DISTINCT
  u.id as userId,
  u.name,
  u.email,
  u.image,
  up.primary_instrument,
  up.years_playing_primary,
  up.primary_genre,
  up.secondary_genres,
  up.status,
  up.city,
  up.state,
  up.country,
  up.profile_completion
FROM users u
INNER JOIN user_profiles up ON u.id = up.user_id
LEFT JOIN user_additional_instruments uai ON u.id = uai.user_id
WHERE up.setup_completed = 1
```

**Apply Filters Conditionally:**

1. **Instruments filter** (if provided):
```sql
AND (
  up.primary_instrument IN (?)
  OR uai.instrument IN (?)
)
```

2. **Genres filter** (if provided):
```sql
AND (
  up.primary_genre IN (?)
  OR up.secondary_genres LIKE '%genre1%'
  OR up.secondary_genres LIKE '%genre2%'
)
```

3. **Availability status filter** (if provided):
```sql
AND up.status IN (?)
```

4. **Location filter** (if city + radius provided):
```sql
AND (
  (
    -- Haversine distance formula
    6371 * 2 * ASIN(SQRT(
      POWER(SIN((RADIANS(?) - RADIANS(latitude)) / 2), 2) +
      COS(RADIANS(?)) * COS(RADIANS(latitude)) *
      POWER(SIN((RADIANS(?) - RADIANS(longitude)) / 2), 2)
    ))
  ) <= ?  -- radius in km (convert miles to km: miles * 1.60934)
)
```

**Note:** SQLite doesn't have built-in lat/lng columns in user_profiles. We'll need to:
- Add `latitude` and `longitude` columns to `user_profiles` table, OR
- Join with `geocoding_cache` table to get coordinates for user's city, OR
- Implement distance calculation in application code (fetch all matching city users, then filter by distance)

**Recommended Approach:** Add `latitude` and `longitude` to `user_profiles` and populate them when user sets city (or backfill via migration).

5. **Location filter fallback** (if geocoding fails):
```sql
AND up.city = ?  -- Exact text match
```

**Ranking/Ordering:**
```sql
ORDER BY
  CASE WHEN up.primary_instrument IN (?) THEN 0 ELSE 1 END,  -- Primary matches first
  u.last_active_at DESC  -- Then by recent activity
```

**Pagination:**
```sql
LIMIT ? OFFSET ?
```

### Count Query (for pagination):
```sql
SELECT COUNT(DISTINCT u.id)
FROM users u
INNER JOIN user_profiles up ON u.id = up.user_id
LEFT JOIN user_additional_instruments uai ON u.id = uai.user_id
WHERE [same filters as search query]
```

## Edge Cases

### Data Edge Cases

1. **User has no location set:**
   - **Behavior:** Include in results if location filter is NOT applied; exclude if location filter IS applied
   - **Implementation:** Check `city IS NOT NULL` when location filter active

2. **User has incomplete profile:**
   - **Behavior:** Include in results (show profile completion percentage)
   - **Rationale:** Even incomplete profiles are valuable for discovery

3. **Secondary genres stored as JSON/text:**
   - **Behavior:** Parse secondary_genres field (comma-separated or JSON array) and match against filter
   - **Implementation:** Use `LIKE '%genre%'` for each genre or parse in application code

4. **Multiple instruments selected:**
   - **Behavior:** Match users with ANY of the selected instruments (OR logic)
   - **Implementation:** `IN (?)` clause for both primary and additional instruments

5. **No filters applied:**
   - **Behavior:** Show all profiles, sorted by last active
   - **Rationale:** Allows browsing without specific criteria

6. **Very long city names or special characters:**
   - **Validation:** Max 100 chars, sanitize input to prevent SQL injection
   - **Geocoding:** Handle unicode characters properly

### Network Edge Cases

1. **Geocoding API timeout:**
   - **Behavior:** Fall back to exact city text matching (no radius)
   - **UX:** Show warning banner: "Location search temporarily unavailable"
   - **Logging:** Log error for monitoring

2. **Geocoding API rate limit:**
   - **Behavior:** Use cached results only; show error if city not in cache
   - **UX:** Show error: "Unable to search this location. Try again later."
   - **Mitigation:** Cache aggressively, use free tier wisely

3. **Database query timeout:**
   - **Behavior:** Return 500 error
   - **UX:** Show error state with retry button
   - **Mitigation:** Optimize queries, add indexes, set reasonable timeout (5s)

4. **Slow network (mobile):**
   - **UX:** Show loading skeleton immediately
   - **Mitigation:** Optimize response payload size (only return needed fields)

### User Edge Cases

1. **User searches for very common criteria (e.g., "Guitar, Rock, Actively Looking"):**
   - **Result:** 1000+ results
   - **Behavior:** Paginate results, show first 12
   - **UX:** Suggest narrowing filters ("Too many results? Try adding location or more genres.")

2. **User searches for very rare criteria:**
   - **Result:** 0 results
   - **Behavior:** Show empty state with suggestions
   - **UX:** "No musicians match your filters. Try broadening your search."

3. **User enters invalid city name (e.g., "asdfasdf"):**
   - **Geocoding:** Returns 404
   - **Behavior:** Fall back to text matching (will likely return 0 results)
   - **UX:** Include hint: "Can't find location? Try 'City, State' format."

4. **User is not logged in:**
   - **Behavior:** Allow search (public feature)
   - **Limitation:** "Message" button requires login (redirect to sign in)

5. **User searches from mobile with slow connection:**
   - **UX:** Show loading skeleton, disable filters during search
   - **Optimization:** Reduce image sizes in results

### Timing Edge Cases

1. **User navigates away during search:**
   - **Behavior:** Cancel pending request (AbortController)
   - **Cleanup:** Clear loading state

2. **User clicks "Search" multiple times quickly:**
   - **Behavior:** Debounce button (disable for 500ms after click)
   - **Mitigation:** Show loading state immediately

3. **Cached geocoding data becomes stale:**
   - **Behavior:** Refresh cache entry if > 30 days old
   - **Process:** Async update (don't block search)

## Validation Rules

### Client-Side (Immediate Feedback)

- **Instruments:** Optional, each must be from predefined list (InstrumentEnum)
- **Genres:** Optional, each must be from predefined list (GenreEnum)
- **City:** Optional, 2-100 characters, alphanumeric + spaces/hyphens/commas
- **Radius:** Optional, must be one of [5, 10, 25, 50, 100]
- **Availability Status:** Optional, each must be from predefined list (AvailabilityStatusEnum)
- **Page:** Positive integer, default 1
- **Limit:** Integer 1-50, default 12

**Validation Errors:**
- Show inline error under field
- Disable "Search Musicians" button if validation fails
- Red border on invalid input

### Server-Side (Security)

- Same validation as client-side (never trust client input)
- Sanitize city input to prevent SQL injection
- Rate limiting: 100 requests per minute per IP
- Max page number: 1000 (prevent excessive pagination)
- Max limit: 50 (prevent large payloads)

**Additional Server Checks:**
- If radius provided, city must be provided
- Validate array inputs are actually arrays
- Trim whitespace from text inputs

## Error Handling

### User-Facing Errors

**Scenario: Invalid filter values**
- **Error Message:** "Invalid [filter name]. Please select from the dropdown."
- **Action:** Highlight invalid field, prevent search

**Scenario: Geocoding service unavailable**
- **Error Message:** "Location search is temporarily unavailable. Showing results based on city name only."
- **Display:** Warning banner (yellow background)
- **Action:** Continue with text-based search

**Scenario: No results found**
- **Error Message:** "No musicians match your filters."
- **Suggestion:** "Try broadening your search criteria or removing some filters."
- **Action:** "Clear All Filters" button

**Scenario: Database error**
- **Error Message:** "Unable to load search results. Please try again."
- **Action:** "Retry Search" button
- **Logging:** Log full error stack for debugging

**Scenario: Network timeout**
- **Error Message:** "Request timed out. Please check your connection and try again."
- **Action:** "Retry Search" button

**Scenario: Rate limit exceeded**
- **Error Message:** "Too many requests. Please wait a moment and try again."
- **Action:** Disable search button for 60 seconds

### Developer Errors (Log + Alert)

- Database connection failure → Log to monitoring service, alert on-call
- Geocoding API 500 error → Log error, alert if sustained
- Query timeout (> 5s) → Log slow query for optimization
- Unexpected data format → Log error with sample data

## Performance Considerations

### Query Optimization

- **Use indexes:** All filter fields (instrument, genre, city, status) are indexed
- **Limit result set:** Default 12 per page, max 50
- **Avoid N+1 queries:** Use JOINs to fetch user + profile + additional instruments in single query
- **Query timeout:** Set 5-second timeout on search queries
- **EXPLAIN queries:** Analyze query plan during development to ensure indexes are used

### Caching Strategy

**Geocoding Cache:**
- **Storage:** SQLite table (geocoding_cache)
- **TTL:** 30 days
- **Eviction:** Periodic cleanup job (delete entries > 90 days old)
- **Hit rate target:** 95%+ (most common cities cached quickly)

**Search Results Cache (Future):**
- NOT implemented in MVP
- Consider caching common searches (e.g., "Guitar, Rock, Chicago") in future iteration

### Frontend Optimization

- **Lazy load images:** Use `loading="lazy"` on profile images
- **Image optimization:** Serve appropriately sized images (80x80 for cards)
- **Debounce filter changes:** Even though using search button, debounce rapid clicks
- **Virtualization:** NOT needed for MVP (only 12 cards per page), consider for infinite scroll in future
- **Prefetch next page:** Prefetch page 2 when user scrolls to 50% of current page (future)

### Expected Load

- **Peak usage:** Assume 10% of MAU search per day
- **Example:** 1,000 MAU → 100 searches/day → ~0.07 searches/min (very low)
- **Rate limit:** 100 requests/min per IP is generous for MVP
- **Database load:** SQLite on Cloudflare D1 can handle this easily

### Monitoring

**Metrics to track:**
- Geocoding cache hit rate (target: 95%)
- Search query duration (p50, p95, p99)
- Geocoding API latency
- Empty result rate (% of searches with 0 results)
- Most searched instruments, genres, cities

## Testing Checklist

### Functional Tests

#### Search Functionality
- [ ] Default search (no filters) returns all profiles sorted by last active
- [ ] Instrument filter matches primary instrument users
- [ ] Instrument filter matches additional instrument users
- [ ] Instrument filter ranks primary matches higher than additional
- [ ] Multiple instruments use OR logic (any match)
- [ ] Genre filter matches primary genre
- [ ] Genre filter matches secondary genres (parsed from JSON/text)
- [ ] Multiple genres use OR logic
- [ ] Availability status filter matches correctly
- [ ] Multiple statuses use OR logic
- [ ] Location filter with radius calculates distance correctly
- [ ] Location filter excludes users without location data
- [ ] No location filter includes users without location data

#### Pagination
- [ ] First page shows 12 results (or fewer if total < 12)
- [ ] Page 2 shows next 12 results
- [ ] Pagination metadata is accurate (total, totalPages, hasMore)
- [ ] Last page shows remaining results (< 12)
- [ ] Page beyond total pages returns empty results

#### Geocoding
- [ ] Common city names are geocoded correctly (e.g., "Chicago", "New York")
- [ ] City + state format works (e.g., "Austin, TX")
- [ ] International cities work (e.g., "London, UK")
- [ ] Geocoding results are cached
- [ ] Cache lookup is faster than API call
- [ ] Geocoding failure falls back to text matching
- [ ] Invalid city name shows appropriate error

### Edge Case Tests

- [ ] Empty state displays when no results found
- [ ] Error state displays on database failure
- [ ] Warning banner displays when geocoding fails
- [ ] Users without location included if no location filter
- [ ] Users without location excluded if location filter applied
- [ ] Very long city names are validated (max 100 chars)
- [ ] Special characters in city names are handled
- [ ] Rapid button clicks are debounced
- [ ] Concurrent searches don't conflict
- [ ] Search works for unauthenticated users
- [ ] "Message" button redirects to login if not authenticated

### Validation Tests

- [ ] Invalid instrument shows validation error
- [ ] Invalid genre shows validation error
- [ ] Invalid radius shows validation error
- [ ] Radius without city shows validation error
- [ ] City field accepts valid input (alphanumeric + spaces)
- [ ] City field rejects < 2 characters
- [ ] City field rejects > 100 characters
- [ ] Page parameter accepts positive integers
- [ ] Page parameter rejects negative/zero values
- [ ] Limit parameter clamps to max 50

### Non-Functional Tests

#### Performance
- [ ] Initial page load < 1s
- [ ] Search with filters completes < 500ms
- [ ] Geocoding cache hit < 50ms
- [ ] Geocoding API call < 2s (if cache miss)
- [ ] Database query < 500ms (with indexes)
- [ ] Large result sets (1000+ matches) paginate efficiently

#### Mobile Responsiveness
- [ ] Filter drawer opens/closes smoothly on mobile
- [ ] Card grid displays 1 column on mobile (< 640px)
- [ ] Card grid displays 2-3 columns on tablet (640-1024px)
- [ ] Card grid displays 3-4 columns on desktop (> 1024px)
- [ ] Touch targets are >= 44x44px
- [ ] Filters are usable on small screens

#### Accessibility (WCAG 2.1 AA)
- [ ] All interactive elements are keyboard-navigable
- [ ] Tab order is logical (filters → search → results)
- [ ] Focus indicators are visible (outline or border)
- [ ] Form labels are associated with inputs
- [ ] Filter inputs have ARIA labels
- [ ] Search button has descriptive label
- [ ] Results count announced by screen reader
- [ ] Focus moves to results heading after search
- [ ] Color contrast >= 4.5:1 for text
- [ ] Color contrast >= 3:1 for UI components
- [ ] Availability badge colors are distinguishable without color (use icons/text)
- [ ] Error messages are announced to screen readers
- [ ] Loading states are announced to screen readers

## Security Considerations

- [x] **Authentication:** Optional (public feature, but rate-limited)
- [x] **Authorization:** Not applicable (public search)
- [x] **Input sanitization:**
  - Validate all query parameters against Zod schemas
  - Sanitize city input to prevent SQL injection
  - Use parameterized queries (Drizzle ORM handles this)
- [x] **Rate limiting:** 100 requests per minute per IP
- [x] **Sensitive data handling:**
  - Do NOT expose email addresses in search results (remove from response)
  - Only show publicly visible profile data
  - User's age is not exposed (only age_range if we add it later)
- [x] **SQL injection prevention:** Use Drizzle ORM parameterized queries
- [x] **XSS prevention:** Sanitize user-generated content (bio, city name) before rendering
- [x] **CORS:** Allow from web app domain only
- [x] **HTTPS:** Enforce HTTPS in production (Cloudflare Workers default)

## Rollout Plan

### Phase 1: MVP (Week 1-2)

**Backend:**
- [ ] Create geocoding cache table + migration
- [ ] Implement `/api/profiles/search` endpoint
- [ ] Implement geocoding service with caching
- [ ] Add query functions in `db/queries/profiles-search-queries.ts`
- [ ] Write unit tests for search logic

**Frontend:**
- [ ] Create `/musicians` page route
- [ ] Build ProfileSearchFilters component (sidebar/drawer)
- [ ] Build ProfileSearchCard component
- [ ] Build ProfileSearchResults component with pagination
- [ ] Implement filter state management
- [ ] Add "Find Musicians" link to main navigation
- [ ] Write E2E tests for search flow

**Shared:**
- [ ] Create Zod schemas in `packages/common/src/types/profile-search.ts`
- [ ] Define TypeScript types for search params + results

**Testing:**
- [ ] Seed test database with diverse profiles
- [ ] Test all filter combinations
- [ ] Test mobile layout
- [ ] Accessibility audit
- [ ] Performance testing (query speed)

**Ship to:** 100% of users (low-risk feature, public-facing)

### Phase 2: Iterate Based on Feedback (Week 3-4)

**Monitor Metrics:**
- Search usage rate (% of users searching)
- Empty result rate (% of searches with 0 results)
- Click-through rate (results → profile views)
- Message rate (profile views → messages sent)
- Most searched instruments/genres/cities

**Improvements:**
- Optimize slow queries
- Improve empty state suggestions
- Add "Save Search" feature (if users request)
- Add distance sorting (if location search is popular)
- Improve geocoding accuracy (if failures are common)

### Phase 3: Polish (Week 5+)

**Nice-to-Haves:**
- Map view of results
- Keyword search in bio/description
- "Similar musicians" recommendations
- Email alerts for new matches
- Search analytics for users ("Your searches this month")

## Metrics to Track

### Engagement Metrics
- **Search usage rate:** % of weekly active users who perform >= 1 search
  - **Target:** 50%+
- **Searches per user:** Average searches per active user
  - **Target:** 3-5 per week
- **Click-through rate:** % of search result views → profile views
  - **Target:** 30%+
- **Message rate:** % of profile views from search → messages sent
  - **Target:** 15%+

### Performance Metrics
- **Search query duration:** p50, p95, p99 latency
  - **Target:** p50 < 200ms, p95 < 500ms
- **Geocoding cache hit rate:** % of lookups served from cache
  - **Target:** 95%+
- **Empty result rate:** % of searches with 0 results
  - **Target:** < 20%

### Quality Metrics
- **Top searched instruments:** Histogram of most popular instruments
- **Top searched genres:** Histogram of most popular genres
- **Top searched cities:** Histogram of most popular cities
- **Filter usage:** Which filters are used most (instrument, genre, location, status)

### Business Metrics
- **New connections:** # of connections formed from search (if we can attribute)
- **Messages from search:** # of conversations started from search results
- **User retention:** Do users who search stay active longer?

## Open Questions

### Product Decisions

1. **Should we show "Distance" in search results?**
   - **Options:** (a) Always show if location filter applied, (b) Never show, (c) User preference
   - **Decision:** Show distance if location filter applied (helps users assess travel feasibility)
   - **Owner:** Product

2. **Should we limit search to profiles with >= X% completion?**
   - **Options:** (a) No limit, show all, (b) >= 50%, (c) >= 75%
   - **Decision:** Show all, display completion percentage to let users decide
   - **Owner:** Product

3. **Should "Message" button work for non-authenticated users?**
   - **Options:** (a) Redirect to sign-up, (b) Open sign-up modal, (c) Disable button
   - **Decision:** Redirect to sign-in page with return URL
   - **Owner:** Product

4. **Should we show user's "last active" timestamp?**
   - **Privacy concern:** Some users may not want this visible
   - **Options:** (a) Show to everyone, (b) Show only relative time ("Active today"), (c) User preference
   - **Decision:** Show relative time ("Active this week", "Active this month")
   - **Owner:** Product

### Technical Decisions

1. **How to store latitude/longitude for users?**
   - **Options:**
     - (a) Add lat/lng columns to user_profiles table (populate on city change)
     - (b) Calculate on-the-fly by joining with geocoding_cache
     - (c) Store in separate user_locations table
   - **Recommendation:** Add lat/lng to user_profiles, populate via migration and on profile update
   - **Owner:** Tech Lead

2. **Which geocoding API to use?**
   - **Options:**
     - (a) Nominatim (OpenStreetMap) - Free, no API key, rate limited
     - (b) Google Geocoding API - Accurate, costs money after free tier
     - (c) Mapbox Geocoding API - Free tier, then costs money
   - **Recommendation:** Start with Nominatim (free), aggressive caching to avoid rate limits
   - **Owner:** Backend Developer

3. **Should we use full-text search for genres (secondary_genres field)?**
   - **Current:** secondary_genres stored as comma-separated text or JSON
   - **Options:** (a) Parse in app code, (b) Use SQLite FTS, (c) Normalize to separate table
   - **Recommendation:** Parse in app code for MVP, normalize to separate table in Phase 2
   - **Owner:** Backend Developer

4. **Should we add geospatial indexes?**
   - **SQLite limitation:** No native geospatial indexes (like PostGIS)
   - **Options:** (a) Use bounding box pre-filter + Haversine, (b) Use SpatiaLite extension, (c) Accept slower queries
   - **Recommendation:** Bounding box pre-filter for MVP (good enough for low traffic)
   - **Owner:** Backend Developer

## Dependencies

### Requires (Blocking)

- None (this is a greenfield feature)

### Integrates With (Existing Features)

- User profiles (`user_profiles` table) - Read profile data
- User authentication (better-auth) - Optional login for messaging
- Messaging system - "Message" button navigates to messages
- Main navigation - Add "Find Musicians" link

### Blocks (Future Features)

- Saved searches (requires search to exist first)
- Search notifications (requires search to exist first)
- Map view (requires geocoding infrastructure)

---

## Estimated Effort

**Backend:** 2-3 days
- Geocoding service + caching: 1 day
- Search endpoint + query logic: 1 day
- Testing + optimization: 0.5-1 day

**Frontend:** 2-3 days
- Page layout + routing: 0.5 day
- Filter components: 1 day
- Results grid + cards: 1 day
- Pagination + states: 0.5 day
- Mobile responsive + accessibility: 0.5-1 day

**Shared Code:** 0.5 day
- Zod schemas + TypeScript types

**Testing:** 1-2 days
- Unit tests: 0.5 day
- E2E tests: 1 day
- Accessibility + performance testing: 0.5 day

**Total Estimate:** 6-9 days (roughly 1.5-2 weeks with buffer)

**Priority:** High (core value proposition of the platform)

**Owner:** Full-stack team (backend + frontend + designer collaboration)
