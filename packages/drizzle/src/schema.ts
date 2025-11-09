import { relations } from 'drizzle-orm';
import { sqliteTable, integer, text, index } from 'drizzle-orm/sqlite-core';
import {
    InstrumentEnum,
    GenreEnum,
    AvailabilityStatusEnum,
    CommitmentLevelEnum,
    RehearsalFrequencyEnum,
    GiggingLevelEnum
} from '@sound-connect/common/types/profile-enums';

export * from './better-auth';

import { users } from './better-auth';

export const authorTypeEnum = ['user', 'band'] as const;

export const postsTable = sqliteTable(
    'posts',
    {
        id: integer('id').primaryKey(),
        authorType: text('author_type', { enum: authorTypeEnum }).default('user').notNull(),
        userId: text('user_id').notNull(),
        bandId: integer('band_id').references(() => bandsTable.id, { onDelete: 'cascade' }),
        content: text('content').notNull(),
        status: text('status').default('pending').notNull(),
        moderationReason: text('moderation_reason'),
        moderatedAt: text('moderated_at'),
        createdAt: text('created_at').notNull(),
        updatedAt: text('updated_at')
    },
    (table) => ({
        authorTypeIdx: index('idx_posts_author_type').on(table.authorType, table.createdAt),
        bandIdIdx: index('idx_posts_band_id').on(table.bandId)
    })
);

export const postsReactionsTable = sqliteTable('posts_reactions', {
    id: integer('id').primaryKey(),
    userId: text('user_id').notNull(),
    postId: integer('post_id')
        .notNull()
        .references(() => postsTable.id),
    createdAt: text('created_at').notNull()
});

// @ts-expect-error - Self-referencing foreign key requires circular reference
export const commentsTable = sqliteTable(
    'comments',
    {
        id: integer('id').primaryKey(),
        authorType: text('author_type', { enum: authorTypeEnum }).default('user').notNull(),
        userId: text('user_id').notNull(),
        bandId: integer('band_id').references(() => bandsTable.id, { onDelete: 'cascade' }),
        postId: integer('post_id')
            .notNull()
            .references(() => postsTable.id),
        // @ts-expect-error - Self-referencing foreign key requires circular reference
        parentCommentId: integer('parent_comment_id').references(() => commentsTable.id),
        content: text('content').notNull(),
        createdAt: text('created_at').notNull(),
        updatedAt: text('updated_at')
    },
    (table) => ({
        authorTypeIdx: index('idx_comments_author_type').on(table.authorType),
        bandIdIdx: index('idx_comments_band_id').on(table.bandId)
    })
);

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

export const bandsTable = sqliteTable(
    'bands',
    {
        id: integer('id').primaryKey(),
        name: text('name').notNull(),
        description: text('description'),
        primaryGenre: text('primary_genre', { enum: GenreEnum }),
        city: text('city'),
        state: text('state'),
        country: text('country'),
        latitude: integer('latitude', { mode: 'number' }),
        longitude: integer('longitude', { mode: 'number' }),
        lookingFor: text('looking_for'),
        profileImageUrl: text('profile_image_url'),
        createdAt: text('created_at').notNull(),
        updatedAt: text('updated_at')
    },
    (table) => ({
        primaryGenreIdx: index('idx_bands_primary_genre').on(table.primaryGenre),
        locationIdx: index('idx_bands_location').on(table.latitude, table.longitude),
        cityIdx: index('idx_bands_city').on(table.city)
    })
);

export const bandsMembersTable = sqliteTable(
    'bands_members',
    {
        id: integer('id').primaryKey(),
        userId: text('user_id').notNull(),
        bandId: integer('band_id')
            .notNull()
            .references(() => bandsTable.id, { onDelete: 'cascade' }),
        isAdmin: integer('is_admin', { mode: 'boolean' }).notNull(),
        joinedAt: text('joined_at').notNull()
    },
    (table) => ({
        userBandsIdx: index('idx_bands_members_user_bands').on(table.userId, table.isAdmin, table.joinedAt)
    })
);

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

export const bandsFollowersTable = sqliteTable(
    'bands_followers',
    {
        id: integer('id').primaryKey(),
        followerId: text('follower_id').notNull(),
        bandId: integer('band_id')
            .notNull()
            .references(() => bandsTable.id, { onDelete: 'cascade' }),
        createdAt: text('created_at').notNull()
    },
    (table) => ({
        bandIdIdx: index('idx_bands_followers_band_id').on(table.bandId),
        followerBandIdx: index('idx_bands_followers_follower_band').on(table.followerId, table.bandId)
    })
);

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
export const entityTypeEnum = ['post', 'comment', 'message', 'band'] as const;

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

export const bandsRelations = relations(bandsTable, ({ many }) => ({
    members: many(bandsMembersTable),
    followers: many(bandsFollowersTable),
    posts: many(postsTable)
}));

export const bandsMembersRelations = relations(bandsMembersTable, ({ one }) => ({
    band: one(bandsTable, { fields: [bandsMembersTable.bandId], references: [bandsTable.id] })
}));

export const bandsFollowersRelations = relations(bandsFollowersTable, ({ one }) => ({
    band: one(bandsTable, { fields: [bandsFollowersTable.bandId], references: [bandsTable.id] })
}));

export const userProfilesTable = sqliteTable(
    'user_profiles',
    {
        id: integer('id').primaryKey({ autoIncrement: true }),
        userId: text('user_id')
            .notNull()
            .unique()
            .references(() => users.id, { onDelete: 'cascade' }),
        primaryInstrument: text('primary_instrument', { enum: InstrumentEnum }),
        yearsPlayingPrimary: integer('years_playing_primary'),
        seekingToPlay: text('seeking_to_play'),
        primaryGenre: text('primary_genre', { enum: GenreEnum }),
        secondaryGenres: text('secondary_genres'),
        influences: text('influences'),
        status: text('status', { enum: AvailabilityStatusEnum }),
        statusExpiresAt: text('status_expires_at'),
        commitmentLevel: text('commitment_level', { enum: CommitmentLevelEnum }),
        weeklyAvailability: text('weekly_availability'),
        rehearsalFrequency: text('rehearsal_frequency', { enum: RehearsalFrequencyEnum }),
        giggingLevel: text('gigging_level', { enum: GiggingLevelEnum }),
        pastBands: text('past_bands'),
        hasStudioExperience: integer('has_studio_experience', { mode: 'boolean' }),
        city: text('city'),
        state: text('state'),
        country: text('country'),
        latitude: integer('latitude', { mode: 'number' }),
        longitude: integer('longitude', { mode: 'number' }),
        travelRadius: integer('travel_radius'),
        hasRehearsalSpace: integer('has_rehearsal_space', { mode: 'boolean' }),
        hasTransportation: integer('has_transportation', { mode: 'boolean' }),
        seeking: text('seeking'),
        canOffer: text('can_offer'),
        dealBreakers: text('deal_breakers'),
        bio: text('bio'),
        musicalGoals: text('musical_goals'),
        ageRange: text('age_range'),
        profileCompletion: integer('profile_completion').notNull().default(0),
        setupCompleted: integer('setup_completed', { mode: 'boolean' }).notNull().default(false),
        createdAt: text('created_at').notNull(),
        updatedAt: text('updated_at')
    },
    (table) => ({
        userIdIdx: index('idx_user_profiles_user_id').on(table.userId),
        statusIdx: index('idx_user_profiles_status').on(table.status),
        primaryGenreIdx: index('idx_user_profiles_primary_genre').on(table.primaryGenre),
        cityIdx: index('idx_user_profiles_city').on(table.city),
        locationIdx: index('idx_user_profiles_location').on(table.latitude, table.longitude)
    })
);

export const userAdditionalInstrumentsTable = sqliteTable(
    'user_additional_instruments',
    {
        id: integer('id').primaryKey({ autoIncrement: true }),
        userId: text('user_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        instrument: text('instrument', { enum: InstrumentEnum }).notNull(),
        years: integer('years').notNull(),
        createdAt: text('created_at').notNull()
    },
    (table) => ({
        userIdIdx: index('idx_user_additional_instruments_user_id').on(table.userId),
        instrumentIdx: index('idx_user_additional_instruments_instrument').on(table.instrument)
    })
);

export const userProfilesRelations = relations(userProfilesTable, ({ one, many }) => ({
    user: one(users, { fields: [userProfilesTable.userId], references: [users.id] }),
    additionalInstruments: many(userAdditionalInstrumentsTable)
}));

export const userAdditionalInstrumentsRelations = relations(userAdditionalInstrumentsTable, ({ one }) => ({
    user: one(users, { fields: [userAdditionalInstrumentsTable.userId], references: [users.id] })
}));

export const usersRelations = relations(users, ({ one }) => ({
    profile: one(userProfilesTable, { fields: [users.id], references: [userProfilesTable.userId] })
}));

export const geocodingCacheTable = sqliteTable(
    'geocoding_cache',
    {
        id: integer('id').primaryKey({ autoIncrement: true }),
        city: text('city').notNull(),
        state: text('state'),
        country: text('country'),
        latitude: integer('latitude', { mode: 'number' }).notNull(),
        longitude: integer('longitude', { mode: 'number' }).notNull(),
        createdAt: text('created_at').notNull(),
        updatedAt: text('updated_at').notNull()
    },
    (table) => ({
        locationIdx: index('idx_geocoding_cache_location').on(table.city, table.state, table.country),
        createdAtIdx: index('idx_geocoding_cache_created_at').on(table.createdAt)
    })
);
