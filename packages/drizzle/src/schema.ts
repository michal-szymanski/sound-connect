import { relations } from 'drizzle-orm';
import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    emailVerified: integer('email_verified', { mode: 'boolean' }).notNull(),
    image: text('image'),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
});

export const sessions = sqliteTable('sessions', {
    id: text('id').primaryKey(),
    expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
    token: text('token').notNull().unique(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' })
});

export const accounts = sqliteTable('accounts', {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: integer('access_token_expires_at', { mode: 'timestamp' }),
    refreshTokenExpiresAt: integer('refresh_token_expires_at', { mode: 'timestamp' }),
    scope: text('scope'),
    password: text('password'),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
});

export const verifications = sqliteTable('verifications', {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
});

export const postsTable = sqliteTable('posts', {
    id: integer().primaryKey(),
    userId: text('user_id').notNull(),
    content: text('content').notNull(),
    status: text('status').default('pending').notNull(),
    moderationReason: text('moderation_reason'),
    moderatedAt: text('moderated_at'),
    createdAt: text().notNull(),
    updatedAt: text()
});

export const postsReactionsTable = sqliteTable('posts_reactions', {
    id: integer().primaryKey(),
    userId: text('user_id').notNull(),
    postId: integer('post_id')
        .notNull()
        .references(() => postsTable.id),
    createdAt: text('created_at').notNull()
});

// @ts-expect-error - Self-referencing foreign key requires circular reference
export const commentsTable = sqliteTable('comments', {
    id: integer().primaryKey(),
    userId: text('user_id').notNull(),
    postId: integer('post_id')
        .notNull()
        .references(() => postsTable.id),
    // @ts-expect-error - Self-referencing foreign key requires circular reference
    parentCommentId: integer('parent_comment_id').references(() => commentsTable.id),
    content: text('content').notNull(),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at')
});

export const commentsReactionsTable = sqliteTable('comments_reactions', {
    id: integer().primaryKey(),
    userId: text('user_id').notNull(),
    commentId: integer('comment_id')
        .notNull()
        .references(() => commentsTable.id),
    createdAt: text('created_at').notNull()
});

export const mediaTypeEnum = ['image', 'video'] as const;

export const mediaTable = sqliteTable('media', {
    id: integer().primaryKey(),
    postId: integer()
        .notNull()
        .references(() => postsTable.id),
    type: text({ enum: mediaTypeEnum }),
    key: text('key').notNull()
});

export const musicGroupsTable = sqliteTable('music_groups', {
    id: integer().primaryKey(),
    name: text('name').notNull(),
    createdAt: text().notNull(),
    updatedAt: text()
});

export const musicGroupMembersTable = sqliteTable('music_groups_members', {
    id: integer().primaryKey(),
    userId: text('user_id').notNull(),
    musicGroupId: integer()
        .notNull()
        .references(() => musicGroupsTable.id),
    isAdmin: integer({ mode: 'boolean' })
});

export const usersFollowersTable = sqliteTable('users_followers', {
    id: integer().primaryKey(),
    followedUserId: text('followed_user_id')
        .notNull()
        .references(() => users.id),
    userId: text('user_id')
        .notNull()
        .references(() => users.id),
    createdAt: text().notNull()
});

export const musicGroupsFollowersTable = sqliteTable('music_groups_followers', {
    id: integer().primaryKey(),
    followerId: text('follower_id').notNull(),
    musicGroupId: integer()
        .notNull()
        .references(() => musicGroupsTable.id),
    createdAt: text().notNull()
});

export const messagesTable = sqliteTable('messages', {
    id: integer().primaryKey(),
    senderId: text()
        .notNull()
        .references(() => users.id),
    receiverId: text()
        .notNull()
        .references(() => users.id),
    content: text().notNull(),
    createdAt: text().notNull(),
    updatedAt: text()
});

export const postsRelations = relations(postsTable, ({ many }) => ({
    comments: many(commentsTable),
    reactions: many(postsReactionsTable),
    media: many(mediaTable)
}));

export const postsReactionsRelations = relations(postsReactionsTable, ({ one }) => ({
    post: one(postsTable, { fields: [postsReactionsTable.postId], references: [postsTable.id] })
}));

export const commentsRelations = relations(commentsTable, ({ one, many }) => ({
    post: one(postsTable, { fields: [commentsTable.postId], references: [postsTable.id] }),
    reactions: many(commentsReactionsTable)
}));

export const commentsReactionsRelations = relations(commentsReactionsTable, ({ one }) => ({
    comment: one(commentsTable, { fields: [commentsReactionsTable.commentId], references: [commentsTable.id] })
}));

export const mediaRelations = relations(mediaTable, ({ one }) => ({
    post: one(postsTable, { fields: [mediaTable.postId], references: [postsTable.id] })
}));

export const musicGroupsRelations = relations(musicGroupsTable, ({ many }) => ({
    members: many(musicGroupMembersTable),
    followers: many(musicGroupsFollowersTable)
}));

export const musicGroupMembersRelations = relations(musicGroupMembersTable, ({ one }) => ({
    musicGroup: one(musicGroupsTable, { fields: [musicGroupMembersTable.musicGroupId], references: [musicGroupsTable.id] })
}));

export const musicGroupsFollowersRelations = relations(musicGroupsFollowersTable, ({ one }) => ({
    musicGroup: one(musicGroupsTable, { fields: [musicGroupsFollowersTable.musicGroupId], references: [musicGroupsTable.id] })
}));
