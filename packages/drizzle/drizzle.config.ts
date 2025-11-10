import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    schema: './src/schema.ts',
    out: './migrations',
    dialect: 'sqlite',
    driver: 'd1-http',
    dbCredentials: {
        accountId: 'a9aafd47f2deb719fa67d2987fefbb47',
        databaseId: '6f14b889-a6fb-4565-857d-d841cef75df2',
        token: 'toA-LhJ726BPQ85bWRRr2-81mXhwIHnMobAVns-3'
    },
    migrations: {
        table: 'migrations',
        schema: 'public'
    },
    verbose: true,
    strict: true
});
