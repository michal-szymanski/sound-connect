# Search

Advanced musician and band search with filters for instruments, genres, location, and availability.

## Key Components
- `ProfileSearchFilters` - Filter form for musician search
- `BandSearchFilters` - Filter form for band search
- `ProfileCard` - User profile card with key info
- `BandCard` - Band card with members preview
- `SearchResults` - Grid of results with pagination

## Hooks
- `useProfileSearch` - Searches musicians with filters
- `useBandSearch` - Searches bands with filters

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
