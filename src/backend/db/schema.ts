import { bigint, date, pgEnum, pgTable, text } from 'drizzle-orm/pg-core';
import { integer } from 'drizzle-orm/pg-core/columns/integer';

export const genderEnum = pgEnum('gender', ['male', 'female', 'unknown']);

export const usersTable = pgTable('users', {
    id: bigint('id', { mode: 'number' }).primaryKey(),
    age: integer('age').notNull(),
    firstName: text('first_name').notNull(),
    lastName: text('last_name').notNull(),
    about: text('about').notNull(),
    gender: genderEnum(),
    createdAt: date('created_at', { mode: 'date' }).notNull(),
    updatedAt: date('updated_at', { mode: 'date' })
});

export const postsTable = pgTable('posts', {
    id: bigint('id', { mode: 'number' }).primaryKey(),
    userId: bigint('user_id', { mode: 'number' }).notNull(),
    content: text('content').notNull(),
    createdAt: date('created_at', { mode: 'date' }).notNull(),
    updatedAt: date('updated_at', { mode: 'date' })
});

export const reactionsTable = pgTable('reactions', {
    id: bigint('id', { mode: 'number' }).primaryKey(),
    userId: bigint('user_id', { mode: 'number' }).notNull(),
    postId: bigint('post_id', { mode: 'number' }),
    comment_id: bigint('comment_id', { mode: 'number' }),
    createdAt: date('created_at', { mode: 'date' }).notNull()
});

export const mediaTypeEnum = pgEnum('media_type', ['image', 'video']);

export const mediaTable = pgTable('media', {
    id: bigint('id', { mode: 'number' }).primaryKey(),
    postId: bigint('post_id', { mode: 'number' }).notNull(),
    type: mediaTypeEnum(),
    url: text('url').notNull()
});

export const commentsTable = pgTable('comments', {
    id: bigint('id', { mode: 'number' }).primaryKey(),
    userId: bigint('user_id', { mode: 'number' }).notNull(),
    postId: bigint('post_id', { mode: 'number' }).notNull(),
    parentId: bigint('parent_id', { mode: 'number' }),
    content: text('content').notNull(),
    createdAt: date('created_at', { mode: 'date' }).notNull(),
    updatedAt: date('updated_at', { mode: 'date' })
});
