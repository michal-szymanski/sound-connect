import { db } from '../src/db';
import { schema } from '@/drizzle';

const { users, userSettingsTable } = schema;

async function backfillUserSettings() {
    console.log('Starting backfill of user settings...');

    const existingUsers = await db.select({ id: users.id }).from(users);

    console.log(`Found ${existingUsers.length} users`);

    const now = new Date().toISOString();

    for (const user of existingUsers) {
        try {
            await db
                .insert(userSettingsTable)
                .values({
                    userId: user.id,
                    createdAt: now,
                    updatedAt: now
                })
                .onConflictDoNothing();

            console.log(`Created settings for user ${user.id}`);
        } catch (error) {
            console.error(`Failed to create settings for user ${user.id}:`, error);
        }
    }

    console.log('Backfill completed!');
}

backfillUserSettings().catch((error) => {
    console.error('Backfill failed:', error);
    process.exit(1);
});
