import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    schema: './src/schema.ts',
    out: './migrations',
    dialect: 'sqlite',
    driver: 'd1-http',
    dbCredentials: {
        accountId: 'a9aafd47f2deb719fa67d2987fefbb47',
        databaseId: '4d13c143-e7a0-4eca-b214-25bf2ef6129a',
        token: 'REDACTED_CF_TOKEN'
    },
    migrations: {
        table: 'migrations',
        schema: 'public'
    },
    verbose: true,
    strict: true
});
