# Discovery

Personalized band discovery recommendations based on user profile matching.

## Key Components

- `BandDiscoveryCard` - Band card with match score and reasons
- `BandDiscoveryFeed` - Grid of recommended bands with pagination
- `MatchReasonBadge` - Visual indicator for match reasons (instrument/genre/location)
- `ProfileCompletionPrompt` - Prompts incomplete profiles to complete setup

## Hooks

- `useBandDiscovery` - Fetches personalized band recommendations with pagination

## Server Functions

- `discoverBands` - Fetches recommended bands based on matching algorithm
- `trackDiscoveryEvent` - Tracks analytics (page view, card click, profile view)

## Data Flow

1. User navigates to `/discover/bands`
2. Backend calculates match scores based on:
    - Instrument match (primary: 50pts, additional: 25pts)
    - Genre match (primary: 30pts, secondary: 15pts)
    - Location proximity (<10mi: 20pts, <25mi: 10pts, <50mi: 5pts)
3. Only bands with "looking for" text and score ≥20 shown
4. Results sorted by match score, paginated (12 per page)
5. Analytics tracked on interactions
