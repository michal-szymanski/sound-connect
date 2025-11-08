# Profile Search - Frontend Implementation Guide

This document provides detailed instructions for implementing the frontend portion of the Advanced Profile Search feature.

## Overview

The frontend agent should implement:
1. `/musicians` page route with server function to fetch search results
2. Filter components (sidebar on desktop, drawer on mobile)
3. Search result cards with all profile information
4. Results grid with responsive layout
5. All UI states (loading, empty, error, geocoding fallback)
6. Navigation link to "Find Musicians"
7. Accessibility features (WCAG 2.1 AA compliance)

## Shared Code Available

All shared code has been created in `packages/common`:

### Types (from `@sound-connect/common/types/profile-search`)
- `profileSearchParamsSchema` - Validation schema for search parameters
- `ProfileSearchParams` - TypeScript type for search params
- `profileSearchResponseSchema` - API response validation schema
- `ProfileSearchResponse` - TypeScript type for response
- `ProfileSearchResult` - TypeScript type for each search result
- `searchRadiusEnum` - Available radius values: [5, 10, 25, 50, 100]

### Enums (from `@sound-connect/common/types/profile-enums`)
- `InstrumentEnum` - All available instruments
- `GenreEnum` - All available genres
- `AvailabilityStatusEnum` - All availability statuses

### Utilities (from `@sound-connect/common/utils/availability`)
- `availabilityStatusConfig` - Color and label configuration for each status
- `getAvailabilityStatusColor(status)` - Returns badge variant and dot color
- `getAvailabilityStatusLabel(status)` - Returns human-readable label

## Designer Guidance Summary

### Filter Controls (Sidebar/Drawer)
- **Instruments:** ShadCN Combobox (searchable multi-select) with badge tags for selected items
- **Location:** Text Input for city + Select dropdown for radius (disabled when no city entered)
- **Genres:** ScrollArea (max-height: 12rem) with Checkbox list
- **Availability:** Checkbox list with color-coded indicator dots
- **Desktop:** Sticky sidebar (w-72, top-20)
- **Mobile:** Sheet (bottom drawer, h-85vh) triggered by "Filters" button with badge showing filter count

### Search Result Cards
- **Avatar:** 80x80px with fallback to user initials
- **Availability Badge:** Top-right corner, color-coded (green/blue/gray/yellow)
- **Name:** text-lg, font-semibold
- **Primary Instrument:** text-sm, muted color with Music2 icon
- **Location:** text-sm with MapPin icon (+ distance if location filter applied)
- **Genre Badges:** Max 3, outline variant
- **Profile Completion:** Progress bar (only if < 100%)
- **Action Buttons:**
  - "View Profile" (outline variant)
  - "Message" (default variant)
- **Hover Effect:** Subtle shadow elevation

### Responsive Grid
- **Mobile (< 640px):** 1 column, gap-4, px-4
- **Tablet (640-1024px):** 2 columns, gap-6, px-6
- **Desktop (1024-1280px):** 3 columns, gap-6, px-8
- **Desktop XL (>= 1280px):** 4 columns, gap-6, px-8

### Accessibility (WCAG 2.1 AA)
- All text: 4.5:1 contrast ratio
- UI components: 3:1 contrast ratio
- Keyboard navigation with visible focus indicators
- Screen reader announcements (aria-live regions)
- Focus management (moves to results heading after search)
- Semantic HTML (main, aside, section, article)
- Touch targets: >= 44x44px

## ShadCN Components to Use

Import these from `~/components/ui`:
- `Combobox` (instruments filter)
- `ScrollArea` (genres filter)
- `Sheet` (mobile filter drawer)
- `Progress` (profile completion bar)
- `Skeleton` (loading state)
- `Alert` (geocoding fallback warning)
- `Badge` (genre tags, availability status, filter count)
- `Avatar`, `AvatarImage`, `AvatarFallback`
- `Card`, `CardContent`
- `Button`
- `Input`
- `Select`, `SelectTrigger`, `SelectValue`, `SelectContent`, `SelectItem`
- `Checkbox`
- `Label`

Icons from `lucide-react`:
- `Music2` (primary instrument)
- `MapPin` (location)
- `Search` (empty state)
- `AlertTriangle` (error state)
- `Filter` (mobile filter button)

## Task 1: Create /musicians Page Route

**File:** `apps/web/src/routes/(main)/musicians.tsx`

### Requirements:
- Tanstack Start route component
- Server function to call backend API
- Filter state management
- URL query parameters for sharing searches
- Loading, empty, and error states

### Implementation Structure:

```typescript
import { createFileRoute } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/start';
import { profileSearchParamsSchema } from '@sound-connect/common/types/profile-search';
import type { ProfileSearchResponse } from '@sound-connect/common/types/profile-search';
import { useState } from 'react';
import { ProfileSearchFilters } from '~/components/profile-search/profile-search-filters';
import { ProfileSearchResults } from '~/components/profile-search/profile-search-results';
import { ProfileSearchSkeleton } from '~/components/profile-search/profile-search-skeleton';
import { ProfileSearchEmptyState } from '~/components/profile-search/profile-search-empty-state';
import { ProfileSearchErrorState } from '~/components/profile-search/profile-search-error-state';
import { Alert, AlertDescription } from '~/components/ui/alert';

const searchProfilesServerFn = createServerFn('GET', async (params: unknown) => {
    // 1. Validate params with profileSearchParamsSchema
    const validatedParams = profileSearchParamsSchema.parse(params);

    // 2. Call backend API
    const response = await fetch(
        `${process.env.API_URL}/api/profiles/search?${new URLSearchParams(validatedParams)}`,
        {
            headers: {
                'Content-Type': 'application/json'
            }
        }
    );

    if (!response.ok) {
        throw new Error('Failed to fetch search results');
    }

    // 3. Validate response
    const data = await response.json();
    return profileSearchResponseSchema.parse(data);
});

export const Route = createFileRoute('/(main)/musicians')({
    component: MusiciansPage
});

function MusiciansPage() {
    const [filters, setFilters] = useState<ProfileSearchParams>({
        page: 1,
        limit: 12
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [results, setResults] = useState<ProfileSearchResponse | null>(null);
    const [isFiltersOpen, setIsFiltersOpen] = useState(false); // Mobile drawer

    const handleSearch = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const data = await searchProfilesServerFn(filters);
            setResults(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClearFilters = () => {
        setFilters({ page: 1, limit: 12 });
        handleSearch();
    };

    return (
        <div className="container mx-auto py-6">
            <div className="flex gap-6">
                {/* Desktop Sidebar */}
                <aside className="hidden lg:block w-72 sticky top-20 self-start">
                    <ProfileSearchFilters
                        filters={filters}
                        onFiltersChange={setFilters}
                        onSearch={handleSearch}
                        onClear={handleClearFilters}
                        isLoading={isLoading}
                    />
                </aside>

                {/* Results */}
                <main className="flex-1">
                    {/* Mobile Filter Button */}
                    <div className="lg:hidden mb-4">
                        <Button onClick={() => setIsFiltersOpen(true)}>
                            <Filter className="mr-2 h-4 w-4" />
                            Filters
                            {/* Show badge with filter count */}
                        </Button>
                    </div>

                    {/* Geocoding Fallback Warning */}
                    {results?.geocodingFallback && (
                        <Alert className="mb-4">
                            <AlertDescription>
                                Location search is temporarily unavailable. Showing results based on city name only.
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Results Count */}
                    {results && (
                        <h2 className="text-lg font-semibold mb-4" tabIndex={-1} ref={/* focus on search */}>
                            {results.pagination.total} musicians found
                        </h2>
                    )}

                    {/* States */}
                    {isLoading && <ProfileSearchSkeleton />}
                    {error && <ProfileSearchErrorState onRetry={handleSearch} error={error} />}
                    {!isLoading && !error && results?.results.length === 0 && (
                        <ProfileSearchEmptyState onClearFilters={handleClearFilters} />
                    )}
                    {!isLoading && !error && results && results.results.length > 0 && (
                        <ProfileSearchResults results={results} onPageChange={(page) => {
                            setFilters({ ...filters, page });
                            handleSearch();
                        }} />
                    )}
                </main>
            </div>

            {/* Mobile Filter Drawer */}
            <Sheet open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
                <SheetContent side="bottom" className="h-[85vh]">
                    <ProfileSearchFilters
                        filters={filters}
                        onFiltersChange={setFilters}
                        onSearch={() => {
                            handleSearch();
                            setIsFiltersOpen(false);
                        }}
                        onClear={handleClearFilters}
                        isLoading={isLoading}
                    />
                </SheetContent>
            </Sheet>
        </div>
    );
}
```

## Task 2: Profile Search Filters Component

**File:** `apps/web/src/components/profile-search/profile-search-filters.tsx`

### Props:
```typescript
type Props = {
    filters: ProfileSearchParams;
    onFiltersChange: (filters: ProfileSearchParams) => void;
    onSearch: () => void;
    onClear: () => void;
    isLoading: boolean;
};
```

### Implementation:
- Instruments: Combobox with multi-select, show selected as badge tags
- Location: Input for city + Select for radius (disable radius if no city)
- Genres: ScrollArea with checkboxes (max-h-48)
- Availability: Checkboxes with color-coded dots
- "Search Musicians" button (primary, disabled when loading)
- "Clear Filters" button (secondary)

### Accessibility:
- All inputs have proper labels
- Checkboxes have associated labels
- Focus indicators visible
- Tab order logical

## Task 3: Profile Search Card Component

**File:** `apps/web/src/components/profile-search/profile-search-card.tsx`

### Props:
```typescript
type Props = {
    result: ProfileSearchResult;
};
```

### Implementation:
```tsx
import { Avatar, AvatarImage, AvatarFallback } from '~/components/ui/avatar';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Card, CardContent } from '~/components/ui/card';
import { Progress } from '~/components/ui/progress';
import { Music2, MapPin } from 'lucide-react';
import { getAvailabilityStatusColor, getAvailabilityStatusLabel } from '@sound-connect/common/utils/availability';
import { useNavigate } from '@tanstack/react-router';

export function ProfileSearchCard({ result }: Props) {
    const navigate = useNavigate();
    const statusConfig = getAvailabilityStatusColor(result.status);

    const initials = result.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase();

    const secondaryGenres = result.secondaryGenres
        ? result.secondaryGenres.split(',').slice(0, 2)
        : [];

    const genres = [result.primaryGenre, ...secondaryGenres].filter(Boolean).slice(0, 3);

    return (
        <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4 relative">
                {/* Availability Badge (top-right) */}
                {result.status && (
                    <Badge variant={statusConfig.badge} className="absolute top-4 right-4">
                        <span className={`w-2 h-2 rounded-full mr-1 ${statusConfig.dot}`} />
                        {statusConfig.label}
                    </Badge>
                )}

                {/* Avatar */}
                <Avatar className="w-20 h-20 mb-3">
                    <AvatarImage src={result.image || undefined} alt={result.name} />
                    <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>

                {/* Name */}
                <h3 className="text-lg font-semibold mb-1">{result.name}</h3>

                {/* Primary Instrument */}
                {result.primaryInstrument && (
                    <div className="flex items-center text-sm text-muted-foreground mb-2">
                        <Music2 className="w-4 h-4 mr-1" />
                        {result.primaryInstrument.replace('_', ' ')}
                        {result.yearsPlayingPrimary && ` • ${result.yearsPlayingPrimary} years`}
                    </div>
                )}

                {/* Location */}
                {result.city && (
                    <div className="flex items-center text-sm text-muted-foreground mb-2">
                        <MapPin className="w-4 h-4 mr-1" />
                        {result.city}, {result.state}
                        {result.distance && ` • ${result.distance.toFixed(1)} mi`}
                    </div>
                )}

                {/* Genre Badges */}
                {genres.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                        {genres.map(genre => (
                            <Badge key={genre} variant="outline">
                                {genre?.replace('_', ' ')}
                            </Badge>
                        ))}
                    </div>
                )}

                {/* Profile Completion */}
                {result.profileCompletion < 100 && (
                    <div className="mb-3">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>Profile Completion</span>
                            <span>{result.profileCompletion}%</span>
                        </div>
                        <Progress value={result.profileCompletion} />
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => navigate({ to: `/profile/${result.userId}` })}
                    >
                        View Profile
                    </Button>
                    <Button
                        variant="default"
                        className="flex-1"
                        onClick={() => navigate({ to: '/messages', search: { userId: result.userId } })}
                    >
                        Message
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
```

## Task 4: Profile Search Results Component

**File:** `apps/web/src/components/profile-search/profile-search-results.tsx`

### Props:
```typescript
type Props = {
    results: ProfileSearchResponse;
    onPageChange: (page: number) => void;
};
```

### Implementation:
- Responsive grid layout
- Map results to ProfileSearchCard components
- Pagination controls at bottom
- Announce results count to screen readers

### Grid Classes:
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 px-4 sm:px-6 lg:px-8">
    {results.results.map(result => (
        <ProfileSearchCard key={result.userId} result={result} />
    ))}
</div>
```

## Task 5: Loading State Component

**File:** `apps/web/src/components/profile-search/profile-search-skeleton.tsx`

### Implementation:
- Show 12 skeleton cards
- Match grid layout
- Use ShadCN Skeleton component

```tsx
import { Skeleton } from '~/components/ui/skeleton';

export function ProfileSearchSkeleton() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 px-4 sm:px-6 lg:px-8">
            {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="space-y-3 p-4">
                    <Skeleton className="w-20 h-20 rounded-full" />
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-2/3" />
                    <div className="flex gap-2">
                        <Skeleton className="h-9 flex-1" />
                        <Skeleton className="h-9 flex-1" />
                    </div>
                </div>
            ))}
        </div>
    );
}
```

## Task 6: Empty State Component

**File:** `apps/web/src/components/profile-search/profile-search-empty-state.tsx`

### Props:
```typescript
type Props = {
    onClearFilters: () => void;
};
```

### Implementation:
```tsx
import { Search } from 'lucide-react';
import { Button } from '~/components/ui/button';

export function ProfileSearchEmptyState({ onClearFilters }: Props) {
    return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <Search className="w-16 h-16 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold mb-2">No musicians match your filters</h2>
            <p className="text-muted-foreground mb-6 max-w-md">
                Try broadening your search criteria or removing some filters to see more results.
            </p>
            <Button onClick={onClearFilters}>Clear All Filters</Button>
        </div>
    );
}
```

## Task 7: Error State Component

**File:** `apps/web/src/components/profile-search/profile-search-error-state.tsx`

### Props:
```typescript
type Props = {
    error: string;
    onRetry: () => void;
};
```

### Implementation:
```tsx
import { AlertTriangle } from 'lucide-react';
import { Button } from '~/components/ui/button';

export function ProfileSearchErrorState({ error, onRetry }: Props) {
    return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center" role="alert">
            <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Unable to load search results</h2>
            <p className="text-muted-foreground mb-6 max-w-md">{error}</p>
            <Button onClick={onRetry}>Retry Search</Button>
        </div>
    );
}
```

## Task 8: Add Navigation Link

**File:** Update main navigation component (find the nav/header component)

Add "Find Musicians" link to main navigation:

```tsx
<Link to="/musicians">
    <Button variant="ghost">Find Musicians</Button>
</Link>
```

## Accessibility Checklist

- [ ] All text meets 4.5:1 contrast ratio
- [ ] UI components meet 3:1 contrast ratio
- [ ] Keyboard navigation works (Tab, Shift+Tab, Enter, Space)
- [ ] Focus indicators are visible (outline or border)
- [ ] All form inputs have associated labels
- [ ] Checkboxes have proper labels
- [ ] Search button has descriptive label
- [ ] Results count is announced to screen readers (aria-live="polite")
- [ ] Focus moves to results heading after search
- [ ] Error messages announced to screen readers (role="alert")
- [ ] Loading states announced to screen readers (aria-busy, aria-live)
- [ ] Touch targets are >= 44x44px
- [ ] Semantic HTML used (main, aside, section, article)
- [ ] Availability status not conveyed by color alone (has text label)

## Mobile Responsiveness Checklist

- [ ] Filter drawer opens/closes smoothly
- [ ] Filter drawer is 85vh tall
- [ ] Grid displays 1 column on mobile (< 640px)
- [ ] Grid displays 2 columns on tablet (640-1024px)
- [ ] Grid displays 3 columns on desktop (1024-1280px)
- [ ] Grid displays 4 columns on desktop XL (>= 1280px)
- [ ] Touch targets are >= 44x44px
- [ ] Filters are usable on small screens
- [ ] Buttons are properly sized for touch
- [ ] Card content is readable on small screens

## Implementation Checklist

- [ ] Create /musicians route
- [ ] Create server function to call backend API
- [ ] Create ProfileSearchFilters component
- [ ] Create ProfileSearchCard component
- [ ] Create ProfileSearchResults component
- [ ] Create ProfileSearchSkeleton component
- [ ] Create ProfileSearchEmptyState component
- [ ] Create ProfileSearchErrorState component
- [ ] Add "Find Musicians" link to navigation
- [ ] Implement filter state management
- [ ] Implement search functionality
- [ ] Implement clear filters functionality
- [ ] Implement pagination
- [ ] Implement mobile filter drawer
- [ ] Implement geocoding fallback warning
- [ ] Implement focus management (results heading)
- [ ] Implement screen reader announcements
- [ ] Test all UI states (loading, empty, error, success)
- [ ] Test mobile responsiveness
- [ ] Test accessibility (keyboard nav, screen readers)
- [ ] Invoke code-quality-enforcer before marking complete
- [ ] Verify all code passes Prettier, ESLint, TypeScript checks

## Notes

- Use Tanstack Query for data fetching (server functions handle this)
- All validation uses Zod schemas from `packages/common`
- Message button redirects to /messages with userId param
- View Profile button navigates to /profile/:userId
- Geocoding fallback warning only shows if backend returns `geocodingFallback: true`
- Filter state should be synced with URL query params for shareable searches
- Desktop sidebar is sticky (position: sticky, top: 5rem)
