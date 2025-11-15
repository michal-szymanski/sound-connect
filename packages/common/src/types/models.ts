import { CHAT_MESSAGE_MAX_LENGTH } from '../constants';
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
} from './drizzle';

export { userDTOSchema, type UserDTO };

export const webSocketMessageTypes = z.enum(['chat', 'system', 'online-status', 'subscribe', 'unsubscribe', 'user-joined', 'user-left']);

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
    senderName: z.string().optional(),
    timestamp: z.number()
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;

export const systemMessageSchema = z.object({
    id: z.string().uuid().optional(),
    type: z.literal(webSocketMessageTypes.enum.system),
    content: z.string(),
    roomId: z.string(),
    userId: z.string().optional(),
    timestamp: z.number()
});

export type SystemMessage = z.infer<typeof systemMessageSchema>;

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

export const webSocketMessageSchema = z.union([
    subscribeMessageSchema,
    unsubscribeMessageSchema,
    chatMessageSchema,
    systemMessageSchema,
    newChatMessageSchema,
    roomNotificationSchema,
    onlineStatusMessageSchema
]);

export type WebSocketMessage = z.infer<typeof webSocketMessageSchema>;

export const postStatusSchema = z.enum(['pending', 'approved', 'rejected', 'flagged']);

export type PostStatus = z.infer<typeof postStatusSchema>;

export const bandInfoSchema = z.object({
    id: z.number(),
    name: z.string(),
    profileImageUrl: z.string().nullable()
});

export const feedItemSchema = z.object({
    post: postSchema,
    user: userDTOSchema.nullable(),
    band: bandInfoSchema.nullable().optional(),
    reactions: z.array(postReactionSchema),
    media: z.array(mediaSchema),
    commentsCount: z.number()
});

export type FeedItem = z.infer<typeof feedItemSchema>;
export type BandInfo = z.infer<typeof bandInfoSchema>;

export const postLikeDataSchema = z.object({
    success: z.boolean().optional(),
    likesCount: z.number(),
    isLiked: z.boolean()
});

export type PostLikeData = z.infer<typeof postLikeDataSchema>;

export type CommentWithUser = {
    comment: Comment;
    user: UserDTO | null;
    band?: BandInfo | null;
    reactions: CommentReaction[];
    replies?: CommentWithUser[];
};

export const commentWithUserSchema: z.ZodType<CommentWithUser> = z.object({
    comment: commentSchema,
    user: userDTOSchema.nullable(),
    band: bandInfoSchema.nullable().optional(),
    reactions: z.array(commentReactionSchema),
    replies: z.array(z.lazy(() => commentWithUserSchema)).optional()
});

export const createCommentSchema = z.object({
    postId: z.number(),
    parentCommentId: z.number().nullable().optional(),
    content: z.string().min(1).max(500)
});

export type CreateComment = z.infer<typeof createCommentSchema>;
