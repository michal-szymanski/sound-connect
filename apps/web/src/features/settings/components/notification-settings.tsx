import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Label } from '@/shared/components/ui/label';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Separator } from '@/shared/components/ui/separator';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Info } from 'lucide-react';
import { useUpdateNotificationSettings } from '@/features/settings/hooks/use-settings';
import type { NotificationSettings as NotificationSettingsType } from '@sound-connect/common/types/settings';

type Props = {
    notificationSettings: NotificationSettingsType;
};

export function NotificationSettings({ notificationSettings: initialSettings }: Props) {
    const updateSettings = useUpdateNotificationSettings();
    const [settings, setSettings] = useState(initialSettings);

    const handleSettingChange = (key: keyof NotificationSettingsType, value: boolean) => {
        setSettings((prev) => ({ ...prev, [key]: value }));
        updateSettings.mutate({ [key]: value });
    };

    const emailEnabled = settings.emailEnabled;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Email Notifications</CardTitle>
                    <CardDescription>Choose what notifications you want to receive via email</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="email-enabled" className="font-semibold">
                                Enable email notifications
                            </Label>
                            <p className="text-muted-foreground text-sm">Turn on or off all email notifications at once</p>
                        </div>
                        <Checkbox
                            id="email-enabled"
                            checked={emailEnabled}
                            onCheckedChange={(checked) => handleSettingChange('emailEnabled', checked as boolean)}
                            disabled={updateSettings.isPending}
                        />
                    </div>

                    <Separator />

                    <div className="space-y-4">
                        <p className="text-sm font-medium">Notification Types</p>

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="follow-notifications">Follow requests and acceptances</Label>
                                <p className="text-muted-foreground text-sm">When someone follows you or accepts your follow request</p>
                            </div>
                            <Checkbox
                                id="follow-notifications"
                                checked={settings.followNotifications}
                                onCheckedChange={(checked) => handleSettingChange('followNotifications', checked as boolean)}
                                disabled={!emailEnabled || updateSettings.isPending}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="comment-notifications">Comments on my posts</Label>
                                <p className="text-muted-foreground text-sm">When someone comments on your posts</p>
                            </div>
                            <Checkbox
                                id="comment-notifications"
                                checked={settings.commentNotifications}
                                onCheckedChange={(checked) => handleSettingChange('commentNotifications', checked as boolean)}
                                disabled={!emailEnabled || updateSettings.isPending}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="reaction-notifications">Reactions to my content</Label>
                                <p className="text-muted-foreground text-sm">When someone reacts to your posts or comments</p>
                            </div>
                            <Checkbox
                                id="reaction-notifications"
                                checked={settings.reactionNotifications}
                                onCheckedChange={(checked) => handleSettingChange('reactionNotifications', checked as boolean)}
                                disabled={!emailEnabled || updateSettings.isPending}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="mention-notifications">Mentions in posts or comments</Label>
                                <p className="text-muted-foreground text-sm">When someone mentions you in a post or comment</p>
                            </div>
                            <Checkbox
                                id="mention-notifications"
                                checked={settings.mentionNotifications}
                                onCheckedChange={(checked) => handleSettingChange('mentionNotifications', checked as boolean)}
                                disabled={!emailEnabled || updateSettings.isPending}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="band-application-notifications">Band applications received</Label>
                                <p className="text-muted-foreground text-sm">When someone applies to join your band (band admins only)</p>
                            </div>
                            <Checkbox
                                id="band-application-notifications"
                                checked={settings.bandApplicationNotifications}
                                onCheckedChange={(checked) => handleSettingChange('bandApplicationNotifications', checked as boolean)}
                                disabled={!emailEnabled || updateSettings.isPending}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="band-response-notifications">Band application responses</Label>
                                <p className="text-muted-foreground text-sm">When your band application is accepted or rejected</p>
                            </div>
                            <Checkbox
                                id="band-response-notifications"
                                checked={settings.bandResponseNotifications}
                                onCheckedChange={(checked) => handleSettingChange('bandResponseNotifications', checked as boolean)}
                                disabled={!emailEnabled || updateSettings.isPending}
                            />
                        </div>
                    </div>

                    <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                            In-app notifications are always enabled and cannot be turned off. These settings only affect email notifications.
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        </div>
    );
}
