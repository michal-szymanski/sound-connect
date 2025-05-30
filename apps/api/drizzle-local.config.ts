import { defineConfig } from 'drizzle-kit';
import fs from 'fs';
import path from 'path';

const dbDirectory = path.resolve('.wrangler/state/v3/d1/miniflare-D1DatabaseObject');
const dbFile = fs.readdirSync(dbDirectory).find((file) => file.endsWith('.sqlite'));

if (!dbFile) {
    throw new Error('SQLite database file not found in the specified directory.');
}

const dbFilePath = path.join(dbDirectory, dbFile);

export default defineConfig({
    schema: 'src/db/schema.ts',
    out: 'src/db/migrations',
    dialect: 'sqlite',
    dbCredentials: {
        url: dbFilePath
    },
    migrations: {
        table: 'migrations',
        schema: 'public'
    },
    verbose: true,
    strict: true
});
