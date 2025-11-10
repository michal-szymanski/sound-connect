# Feature: Emoji Picker Component

## Problem Statement

Musicians on Sound Connect create text-based posts but lack an easy way to add emojis for expression. While users can copy-paste emojis from external sources or use OS emoji pickers, this creates friction. An integrated emoji picker will make posts more expressive and engaging, improving user satisfaction and platform vibrancy.

**Who has this problem:** All Sound Connect users creating posts (user posts and band posts).

## Success Criteria

- Users can open emoji picker with one click from post composer
- Users can find desired emoji within 3 seconds (via categories or search)
- Clicking emoji inserts it at cursor position in textarea
- Search returns relevant results for common queries ("happy", "music", "fire")
- Recently used emojis appear at top for quick access
- Picker closes cleanly when clicking outside or pressing Escape
- UI is polished, responsive, and matches Sound Connect design system
- No performance issues with ~400 emojis
- Keyboard navigation works for accessibility

## User Stories

- As a musician, I want to quickly add emojis to my posts so that I can express emotion and personality
- As a band admin, I want to use emojis in band posts so that our announcements feel more engaging
- As a user, I want to search for emojis by name so that I can find the right one without scrolling
- As a user, I want my frequently used emojis to appear first so that I can access them quickly
- As a keyboard user, I want to navigate the emoji picker with keyboard so that I can use it without a mouse

## Scope

### In Scope (MVP)

- Emoji picker component with popover UI
- 8 emoji categories with ~400 total emojis
- Search functionality with keyword matching
- Recently used emojis (stored in localStorage, max 24)
- Click emoji to insert at cursor position
- Keyboard navigation (arrow keys, Enter, Escape)
- Integration into user post modal
- Integration into band post composer
- Static emoji data file (`apps/web/src/data/emojis.json`)
- Responsive design (mobile and desktop)
- Accessibility (ARIA labels, keyboard support)

### Out of Scope (Future)

- Skin tone variations (why: adds complexity, validate demand first)
- Custom emoji uploads (why: requires backend, moderation)
- Animated emojis/GIFs (why: separate feature)
- Emoji reactions to comments (why: separate feature)
- User-specific recently used sync across devices (why: requires backend API)
- Virtual scrolling (why: performance acceptable with ~400 emojis)

## User Flow

### Opening Picker

1. User writes post text in textarea
2. User clicks emoji button (😀) in toolbar above textarea
3. Emoji picker popover opens below button
4. Picker shows "Recently Used" section (if user has history) + category tabs
5. Default view: Recently Used or first category (Smileys & People)

### Finding Emoji (Browse)

1. User clicks category tab (e.g., "Animals & Nature")
2. Grid displays emojis for that category
3. User hovers over emoji → tooltip shows emoji name
4. User scrolls to see more emojis in category

### Finding Emoji (Search)

1. User types in search input (e.g., "music")
2. Results filter in real-time, showing matching emojis
3. If no results, show "No emojis found" message
4. User clears search to return to category view

### Inserting Emoji

1. User clicks emoji or presses Enter on focused emoji
2. Emoji inserts at cursor position in textarea
3. Emoji is added to "Recently Used" list
4. Picker remains open for additional selections
5. User clicks outside picker or presses Escape to close

### Keyboard Navigation

1. User presses Tab to focus search input
2. User presses Tab again to focus emoji grid
3. User presses arrow keys to navigate emojis
4. User presses Enter to insert focused emoji
5. User presses Escape to close picker

## UI Requirements

### Components Needed

**EmojiPicker** (main component)
- Props: `onEmojiSelect: (emoji: string) => void`, `trigger?: ReactNode`
- Manages popover state, search, category selection
- Coordinates sub-components

**EmojiPickerTrigger** (button to open picker)
- Emoji button (😀 icon) in toolbar
- Opens popover on click
- Shows active state when popover is open

**EmojiPickerContent** (popover content)
- Width: 352px (desktop), 100% (mobile, max 352px)
- Height: 400px (fixed, scrollable content)
- Padding: 12px
- Border radius: 8px
- Shadow: medium elevation

**EmojiSearchInput**
- Text input with search icon
- Placeholder: "Search emojis..."
- Debounced input (150ms delay)
- Clear button (X) when has value

**EmojiCategoryTabs**
- Horizontal tabs with icons
- Categories: 😊 🐶 🍕 ⚽ 🚗 💡 🎵 🏁
- Active tab highlighted with primary color
- Sticky at top of scrollable area

**EmojiGrid**
- Grid layout: 8 columns (desktop), 6 columns (mobile)
- Cell size: 40x40px
- Gap: 4px
- Hover state: light background
- Focus state: border outline (keyboard navigation)

**RecentlyUsedSection**
- Shown above category tabs
- Label: "Recently Used"
- Same grid layout as categories
- Max 24 emojis (3 rows on desktop)

**EmptyState**
- Shown when search has no results
- Icon: 🔍 (magnifying glass)
- Text: "No emojis found"
- Subtext: "Try a different search term"

### States

**Loading State**
- Not needed (static data, instant load)

**Empty State (No Recent Emojis)**
- Hide "Recently Used" section if localStorage is empty

**Empty State (No Search Results)**
- Show EmptyState component
- Display search term in message
- Provide clear button to reset search

**Error State**
- If emoji data fails to load (JSON parse error)
- Show error message: "Failed to load emojis. Please refresh the page."
- Fallback: Allow user to type emojis manually

**Success State (Normal Operation)**
- Popover open with emojis displayed
- Category selected and emojis showing
- Search active with filtered results
- Emoji hovered with tooltip

**Focus State (Keyboard Navigation)**
- Search input focused: Blue border
- Emoji focused: Blue outline, show name below grid
- Tab focused: Underline active tab

### Interactions

**Click emoji button → Popover opens**
- Position: Below button, aligned left
- Animation: Fade in + scale (150ms ease-out)
- Focus: Auto-focus search input

**Click category tab → Switch category**
- Update grid to show category emojis
- Scroll grid to top
- Clear search input

**Type in search → Filter emojis**
- Debounced input (150ms)
- Case-insensitive matching
- Match against emoji name and keywords
- Show results across all categories
- Update count: "42 emojis found"

**Click emoji → Insert and update recents**
- Insert emoji at cursor position
- Add to localStorage "recently-used-emojis" array
- Limit to 24 most recent (FIFO queue)
- Keep picker open for multiple selections

**Hover emoji → Show tooltip**
- Tooltip appears above emoji
- Shows emoji name (capitalized)
- Delay: 300ms

**Click outside → Close picker**
- Dismiss popover
- Restore focus to textarea

**Press Escape → Close picker**
- Dismiss popover
- Restore focus to textarea

**Arrow keys → Navigate emojis**
- Grid navigation (up/down/left/right)
- Wrap at edges
- Show focused emoji name below grid

**Enter key → Insert focused emoji**
- Same behavior as click

**Tab key → Focus next element**
- Tab order: Search input → Category tabs → Emoji grid

## API Requirements

### No Backend API Needed

This is a frontend-only feature. All data is static and stored in `apps/web/src/data/emojis.json`.

### Emoji Data Structure

```json
{
  "categories": [
    {
      "id": "smileys-people",
      "name": "Smileys & People",
      "icon": "😊",
      "emojis": [
        {
          "emoji": "😀",
          "name": "grinning face",
          "keywords": ["smile", "happy", "joy", "grin"]
        },
        {
          "emoji": "😃",
          "name": "grinning face with big eyes",
          "keywords": ["smile", "happy", "joy", "haha"]
        }
      ]
    },
    {
      "id": "animals-nature",
      "name": "Animals & Nature",
      "icon": "🐶",
      "emojis": [
        {
          "emoji": "🐶",
          "name": "dog face",
          "keywords": ["dog", "puppy", "pet", "animal"]
        }
      ]
    }
  ]
}
```

**Category IDs:**
- `smileys-people` - Smileys & People (😊)
- `animals-nature` - Animals & Nature (🐶)
- `food-drink` - Food & Drink (🍕)
- `activities` - Activities (⚽)
- `travel-places` - Travel & Places (🚗)
- `objects` - Objects (💡)
- `symbols` - Symbols (🎵)
- `flags` - Flags (🏁)

### Component API

```typescript
type EmojiPickerProps = {
  onEmojiSelect: (emoji: string) => void
  trigger?: ReactNode // Custom trigger, defaults to emoji button
}

// Usage
<EmojiPicker onEmojiSelect={(emoji) => insertAtCursor(emoji)} />

// With custom trigger
<EmojiPicker
  onEmojiSelect={(emoji) => insertAtCursor(emoji)}
  trigger={<Button>Add Emoji</Button>}
/>
```

### Recently Used Storage (localStorage)

```typescript
// Key: "sound-connect:recently-used-emojis"
// Value: JSON array of emoji strings
// Max length: 24 emojis (FIFO)

type RecentEmojis = string[] // ["😀", "🎸", "🔥", ...]

// Helper functions
function getRecentEmojis(): string[]
function addRecentEmoji(emoji: string): void
function clearRecentEmojis(): void
```

## Database Changes

**None.** This is a frontend-only feature with no backend persistence.

## Edge Cases

### What happens when...

1. **User has no recently used emojis?**
   → Hide "Recently Used" section, show first category (Smileys & People)

2. **Search returns no results?**
   → Show EmptyState component with "No emojis found" message and clear button

3. **User types very long search query (100+ chars)?**
   → Truncate input at 50 characters, show warning tooltip

4. **Emoji data JSON fails to load or parse?**
   → Show error state: "Failed to load emojis. Please refresh the page."
   → Log error to console for debugging

5. **User clicks emoji button while picker is already open?**
   → Close picker (toggle behavior)

6. **Cursor is not in textarea when emoji is selected?**
   → Insert emoji at end of text content (fallback)

7. **Textarea is at max length?**
   → Check if adding emoji would exceed limit, show warning toast if so

8. **User opens picker on mobile (small screen)?**
   → Adjust grid to 6 columns, reduce cell size if needed, full-width popover

9. **User navigates with keyboard to edge of grid?**
   → Wrap to opposite side (e.g., right edge → left edge of next row)

10. **localStorage is full or disabled?**
    → Catch error, continue without recently used feature, log warning

11. **User has multiple tabs open?**
    → Recently used emojis sync across tabs via localStorage events (optional enhancement)

12. **Emoji doesn't render on user's device (missing font)?**
    → Browser displays fallback character (□), no special handling needed

13. **User presses Escape while search is focused?**
    → First press clears search, second press closes picker

14. **Popover would render off-screen?**
    → ShadCN Popover automatically repositions (flip to top if needed)

## Validation Rules

### Client-side (immediate feedback)

**Search Input:**
- Max length: 50 characters
- Trim whitespace
- No validation errors (free-form search)

**Emoji Selection:**
- Must be valid emoji character (from data file)
- No validation beyond data file contents

**Recently Used:**
- Max 24 emojis stored
- Must be valid emoji strings
- Remove duplicates (most recent occurrence kept)

## Error Handling

### User-Facing Errors

**Scenario 1: Emoji data fails to load**
- Error message: "Failed to load emojis. Please refresh the page."
- Action: Provide refresh button, allow manual emoji typing

**Scenario 2: localStorage quota exceeded**
- Error: Silent failure (recently used won't persist)
- Log warning to console
- User can still use emoji picker normally

**Scenario 3: Invalid emoji in recently used**
- Error: Filter out invalid emojis during load
- Log warning to console
- Display remaining valid emojis

### Developer Errors (log, alert)

- JSON parse failure on emoji data → Console error + Sentry alert
- localStorage access denied → Console warning
- Invalid emoji data structure → Console error + fallback to empty categories

## Performance Considerations

- **Expected load:** N/A (client-side only)
- **Emoji data size:** ~50KB JSON file (400 emojis × ~125 bytes each)
- **Search performance:** O(n) linear search acceptable for 400 items (~1ms)
- **Rendering performance:** ~400 emojis in grid, CSS Grid handles efficiently
- **Virtual scrolling:** Not needed for MVP (renders fine with 400 emojis)
- **Debounced search:** 150ms delay to reduce re-renders
- **Memoization:** Memoize filtered emoji results with useMemo
- **Lazy load emoji data:** Import JSON dynamically to reduce initial bundle
- **Recently used lookup:** O(1) array operations, max 24 items

## Testing Checklist

### Functional Tests

- [ ] User can open emoji picker by clicking button
- [ ] User can close picker by clicking outside
- [ ] User can close picker by pressing Escape
- [ ] Clicking emoji inserts it at cursor position
- [ ] Switching categories displays correct emojis
- [ ] Search filters emojis correctly (name and keywords)
- [ ] Search shows empty state when no results
- [ ] Recently used emojis appear at top
- [ ] Recently used updates after emoji selection
- [ ] Recently used persists after page refresh
- [ ] Keyboard navigation works (arrow keys, Enter, Tab)
- [ ] Hovering emoji shows tooltip with name
- [ ] Picker integrates into user post modal
- [ ] Picker integrates into band post composer

### Edge Case Tests

- [ ] Empty recently used displays correctly (section hidden)
- [ ] No search results shows empty state
- [ ] Very long search query truncates properly
- [ ] Emoji data load failure shows error state
- [ ] localStorage disabled doesn't break picker
- [ ] Cursor not in textarea inserts at end (fallback)
- [ ] Mobile view adjusts grid columns
- [ ] Keyboard navigation wraps at grid edges
- [ ] Pressing Escape clears search first, then closes picker

### Non-Functional Tests

- [ ] Search performance < 50ms for 400 emojis
- [ ] Picker opens with smooth animation (< 150ms)
- [ ] Mobile responsive (works on 320px width)
- [ ] Keyboard accessible (all features usable without mouse)
- [ ] Screen reader announces emoji names (ARIA labels)
- [ ] No layout shift when picker opens
- [ ] Emoji data loads quickly (< 100ms)

## Accessibility Considerations

- [ ] Emoji button has ARIA label: "Open emoji picker"
- [ ] Popover has role="dialog" and aria-label="Emoji picker"
- [ ] Search input has aria-label="Search emojis"
- [ ] Emoji buttons have aria-label with emoji name
- [ ] Category tabs use proper ARIA roles (role="tablist", role="tab")
- [ ] Keyboard navigation follows WAI-ARIA patterns
- [ ] Focus visible for all interactive elements
- [ ] Escape key closes picker (expected behavior)
- [ ] Focus returns to trigger button when picker closes
- [ ] Screen reader announces emoji name on selection
- [ ] Color contrast meets WCAG 2.1 AA (4.5:1 for text)

## Integration Points

### 1. User Post Modal (`apps/web/src/features/posts/components/post-modal.tsx`)

**Location:** Toolbar above textarea

**Changes:**
1. Import EmojiPicker component
2. Add toolbar div above textarea (if not exists)
3. Add EmojiPicker with onEmojiSelect handler
4. Implement insertAtCursor function to insert emoji at cursor position
5. Style toolbar to match modal design

**Code Location:**
```
apps/web/src/features/posts/components/post-modal.tsx
```

**Implementation Details:**
- Store textarea ref to access cursor position
- Implement insertAtCursor(emoji: string) function:
  - Get current cursor position (selectionStart)
  - Insert emoji at cursor
  - Update textarea value
  - Restore cursor position after emoji

### 2. Band Post Composer

**Action Required:** Locate existing band post creation component

**Expected Locations:**
- `apps/web/src/features/bands/components/band-post-composer.tsx` (or similar)
- Band profile page post creation form

**Changes:** Same as user post modal
1. Add toolbar above textarea
2. Add EmojiPicker component
3. Implement insertAtCursor function

**Note:** If band post uses same PostModal component, integration is automatic.

## File Structure

```
apps/web/src/
├── components/
│   └── emoji-picker/
│       ├── emoji-picker.tsx              # Main component
│       ├── emoji-picker-trigger.tsx      # Button component
│       ├── emoji-picker-content.tsx      # Popover content
│       ├── emoji-search-input.tsx        # Search input
│       ├── emoji-category-tabs.tsx       # Category tabs
│       ├── emoji-grid.tsx                # Emoji grid
│       ├── recently-used-section.tsx     # Recently used emojis
│       ├── emoji-button.tsx              # Individual emoji button
│       └── empty-state.tsx               # No results state
├── data/
│   └── emojis.json                       # Static emoji data
├── hooks/
│   ├── use-emoji-search.ts               # Search logic hook
│   └── use-recent-emojis.ts              # Recently used logic hook
└── utils/
    └── emoji-utils.ts                    # Helper functions

apps/web/src/features/posts/components/
└── post-modal.tsx                        # Updated with emoji picker

apps/web/src/features/bands/components/
└── [band-post-composer].tsx              # Updated with emoji picker
```

## Search Algorithm

### Fuzzy Search Implementation

**Approach:** Simple substring matching (case-insensitive)

**Why:** Sufficient for 400 emojis, fast, no dependencies

**Algorithm:**
1. Convert search query to lowercase
2. For each emoji:
   - Check if query matches emoji name (substring)
   - Check if query matches any keyword (substring)
3. Return all matching emojis
4. Limit results to 100 emojis (pagination if needed)

**Performance:** O(n × m) where n = emojis (400), m = keywords per emoji (~4)
- Worst case: ~1,600 comparisons
- Expected time: < 10ms on modern devices

**Future Enhancement:** Implement Fuse.js for true fuzzy search if needed

### Search Relevance Scoring (Optional Enhancement)

**Priority order:**
1. Exact name match (highest score)
2. Name starts with query
3. Name contains query
4. Keyword exact match
5. Keyword starts with query
6. Keyword contains query

**Implementation:**
```typescript
function searchEmojis(query: string, emojis: Emoji[]): Emoji[] {
  const lowerQuery = query.toLowerCase().trim()

  return emojis
    .map(emoji => ({
      emoji,
      score: calculateScore(emoji, lowerQuery)
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ emoji }) => emoji)
}
```

## Recently Used Emojis Implementation

### localStorage Schema

```typescript
// Key
const STORAGE_KEY = "sound-connect:recently-used-emojis"

// Value (JSON string)
type RecentEmojis = string[] // ["😀", "🎸", "🔥"]

// Max length
const MAX_RECENT = 24
```

### Operations

**Get Recent Emojis:**
```typescript
function getRecentEmojis(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []

    const emojis = JSON.parse(stored) as string[]

    // Validate: must be array of strings
    if (!Array.isArray(emojis)) return []
    if (!emojis.every(e => typeof e === "string")) return []

    return emojis.slice(0, MAX_RECENT)
  } catch (error) {
    console.warn("Failed to load recent emojis:", error)
    return []
  }
}
```

**Add Recent Emoji:**
```typescript
function addRecentEmoji(emoji: string): void {
  try {
    const recent = getRecentEmojis()

    // Remove duplicate if exists
    const filtered = recent.filter(e => e !== emoji)

    // Add to front (most recent)
    const updated = [emoji, ...filtered].slice(0, MAX_RECENT)

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch (error) {
    console.warn("Failed to save recent emoji:", error)
  }
}
```

**Clear Recent Emojis:**
```typescript
function clearRecentEmojis(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.warn("Failed to clear recent emojis:", error)
  }
}
```

### Storage Size

- 24 emojis × 4 bytes per emoji (avg) = 96 bytes
- JSON overhead: ~30 bytes
- **Total: ~125 bytes** (negligible)

### Cross-Tab Sync (Optional Enhancement)

Listen for localStorage events to sync recently used across tabs:

```typescript
useEffect(() => {
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      setRecentEmojis(getRecentEmojis())
    }
  }

  window.addEventListener("storage", handleStorageChange)
  return () => window.removeEventListener("storage", handleStorageChange)
}, [])
```

## Rollout Plan

### Phase 1 (MVP Implementation)

**Week 1: Core Component**
- [ ] Create emoji data file with ~400 emojis (8 categories)
- [ ] Build EmojiPicker component structure
- [ ] Implement category tabs and grid layout
- [ ] Add search functionality
- [ ] Implement recently used with localStorage

**Week 2: Integration & Polish**
- [ ] Integrate into user post modal
- [ ] Integrate into band post composer
- [ ] Add keyboard navigation
- [ ] Implement accessibility features (ARIA labels)
- [ ] Mobile responsive design

**Week 3: Testing & Ship**
- [ ] E2E tests with Playwright
- [ ] Accessibility audit with axe-core
- [ ] Performance testing (search speed, render time)
- [ ] Ship to 100% of users

### Phase 2 (Future Enhancements)

**Post-MVP (Based on User Feedback):**
- [ ] Skin tone variations
- [ ] Custom emoji uploads (requires backend)
- [ ] Emoji autocomplete (type :smile: to insert 😀)
- [ ] Emoji reactions to comments (separate feature)
- [ ] Analytics: Track most used emojis
- [ ] User-specific recently used (sync via API)

### Phase 3 (Polish & Optimize)

**Performance:**
- [ ] Virtual scrolling if emoji count grows > 1000
- [ ] Lazy load emoji data on first open (reduce bundle)
- [ ] Preload emoji images for faster rendering

**UX Improvements:**
- [ ] Emoji preview (large emoji on hover)
- [ ] Emoji history by category
- [ ] Customizable emoji button placement

## Metrics to Track

- **Adoption:** % of posts with emojis (target: 40%)
- **Usage:** Average emojis per post (target: 2-3)
- **Search:** % of users using search (target: 30%)
- **Recently Used:** % of emoji selections from recently used (target: 50%)
- **Performance:** Picker open time (target: < 150ms)
- **Performance:** Search time (target: < 50ms)
- **Accessibility:** % of emoji selections via keyboard (target: 10%)

**How to Measure:**
- Add analytics events: `emoji_picker_opened`, `emoji_selected`, `emoji_searched`
- Track emoji presence in posts (detect emoji unicode in post content)
- Log search queries and results count
- Track recently used hit rate

## Open Questions

1. **Should we include music-specific emojis in a separate category?**
   - Decision: User (product decision)
   - Options: Add "Music" category or highlight music emojis in search

2. **Should emoji picker be available in comments too?**
   - Decision: User (scope decision)
   - Impact: Additional integration point, but consistent UX

3. **Should we show emoji count per category in tabs?**
   - Decision: Designer (UX decision)
   - Pro: Helps users know category size
   - Con: Adds visual clutter

4. **Should we support emoji shortcodes (e.g., :smile: → 😀)?**
   - Decision: User (feature decision)
   - Defer to Phase 2 (validate demand first)

## Dependencies

- **No blocking dependencies:** Can implement immediately
- **Requires:** ShadCN components (already installed)
- **Requires:** Emoji data curation (400 emojis across 8 categories)
- **Blocks:** Emoji reactions feature (depends on picker component)
- **Blocks:** Comment emoji support (depends on picker component)

## Design Resources

**Inspiration:**
- Slack emoji picker: https://slack.com (clean, fast search)
- Discord emoji picker: https://discord.com (good category organization)
- GitHub emoji picker: https://github.com (simple, effective)

**ShadCN Components to Use:**
- Popover: https://ui.shadcn.com/docs/components/popover
- Tabs: https://ui.shadcn.com/docs/components/tabs
- Input: https://ui.shadcn.com/docs/components/input
- ScrollArea: https://ui.shadcn.com/docs/components/scroll-area
- Button: https://ui.shadcn.com/docs/components/button

---

**Estimated Effort:** 3 weeks (1 week core, 1 week integration, 1 week testing)
**Priority:** High (improves post engagement and user expression)
**Owner:** Frontend Team
