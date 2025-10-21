import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    schema: './src/schema.ts',
    out: './migrations',
    dialect: 'sqlite',
    driver: 'd1-http',
    dbCredentials: {
        accountId: 'a9aafd47f2deb719fa67d2987fefbb47',
        databaseId: 'ce66ac7f-5b4a-47e8-9db6-7143d996b13c',
        token: 'REDACTED_CF_TOKEN'
    },
    migrations: {
        table: 'migrations',
        schema: 'public'
    },
    verbose: true,
    strict: true
});
