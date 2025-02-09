import { z } from 'zod';

export const genderEnum = z.enum(['male', 'female']);

export const userSchema = z.object({
    id: z.number(),
    birthday: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    about: z.string(),
    gender: genderEnum.nullable()
});

export type User = z.infer<typeof userSchema>;
