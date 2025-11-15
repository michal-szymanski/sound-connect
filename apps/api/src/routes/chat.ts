import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { z } from 'zod';
import { HonoContext } from 'types';
import { getConversations } from '@/api/db/queries/conversations-queries';
import { checkMessagingPermissionRequestSchema, checkMessagingPermissionResponseSchema } from '@sound-connect/common/types/messaging';
import { drizzle } from 'drizzle-orm/d1';
import { schema } from '@sound-connect/drizzle';
import { eq, and } from 'drizzle-orm';

const chatRoutes = new Hono<HonoContext>();

chatRoutes.get('/chat/conversations', async (c) => {
    const user = c.get('user');

    if (!user) {
        throw new HTTPException(401, { message: 'Unauthorized' });
    }

    const { limit, offset } = z
        .object({
            limit: z.coerce.number().positive().max(100).optional().default(20),
            offset: z.coerce.number().min(0).optional().default(0)
        })
        .parse({
            limit: c.req.query('limit'),
            offset: c.req.query('offset')
        });

    const result = await getConversations({
        userId: user.id,
        limit,
        offset
    });

    return c.json(result);
});

chatRoutes.post('/chat/check-messaging-permission', async (c) => {
    const currentUser = c.get('user');

    if (!currentUser) {
        throw new HTTPException(401, { message: 'Unauthorized' });
    }

    const body = await c.req.json();
    const { targetUserId } = checkMessagingPermissionRequestSchema.parse(body);

    if (currentUser.id === targetUserId) {
        return c.json(
            checkMessagingPermissionResponseSchema.parse({
                canMessage: false,
                reason: 'self'
            })
        );
    }

    const db = drizzle(c.env.DB);
    const { users, blockedUsersTable, userSettingsTable, usersFollowersTable } = schema;

    const [targetUser] = await db.select().from(users).where(eq(users.id, targetUserId)).limit(1);

    if (!targetUser) {
        throw new HTTPException(404, { message: 'User not found' });
    }

    const [blockedBySender, blockedByTarget] = await Promise.all([
        db
            .select()
            .from(blockedUsersTable)
            .where(and(eq(blockedUsersTable.blockerId, currentUser.id), eq(blockedUsersTable.blockedId, targetUserId)))
            .limit(1),
        db
            .select()
            .from(blockedUsersTable)
            .where(and(eq(blockedUsersTable.blockerId, targetUserId), eq(blockedUsersTable.blockedId, currentUser.id)))
            .limit(1)
    ]);

    if (blockedBySender.length > 0 || blockedByTarget.length > 0) {
        return c.json(
            checkMessagingPermissionResponseSchema.parse({
                canMessage: false,
                reason: 'blocked'
            })
        );
    }

    const [settings] = await db.select().from(userSettingsTable).where(eq(userSettingsTable.userId, targetUserId)).limit(1);

    if (settings?.messagingPermission === 'none') {
        return c.json(
            checkMessagingPermissionResponseSchema.parse({
                canMessage: false,
                reason: 'privacy'
            })
        );
    }

    if (settings?.messagingPermission === 'followers') {
        const [following] = await db
            .select()
            .from(usersFollowersTable)
            .where(and(eq(usersFollowersTable.userId, currentUser.id), eq(usersFollowersTable.followedUserId, targetUserId)))
            .limit(1);

        if (!following) {
            return c.json(
                checkMessagingPermissionResponseSchema.parse({
                    canMessage: false,
                    reason: 'privacy'
                })
            );
        }
    }

    return c.json(
        checkMessagingPermissionResponseSchema.parse({
            canMessage: true,
            reason: null
        })
    );
});

chatRoutes.get('/chat/:roomId/history', async (c) => {
    const { roomId } = c.req.param();
    const user = c.get('user');

    if (roomId.startsWith('dm:')) {
        if (!roomId.includes(user.id)) {
            throw new HTTPException(403, { message: 'Forbidden: You are not part of this room' });
        }
    } else if (roomId.startsWith('band:')) {
        const bandIdStr = roomId.split(':')[1];
        if (!bandIdStr) {
            throw new HTTPException(400, { message: 'Invalid band room ID' });
        }
        const bandId = parseInt(bandIdStr, 10);
        if (isNaN(bandId)) {
            throw new HTTPException(400, { message: 'Invalid band room ID' });
        }

        const db = drizzle(c.env.DB);
        const { bandsMembersTable } = schema;

        const [membership] = await db
            .select()
            .from(bandsMembersTable)
            .where(and(eq(bandsMembersTable.bandId, bandId), eq(bandsMembersTable.userId, user.id)))
            .limit(1);

        if (!membership) {
            throw new HTTPException(403, { message: 'Forbidden: You are not a member of this band' });
        }
    } else {
        throw new HTTPException(400, { message: 'Invalid room ID format' });
    }

    const id = c.env.ChatDO.idFromName(`room:${roomId}`);
    const stub = c.env.ChatDO.get(id);

    const history = await stub.getRoomHistory(roomId, user.id);

    return c.json(history);
});

export { chatRoutes };
