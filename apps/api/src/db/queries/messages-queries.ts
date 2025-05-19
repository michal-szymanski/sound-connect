import { db } from '@/api/db';
import { messagesTable } from '@/api/db/schema';
import { and, eq } from 'drizzle-orm';

export const getMessagesByUserIds = async (senderId: number, receiverId: number) => {
    return db
        .select()
        .from(messagesTable)
        .where(and(eq(messagesTable.senderId, senderId), eq(messagesTable.receiverId, receiverId)));
};
