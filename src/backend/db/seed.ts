import { db } from '@/backend/db';
import {
    commentsTable,
    commentsReactionsTable,
    mediaTable,
    musicGroupMembersTable,
    musicGroupsFollowersTable,
    musicGroupsTable,
    postsTable,
    postsReactionsTable,
    usersFollowersTable,
    usersTable
} from '@/backend/db/schema';
import { seed } from 'drizzle-seed';

export const main = async () => {
    await seed(db, {
        usersTable,
        postsTable,
        postsReactionsTable,
        mediaTable,
        commentsTable,
        commentsReactionsTable,
        musicGroupsTable,
        musicGroupMembersTable,
        usersFollowersTable,
        musicGroupsFollowersTable
    });
};

export default main().catch(console.error);
