import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { toast } from 'sonner';
import {
    getAccountInfo,
    updateEmail,
    updatePassword,
    getPrivacySettings,
    updatePrivacySettings,
    getNotificationSettings,
    updateNotificationSettings,
    getBlockedUsers,
    blockUser,
    unblockUser,
    exportData,
    deleteAccount
} from '@/features/settings/server-functions/settings';
import type {
    UpdateEmail,
    UpdatePassword,
    UpdatePrivacySettings,
    UpdateNotificationSettings,
    DeleteAccount,
    PrivacySettings,
    NotificationSettings
} from '@sound-connect/common/types/settings';

export const useAccountInfo = () => {
    return useQuery({
        queryKey: ['accountInfo'],
        queryFn: async () => {
            const result = await getAccountInfo();
            if (!result.success) {
                throw new Error(result.body?.message || 'Failed to load account info');
            }
            return result.body;
        },
        staleTime: 5 * 60 * 1000
    });
};

export const useUpdateEmail = () => {
    return useMutation({
        mutationFn: async (data: UpdateEmail) => {
            const result = await updateEmail({ data });
            if (!result.success) {
                throw new Error(result.body?.message || 'Failed to update email');
            }
            return result.body;
        },
        onSuccess: (data) => {
            toast.success(data.message);
        },
        onError: (error: Error) => {
            toast.error(error.message);
        }
    });
};

export const useUpdatePassword = () => {
    return useMutation({
        mutationFn: async (data: UpdatePassword) => {
            const result = await updatePassword({ data });
            if (!result.success) {
                throw new Error(result.body?.message || 'Failed to update password');
            }
            return result.body;
        },
        onSuccess: (data) => {
            toast.success(data.message);
        },
        onError: (error: Error) => {
            toast.error(error.message);
        }
    });
};

export const usePrivacySettings = () => {
    return useQuery({
        queryKey: ['privacySettings'],
        queryFn: async () => {
            const result = await getPrivacySettings();
            if (!result.success) {
                throw new Error(result.body?.message || 'Failed to load privacy settings');
            }
            return result.body;
        },
        staleTime: 5 * 60 * 1000
    });
};

export const useUpdatePrivacySettings = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: UpdatePrivacySettings) => {
            const result = await updatePrivacySettings({ data });
            if (!result.success) {
                throw new Error(result.body?.message || 'Failed to update privacy settings');
            }
            return result.body;
        },
        onMutate: async (variables) => {
            await queryClient.cancelQueries({ queryKey: ['privacySettings'] });

            const previousSettings = queryClient.getQueryData(['privacySettings']);

            queryClient.setQueryData(
                ['privacySettings'],
                (old: PrivacySettings | undefined) =>
                    ({
                        ...(old || {}),
                        ...variables
                    }) as PrivacySettings
            );

            return { previousSettings };
        },
        onSuccess: (data) => {
            queryClient.setQueryData(['privacySettings'], data.settings);
            toast.success(data.message);
        },
        onError: (error: Error, variables, context) => {
            if (context?.previousSettings) {
                queryClient.setQueryData(['privacySettings'], context.previousSettings);
            }
            toast.error(error.message);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['privacySettings'] });
        }
    });
};

export const useNotificationSettings = () => {
    return useQuery({
        queryKey: ['notificationSettings'],
        queryFn: async () => {
            const result = await getNotificationSettings();
            if (!result.success) {
                throw new Error(result.body?.message || 'Failed to load notification settings');
            }
            return result.body;
        },
        staleTime: 5 * 60 * 1000
    });
};

export const useUpdateNotificationSettings = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: UpdateNotificationSettings) => {
            const result = await updateNotificationSettings({ data });
            if (!result.success) {
                throw new Error(result.body?.message || 'Failed to update notification settings');
            }
            return result.body;
        },
        onMutate: async (variables) => {
            await queryClient.cancelQueries({ queryKey: ['notificationSettings'] });

            const previousSettings = queryClient.getQueryData(['notificationSettings']);

            queryClient.setQueryData(
                ['notificationSettings'],
                (old: NotificationSettings | undefined) =>
                    ({
                        ...(old || {}),
                        ...variables
                    }) as NotificationSettings
            );

            return { previousSettings };
        },
        onSuccess: (data) => {
            queryClient.setQueryData(['notificationSettings'], data.settings);
            toast.success(data.message);
        },
        onError: (error: Error, variables, context) => {
            if (context?.previousSettings) {
                queryClient.setQueryData(['notificationSettings'], context.previousSettings);
            }
            toast.error(error.message);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['notificationSettings'] });
        }
    });
};

export const useBlockedUsers = () => {
    return useQuery({
        queryKey: ['blockedUsers'],
        queryFn: async () => {
            const result = await getBlockedUsers();
            if (!result.success) {
                throw new Error(result.body?.message || 'Failed to load blocked users');
            }
            return result.body.blockedUsers;
        },
        staleTime: 5 * 60 * 1000
    });
};

export const useBlockUser = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (userId: string) => {
            const result = await blockUser({ data: { userId } });
            if (!result.success) {
                throw new Error(result.body?.message || 'Failed to block user');
            }
            return result.body;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['blockedUsers'] });
            toast.success(data.message);
        },
        onError: (error: Error) => {
            toast.error(error.message);
        }
    });
};

export const useUnblockUser = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (userId: string) => {
            const result = await unblockUser({ data: { userId } });
            if (!result.success) {
                throw new Error(result.body?.message || 'Failed to unblock user');
            }
            return result.body;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['blockedUsers'] });
            toast.success(data.message);
        },
        onError: (error: Error) => {
            toast.error(error.message);
        }
    });
};

export const useExportData = () => {
    return useMutation({
        mutationFn: async () => {
            const result = await exportData();
            if (!result.success) {
                throw new Error(result.body?.message || 'Failed to export data');
            }
            return result.body;
        },
        onSuccess: (data) => {
            window.open(data.downloadUrl, '_blank');
            toast.success('Data export ready for download');
        },
        onError: (error: Error) => {
            toast.error(error.message);
        }
    });
};

export const useDeleteAccount = () => {
    const router = useRouter();

    return useMutation({
        mutationFn: async (data: DeleteAccount) => {
            const result = await deleteAccount({ data });
            if (!result.success) {
                throw new Error(result.body?.message || 'Failed to delete account');
            }
            return result.body;
        },
        onSuccess: () => {
            toast.success('Account deleted successfully');
            router.navigate({ to: '/' });
        },
        onError: (error: Error) => {
            toast.error(error.message);
        }
    });
};
