import { drizzle } from 'drizzle-orm/d1';
import * as schema from '@/drizzle/schema';

export const createDb = (d1: D1Database) => drizzle(d1, { schema });

let _db: ReturnType<typeof createDb> | null = null;

export const initDb = (d1: D1Database) => {
    if (!_db) {
        _db = createDb(d1);
    }
    return _db;
};

export const getDb = () => {
    if (!_db) {
        throw new Error('Database not initialized. Call initDb first.');
    }
    return _db;
};

export const db = new Proxy({} as ReturnType<typeof createDb>, {
    get(_, prop) {
        return getDb()[prop as keyof ReturnType<typeof createDb>];
    }
});
