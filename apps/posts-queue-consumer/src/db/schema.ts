import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const postsTable = sqliteTable('posts', {
    id: integer('id').primaryKey(),
    userId: text('user_id').notNull(),
    content: text('content').notNull(),
    status: text('status').default('pending').notNull(),
    moderationReason: text('moderation_reason'),
    moderatedAt: text('moderated_at'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at')
});