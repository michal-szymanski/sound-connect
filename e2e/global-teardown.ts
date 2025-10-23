import { cleanupSnapshots } from '@/e2e/utils/db-snapshot';

export default async function globalTeardown() {
    console.log('\n🧹 E2E Test Global Teardown\n');

    cleanupSnapshots();

    console.log('✅ Global teardown complete\n');
}
