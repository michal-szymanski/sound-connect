import { schema } from '@/drizzle';
import { notificationSchema, type NotificationType, type EntityType } from '@/common/types/drizzle';
import { and, desc, eq, inArray } from 'drizzle-orm';
import z from 'zod';
import { db } from '../index';

const { notificationsTable } = schema;

export const getUserNotifications = async (userId: string, limit?: number) => {
    const baseQuery = db
        .select({
            id: notificationsTable.id,
            userId: notificationsTable.userId,
            type: notificationsTable.type,
            actorId: notificationsTable.actorId,
            entityId: notificationsTable.entityId,
            entityType: notificationsTable.entityType,
            content: notificationsTable.content,
            seen: notificationsTable.seen,
            createdAt: notificationsTable.createdAt
        })
        .from(notificationsTable)
        .where(eq(notificationsTable.userId, userId))
        .orderBy(desc(notificationsTable.createdAt));

    const results = limit !== undefined ? await baseQuery.limit(limit) : await baseQuery;

    const arraySchema = z.array(notificationSchema);
    return arraySchema.parse(results);
};

export const createNotification = async (data: {
    userId: string;
    type: NotificationType;
    actorId: string;
    entityId?: string | null;
    entityType?: EntityType | null;
    content: string;
}) => {
    return db.insert(notificationsTable).values({
        userId: data.userId,
        type: data.type,
        actorId: data.actorId,
        entityId: data.entityId ?? null,
        entityType: data.entityType ?? null,
        content: data.content,
        seen: false,
        createdAt: new Date().toISOString()
    });
};

export const markNotificationAsSeen = async (notificationId: number) => {
    return db.update(notificationsTable).set({ seen: true }).where(eq(notificationsTable.id, notificationId));
};

export const markNotificationsAsSeen = async (notificationIds: number[], userId: string) => {
    return db
        .update(notificationsTable)
        .set({ seen: true })
        .where(and(eq(notificationsTable.userId, userId), inArray(notificationsTable.id, notificationIds)));
};

export const markAllNotificationsAsSeen = async (userId: string) => {
    return db
        .update(notificationsTable)
        .set({ seen: true })
        .where(and(eq(notificationsTable.userId, userId), eq(notificationsTable.seen, false)));
};

export const deleteNotification = async (notificationId: number) => {
    return db.delete(notificationsTable).where(eq(notificationsTable.id, notificationId));
};
