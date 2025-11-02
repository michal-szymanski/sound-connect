import { drizzle } from 'drizzle-orm/d1';
import * as schema from '@/drizzle/schema';
import { env } from 'cloudflare:workers';

export const db = drizzle<typeof schema>(env.DB, { schema });
