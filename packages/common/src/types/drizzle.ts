import { z } from 'zod';
import { InstrumentEnum, GenreEnum, AvailabilityStatusEnum, CommitmentLevelEnum, RehearsalFrequencyEnum, GiggingLevelEnum } from './profile-enums';

export const createUserSchema = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
    emailVerified: z.boolean(),
    image: z.string().nullable(),
    lastActiveAt: z.string().nullish(),
    createdAt: z.date(),
    updatedAt: z.date()
});

export const userSchema = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
    emailVerified: z.boolean(),
    image: z.string().nullable(),
    lastActiveAt: z.string().nullish(),
    createdAt: z.string(),
    updatedAt: z.string()
});

export type CreateUser = z.infer<typeof createUserSchema>;
export type User = z.infer<typeof userSchema>;

export const userDTOSchema = userSchema.omit({ email: true, emailVerified: true, createdAt: true, updatedAt: true });
export type UserDTO = z.infer<typeof userDTOSchema>;

export const createSessionSchema = z.object({
    id: z.string(),
    expiresAt: z.date(),
    token: z.string(),
    createdAt: z.date(),
    updatedAt: z.date(),
    ipAddress: z.string().nullable(),
    userAgent: z.string().nullable(),
    userId: z.string()
});

export const sessionSchema = z.object({
    id: z.string(),
    expiresAt: z.string(),
    token: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
    ipAddress: z.string().nullable(),
    userAgent: z.string().nullable(),
    userId: z.string()
});

export type CreateSession = z.infer<typeof createSessionSchema>;
export type Session = z.infer<typeof sessionSchema>;

export const createAccountSchema = z.object({
    id: z.string(),
    accountId: z.string(),
    providerId: z.string(),
    userId: z.string(),
    accessToken: z.string().nullable(),
    refreshToken: z.string().nullable(),
    idToken: z.string().nullable(),
    accessTokenExpiresAt: z.date().nullable(),
    refreshTokenExpiresAt: z.date().nullable(),
    scope: z.string().nullable(),
    password: z.string().nullable(),
    createdAt: z.date(),
    updatedAt: z.date()
});

export const accountSchema = z.object({
    id: z.string(),
    accountId: z.string(),
    providerId: z.string(),
    userId: z.string(),
    accessToken: z.string().nullable(),
    refreshToken: z.string().nullable(),
    idToken: z.string().nullable(),
    accessTokenExpiresAt: z.date().nullable(),
    refreshTokenExpiresAt: z.date().nullable(),
    scope: z.string().nullable(),
    password: z.string().nullable(),
    createdAt: z.date(),
    updatedAt: z.date()
});

export type CreateAccount = z.infer<typeof createAccountSchema>;
export type Account = z.infer<typeof accountSchema>;

export const createVerificationSchema = z.object({
    id: z.string(),
    identifier: z.string(),
    value: z.string(),
    expiresAt: z.date(),
    createdAt: z.date().nullable(),
    updatedAt: z.date().nullable()
});

export const verificationSchema = z.object({
    id: z.string(),
    identifier: z.string(),
    value: z.string(),
    expiresAt: z.date(),
    createdAt: z.date().nullable(),
    updatedAt: z.date().nullable()
});

export type CreateVerification = z.infer<typeof createVerificationSchema>;
export type Verification = z.infer<typeof verificationSchema>;

export const authorTypeEnum = z.enum(['user', 'band']);

export const createPostSchema = z.object({
    id: z.number(),
    authorType: authorTypeEnum.default('user'),
    userId: z.string(),
    bandId: z.number().nullable().optional(),
    content: z.string(),
    status: z.string(),
    moderationReason: z.string().nullable(),
    moderatedAt: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string().nullable()
});

export const postSchema = z.object({
    id: z.number(),
    authorType: authorTypeEnum.default('user'),
    userId: z.string(),
    bandId: z.number().nullable().optional(),
    content: z.string(),
    status: z.string(),
    moderationReason: z.string().nullable(),
    moderatedAt: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string().nullable()
});

export type CreatePost = z.infer<typeof createPostSchema>;
export type Post = z.infer<typeof postSchema>;
export type AuthorType = z.infer<typeof authorTypeEnum>;

export const createPostReactionSchema = z.object({
    id: z.number(),
    userId: z.string(),
    postId: z.number(),
    createdAt: z.string()
});

export const postReactionSchema = z.object({
    id: z.number(),
    userId: z.string(),
    postId: z.number(),
    createdAt: z.string()
});

export type CreatePostReaction = z.infer<typeof createPostReactionSchema>;
export type PostReaction = z.infer<typeof postReactionSchema>;

export const createCommentSchema = z.object({
    id: z.number(),
    authorType: z.enum(['user', 'band']).default('user'),
    userId: z.string(),
    bandId: z.number().nullable().optional(),
    postId: z.number(),
    parentCommentId: z.number().nullable().optional(),
    content: z.string(),
    createdAt: z.string(),
    updatedAt: z.string().nullable()
});

export const commentSchema = z.object({
    id: z.number(),
    authorType: z.enum(['user', 'band']).default('user'),
    userId: z.string(),
    bandId: z.number().nullable().optional(),
    postId: z.number(),
    parentCommentId: z.number().nullable(),
    content: z.string(),
    createdAt: z.string(),
    updatedAt: z.string().nullable()
});

export type CreateComment = z.infer<typeof createCommentSchema>;
export type Comment = z.infer<typeof commentSchema>;

export const createCommentReactionSchema = z.object({
    id: z.number(),
    userId: z.string(),
    commentId: z.number(),
    createdAt: z.string()
});

export const commentReactionSchema = z.object({
    id: z.number(),
    userId: z.string(),
    commentId: z.number(),
    createdAt: z.string()
});

export type CreateCommentReaction = z.infer<typeof createCommentReactionSchema>;
export type CommentReaction = z.infer<typeof commentReactionSchema>;

export const createMediaSchema = z.object({
    id: z.number(),
    postId: z.number(),
    type: z.enum(['image', 'video']),
    key: z.string()
});

export const mediaSchema = z.object({
    id: z.number(),
    postId: z.number(),
    type: z.enum(['image', 'video']),
    key: z.string()
});

export type CreateMedia = z.infer<typeof createMediaSchema>;
export type Media = z.infer<typeof mediaSchema>;

export const createBandSchema = z.object({
    id: z.number(),
    name: z.string(),
    description: z.string().nullable(),
    primaryGenre: z.string().nullable(),
    city: z.string().nullable(),
    state: z.string().nullable(),
    country: z.string().nullable(),
    latitude: z.number().nullable(),
    longitude: z.number().nullable(),
    lookingFor: z.string().nullable(),
    profileImageUrl: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string().nullable()
});

export const bandSchema = z.object({
    id: z.number(),
    name: z.string(),
    description: z.string().nullable(),
    primaryGenre: z.string().nullable(),
    city: z.string().nullable(),
    state: z.string().nullable(),
    country: z.string().nullable(),
    latitude: z.number().nullable(),
    longitude: z.number().nullable(),
    lookingFor: z.string().nullable(),
    profileImageUrl: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string().nullable()
});

export type CreateBand = z.infer<typeof createBandSchema>;
export type Band = z.infer<typeof bandSchema>;

export const createBandMemberSchema = z.object({
    id: z.number(),
    userId: z.string(),
    bandId: z.number(),
    isAdmin: z.boolean(),
    joinedAt: z.string()
});

export const bandMemberSchema = z.object({
    id: z.number(),
    userId: z.string(),
    bandId: z.number(),
    isAdmin: z.boolean(),
    joinedAt: z.string()
});

export type CreateBandMember = z.infer<typeof createBandMemberSchema>;
export type BandMember = z.infer<typeof bandMemberSchema>;

export const createUserFollowerSchema = z.object({
    id: z.number(),
    followedUserId: z.string(),
    userId: z.string(),
    createdAt: z.string()
});

export const userFollowerSchema = z.object({
    id: z.number(),
    followedUserId: z.string(),
    userId: z.string(),
    createdAt: z.string()
});

export type CreateUserFollower = z.infer<typeof createUserFollowerSchema>;
export type UserFollower = z.infer<typeof userFollowerSchema>;

export const createBandFollowerSchema = z.object({
    id: z.number(),
    followerId: z.string(),
    bandId: z.number(),
    createdAt: z.string()
});

export const bandFollowerSchema = z.object({
    id: z.number(),
    followerId: z.string(),
    bandId: z.number(),
    createdAt: z.string()
});

export type CreateBandFollower = z.infer<typeof createBandFollowerSchema>;
export type BandFollower = z.infer<typeof bandFollowerSchema>;

export const createMessageSchema = z.object({
    id: z.number(),
    senderId: z.string(),
    receiverId: z.string(),
    content: z.string(),
    createdAt: z.string(),
    updatedAt: z.string().nullable()
});

export const messageSchema = z.object({
    id: z.number(),
    senderId: z.string(),
    receiverId: z.string(),
    content: z.string(),
    createdAt: z.string(),
    updatedAt: z.string().nullable()
});

export type CreateMessage = z.infer<typeof createMessageSchema>;
export type Message = z.infer<typeof messageSchema>;

export const notificationTypeEnum = z.enum(['follow_request', 'follow_accepted', 'comment', 'reaction', 'mention']);
export const entityTypeEnum = z.enum(['post', 'comment', 'message', 'band']);

export const createNotificationSchema = z.object({
    id: z.number(),
    userId: z.string(),
    type: notificationTypeEnum,
    actorId: z.string(),
    entityId: z.string().nullable(),
    entityType: entityTypeEnum.nullable(),
    content: z.string(),
    seen: z.boolean(),
    createdAt: z.string()
});

export const notificationSchema = z.object({
    id: z.number(),
    userId: z.string(),
    type: notificationTypeEnum,
    actorId: z.string(),
    entityId: z.string().nullable(),
    entityType: entityTypeEnum.nullable(),
    content: z.string(),
    seen: z.boolean(),
    createdAt: z.string()
});

export type CreateNotification = z.infer<typeof createNotificationSchema>;
export type Notification = z.infer<typeof notificationSchema>;
export type NotificationType = z.infer<typeof notificationTypeEnum>;
export type EntityType = z.infer<typeof entityTypeEnum>;

export const createUserProfileSchema = z.object({
    id: z.number(),
    userId: z.string(),
    primaryInstrument: z.enum(InstrumentEnum).nullable(),
    yearsPlayingPrimary: z.number().nullable(),
    seekingToPlay: z.string().nullable(),
    primaryGenre: z.enum(GenreEnum).nullable(),
    secondaryGenres: z.string().nullable(),
    influences: z.string().nullable(),
    status: z.enum(AvailabilityStatusEnum).nullable(),
    statusExpiresAt: z.string().nullable(),
    commitmentLevel: z.enum(CommitmentLevelEnum).nullable(),
    weeklyAvailability: z.string().nullable(),
    rehearsalFrequency: z.enum(RehearsalFrequencyEnum).nullable(),
    giggingLevel: z.enum(GiggingLevelEnum).nullable(),
    pastBands: z.string().nullable(),
    hasStudioExperience: z.boolean().nullable(),
    city: z.string().nullable(),
    state: z.string().nullable(),
    country: z.string().nullable(),
    latitude: z.number().nullable(),
    longitude: z.number().nullable(),
    travelRadius: z.number().nullable(),
    hasRehearsalSpace: z.boolean().nullable(),
    hasTransportation: z.boolean().nullable(),
    seeking: z.string().nullable(),
    canOffer: z.string().nullable(),
    dealBreakers: z.string().nullable(),
    bio: z.string().nullable(),
    musicalGoals: z.string().nullable(),
    ageRange: z.string().nullable(),
    profileCompletion: z.number(),
    setupCompleted: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string().nullable()
});

export const userProfileSchema = z.object({
    id: z.number(),
    userId: z.string(),
    primaryInstrument: z.enum(InstrumentEnum).nullable(),
    yearsPlayingPrimary: z.number().nullable(),
    seekingToPlay: z.string().nullable(),
    primaryGenre: z.enum(GenreEnum).nullable(),
    secondaryGenres: z.string().nullable(),
    influences: z.string().nullable(),
    status: z.enum(AvailabilityStatusEnum).nullable(),
    statusExpiresAt: z.string().nullable(),
    commitmentLevel: z.enum(CommitmentLevelEnum).nullable(),
    weeklyAvailability: z.string().nullable(),
    rehearsalFrequency: z.enum(RehearsalFrequencyEnum).nullable(),
    giggingLevel: z.enum(GiggingLevelEnum).nullable(),
    pastBands: z.string().nullable(),
    hasStudioExperience: z.boolean().nullable(),
    city: z.string().nullable(),
    state: z.string().nullable(),
    country: z.string().nullable(),
    latitude: z.number().nullable(),
    longitude: z.number().nullable(),
    travelRadius: z.number().nullable(),
    hasRehearsalSpace: z.boolean().nullable(),
    hasTransportation: z.boolean().nullable(),
    seeking: z.string().nullable(),
    canOffer: z.string().nullable(),
    dealBreakers: z.string().nullable(),
    bio: z.string().nullable(),
    musicalGoals: z.string().nullable(),
    ageRange: z.string().nullable(),
    profileCompletion: z.number(),
    setupCompleted: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string().nullable()
});

export type CreateUserProfile = z.infer<typeof createUserProfileSchema>;
export type UserProfile = z.infer<typeof userProfileSchema>;

export const createUserAdditionalInstrumentSchema = z.object({
    id: z.number(),
    userId: z.string(),
    instrument: z.enum(InstrumentEnum),
    years: z.number(),
    createdAt: z.string()
});

export const userAdditionalInstrumentSchema = z.object({
    id: z.number(),
    userId: z.string(),
    instrument: z.enum(InstrumentEnum),
    years: z.number(),
    createdAt: z.string()
});

export type CreateUserAdditionalInstrument = z.infer<typeof createUserAdditionalInstrumentSchema>;
export type UserAdditionalInstrument = z.infer<typeof userAdditionalInstrumentSchema>;

export const createGeocodingCacheSchema = z.object({
    id: z.number(),
    city: z.string(),
    state: z.string().nullable(),
    country: z.string().nullable(),
    latitude: z.number(),
    longitude: z.number(),
    createdAt: z.string(),
    updatedAt: z.string()
});

export const geocodingCacheSchema = z.object({
    id: z.number(),
    city: z.string(),
    state: z.string().nullable(),
    country: z.string().nullable(),
    latitude: z.number(),
    longitude: z.number(),
    createdAt: z.string(),
    updatedAt: z.string()
});

export type CreateGeocodingCache = z.infer<typeof createGeocodingCacheSchema>;
export type GeocodingCache = z.infer<typeof geocodingCacheSchema>;
