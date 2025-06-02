import { CHAT_MESSAGE_MAX_LENGTH } from '../constants';
import z from 'zod';

export const webSocketMessageTypes = z.enum(['chat', 'online-status', 'connect', 'disconnect', 'notification']);

export type WebSocketMessageType = z.infer<typeof webSocketMessageTypes>;

export const chatMessageSchema = z.object({
    type: z.literal(webSocketMessageTypes.Enum.chat),
    peerId: z.string(),
    text: z.string().max(CHAT_MESSAGE_MAX_LENGTH)
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;

export const onlineStatusSchema = z.enum(['online', 'offline']);

export type OnlineStatus = z.infer<typeof onlineStatusSchema>;

export const onlineStatusMessageSchema = z.object({
    type: z.literal(webSocketMessageTypes.Enum['online-status']),
    userId: z.string(),
    status: onlineStatusSchema
});

export type OnlineStatusMessage = z.infer<typeof onlineStatusMessageSchema>;

export const webSocketMessageSchema = z.object({
    type: webSocketMessageTypes
});

export type WebSocketMessage = z.infer<typeof webSocketMessageSchema>;

export const notificationKind = z.enum(['follow-request', 'reaction']);

export type NotificationKind = z.infer<typeof notificationKind>;

export const followRequestNotificationItem = z.object({
    id: z.string().uuid(),
    date: z.string(),
    seen: z.boolean(),
    accepted: z.boolean(),
    userId: z.string()
});

export type FollowRequestNotificationItem = z.infer<typeof followRequestNotificationItem>;

export const followRequestNotification = z.object({
    type: z.literal(webSocketMessageTypes.Enum.notification),
    kind: z.literal(notificationKind.Enum['follow-request']),
    items: z.array(followRequestNotificationItem)
});

export type FollowRequestNotification = z.infer<typeof followRequestNotification>;

export const reactionNotificationItem = z.object({ id: z.string().uuid(), date: z.string(), seen: z.boolean(), userId: z.string(), postId: z.string() });

export type ReactionNotificationItem = z.infer<typeof reactionNotificationItem>;

export const reactionNotification = z.object({
    type: z.literal(webSocketMessageTypes.Enum.notification),
    kind: z.literal(notificationKind.Enum['reaction']),
    items: z.array(reactionNotificationItem)
});

export type ReactionNotification = z.infer<typeof reactionNotification>;

export const postSchema = z.object({
    id: z.number(),
    userId: z.string(),
    content: z.string(),
    createdAt: z.string(),
    updatedAt: z.string().nullable()
});

export type Post = z.infer<typeof postSchema>;

export const postReactionSchema = z.object({
    id: z.number(),
    userId: z.string(),
    postId: z.number(),
    createdAt: z.string()
});

export type PostReaction = z.infer<typeof postReactionSchema>;

export const userSchema = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
    emailVerified: z.boolean(),
    image: z.string().url().nullable(),
    createdAt: z.string(),
    updatedAt: z.string()
});

export type User = z.infer<typeof userSchema>;

export const userDTOSchema = userSchema.omit({ email: true, emailVerified: true, createdAt: true, updatedAt: true });

export type UserDTO = z.infer<typeof userDTOSchema>;

export const feedItemSchema = z.object({
    post: postSchema,
    user: userDTOSchema,
    reactions: z.array(postReactionSchema)
});

export type FeedItem = z.infer<typeof feedItemSchema>;
