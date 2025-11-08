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

export const createPostSchema = z.object({
    id: z.number(),
    userId: z.string(),
    content: z.string(),
    status: z.string(),
    moderationReason: z.string().nullable(),
    moderatedAt: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string().nullable()
});

export const postSchema = z.object({
    id: z.number(),
    userId: z.string(),
    content: z.string(),
    status: z.string(),
    moderationReason: z.string().nullable(),
    moderatedAt: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string().nullable()
});

export type CreatePost = z.infer<typeof createPostSchema>;
export type Post = z.infer<typeof postSchema>;

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
    userId: z.string(),
    postId: z.number(),
    parentCommentId: z.number().nullable().optional(),
    content: z.string(),
    createdAt: z.string(),
    updatedAt: z.string().nullable()
});

export const commentSchema = z.object({
    id: z.number(),
    userId: z.string(),
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

export const createMusicGroupSchema = z.object({
    id: z.number(),
    name: z.string(),
    createdAt: z.string(),
    updatedAt: z.string().nullable()
});

export const musicGroupSchema = z.object({
    id: z.number(),
    name: z.string(),
    createdAt: z.string(),
    updatedAt: z.string().nullable()
});

export type CreateMusicGroup = z.infer<typeof createMusicGroupSchema>;
export type MusicGroup = z.infer<typeof musicGroupSchema>;

export const createMusicGroupMemberSchema = z.object({
    id: z.number(),
    userId: z.string(),
    musicGroupId: z.number(),
    isAdmin: z.boolean().nullable()
});

export const musicGroupMemberSchema = z.object({
    id: z.number(),
    userId: z.string(),
    musicGroupId: z.number(),
    isAdmin: z.boolean().nullable()
});

export type CreateMusicGroupMember = z.infer<typeof createMusicGroupMemberSchema>;
export type MusicGroupMember = z.infer<typeof musicGroupMemberSchema>;

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

export const createMusicGroupFollowerSchema = z.object({
    id: z.number(),
    followerId: z.string(),
    musicGroupId: z.number(),
    createdAt: z.string()
});

export const musicGroupFollowerSchema = z.object({
    id: z.number(),
    followerId: z.string(),
    musicGroupId: z.number(),
    createdAt: z.string()
});

export type CreateMusicGroupFollower = z.infer<typeof createMusicGroupFollowerSchema>;
export type MusicGroupFollower = z.infer<typeof musicGroupFollowerSchema>;

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
export const entityTypeEnum = z.enum(['post', 'comment', 'message', 'music_group']);

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
