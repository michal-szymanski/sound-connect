import { z } from 'zod';

export const conversationTypeSchema = z.enum(['user', 'band']);

export type ConversationType = z.infer<typeof conversationTypeSchema>;

export const conversationPartnerSchema = z
    .object({
        id: z.string(),
        name: z.string(),
        image: z.string().nullable()
    })
    .nullable();

export const bandConversationInfoSchema = z.object({
    id: z.number(),
    name: z.string(),
    image: z.string().nullable(),
    memberCount: z.number()
});

export const conversationLastMessageSchema = z.object({
    content: z.string(),
    senderId: z.string(),
    senderName: z.string().optional(),
    createdAt: z.string()
});

export const userConversationDTOSchema = z.object({
    type: z.literal('user'),
    partnerId: z.string(),
    partner: conversationPartnerSchema,
    lastMessage: conversationLastMessageSchema,
    isMutualFollow: z.boolean(),
    unreadCount: z.number()
});

export const bandConversationDTOSchema = z.object({
    type: z.literal('band'),
    bandId: z.number(),
    band: bandConversationInfoSchema,
    lastMessage: conversationLastMessageSchema,
    unreadCount: z.number()
});

export const conversationDTOSchema = z.discriminatedUnion('type', [userConversationDTOSchema, bandConversationDTOSchema]);

export const conversationsResponseSchema = z.object({
    conversations: z.array(conversationDTOSchema),
    total: z.number()
});

export type ConversationPartnerDTO = z.infer<typeof conversationPartnerSchema>;
export type BandConversationInfo = z.infer<typeof bandConversationInfoSchema>;
export type ConversationLastMessageDTO = z.infer<typeof conversationLastMessageSchema>;
export type UserConversationDTO = z.infer<typeof userConversationDTOSchema>;
export type BandConversationDTO = z.infer<typeof bandConversationDTOSchema>;
export type ConversationDTO = z.infer<typeof conversationDTOSchema>;
export type ConversationsResponseDTO = z.infer<typeof conversationsResponseSchema>;
