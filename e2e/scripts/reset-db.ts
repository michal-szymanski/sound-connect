import { restoreSnapshot, snapshotExists } from '@/e2e/utils/db-snapshot';

console.log('\n🔄 Manual Database Reset\n');

if (!snapshotExists()) {
    console.error('❌ Error: No snapshot found. Please run tests at least once to create a snapshot.\n');
    process.exit(1);
}

try {
    restoreSnapshot();
    console.log('✅ Database has been reset to the snapshot state\n');
} catch (error) {
    console.error('❌ Error restoring database:', error);
    process.exit(1);
}
