import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import {
    users,
    sessions,
    accounts,
    verifications,
    postsTable,
    postsReactionsTable,
    commentsTable,
    commentsReactionsTable,
    mediaTable,
    musicGroupsTable,
    musicGroupMembersTable,
    usersFollowersTable,
    musicGroupsFollowersTable,
    messagesTable
} from '@sound-connect/drizzle/schema';

export const createUserSchema = createInsertSchema(users);
export const userSchema = createSelectSchema(users);
export type CreateUser = z.infer<typeof createUserSchema>;
export type User = z.infer<typeof userSchema>;

export const createSessionSchema = createInsertSchema(sessions);
export const sessionSchema = createSelectSchema(sessions);
export type CreateSession = z.infer<typeof createSessionSchema>;
export type Session = z.infer<typeof sessionSchema>;

export const createAccountSchema = createInsertSchema(accounts);
export const accountSchema = createSelectSchema(accounts);
export type CreateAccount = z.infer<typeof createAccountSchema>;
export type Account = z.infer<typeof accountSchema>;

export const createVerificationSchema = createInsertSchema(verifications);
export const verificationSchema = createSelectSchema(verifications);
export type CreateVerification = z.infer<typeof createVerificationSchema>;
export type Verification = z.infer<typeof verificationSchema>;

export const createPostSchema = createInsertSchema(postsTable);
export const postSchema = createSelectSchema(postsTable);
export type CreatePost = z.infer<typeof createPostSchema>;
export type Post = z.infer<typeof postSchema>;

export const createPostReactionSchema = createInsertSchema(postsReactionsTable);
export const postReactionSchema = createSelectSchema(postsReactionsTable);
export type CreatePostReaction = z.infer<typeof createPostReactionSchema>;
export type PostReaction = z.infer<typeof postReactionSchema>;

export const createCommentSchema = createInsertSchema(commentsTable);
export const commentSchema = createSelectSchema(commentsTable);
export type CreateComment = z.infer<typeof createCommentSchema>;
export type Comment = z.infer<typeof commentSchema>;

export const createCommentReactionSchema = createInsertSchema(commentsReactionsTable);
export const commentReactionSchema = createSelectSchema(commentsReactionsTable);
export type CreateCommentReaction = z.infer<typeof createCommentReactionSchema>;
export type CommentReaction = z.infer<typeof commentReactionSchema>;

export const createMediaSchema = createInsertSchema(mediaTable);
export const mediaSchema = createSelectSchema(mediaTable);
export type CreateMedia = z.infer<typeof createMediaSchema>;
export type Media = z.infer<typeof mediaSchema>;

export const createMusicGroupSchema = createInsertSchema(musicGroupsTable);
export const musicGroupSchema = createSelectSchema(musicGroupsTable);
export type CreateMusicGroup = z.infer<typeof createMusicGroupSchema>;
export type MusicGroup = z.infer<typeof musicGroupSchema>;

export const createMusicGroupMemberSchema = createInsertSchema(musicGroupMembersTable);
export const musicGroupMemberSchema = createSelectSchema(musicGroupMembersTable);
export type CreateMusicGroupMember = z.infer<typeof createMusicGroupMemberSchema>;
export type MusicGroupMember = z.infer<typeof musicGroupMemberSchema>;

export const createUserFollowerSchema = createInsertSchema(usersFollowersTable);
export const userFollowerSchema = createSelectSchema(usersFollowersTable);
export type CreateUserFollower = z.infer<typeof createUserFollowerSchema>;
export type UserFollower = z.infer<typeof userFollowerSchema>;

export const createMusicGroupFollowerSchema = createInsertSchema(musicGroupsFollowersTable);
export const musicGroupFollowerSchema = createSelectSchema(musicGroupsFollowersTable);
export type CreateMusicGroupFollower = z.infer<typeof createMusicGroupFollowerSchema>;
export type MusicGroupFollower = z.infer<typeof musicGroupFollowerSchema>;

export const createMessageSchema = createInsertSchema(messagesTable);
export const messageSchema = createSelectSchema(messagesTable);
export type CreateMessage = z.infer<typeof createMessageSchema>;
export type Message = z.infer<typeof messageSchema>;
