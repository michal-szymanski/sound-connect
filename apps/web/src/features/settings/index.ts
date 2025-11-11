export { AccountSettings } from './components/account-settings';
export { PrivacySettings } from './components/privacy-settings';
export { NotificationSettings } from './components/notification-settings';
export { DataAccountSettings } from './components/data-account-settings';

export {
    useAccountInfo,
    useUpdateEmail,
    useUpdatePassword,
    usePrivacySettings,
    useUpdatePrivacySettings,
    useNotificationSettings,
    useUpdateNotificationSettings,
    useBlockedUsers,
    useBlockUser,
    useUnblockUser,
    useExportData,
    useDeleteAccount
} from './hooks/use-settings';

export {
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
} from './server-functions/settings';
