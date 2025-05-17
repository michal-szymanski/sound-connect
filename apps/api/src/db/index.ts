import { drizzle } from 'drizzle-orm/d1';
import dotenv from 'dotenv';
import path from 'path';
import * as schema from './schema';
import { Context } from 'hono';

const envPath = path.join(process.cwd(), '.env');
dotenv.config({ path: envPath });

export const db = (c: Context) => drizzle<typeof schema>(c.env.DB, { schema });
