import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    schema: './db/schema.ts',
    out: './db/migrations',
    dialect: 'postgresql',
    dbCredentials: {
        host: process.env.DB_HOST!,
        port: +process.env.DB_PORT!,
        user: process.env.DB_USER!,
        password: process.env.DB_PASSWORD!,
        database: process.env.DB_NAME!,
        ssl: false
    },
    migrations: {
        table: 'migrations',
        schema: 'public'
    },
    verbose: true,
    strict: true
});
