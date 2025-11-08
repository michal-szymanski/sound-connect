# Band Profile MVP - API Contracts

This document defines the API contracts between frontend and backend for the Band Profile MVP feature.

## Shared Types Location

All shared types, Zod schemas, and validation logic are defined in:
- `/packages/common/src/types/bands.ts` - Band-specific types and validation
- `/packages/common/src/types/drizzle.ts` - Updated database entity schemas
- `/packages/common/src/types/profile-enums.ts` - Genre enums (already exists)

## API Endpoints

### 1. POST /api/bands

**Purpose**: Create a new band

**Authentication**: Required (JWT)

**Request Body Schema**: `createBandInputSchema` from `@sound-connect/common/types/bands`

```typescript
{
  name: string;           // 1-100 chars
  description: string;    // 1-500 chars (bio)
  city: string;           // 1-100 chars
  state: string;          // 1-100 chars
  country?: string;       // default "USA"
  primaryGenre: Genre;    // from GenreEnum
  lookingFor?: string;    // 0-500 chars
}
```

**Response**: `bandSchema` (201 Created)

**Side Effects**:
- Creates band record in `bands` table
- Geocodes city/state to latitude/longitude
- Adds creator as admin member in `bands_members` table

**Errors**:
- 400: Validation errors (return field-specific messages)
- 401: Unauthorized
- 500: Geocoding failed or database error

---

### 2. GET /api/bands/:id

**Purpose**: Get band details with members

**Authentication**: Optional (public endpoint, returns `isUserAdmin` only if authenticated)

**Path Parameters**:
- `id`: number (band ID)

**Response**: `bandWithMembersSchema` (200 OK)

```typescript
{
  ...Band,
  members: BandMember[];  // sorted: admins first, then by joinedAt ASC
  isUserAdmin?: boolean;  // only if authenticated
}
```

**Errors**:
- 404: Band not found
- 500: Server error

---

### 3. PATCH /api/bands/:id

**Purpose**: Update band information

**Authentication**: Required (must be band admin)

**Path Parameters**:
- `id`: number (band ID)

**Request Body Schema**: `updateBandInputSchema` (all fields optional)

```typescript
{
  name?: string;
  description?: string;
  city?: string;
  state?: string;
  country?: string;
  primaryGenre?: Genre;
  lookingFor?: string;
}
```

**Response**: `bandSchema` (200 OK)

**Side Effects**:
- Updates band in `bands` table
- Re-geocodes if city/state changed
- Updates `updatedAt` timestamp

**Errors**:
- 400: Validation errors
- 401: Unauthorized
- 403: Forbidden (not a band admin)
- 404: Band not found
- 500: Server error

---

### 4. DELETE /api/bands/:id

**Purpose**: Delete band (hard delete)

**Authentication**: Required (must be band admin)

**Path Parameters**:
- `id`: number (band ID)

**Response**: 204 No Content

**Side Effects**:
- Deletes band from `bands` table
- Cascades delete to `bands_members` (all members removed)

**Errors**:
- 401: Unauthorized
- 403: Forbidden (not a band admin)
- 404: Band not found
- 500: Server error

---

### 5. POST /api/bands/:id/members

**Purpose**: Add member to band

**Authentication**: Required (must be band admin)

**Path Parameters**:
- `id`: number (band ID)

**Request Body Schema**: `addBandMemberInputSchema`

```typescript
{
  userId: string;
}
```

**Response**: `bandMemberSchema` (201 Created)

```typescript
{
  userId: string;
  name: string;
  profileImageUrl: string | null;
  isAdmin: boolean;       // always false for added members
  joinedAt: string;
}
```

**Side Effects**:
- Adds user to `bands_members` table with `isAdmin: false`

**Errors**:
- 400: User already a member
- 401: Unauthorized
- 403: Forbidden (not a band admin)
- 404: Band or user not found
- 500: Server error

---

### 6. DELETE /api/bands/:id/members/:userId

**Purpose**: Remove member from band

**Authentication**: Required (must be band admin)

**Path Parameters**:
- `id`: number (band ID)
- `userId`: string (user ID to remove)

**Response**: 204 No Content

**Side Effects**:
- Removes user from `bands_members` table

**Validation**:
- Cannot remove last admin (must have at least one admin)
- User must be a member of the band

**Errors**:
- 400: Cannot remove last admin
- 401: Unauthorized
- 403: Forbidden (not a band admin)
- 404: Band or member not found
- 500: Server error

---

### 7. GET /api/users/:userId/bands

**Purpose**: Get all bands user is a member of

**Authentication**: Optional (public endpoint)

**Path Parameters**:
- `userId`: string (user ID)

**Response**: `userBandsResponseSchema` (200 OK)

```typescript
{
  bands: BandMembership[];  // sorted: admin bands first, then by joinedAt DESC
}
```

**Errors**:
- 404: User not found
- 500: Server error

---

## Authorization Rules

**Band Admin Actions** (require `isAdmin: true` in `bands_members`):
- Update band (PATCH /api/bands/:id)
- Delete band (DELETE /api/bands/:id)
- Add members (POST /api/bands/:id/members)
- Remove members (DELETE /api/bands/:id/members/:userId)

**Validation**:
- ALWAYS use `c.get('user')` to get authenticated user ID
- NEVER trust user IDs from frontend requests
- Check admin status with database query before any write operation

---

## Database Schema Updates Required

The backend agent will need to:

1. **Add columns to `bands` table**:
   - `description` (TEXT, nullable)
   - `primary_genre` (TEXT, nullable)
   - `city` (TEXT, nullable)
   - `state` (TEXT, nullable)
   - `country` (TEXT, nullable, default 'USA')
   - `latitude` (REAL, nullable)
   - `longitude` (REAL, nullable)
   - `looking_for` (TEXT, nullable)
   - `profile_image_url` (TEXT, nullable)

2. **Add column to `bands_members` table**:
   - `joined_at` (TEXT, NOT NULL, default current timestamp)

3. **Create indexes**:
   - `idx_music_groups_primary_genre` on `primary_genre`
   - `idx_music_groups_location` on `latitude, longitude`

---

## Geocoding

**Use existing geocoding logic** from user profiles:
- Location: `/apps/api/src/helpers/geocoding.ts` (or similar)
- Should use geocoding cache table
- Return 400 error if geocoding fails: "Could not find location. Please check city and state."

---

## Validation Flow

**Both frontend and backend MUST validate using the same Zod schemas**:

1. **Frontend**: Validate input before sending request
   - Use `createBandInputSchema`, `updateBandInputSchema`, `addBandMemberInputSchema`
   - Show inline errors immediately

2. **Backend**: Validate input after receiving request
   - Use same schemas from `@sound-connect/common/types/bands`
   - Return 400 with field-specific errors on failure

**This ensures type safety and consistent validation across the stack.**

---

## Rate Limiting Recommendations

Backend should implement:
- Band creation: 5 per hour per user
- Member operations: 10 per hour per band
- General API: 100 per minute per user

---

## Error Response Format

All error responses should follow this structure:

```typescript
{
  error: string;          // Human-readable error message
  code?: string;          // Optional error code for programmatic handling
  fields?: {              // Optional field-specific validation errors
    [fieldName: string]: string;
  }
}
```

**Examples**:

```json
// Validation error
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "fields": {
    "name": "Band name is required",
    "description": "Bio must be 500 characters or less"
  }
}

// Authorization error
{
  "error": "You don't have permission to edit this band",
  "code": "FORBIDDEN"
}

// Business logic error
{
  "error": "Cannot remove the last admin. Add another admin first or delete the band.",
  "code": "LAST_ADMIN"
}
```

---

## Type Safety Chain

```
Zod Schema → TypeScript Type → Database Schema → API Response → Frontend UI
     ↓              ↓                ↓                ↓             ↓
packages/common  packages/common  drizzle schema    Hono          React
```

**Backend responsibilities**:
- Implement database migrations
- Create API endpoints with validation
- Use schemas from `@sound-connect/common/types/bands`
- Query database with Drizzle ORM
- Ensure authorization checks

**Frontend responsibilities**:
- Create UI components and forms
- Implement Tanstack Query hooks
- Use schemas from `@sound-connect/common/types/bands`
- Show loading/error states
- Handle user interactions
