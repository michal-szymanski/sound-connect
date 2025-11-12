import { z } from 'zod';

export const conversationPartnerSchema = z
    .object({
        id: z.string(),
        name: z.string(),
        image: z.string().nullable()
    })
    .nullable();

export const conversationLastMessageSchema = z.object({
    content: z.string(),
    senderId: z.string(),
    createdAt: z.string()
});

export const conversationDTOSchema = z.object({
    partnerId: z.string(),
    partner: conversationPartnerSchema,
    lastMessage: conversationLastMessageSchema,
    isMutualFollow: z.boolean()
});

export const conversationsResponseSchema = z.object({
    conversations: z.array(conversationDTOSchema),
    total: z.number()
});

export type ConversationPartnerDTO = z.infer<typeof conversationPartnerSchema>;
export type ConversationLastMessageDTO = z.infer<typeof conversationLastMessageSchema>;
export type ConversationDTO = z.infer<typeof conversationDTOSchema>;
export type ConversationsResponseDTO = z.infer<typeof conversationsResponseSchema>;
