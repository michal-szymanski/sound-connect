import { DrizzleD1Database } from 'drizzle-orm/d1';
import * as schema from '@/api/db/schema';
import { auth } from 'auth';

export type HonoContext = {
    Bindings: CloudflareBindings;
    Variables: {
        user: typeof auth.$Infer.Session.user | null;
		session: typeof auth.$Infer.Session.session | null
    };
};

export type Schema = typeof schema;

export type DrizzleDB = DrizzleD1Database<Schema>;
