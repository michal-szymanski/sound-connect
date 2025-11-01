import { cleanTestData } from '@/e2e/utils/db-snapshot';

console.log('\n🔄 Manual Database Reset\n');

try {
    cleanTestData();
    console.log('✅ Database has been reset\n');
} catch (error) {
    console.error('❌ Error resetting database:', error);
    process.exit(1);
}
