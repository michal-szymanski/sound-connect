import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
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

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);

export const insertSessionSchema = createInsertSchema(sessions);
export const selectSessionSchema = createSelectSchema(sessions);

export const insertAccountSchema = createInsertSchema(accounts);
export const selectAccountSchema = createSelectSchema(accounts);

export const insertVerificationSchema = createInsertSchema(verifications);
export const selectVerificationSchema = createSelectSchema(verifications);

export const insertPostSchema = createInsertSchema(postsTable);
export const selectPostSchema = createSelectSchema(postsTable);

export const insertPostReactionSchema = createInsertSchema(postsReactionsTable);
export const selectPostReactionSchema = createSelectSchema(postsReactionsTable);

export const insertCommentSchema = createInsertSchema(commentsTable);
export const selectCommentSchema = createSelectSchema(commentsTable);

export const insertCommentReactionSchema = createInsertSchema(commentsReactionsTable);
export const selectCommentReactionSchema = createSelectSchema(commentsReactionsTable);

export const insertMediaSchema = createInsertSchema(mediaTable);
export const selectMediaSchema = createSelectSchema(mediaTable);

export const insertMusicGroupSchema = createInsertSchema(musicGroupsTable);
export const selectMusicGroupSchema = createSelectSchema(musicGroupsTable);

export const insertMusicGroupMemberSchema = createInsertSchema(musicGroupMembersTable);
export const selectMusicGroupMemberSchema = createSelectSchema(musicGroupMembersTable);

export const insertUserFollowerSchema = createInsertSchema(usersFollowersTable);
export const selectUserFollowerSchema = createSelectSchema(usersFollowersTable);

export const insertMusicGroupFollowerSchema = createInsertSchema(musicGroupsFollowersTable);
export const selectMusicGroupFollowerSchema = createSelectSchema(musicGroupsFollowersTable);

export const insertMessageSchema = createInsertSchema(messagesTable);
export const selectMessageSchema = createSelectSchema(messagesTable);
