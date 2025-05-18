import { drizzle } from 'drizzle-orm/d1';
import dotenv from 'dotenv';
import path from 'path';
import * as schema from './schema';
import { env } from "cloudflare:workers";

const envPath = path.join(process.cwd(), '.env');
dotenv.config({ path: envPath });

export const db = drizzle<typeof schema>(env.DB, { schema });
