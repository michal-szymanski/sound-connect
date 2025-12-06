# Search

Advanced musician and band search with filters for instruments, genres, location, and availability.

## Key Components

### Profile Search (`profile-search/`)
- `profile-search-filters.tsx` - Filter form for musician search (instruments, genres, location, availability)
- `profile-search-results.tsx` - Grid of profile search results with pagination
- `profile-search-card.tsx` - User profile card with key info and distance
- `profile-search-skeleton.tsx` - Loading skeleton for profile search
- `profile-search-empty-state.tsx` - Empty state when no results found
- `profile-search-error-state.tsx` - Error state for failed searches

### Band Search (`band-search/`)
- `band-search-filters.tsx` - Filter form for band search (genre, location, looking for)
- `band-search-results.tsx` - Grid of band search results with pagination
- `band-search-card.tsx` - Band card with members preview and distance
- `band-search-skeleton.tsx` - Loading skeleton for band search
- `band-search-empty-state.tsx` - Empty state when no results found
- `band-search-error-state.tsx` - Error state for failed searches

## Hooks

**Note:** Search hooks are implemented directly within components using Tanstack Query and server functions. No dedicated hook files exist.

## Server Functions

- `searchProfiles` - Searches musicians by instruments, genres, location, availability
- `searchBands` - Searches bands by genre, location, "looking for" text

## Data Flow

1. **Musician Search**:
    - Filter by instruments (multi-select, searches primary + additional)
    - Filter by genres (multi-select, searches primary + secondary)
    - Filter by location with radius (5, 10, 25, 50, 100 miles)
    - Filter by availability status (multi-select)
    - Results sorted by instrument match + last active
    - Distance calculated via haversine formula with Mapbox coordinates
    - Pagination (12 results per page)

2. **Band Search**:
    - Filter by genre
    - Filter by location with radius
    - Filter by "looking for" text search
    - Shows member count and distance
    - Pagination (12 results per page)

3. Search respects privacy settings (profile visibility, search visibility)
