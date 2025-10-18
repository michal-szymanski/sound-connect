import { drizzle } from 'drizzle-orm/d1';

export const db = (env?: CloudflareBindings) => {
    if (!env?.DB) {
        throw new Error('Database binding not found');
    }
    return drizzle(env.DB);
};
