# Discovery

Personalized band discovery recommendations based on user profile matching.

## Key Components

- `band-discovery-card.tsx` - Band card with match score and match reasons
- `match-score-badge.tsx` - Visual badge showing match score (0-100)
- `match-reason-tag.tsx` - Tag showing match reason (instrument/genre/location)
- `empty-discovery-state.tsx` - Empty state when no recommendations available
- `band-discovery-card-skeleton.tsx` - Loading skeleton for discovery cards

## Hooks

- `useDiscoveryAnalytics` (from `use-discovery-analytics.ts`) - Tracks discovery interaction analytics

## Server Functions

- `discoverBands` - Fetches personalized band recommendations based on matching algorithm
- `trackDiscoveryEvent` - Tracks analytics events (page view, card click, profile view)

## Data Flow

1. User navigates to `/discover/bands`
2. Backend calculates match scores based on:
    - Instrument match (primary: 50pts, additional: 25pts)
    - Genre match (primary: 30pts, secondary: 15pts)
    - Location proximity (<10mi: 20pts, <25mi: 10pts, <50mi: 5pts)
3. Only bands with "looking for" text and score ≥20 shown
4. Results sorted by match score, paginated (12 per page)
5. Analytics tracked on interactions
