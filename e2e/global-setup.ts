import { createSnapshot, cleanTestData } from '@/e2e/utils/db-snapshot';

export default async function globalSetup() {
    console.log('\n🚀 E2E Test Global Setup\n');
    console.log('Waiting for dev server to be ready...');
    console.log('(Migrations should run automatically via `pnpm dev`)\n');

    await new Promise((resolve) => setTimeout(resolve, 2000));

    cleanTestData();
    createSnapshot();

    console.log('✅ Global setup complete - ready to run tests!\n');
}
