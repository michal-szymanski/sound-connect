import { relations } from 'drizzle-orm';
import { bigint, boolean, date, pgEnum, pgTable, text } from 'drizzle-orm/pg-core';

export const genderEnum = pgEnum('gender', ['male', 'female', 'unknown']);

export const usersTable = pgTable('users', {
    id: bigint('id', { mode: 'number' }).primaryKey(),
    birthday: date('birthday', { mode: 'date' }).notNull(),
    firstName: text('first_name').notNull(),
    lastName: text('last_name').notNull(),
    about: text('about').notNull(),
    gender: genderEnum(),
    createdAt: date('created_at', { mode: 'date' }).notNull(),
    updatedAt: date('updated_at', { mode: 'date' })
});

export const postsTable = pgTable('posts', {
    id: bigint('id', { mode: 'number' }).primaryKey(),
    userId: bigint('user_id', { mode: 'number' })
        .notNull()
        .references(() => usersTable.id),
    content: text('content').notNull(),
    createdAt: date('created_at', { mode: 'date' }).notNull(),
    updatedAt: date('updated_at', { mode: 'date' })
});

export const postsReactionsTable = pgTable('posts_reactions', {
    id: bigint('id', { mode: 'number' }).primaryKey(),
    userId: bigint('user_id', { mode: 'number' })
        .notNull()
        .references(() => usersTable.id),
    postId: bigint('post_id', { mode: 'number' })
        .notNull()
        .references(() => postsTable.id),
    createdAt: date('created_at', { mode: 'date' }).notNull()
});

export const commentsTable = pgTable('comments', {
    id: bigint('id', { mode: 'number' }).primaryKey(),
    userId: bigint('user_id', { mode: 'number' })
        .notNull()
        .references(() => usersTable.id),
    postId: bigint('post_id', { mode: 'number' })
        .notNull()
        .references(() => postsTable.id),
    content: text('content').notNull(),
    createdAt: date('created_at', { mode: 'date' }).notNull(),
    updatedAt: date('updated_at', { mode: 'date' })
});

export const commentsReactionsTable = pgTable('comments_reactions', {
    id: bigint('id', { mode: 'number' }).primaryKey(),
    userId: bigint('user_id', { mode: 'number' })
        .notNull()
        .references(() => usersTable.id),
    comment_id: bigint('comment_id', { mode: 'number' })
        .notNull()
        .references(() => commentsTable.id),
    createdAt: date('created_at', { mode: 'date' }).notNull()
});

export const mediaTypeEnum = pgEnum('media_type', ['image', 'video']);

export const mediaTable = pgTable('media', {
    id: bigint('id', { mode: 'number' }).primaryKey(),
    postId: bigint('post_id', { mode: 'number' })
        .notNull()
        .references(() => postsTable.id),
    type: mediaTypeEnum(),
    url: text('url').notNull()
});

export const musicGroupsTable = pgTable('music_groups', {
    id: bigint('id', { mode: 'number' }).primaryKey(),
    name: text('name').notNull(),
    createdAt: date('created_at', { mode: 'date' }).notNull(),
    updatedAt: date('updated_at', { mode: 'date' })
});

export const musicGroupMembersTable = pgTable('music_groups_members', {
    id: bigint('id', { mode: 'number' }).primaryKey(),
    userId: bigint('user_id', { mode: 'number' })
        .notNull()
        .references(() => usersTable.id),
    musicGroupId: bigint('music_group_id', { mode: 'number' })
        .notNull()
        .references(() => musicGroupsTable.id),
    isAdmin: boolean('is_admin')
});

export const usersFollowersTable = pgTable('users_followers', {
    id: bigint('id', { mode: 'number' }).primaryKey(),
    followerId: bigint('follower_id', { mode: 'number' })
        .notNull()
        .references(() => usersTable.id),
    userId: bigint('user_id', { mode: 'number' })
        .notNull()
        .references(() => usersTable.id),
    createdAt: date('created_at', { mode: 'date' }).notNull()
});

export const musicGroupsFollowersTable = pgTable('music_groups_followers', {
    id: bigint('id', { mode: 'number' }).primaryKey(),
    followerId: bigint('follower_id', { mode: 'number' })
        .notNull()
        .references(() => usersTable.id),
    musicGroupId: bigint('music_group_id', { mode: 'number' })
        .notNull()
        .references(() => musicGroupsTable.id),
    createdAt: date('created_at', { mode: 'date' }).notNull()
});

export const usersRelations = relations(usersTable, ({ many }) => ({
    posts: many(postsTable),
    postReactions: many(postsReactionsTable),
    comments: many(commentsTable),
    commentReactions: many(commentsReactionsTable),
    musicGroupMemberships: many(musicGroupMembersTable),
    followers: many(usersFollowersTable, { relationName: 'followers' }),
    following: many(usersFollowersTable, { relationName: 'following' }),
    musicGroupsFollowed: many(musicGroupsFollowersTable)
}));

export const postsRelations = relations(postsTable, ({ one, many }) => ({
    user: one(usersTable, { fields: [postsTable.userId], references: [usersTable.id] }),
    comments: many(commentsTable),
    reactions: many(postsReactionsTable),
    media: many(mediaTable)
}));

export const postsReactionsRelations = relations(postsReactionsTable, ({ one }) => ({
    user: one(usersTable, { fields: [postsReactionsTable.userId], references: [usersTable.id] }),
    post: one(postsTable, { fields: [postsReactionsTable.postId], references: [postsTable.id] })
}));

export const commentsRelations = relations(commentsTable, ({ one, many }) => ({
    user: one(usersTable, { fields: [commentsTable.userId], references: [usersTable.id] }),
    post: one(postsTable, { fields: [commentsTable.postId], references: [postsTable.id] }),
    reactions: many(commentsReactionsTable)
}));

export const commentsReactionsRelations = relations(commentsReactionsTable, ({ one }) => ({
    user: one(usersTable, { fields: [commentsReactionsTable.userId], references: [usersTable.id] }),
    comment: one(commentsTable, { fields: [commentsReactionsTable.comment_id], references: [commentsTable.id] })
}));

export const mediaRelations = relations(mediaTable, ({ one }) => ({
    post: one(postsTable, { fields: [mediaTable.postId], references: [postsTable.id] })
}));

export const musicGroupsRelations = relations(musicGroupsTable, ({ many }) => ({
    members: many(musicGroupMembersTable),
    followers: many(musicGroupsFollowersTable)
}));

export const musicGroupMembersRelations = relations(musicGroupMembersTable, ({ one }) => ({
    user: one(usersTable, { fields: [musicGroupMembersTable.userId], references: [usersTable.id] }),
    musicGroup: one(musicGroupsTable, { fields: [musicGroupMembersTable.musicGroupId], references: [musicGroupsTable.id] })
}));

export const usersFollowersRelations = relations(usersFollowersTable, ({ one }) => ({
    follower: one(usersTable, { fields: [usersFollowersTable.followerId], references: [usersTable.id] }),
    user: one(usersTable, { fields: [usersFollowersTable.userId], references: [usersTable.id] })
}));

export const musicGroupsFollowersRelations = relations(musicGroupsFollowersTable, ({ one }) => ({
    follower: one(usersTable, { fields: [musicGroupsFollowersTable.followerId], references: [usersTable.id] }),
    musicGroup: one(musicGroupsTable, { fields: [musicGroupsFollowersTable.musicGroupId], references: [musicGroupsTable.id] })
}));
