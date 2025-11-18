import { z } from 'zod';

export const ProfileVisibilityEnum = ['public', 'followers_only', 'private'] as const;
export const MessagingPermissionEnum = ['anyone', 'followers', 'none'] as const;
export const FollowPermissionEnum = ['anyone', 'approval', 'none'] as const;

export const updateEmailSchema = z.object({
    email: z.string().email('Invalid email format').max(255, 'Email too long')
});

export const updatePasswordSchema = z
    .object({
        currentPassword: z.string().min(8, 'Current password must be at least 8 characters'),
        newPassword: z
            .string()
            .min(8, 'New password must be at least 8 characters')
            .max(100, 'New password too long')
            .regex(/[A-Z]/, 'New password must include at least one uppercase letter')
            .regex(/[a-z]/, 'New password must include at least one lowercase letter')
            .regex(/[0-9]/, 'New password must include at least one number')
    })
    .refine((data) => data.currentPassword !== data.newPassword, {
        message: 'New password must be different from current password',
        path: ['newPassword']
    });

export const updateEmailResponseSchema = z.object({
    message: z.string()
});

export const updatePasswordResponseSchema = z.object({
    message: z.string()
});

export const privacySettingsSchema = z.object({
    profileVisibility: z.enum(ProfileVisibilityEnum),
    searchVisibility: z.boolean(),
    messagingPermission: z.enum(MessagingPermissionEnum),
    followPermission: z.enum(FollowPermissionEnum)
});

export const updatePrivacySettingsSchema = privacySettingsSchema.partial();

export const updatePrivacySettingsResponseSchema = z.object({
    message: z.string(),
    settings: privacySettingsSchema
});

export const notificationSettingsSchema = z.object({
    emailEnabled: z.boolean(),
    followNotifications: z.boolean(),
    commentNotifications: z.boolean(),
    bandApplicationNotifications: z.boolean(),
    bandResponseNotifications: z.boolean()
});

export const updateNotificationSettingsSchema = notificationSettingsSchema.partial();

export const updateNotificationSettingsResponseSchema = z.object({
    message: z.string(),
    settings: notificationSettingsSchema
});

export const blockedUserSchema = z.object({
    id: z.string(),
    name: z.string(),
    image: z.string().nullable(),
    blockedAt: z.string().datetime()
});

export const blockedUsersResponseSchema = z.object({
    blockedUsers: z.array(blockedUserSchema)
});

export const blockUserResponseSchema = z.object({
    message: z.string()
});

export const unblockUserResponseSchema = z.object({
    message: z.string()
});

export const exportDataResponseSchema = z.object({
    downloadUrl: z.string().url(),
    expiresAt: z.string().datetime()
});

export const deleteAccountSchema = z.object({
    password: z.string().min(1, 'Password is required')
});

export const deleteAccountResponseSchema = z.object({
    message: z.string()
});

export const accountInfoSchema = z.object({
    email: z.string().email(),
    createdAt: z.string().datetime(),
    lastActiveAt: z.string().datetime().nullable()
});

export type UpdateEmail = z.infer<typeof updateEmailSchema>;
export type UpdatePassword = z.infer<typeof updatePasswordSchema>;
export type UpdateEmailResponse = z.infer<typeof updateEmailResponseSchema>;
export type UpdatePasswordResponse = z.infer<typeof updatePasswordResponseSchema>;

export type PrivacySettings = z.infer<typeof privacySettingsSchema>;
export type UpdatePrivacySettings = z.infer<typeof updatePrivacySettingsSchema>;
export type UpdatePrivacySettingsResponse = z.infer<typeof updatePrivacySettingsResponseSchema>;

export type NotificationSettings = z.infer<typeof notificationSettingsSchema>;
export type UpdateNotificationSettings = z.infer<typeof updateNotificationSettingsSchema>;
export type UpdateNotificationSettingsResponse = z.infer<typeof updateNotificationSettingsResponseSchema>;

export type BlockedUser = z.infer<typeof blockedUserSchema>;
export type BlockedUsersResponse = z.infer<typeof blockedUsersResponseSchema>;
export type BlockUserResponse = z.infer<typeof blockUserResponseSchema>;
export type UnblockUserResponse = z.infer<typeof unblockUserResponseSchema>;

export type ExportDataResponse = z.infer<typeof exportDataResponseSchema>;

export type DeleteAccount = z.infer<typeof deleteAccountSchema>;
export type DeleteAccountResponse = z.infer<typeof deleteAccountResponseSchema>;

export type AccountInfo = z.infer<typeof accountInfoSchema>;
