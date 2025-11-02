import { relations, sql } from 'drizzle-orm';
import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    emailVerified: integer('email_verified', { mode: 'boolean' }).default(false).notNull(),
    image: text('image'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
        .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
        .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
        .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
        .$onUpdate(() => new Date())
        .notNull()
});

export const sessions = sqliteTable('sessions', {
    id: text('id').primaryKey(),
    expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
    token: text('token').notNull().unique(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
        .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
        .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
        .$onUpdate(() => new Date())
        .notNull(),
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
    accessTokenExpiresAt: integer('access_token_expires_at', { mode: 'timestamp_ms' }),
    refreshTokenExpiresAt: integer('refresh_token_expires_at', { mode: 'timestamp_ms' }),
    scope: text('scope'),
    password: text('password'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
        .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
        .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
        .$onUpdate(() => new Date())
        .notNull()
});

export const verifications = sqliteTable('verifications', {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
        .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
        .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
        .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
        .$onUpdate(() => new Date())
        .notNull()
});

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

export const postsReactionsTable = sqliteTable('posts_reactions', {
    id: integer('id').primaryKey(),
    userId: text('user_id').notNull(),
    postId: integer('post_id')
        .notNull()
        .references(() => postsTable.id),
    createdAt: text('created_at').notNull()
});

// @ts-expect-error - Self-referencing foreign key requires circular reference
export const commentsTable = sqliteTable('comments', {
    id: integer('id').primaryKey(),
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
    id: integer('id').primaryKey(),
    userId: text('user_id').notNull(),
    commentId: integer('comment_id')
        .notNull()
        .references(() => commentsTable.id),
    createdAt: text('created_at').notNull()
});

export const mediaTypeEnum = ['image', 'video'] as const;

export const mediaTable = sqliteTable('media', {
    id: integer('id').primaryKey(),
    postId: integer('post_id')
        .notNull()
        .references(() => postsTable.id),
    type: text('type', { enum: mediaTypeEnum }).notNull(),
    key: text('key').notNull()
});

export const musicGroupsTable = sqliteTable('music_groups', {
    id: integer('id').primaryKey(),
    name: text('name').notNull(),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at')
});

export const musicGroupMembersTable = sqliteTable('music_groups_members', {
    id: integer('id').primaryKey(),
    userId: text('user_id').notNull(),
    musicGroupId: integer('music_group_id')
        .notNull()
        .references(() => musicGroupsTable.id),
    isAdmin: integer('is_admin', { mode: 'boolean' })
});

export const usersFollowersTable = sqliteTable('users_followers', {
    id: integer('id').primaryKey(),
    followedUserId: text('followed_user_id')
        .notNull()
        .references(() => users.id),
    userId: text('user_id')
        .notNull()
        .references(() => users.id),
    createdAt: text('created_at').notNull()
});

export const musicGroupsFollowersTable = sqliteTable('music_groups_followers', {
    id: integer('id').primaryKey(),
    followerId: text('follower_id').notNull(),
    musicGroupId: integer('music_group_id')
        .notNull()
        .references(() => musicGroupsTable.id),
    createdAt: text('created_at').notNull()
});

export const messagesTable = sqliteTable('messages', {
    id: integer('id').primaryKey(),
    senderId: text('sender_id')
        .notNull()
        .references(() => users.id),
    receiverId: text('receiver_id')
        .notNull()
        .references(() => users.id),
    content: text('content').notNull(),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at')
});

export const notificationTypeEnum = ['follow_request', 'follow_accepted', 'comment', 'reaction', 'mention'] as const;
export const entityTypeEnum = ['post', 'comment', 'message', 'music_group'] as const;

export const notificationsTable = sqliteTable('notifications', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: text('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type', { enum: notificationTypeEnum }).notNull(),
    actorId: text('actor_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    entityId: text('entity_id'),
    entityType: text('entity_type', { enum: entityTypeEnum }),
    content: text('content').notNull(),
    seen: integer('seen', { mode: 'boolean' }).notNull().default(false),
    createdAt: text('created_at').notNull()
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
