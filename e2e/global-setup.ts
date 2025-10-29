import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { createSnapshot, cleanTestData } from '@/e2e/utils/db-snapshot';

async function waitForDatabase(maxWaitMs = 60000): Promise<void> {
    const dbPath = path.join(process.cwd(), '..', 'apps', 'api', '.wrangler', 'state', 'v3', 'd1', 'miniflare-D1DatabaseObject');
    const startTime = Date.now();

    console.log('⏳ Waiting for database to be ready...');

    while (Date.now() - startTime < maxWaitMs) {
        if (existsSync(dbPath)) {
            try {
                const files = readdirSync(dbPath);
                if (files.some((f) => f.endsWith('.sqlite'))) {
                    console.log('✅ Database is ready\n');
                    return;
                }
            } catch {
                // Directory might be in the process of being created
            }
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    throw new Error('Database did not initialize within timeout period. Make sure dev server is running.');
}

export default async function globalSetup() {
    console.log('\n🚀 E2E Test Global Setup\n');

    await waitForDatabase();

    cleanTestData();
    createSnapshot();

    console.log('✅ Global setup complete - ready to run tests!\n');
}
