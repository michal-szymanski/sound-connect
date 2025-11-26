import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Separator } from '@/shared/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Button } from '@/shared/components/ui/button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from '@/shared/components/ui/alert-dialog';
import { useUpdatePrivacySettings, useUnblockUser } from '@/features/settings/hooks/use-settings';
import { ProfileVisibilityEnum, MessagingPermissionEnum, FollowPermissionEnum } from '@sound-connect/common/types/settings';
import type { PrivacySettings as PrivacySettingsType, BlockedUser } from '@sound-connect/common/types/settings';

type Props = {
    privacySettings: PrivacySettingsType;
    blockedUsers: BlockedUser[];
};

export function PrivacySettings({ privacySettings: initialSettings, blockedUsers: initialBlockedUsers }: Props) {
    const updateSettings = useUpdatePrivacySettings();
    const unblockUserMutation = useUnblockUser();

    const [unblockDialogOpen, setUnblockDialogOpen] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [settings, setSettings] = useState(initialSettings);
    const [blockedUsers, setBlockedUsers] = useState(initialBlockedUsers);

    const handleSettingChange = (key: keyof PrivacySettingsType, value: string | boolean) => {
        setSettings((prev) => ({ ...prev, [key]: value }));
        updateSettings.mutate({ [key]: value });
    };

    const handleUnblockClick = (userId: string) => {
        setSelectedUserId(userId);
        setUnblockDialogOpen(true);
    };

    const handleConfirmUnblock = () => {
        if (selectedUserId) {
            unblockUserMutation.mutate(selectedUserId, {
                onSuccess: () => {
                    setBlockedUsers((prev) => prev.filter((user) => user.id !== selectedUserId));
                    setUnblockDialogOpen(false);
                    setSelectedUserId(null);
                }
            });
        }
    };

    const formatLabel = (value: string) => {
        return value
            .split('_')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Profile Visibility</CardTitle>
                    <CardDescription>Control who can see your musician profile</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="profile-visibility">Who can see your profile?</Label>
                        <Select
                            value={settings.profileVisibility}
                            onValueChange={(value) => handleSettingChange('profileVisibility', value as (typeof ProfileVisibilityEnum)[number])}
                            disabled={updateSettings.isPending}
                        >
                            <SelectTrigger id="profile-visibility" className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {ProfileVisibilityEnum.map((visibility) => (
                                    <SelectItem key={visibility} value={visibility}>
                                        {formatLabel(visibility)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-muted-foreground text-sm">
                            {settings.profileVisibility === 'public' && 'Anyone can view your full profile'}
                            {settings.profileVisibility === 'followers_only' && 'Only your followers can view your full profile'}
                            {settings.profileVisibility === 'private' && 'Only you can view your full profile'}
                        </p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Search & Discovery</CardTitle>
                    <CardDescription>Manage your visibility in search results</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="search-visibility">Appear in musician search</Label>
                            <p className="text-muted-foreground text-sm">Allow other musicians to find you through search</p>
                        </div>
                        <Checkbox
                            id="search-visibility"
                            checked={settings.searchVisibility}
                            onCheckedChange={(checked) => handleSettingChange('searchVisibility', checked as boolean)}
                            disabled={updateSettings.isPending}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Communication Preferences</CardTitle>
                    <CardDescription>Control who can message and follow you</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="messaging-permission">Who can message you?</Label>
                        <Select
                            value={settings.messagingPermission}
                            onValueChange={(value) => handleSettingChange('messagingPermission', value as (typeof MessagingPermissionEnum)[number])}
                            disabled={updateSettings.isPending}
                        >
                            <SelectTrigger id="messaging-permission" className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {MessagingPermissionEnum.map((permission) => (
                                    <SelectItem key={permission} value={permission}>
                                        {formatLabel(permission)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-muted-foreground text-sm">
                            {settings.messagingPermission === 'anyone' && 'Anyone can send you messages'}
                            {settings.messagingPermission === 'followers' && 'Only your followers can send you messages'}
                            {settings.messagingPermission === 'none' && 'No one can send you new messages'}
                        </p>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                        <Label htmlFor="follow-permission">Who can follow you?</Label>
                        <Select
                            value={settings.followPermission}
                            onValueChange={(value) => handleSettingChange('followPermission', value as (typeof FollowPermissionEnum)[number])}
                            disabled={updateSettings.isPending}
                        >
                            <SelectTrigger id="follow-permission" className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {FollowPermissionEnum.map((permission) => (
                                    <SelectItem key={permission} value={permission}>
                                        {formatLabel(permission)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-muted-foreground text-sm">
                            {settings.followPermission === 'anyone' && 'Anyone can follow you'}
                            {settings.followPermission === 'approval' && 'Follow requests require your approval'}
                            {settings.followPermission === 'none' && 'No one can follow you'}
                        </p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Blocked Users</CardTitle>
                    <CardDescription>Manage users you have blocked</CardDescription>
                </CardHeader>
                <CardContent>
                    {blockedUsers.length > 0 ? (
                        <div className="space-y-4">
                            {blockedUsers.map((user) => (
                                <div key={user.id} className="flex items-center justify-between py-2">
                                    <div className="flex items-center gap-3">
                                        <Avatar>
                                            <AvatarImage src={user.image || undefined} alt={user.name} />
                                            <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-medium">{user.name}</p>
                                            <p className="text-muted-foreground text-sm">
                                                Blocked{' '}
                                                {new Date(user.blockedAt).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={() => handleUnblockClick(user.id)} disabled={unblockUserMutation.isPending}>
                                        Unblock
                                    </Button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-8 text-center">
                            <p className="text-muted-foreground">You haven&apos;t blocked anyone</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <AlertDialog open={unblockDialogOpen} onOpenChange={setUnblockDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Unblock User?</AlertDialogTitle>
                        <AlertDialogDescription>This user will be able to see your profile and contact you again.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmUnblock} disabled={unblockUserMutation.isPending}>
                            {unblockUserMutation.isPending ? 'Unblocking...' : 'Unblock'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
