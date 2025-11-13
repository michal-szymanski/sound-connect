# Feature: [Name]

## Problem Statement
What problem does this solve? Who has this problem?

## Success Criteria
How do we know this feature works? What does success look like?

## User Stories
- As a [user type], I want to [action] so that [benefit]
- As a [user type], I want to [action] so that [benefit]

## Scope

### In Scope (MVP)
- Thing 1
- Thing 2
- Thing 3

### Out of Scope (Future)
- Thing A (why: not critical for MVP)
- Thing B (why: complex, validate demand first)

## User Flow

1. User does X
2. System does Y
3. User sees Z
4. User can A or B

## UI Requirements

### Components Needed
- Component 1 (description)
- Component 2 (description)

### States
- Loading state: Show...
- Empty state: Show...
- Error state: Show...
- Success state: Show...

### Interactions
- User clicks X → Y happens
- User types in Z → A validates

## API Requirements

### Endpoints Needed

#### `POST /api/endpoint`
**Purpose:** What this does
**Auth:** Required/Optional
**Request:**
```json
{
  "field": "type"
}
```
**Response:**
```json
{
  "result": "type"
}
```
**Validation:**
- Field X: required, min/max, format
**Errors:**
- 400: Invalid input (specific cases)
- 404: Resource not found
- 500: Server error

## Database Changes

### New Tables
```sql
CREATE TABLE name (
  id TEXT PRIMARY KEY,
  field TEXT NOT NULL,
  ...
)
```

### Modified Tables
- Add column `field` to `table` (type, constraints)

### Indexes Needed
- Index on `table.field` (why: improve query performance)

## Edge Cases

### What happens when...
1. User has no data? → Show empty state with CTA
2. Request fails? → Show error, allow retry
3. User is offline? → Queue action, sync when online
4. Concurrent modifications? → Last write wins / optimistic locking
5. Invalid input? → Show validation error inline
6. User cancels mid-flow? → Discard changes / save draft

## Validation Rules

### Client-side (immediate feedback)
- Field X: required, 1-100 chars
- Field Y: email format
- Field Z: positive number

### Server-side (security)
- Same as client + auth checks
- Rate limiting: X requests per Y minutes
- Business logic: User can only do X if Y

## Error Handling

### User-Facing Errors
- Scenario 1 → Error message: "..." + Action: Retry / Go back
- Scenario 2 → Error message: "..." + Action: Fix input

### Developer Errors (log, alert)
- DB connection failure
- External API timeout
- Unexpected data format

## Performance Considerations

- Expected load: X requests per minute
- Query optimization: Index on Y, limit results to Z
- Caching: Cache X for Y duration
- Rate limiting: Prevent abuse on expensive operation

## Testing Checklist

### Functional Tests
- [ ] User can do happy path flow
- [ ] Validation errors show correctly
- [ ] API returns correct data
- [ ] Database updates persist

### Edge Case Tests
- [ ] Empty state displays
- [ ] Error state displays
- [ ] Concurrent modifications handled
- [ ] Invalid input rejected

### Non-Functional Tests
- [ ] Performance acceptable (< X ms)
- [ ] Mobile responsive
- [ ] Accessible (keyboard nav, screen reader)

## Security Considerations

- [ ] Authentication required?
- [ ] Authorization (who can do this)?
- [ ] Input sanitization (XSS, SQL injection)
- [ ] Rate limiting
- [ ] Sensitive data handling

## Rollout Plan

### Phase 1 (MVP)
- Build X, Y, Z
- Ship to 10% of users
- Monitor metrics

### Phase 2 (Iterate)
- Add A, B based on feedback
- Ship to 100%

### Phase 3 (Polish)
- Improve performance
- Add nice-to-haves

## Metrics to Track

- Metric 1: Definition, target
- Metric 2: Definition, target

## Open Questions

- Question 1? (who decides: user/product)
- Question 2? (who decides: tech/implementation)

## Dependencies

- Requires Feature X to be shipped first
- Requires API change Y to be deployed
- Blocks Feature Z

---

**Estimated Effort:** X days
**Priority:** High/Medium/Low
**Owner:** Name
