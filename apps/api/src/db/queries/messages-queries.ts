import { db } from '@/api/db';
import { messagesTable } from '@/api/db/schema';
import { and, asc, eq, or } from 'drizzle-orm';

export const getMessagesByUserIds = async (senderId: string, receiverId: string) => {
    return db
        .select()
        .from(messagesTable)
        .where(
            or(
                and(eq(messagesTable.senderId, senderId), eq(messagesTable.receiverId, receiverId)),
                and(eq(messagesTable.senderId, receiverId), eq(messagesTable.receiverId, senderId))
            )
        )
        .orderBy(asc(messagesTable.createdAt));
};
