# Durable Objects Package

This package contains Cloudflare Durable Object classes used for real-time communication across the Sound Connect application.

📚 **[← Back to Main Documentation](../../CLAUDE.md)**

## Contents

- `ChatDurableObject` - Manages real-time chat room state and message broadcasting
- `UserDurableObject` - Manages per-user WebSocket connections and online status
- `NotificationsDurableObject` - Manages real-time notification delivery

## Technology Stack

- **Runtime**: Cloudflare Workers with Durable Objects
- **Storage**: Durable Object Storage API
- **Real-time**: WebSockets

## Architecture

Durable Objects are stateful, single-instance workers that handle real-time features:

- **ChatDurableObject**: One instance per chat room, manages participants and message history
- **UserDurableObject**: One instance per user, manages WebSocket connection and subscriptions
- **NotificationsDurableObject**: Shared instance for all users, routes notifications to connected clients

## Usage

These Durable Objects are imported and exported by worker applications:

```typescript
// In apps/api/src/server.ts
import { ChatDurableObject, UserDurableObject, NotificationsDurableObject } from '@sound-connect/durable-objects';

export { ChatDurableObject, UserDurableObject, NotificationsDurableObject };
```

Workers bind to these Durable Objects via `wrangler.jsonc`:

```jsonc
{
    "durable_objects": {
        "bindings": [
            {
                "name": "ChatDO",
                "class_name": "ChatDurableObject"
            }
        ]
    }
}
```

## AI Rules

- Durable Objects have access to `this.env` for accessing bindings (DB, other DOs, etc.)
- Each Durable Object instance is single-threaded and handles one entity (user, room, etc.)
- Use Durable Object Storage for persistent state that survives between requests
- WebSocket connections must be accepted before use
- Always handle WebSocket errors and cleanup on disconnect
