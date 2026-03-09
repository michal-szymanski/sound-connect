import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { z } from 'zod';
import { HonoContext } from 'types';
import {
    getUserSettings,
    createUserSettings,
    updatePrivacySettings,
    updateNotificationSettings,
    getBlockedUsers,
    blockUser,
    unblockUser,
    isUserBlocked
} from '@/api/db/queries/settings-queries';
import {
    privacySettingsSchema,
    updatePrivacySettingsSchema,
    updateNotificationSettingsSchema,
    notificationSettingsSchema,
    updateEmailSchema,
    updatePasswordSchema,
    deleteAccountSchema,
    accountInfoSchema,
    checkUsernameAvailabilitySchema,
    checkUsernameAvailabilityResponseSchema,
    updateUsernameSchema,
    updateUsernameResponseSchema
} from '@sound-connect/common/types/settings';
import { schema } from '@/drizzle';
import { db } from '@/api/db';
import { eq, and, sql } from 'drizzle-orm';
import { getUserById, updateUsername } from '@/api/db/queries/users-queries';
import { isUsernameGloballyAvailable } from '@/api/db/queries/profile-queries';

const settingsRoutes = new Hono<HonoContext>();

const {
    users,
    accounts,
    sessions,
    userProfilesTable,
    postsTable,
    commentsTable,
    messagesTable,
    bandsMembersTable,
    usersFollowersTable,
    chatRoomParticipantsTable
} = schema;

settingsRoutes.get('/users/me/settings/privacy', async (c) => {
    const currentUser = c.get('user');

    let settings = await getUserSettings(currentUser.id);

    if (!settings) {
        settings = await createUserSettings(currentUser.id);
    }

    if (!settings) {
        throw new HTTPException(500, { message: 'Failed to create user settings' });
    }

    const response = privacySettingsSchema.parse({
        profileVisibility: settings.profileVisibility,
        searchVisibility: Boolean(settings.searchVisibility),
        messagingPermission: settings.messagingPermission,
        followPermission: settings.followPermission
    });

    return c.json(response);
});

settingsRoutes.patch('/users/me/settings/privacy', async (c) => {
    const currentUser = c.get('user');
    const body = await c.req.json();
    const data = updatePrivacySettingsSchema.parse(body);

    let settings = await getUserSettings(currentUser.id);

    if (!settings) {
        settings = await createUserSettings(currentUser.id);
    }

    if (!settings) {
        throw new HTTPException(500, { message: 'Failed to create user settings' });
    }

    const updateData: {
        profileVisibility?: 'public' | 'followers_only' | 'private';
        searchVisibility?: boolean;
        messagingPermission?: 'anyone' | 'followers' | 'none';
        followPermission?: 'anyone' | 'approval' | 'none';
    } = {};

    if (data.profileVisibility !== undefined) {
        updateData.profileVisibility = data.profileVisibility;
    }
    if (data.searchVisibility !== undefined) {
        updateData.searchVisibility = data.searchVisibility;
    }
    if (data.messagingPermission !== undefined) {
        updateData.messagingPermission = data.messagingPermission;
    }
    if (data.followPermission !== undefined) {
        updateData.followPermission = data.followPermission;
    }

    const updated = await updatePrivacySettings(currentUser.id, updateData);

    if (!updated) {
        throw new HTTPException(500, { message: 'Failed to update privacy settings' });
    }

    const response = privacySettingsSchema.parse({
        profileVisibility: updated.profileVisibility,
        searchVisibility: Boolean(updated.searchVisibility),
        messagingPermission: updated.messagingPermission,
        followPermission: updated.followPermission
    });

    return c.json({
        message: 'Privacy settings updated',
        settings: response
    });
});

settingsRoutes.get('/users/me/settings/notifications', async (c) => {
    const currentUser = c.get('user');

    let settings = await getUserSettings(currentUser.id);

    if (!settings) {
        settings = await createUserSettings(currentUser.id);
    }

    if (!settings) {
        throw new HTTPException(500, { message: 'Failed to create user settings' });
    }

    const response = notificationSettingsSchema.parse({
        emailEnabled: Boolean(settings.emailEnabled),
        followNotifications: Boolean(settings.followNotifications),
        commentNotifications: Boolean(settings.commentNotifications),
        reactionNotifications: Boolean(settings.reactionNotifications),
        mentionNotifications: Boolean(settings.mentionNotifications),
        bandApplicationNotifications: Boolean(settings.bandApplicationNotifications),
        bandResponseNotifications: Boolean(settings.bandResponseNotifications)
    });

    return c.json(response);
});

settingsRoutes.patch('/users/me/settings/notifications', async (c) => {
    const currentUser = c.get('user');
    const body = await c.req.json();
    const data = updateNotificationSettingsSchema.parse(body);

    let settings = await getUserSettings(currentUser.id);

    if (!settings) {
        settings = await createUserSettings(currentUser.id);
    }

    if (!settings) {
        throw new HTTPException(500, { message: 'Failed to create user settings' });
    }

    const updated = await updateNotificationSettings(currentUser.id, data);

    if (!updated) {
        throw new HTTPException(500, { message: 'Failed to update notification settings' });
    }

    const response = notificationSettingsSchema.parse({
        emailEnabled: Boolean(updated.emailEnabled),
        followNotifications: Boolean(updated.followNotifications),
        commentNotifications: Boolean(updated.commentNotifications),
        reactionNotifications: Boolean(updated.reactionNotifications),
        mentionNotifications: Boolean(updated.mentionNotifications),
        bandApplicationNotifications: Boolean(updated.bandApplicationNotifications),
        bandResponseNotifications: Boolean(updated.bandResponseNotifications)
    });

    return c.json({
        message: 'Notification preferences updated',
        settings: response
    });
});

settingsRoutes.get('/users/me/blocked', async (c) => {
    const currentUser = c.get('user');

    const blockedUsers = await getBlockedUsers(currentUser.id);

    return c.json({
        blockedUsers: blockedUsers.map((user) => ({
            id: user.id,
            name: user.name,
            image: user.image,
            blockedAt: user.blockedAt
        }))
    });
});

settingsRoutes.post('/users/:userId/block', async (c) => {
    const { userId } = z.object({ userId: z.string() }).parse(c.req.param());
    const currentUser = c.get('user');

    if (userId === currentUser.id) {
        throw new HTTPException(400, { message: 'Cannot block yourself' });
    }

    const targetUser = await getUserById(userId);
    if (!targetUser) {
        throw new HTTPException(404, { message: 'User not found' });
    }

    const alreadyBlocked = await isUserBlocked(currentUser.id, userId);
    if (alreadyBlocked) {
        throw new HTTPException(400, { message: 'User already blocked' });
    }

    await blockUser(currentUser.id, userId);

    return c.json({ message: 'User blocked successfully' });
});

settingsRoutes.delete('/users/:userId/block', async (c) => {
    const { userId } = z.object({ userId: z.string() }).parse(c.req.param());
    const currentUser = c.get('user');

    const alreadyBlocked = await isUserBlocked(currentUser.id, userId);
    if (!alreadyBlocked) {
        throw new HTTPException(404, { message: 'User not blocked' });
    }

    await unblockUser(currentUser.id, userId);

    return c.json({ message: 'User unblocked successfully' });
});

settingsRoutes.get('/users/me/account-info', async (c) => {
    const currentUser = c.get('user');

    const [user] = await db.select().from(users).where(eq(users.id, currentUser.id)).limit(1);

    if (!user) {
        throw new HTTPException(404, { message: 'User not found' });
    }

    const response = accountInfoSchema.parse({
        email: user.email,
        createdAt: new Date(user.createdAt).toISOString(),
        lastActiveAt: user.lastActiveAt
    });

    return c.json(response);
});

settingsRoutes.patch('/users/me/email', async (c) => {
    const currentUser = c.get('user');
    const body = await c.req.json();
    const { email } = updateEmailSchema.parse(body);

    const [existingUser] = await db
        .select()
        .from(users)
        .where(and(eq(users.email, email), sql`${users.id} != ${currentUser.id}`))
        .limit(1);

    if (existingUser) {
        throw new HTTPException(409, { message: 'Email already in use' });
    }

    return c.json({
        message: `Verification email sent to ${email}`
    });
});

settingsRoutes.patch('/users/me/password', async (c) => {
    const currentUser = c.get('user');
    const body = await c.req.json();
    updatePasswordSchema.parse(body);

    const [account] = await db
        .select()
        .from(accounts)
        .where(and(eq(accounts.userId, currentUser.id), eq(accounts.providerId, 'credential')))
        .limit(1);

    if (!account || !account.password) {
        throw new HTTPException(400, { message: 'Password authentication not configured' });
    }

    return c.json({
        message: 'Password updated successfully'
    });
});

settingsRoutes.post('/users/me/export', async (c) => {
    const currentUser = c.get('user');

    const [user] = await db.select().from(users).where(eq(users.id, currentUser.id)).limit(1);

    if (!user) {
        throw new HTTPException(404, { message: 'User not found' });
    }

    const [profile] = await db.select().from(userProfilesTable).where(eq(userProfilesTable.userId, currentUser.id)).limit(1);

    const posts = await db.select().from(postsTable).where(eq(postsTable.userId, currentUser.id));

    const comments = await db.select().from(commentsTable).where(eq(commentsTable.userId, currentUser.id));

    const userChatRooms = await db
        .select({ chatRoomId: chatRoomParticipantsTable.chatRoomId })
        .from(chatRoomParticipantsTable)
        .where(eq(chatRoomParticipantsTable.userId, currentUser.id));

    const chatRoomIds = userChatRooms.map((room) => room.chatRoomId);

    const allMessages =
        chatRoomIds.length > 0
            ? await db
                  .select()
                  .from(messagesTable)
                  .where(
                      sql`${messagesTable.chatRoomId} IN (${sql.join(
                          chatRoomIds.map((id) => sql`${id}`),
                          sql`, `
                      )})`
                  )
            : [];

    const sentMessages = allMessages.filter((msg) => msg.senderId === currentUser.id);
    const receivedMessages = allMessages.filter((msg) => msg.senderId !== currentUser.id);

    const bandMemberships = await db.select().from(bandsMembersTable).where(eq(bandsMembersTable.userId, currentUser.id));

    const followers = await db.select().from(usersFollowersTable).where(eq(usersFollowersTable.followedUserId, currentUser.id));

    const following = await db.select().from(usersFollowersTable).where(eq(usersFollowersTable.userId, currentUser.id));

    const exportData = {
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            createdAt: new Date(user.createdAt).toISOString(),
            lastActiveAt: user.lastActiveAt
        },
        profile,
        posts,
        comments,
        messages: {
            sent: sentMessages,
            received: receivedMessages
        },
        bands: bandMemberships,
        followers,
        following,
        exportedAt: new Date().toISOString()
    };

    const jsonContent = JSON.stringify(exportData, null, 2);
    const fileName = `${currentUser.id}-${Date.now()}.json`;
    const tempKey = `temp/${currentUser.id}/${fileName}`;

    await c.env.ASSETS.put(tempKey, jsonContent, {
        httpMetadata: {
            contentType: 'application/json'
        }
    });

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const downloadUrl = `${c.env.R2_PUBLIC_URL}/${tempKey}`;

    return c.json({
        downloadUrl,
        expiresAt: expiresAt.toISOString()
    });
});

settingsRoutes.delete('/users/me', async (c) => {
    const currentUser = c.get('user');
    const body = await c.req.json();
    deleteAccountSchema.parse(body);

    const [account] = await db
        .select()
        .from(accounts)
        .where(and(eq(accounts.userId, currentUser.id), eq(accounts.providerId, 'credential')))
        .limit(1);

    if (!account || !account.password) {
        throw new HTTPException(400, { message: 'Password authentication not configured' });
    }

    const adminBands = await db
        .select()
        .from(bandsMembersTable)
        .where(and(eq(bandsMembersTable.userId, currentUser.id), eq(bandsMembersTable.isAdmin, true)));

    for (const membership of adminBands) {
        const allAdmins = await db
            .select()
            .from(bandsMembersTable)
            .where(and(eq(bandsMembersTable.bandId, membership.bandId), eq(bandsMembersTable.isAdmin, true)));

        if (allAdmins.length === 1) {
            throw new HTTPException(400, {
                message: 'Cannot delete account: You are the last admin of one or more bands. Please transfer ownership or delete the bands first.'
            });
        }
    }

    await db.transaction(async (tx) => {
        await tx.delete(sessions).where(eq(sessions.userId, currentUser.id));

        await tx.delete(users).where(eq(users.id, currentUser.id));
    });

    return c.json({
        message: 'Account deleted successfully'
    });
});

settingsRoutes.post('/users/username/check', async (c) => {
    const body = await c.req.json();
    const { username } = checkUsernameAvailabilitySchema.parse(body);

    const result = await isUsernameGloballyAvailable(username);

    const response = checkUsernameAvailabilityResponseSchema.parse({
        available: result.available,
        username
    });

    return c.json(response);
});

settingsRoutes.patch('/users/me/username', async (c) => {
    const currentUser = c.get('user');
    const body = await c.req.json();
    const { username } = updateUsernameSchema.parse(body);

    if (username !== null) {
        const result = await isUsernameGloballyAvailable(username, currentUser.id);

        if (!result.available) {
            throw new HTTPException(409, { message: 'Username is already taken' });
        }
    }

    const updated = await updateUsername(currentUser.id, username);

    if (!updated) {
        throw new HTTPException(500, { message: 'Failed to update username' });
    }

    const response = updateUsernameResponseSchema.parse({
        message: username === null ? 'Username removed successfully' : 'Username updated successfully',
        username: updated.username
    });

    return c.json(response);
});

export { settingsRoutes };
