import { CHAT_MESSAGE_MAX_LENGTH } from '@sound-connect/common/constants';
import z from 'zod';
import {
    userDTOSchema,
    postSchema,
    postReactionSchema,
    commentSchema,
    commentReactionSchema,
    mediaSchema,
    type Comment,
    type CommentReaction,
    type UserDTO
} from '@sound-connect/common/types/drizzle';

export const webSocketMessageTypes = z.enum(['chat', 'online-status', 'notification', 'subscribe', 'unsubscribe', 'user-joined', 'user-left']);

export type WebSocketMessageType = z.infer<typeof webSocketMessageTypes>;

export const onlineStatusSchema = z.enum(['online', 'offline']);

export type OnlineStatus = z.infer<typeof onlineStatusSchema>;

export const onlineStatusMessageSchema = z.object({
    type: z.literal(webSocketMessageTypes.enum['online-status']),
    userId: z.string(),
    status: onlineStatusSchema
});

export type OnlineStatusMessage = z.infer<typeof onlineStatusMessageSchema>;

export const chatMessageSchema = z.object({
    id: z.string().uuid(),
    type: z.literal(webSocketMessageTypes.enum.chat),
    content: z.string().max(CHAT_MESSAGE_MAX_LENGTH),
    roomId: z.string(),
    senderId: z.string(),
    timestamp: z.number()
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;

export const newChatMessageSchema = chatMessageSchema.omit({ id: true, senderId: true, timestamp: true });

export type NewChatMessage = z.infer<typeof newChatMessageSchema>;

export const roomNotificationSchema = z.object({
    type: z.enum(['user-joined', 'user-left']),
    roomId: z.string(),
    userId: z.string()
});

export type RoomNotification = z.infer<typeof roomNotificationSchema>;

export const subscribeMessageSchema = z.object({
    type: z.literal(webSocketMessageTypes.enum['subscribe']),
    roomId: z.string()
});

export type SubscribeMessage = z.infer<typeof subscribeMessageSchema>;

export const unsubscribeMessageSchema = z.object({
    type: z.literal(webSocketMessageTypes.enum['unsubscribe']),
    roomId: z.string()
});

export type UnsubscribeMessage = z.infer<typeof unsubscribeMessageSchema>;

export const notificationKind = z.enum(['follow-request', 'follow-request-accepted', 'reaction']);

export type NotificationKind = z.infer<typeof notificationKind>;

export const followRequestNotificationItemSchema = z.object({
    id: z.string().uuid(),
    date: z.string(),
    seen: z.boolean(),
    accepted: z.boolean(),
    from: z.string(),
    to: z.string()
});

export type FollowRequestNotificationItem = z.infer<typeof followRequestNotificationItemSchema>;

export const followRequestAcceptedNotificationItemSchema = z.object({
    id: z.string().uuid(),
    date: z.string(),
    seen: z.boolean(),
    from: z.string(),
    to: z.string()
});

export type FollowRequestAcceptedNotificationItem = z.infer<typeof followRequestAcceptedNotificationItemSchema>;

export const followRequestNotificationSchema = z.object({
    type: z.literal(webSocketMessageTypes.enum.notification),
    kind: z.literal(notificationKind.enum['follow-request']),
    items: z.array(followRequestNotificationItemSchema)
});

export type FollowRequestNotification = z.infer<typeof followRequestNotificationSchema>;

export const followRequestAcceptedNotificationSchema = z.object({
    type: z.literal(webSocketMessageTypes.enum.notification),
    kind: z.literal(notificationKind.enum['follow-request-accepted']),
    items: z.array(followRequestAcceptedNotificationItemSchema)
});

export type FollowRequestAcceptedNotification = z.infer<typeof followRequestAcceptedNotificationSchema>;

export const reactionNotificationItem = z.object({ id: z.string().uuid(), date: z.string(), seen: z.boolean(), userId: z.string(), postId: z.string() });

export type ReactionNotificationItem = z.infer<typeof reactionNotificationItem>;

export const reactionNotification = z.object({
    type: z.literal(webSocketMessageTypes.enum.notification),
    kind: z.literal(notificationKind.enum['reaction']),
    items: z.array(reactionNotificationItem)
});

export type ReactionNotification = z.infer<typeof reactionNotification>;

export const notificationMessageSchema = z.discriminatedUnion('kind', [
    followRequestNotificationSchema,
    followRequestAcceptedNotificationSchema,
    reactionNotification
]);

export type NotificationMessage = z.infer<typeof notificationMessageSchema>;

export const webSocketMessageSchema = z.union([
    subscribeMessageSchema,
    unsubscribeMessageSchema,
    chatMessageSchema,
    newChatMessageSchema,
    roomNotificationSchema,
    onlineStatusMessageSchema,
    notificationMessageSchema
]);

export type WebSocketMessage = z.infer<typeof webSocketMessageSchema>;

export const postStatusSchema = z.enum(['pending', 'approved', 'rejected', 'flagged']);

export type PostStatus = z.infer<typeof postStatusSchema>;

export const feedItemSchema = z.object({
    post: postSchema,
    user: userDTOSchema,
    reactions: z.array(postReactionSchema),
    media: z.array(mediaSchema),
    commentsCount: z.number()
});

export type FeedItem = z.infer<typeof feedItemSchema>;

export const postLikeDataSchema = z.object({
    likesCount: z.number(),
    isLiked: z.boolean()
});

export type PostLikeData = z.infer<typeof postLikeDataSchema>;

export type CommentWithUser = {
    comment: Comment;
    user: UserDTO;
    reactions: CommentReaction[];
    replies?: CommentWithUser[];
};

export const commentWithUserSchema: z.ZodType<CommentWithUser> = z.object({
    comment: commentSchema,
    user: userDTOSchema,
    reactions: z.array(commentReactionSchema),
    replies: z.array(z.lazy(() => commentWithUserSchema)).optional()
});

export const createCommentSchema = z.object({
    postId: z.number(),
    parentCommentId: z.number().nullable().optional(),
    content: z.string().min(1).max(500)
});

export type CreateComment = z.infer<typeof createCommentSchema>;
