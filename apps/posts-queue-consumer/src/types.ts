import { postStatusSchema } from '@/common/types/models';
import { z } from 'zod';

export type HonoContext = {
    Bindings: CloudflareBindings;
    Variables: Record<string, unknown>;
};

export const moderationResultSchema = z.object({
    status: postStatusSchema,
    reason: z.string().optional(),
    confidence: z.number().optional()
});

export type ModerationResult = z.infer<typeof moderationResultSchema>;
