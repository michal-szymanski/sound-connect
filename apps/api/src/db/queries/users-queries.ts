import { schema } from '@/drizzle';
import { userDTOSchema } from '@/common/types/models';
import { aliasedTable, eq, sql } from 'drizzle-orm';
import { and } from 'drizzle-orm';
import z from 'zod';
import { db } from '../index';
import { isReservedUsername } from '@sound-connect/common/reserved-usernames';

const { users, usersFollowersTable } = schema;

export const getFollowedUsers = async (userId: string) => {
    const results = await db
        .select({
            id: users.id,
            name: users.name,
            image: users.image
        })
        .from(usersFollowersTable)
        .innerJoin(users, eq(users.id, usersFollowersTable.followedUserId))
        .where(eq(usersFollowersTable.userId, userId));

    const schema = z.array(userDTOSchema);
    return schema.parse(results);
};

export const getUserFollowers = async (userId: string) => {
    const results = await db
        .select({
            id: users.id,
            name: users.name,
            image: users.image
        })
        .from(usersFollowersTable)
        .innerJoin(users, eq(users.id, usersFollowersTable.userId))
        .where(eq(usersFollowersTable.followedUserId, userId));

    const schema = z.array(userDTOSchema);
    return schema.parse(results);
};

export const getUserById = async (userId: string) => {
    const results = await db
        .select({
            id: users.id,
            name: users.name,
            image: users.image
        })
        .from(users)
        .where(eq(users.id, userId));

    const [user] = results;
    return userDTOSchema.parse(user);
};

export const followUser = async (userId: string, followedUserId: string) => {
    return db.insert(usersFollowersTable).values({
        userId,
        followedUserId,
        createdAt: new Date().toISOString()
    });
};

export const unfollowUser = async (userId: string, followedUserId: string) => {
    return db.delete(usersFollowersTable).where(and(eq(usersFollowersTable.userId, userId), eq(usersFollowersTable.followedUserId, followedUserId)));
};

export const getContacts = async (userId: string) => {
    const uf2 = aliasedTable(usersFollowersTable, 'uf2');

    const results = await db
        .select({
            id: users.id,
            name: users.name,
            image: users.image
        })
        .from(usersFollowersTable)
        .innerJoin(uf2, and(eq(usersFollowersTable.followedUserId, uf2.userId), eq(usersFollowersTable.userId, uf2.followedUserId)))
        .innerJoin(users, eq(users.id, usersFollowersTable.followedUserId))
        .where(eq(usersFollowersTable.userId, userId));

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

export const updateUserImage = async (userId: string, imageUrl: string) => {
    const [updated] = await db
        .update(users)
        .set({ image: imageUrl, updatedAt: new Date() })
        .where(eq(users.id, userId))
        .returning({
            id: users.id,
            name: users.name,
            image: users.image
        });

    return updated;
};

export const updateUserBackgroundImage = async (userId: string, backgroundImageUrl: string) => {
    const [updated] = await db
        .update(users)
        .set({ backgroundImage: backgroundImageUrl, updatedAt: new Date() })
        .where(eq(users.id, userId))
        .returning({
            id: users.id,
            name: users.name,
            backgroundImage: users.backgroundImage
        });

    return updated;
};

export const isUsernameAvailable = async (username: string): Promise<boolean> => {
    const normalized = username.toLowerCase();

    if (isReservedUsername(normalized)) {
        return false;
    }

    const [existingUser] = await db
        .select({ id: users.id })
        .from(users)
        .where(sql`LOWER(${users.username}) = ${normalized}`)
        .limit(1);

    return !existingUser;
};

export const updateUsername = async (userId: string, username: string | null) => {
    const [updated] = await db
        .update(users)
        .set({ username, updatedAt: new Date() })
        .where(eq(users.id, userId))
        .returning({
            id: users.id,
            name: users.name,
            username: users.username
        });

    return updated;
};

export const getUserByUsername = async (username: string) => {
    const normalized = username.toLowerCase();

    const [user] = await db
        .select({
            id: users.id,
            name: users.name,
            image: users.image
        })
        .from(users)
        .where(sql`LOWER(${users.username}) = ${normalized}`)
        .limit(1);

    if (!user) {
        return null;
    }

    return userDTOSchema.parse(user);
};
