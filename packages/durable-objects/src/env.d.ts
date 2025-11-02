import type { ChatDurableObject } from './chat-durable-object';
import type { UserDurableObject } from './user-durable-object';
import type { NotificationsDurableObject } from './notifications-durable-object';

declare global {
    namespace Cloudflare {
        interface Env {
            ChatDO: DurableObjectNamespace<ChatDurableObject>;
            UserDO: DurableObjectNamespace<UserDurableObject>;
            NotificationsDO: DurableObjectNamespace<NotificationsDurableObject>;
            DB: D1Database;
        }
    }
}

export {};
