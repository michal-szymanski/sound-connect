import { users, usersFollowersTable } from '@/api//db/schema';
import { db } from '@/api/db';
import { userDTOSchema } from '@sound-connect/common/types/models';
import { aliasedTable, eq, sql } from 'drizzle-orm';
import { and } from 'drizzle-orm';
import z from 'zod';

const getFollowedUsersQuery = db
    .select({
        id: users.id,
        name: users.name,
        image: users.image
    })
    .from(usersFollowersTable)
    .innerJoin(users, eq(users.id, usersFollowersTable.followedUserId))
    .where(eq(usersFollowersTable.userId, sql.placeholder('userId')))
    .prepare();

export const getFollowedUsers = async (userId: string) => {
    const results = await getFollowedUsersQuery.execute({ userId });
    const schema = z.array(userDTOSchema);
    return schema.parse(results);
};

const getUserFollowersQuery = db
    .select({
        id: users.id,
        name: users.name,
        image: users.image
    })
    .from(usersFollowersTable)
    .innerJoin(users, eq(users.id, usersFollowersTable.userId))
    .where(eq(usersFollowersTable.followedUserId, sql.placeholder('userId')))
    .prepare();

export const getUserFollowers = async (userId: string) => {
    const results = await getUserFollowersQuery.execute({ userId });
    const schema = z.array(userDTOSchema);
    return schema.parse(results);
};

const getUserByIdQuery = db
    .select({
        id: users.id,
        name: users.name,
        image: users.image
    })
    .from(users)
    .where(eq(users.id, sql.placeholder('userId')))
    .prepare();

export const getUserById = async (userId: string) => {
    const results = await getUserByIdQuery.execute({ userId });
    const [user] = results;
    return userDTOSchema.parse(user);
};

const followUserQuery = db
    .insert(usersFollowersTable)
    .values({
        userId: sql.placeholder('userId'),
        followedUserId: sql.placeholder('followedUserId'),
        createdAt: sql.placeholder('createdAt')
    })
    .prepare();

export const followUser = async (userId: string, followedUserId: string) => {
    return followUserQuery.execute({
        userId,
        followedUserId,
        createdAt: new Date().toISOString()
    });
};

const unfollowUserQuery = db
    .delete(usersFollowersTable)
    .where(and(eq(usersFollowersTable.userId, sql.placeholder('userId')), eq(usersFollowersTable.followedUserId, sql.placeholder('followedUserId'))))
    .prepare();

export const unfollowUser = async (userId: string, followedUserId: string) => {
    return unfollowUserQuery.execute({ userId, followedUserId });
};

const uf2 = aliasedTable(usersFollowersTable, 'uf2');
const getContactsQuery = db
    .select({
        id: users.id,
        name: users.name,
        image: users.image
    })
    .from(usersFollowersTable)
    .innerJoin(uf2, and(eq(usersFollowersTable.followedUserId, uf2.userId), eq(usersFollowersTable.userId, uf2.followedUserId)))
    .innerJoin(users, eq(users.id, usersFollowersTable.followedUserId))
    .where(eq(usersFollowersTable.userId, sql.placeholder('userId')))
    .prepare();

export const getContacts = async (userId: string) => {
    const results = await getContactsQuery.execute({ userId });
    const schema = z.array(userDTOSchema);
    return schema.parse(results);
};

export const searchUsers = async (query: string) => {
    const sqlQuery = sql.raw(`
        SELECT u.id, u.name, u.image
        FROM users_fts f
        JOIN users u ON u.rowid = f.rowid
        WHERE users_fts MATCH '${query}';
        `);

    const schema = z.array(userDTOSchema);

    const { results } = await db.run(sqlQuery);
    return schema.parse(results);
};
