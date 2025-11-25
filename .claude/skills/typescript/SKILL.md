---
name: typescript
description: TypeScript patterns and conventions for Sound Connect. Use when writing TypeScript code, defining types, creating enums, working with generics, or implementing type guards. Covers type vs interface rules, naming conventions, and project-specific patterns.
---

# TypeScript

## Overview

TypeScript patterns and conventions specific to Sound Connect. Always use `type` over `interface`, follow kebab-case file naming, and derive types from `as const` arrays for enums.

## Documentation

For TypeScript language features and syntax, fetch up-to-date documentation:

```
mcp__context7__get-library-docs
context7CompatibleLibraryID: /microsoft/typescript
topic: [relevant topic]
```

## Type vs Interface

**Always use `type` unless technically impossible.**

The only exception is declaration merging in `declare module` blocks (e.g., extending third-party library types).

```typescript
type User = {
    id: string;
    name: string;
    email: string;
};

type ApiResponse<T> = {
    data: T;
    status: number;
};
```

## Component Props

**Always name component props type as `Props`.**

```typescript
type Props = {
    userId: string;
    onSelect: (id: string) => void;
    isDisabled?: boolean;
};

export function UserCard({ userId, onSelect, isDisabled }: Props) {
    // ...
}
```

For components with children, use `React.PropsWithChildren`:

```typescript
type Props = React.PropsWithChildren<{
    title: string;
}>;
```

## Enum Pattern (as const)

**Use `as const` arrays instead of TypeScript enums.**

Define the array, then derive the type:

```typescript
export const AvailabilityStatusEnum = ['actively_looking', 'open_to_offers', 'not_looking', 'just_browsing'] as const;

export type AvailabilityStatus = (typeof AvailabilityStatusEnum)[number];
```

Real example from codebase:

```typescript
export const ProfileVisibilityEnum = ['public', 'followers_only', 'private'] as const;
export const MessagingPermissionEnum = ['anyone', 'followers', 'none'] as const;
export const FollowPermissionEnum = ['anyone', 'approval', 'none'] as const;
```

This pattern enables:
- Runtime array iteration
- Zod schema integration: `z.enum(AvailabilityStatusEnum)`
- Type-safe union types

## Discriminated Unions

Use `z.literal()` for discriminant fields in union types:

```typescript
export const userConversationDTOSchema = z.object({
    type: z.literal('user'),
    partnerId: z.string(),
    partner: conversationPartnerSchema
});

export const bandConversationDTOSchema = z.object({
    type: z.literal('band'),
    bandId: z.number(),
    band: bandConversationInfoSchema
});

export const conversationDTOSchema = z.discriminatedUnion('type', [
    userConversationDTOSchema,
    bandConversationDTOSchema
]);

export type ConversationDTO = z.infer<typeof conversationDTOSchema>;
```

## Type Guards and Narrowing

Use inline type predicates for filtering:

```typescript
const userInstruments = [userProfile.primaryInstrument, ...additionalInstruments.map((ai) => ai.instrument)]
    .filter((inst): inst is string => inst !== null);
```

Pattern: `(value): value is TargetType => condition`

## Deriving Types from Zod Schemas

**Always derive TypeScript types from Zod schemas using `z.infer`.**

```typescript
export const matchReasonSchema = z.object({
    type: z.enum(['instrument', 'genre', 'location']),
    label: z.string(),
    points: z.number()
});

export type MatchReason = z.infer<typeof matchReasonSchema>;
```

## Import Patterns

Import types separately using `import type`:

```typescript
import type { NotificationQueueMessage, SocialNotificationMessage } from '@sound-connect/common/types/notifications';
```

Import both values and types when needed:

```typescript
import { InstrumentEnum, GenreEnum, type Instrument, type Genre } from '@sound-connect/common/types/profile-enums';
```

## File Naming

**All file names must be kebab-case:**

- `profile-enums.ts`
- `band-discovery.ts`
- `user-card.tsx`

## Utility Types

Use built-in utility types:

```typescript
type PartialUser = Partial<User>;
type RequiredFields = Required<Pick<User, 'id' | 'email'>>;
type UserWithoutPassword = Omit<User, 'password'>;
```

Zod equivalents:

```typescript
export const updatePrivacySettingsSchema = privacySettingsSchema.partial();
export const newChatMessageSchema = chatMessageSchema.omit({ id: true, senderId: true, timestamp: true });
```

## Generic Types

Pattern for API responses:

```typescript
type ApiResponse<T> = {
    data: T;
    status: number;
};

type PaginatedResponse<T> = {
    items: T[];
    pagination: {
        currentPage: number;
        totalPages: number;
        hasNextPage: boolean;
    };
};
```

## Record Types for Enum Mappings

Use `Record` with derived enum types for exhaustive mappings:

```typescript
export const instrumentLabels: Record<(typeof InstrumentEnum)[number], string> = {
    guitar: 'Guitar',
    bass_guitar: 'Bass Guitar',
    drums: 'Drums',
    // ... all values required
};
```
