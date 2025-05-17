import { DrizzleD1Database } from 'drizzle-orm/d1';
import * as schema from '@/api/db/schema';
import { auth } from 'auth';

declare module 'hono' {
    interface ContextVariableMap {
        db: DrizzleDB;
        auth: ReturnType<typeof auth>;
    }
}

export type HonoContext = {
    Bindings: CloudflareBindings;
    Variables: {
        user: any | null;
        session: any | null;
    };
};

export type Schema = typeof schema;

export type DrizzleDB = DrizzleD1Database<Schema>;
