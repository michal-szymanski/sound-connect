import { Button } from '@/web/components/ui/button';
import { SheetContent, SheetHeader, SheetTitle, Sheet } from '@/web/components/ui/sheet';
import { useUserStatuses } from '@/web/providers/user-statuses-provider';
import { acceptFollowRequest, getUser, sendFollowRequest } from '@/web/server-functions/models';
import { UserDTO } from '@/web/types/auth';
import { useRouter } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { formatDistanceToNowStrict, parseISO } from 'date-fns';
import StatusAvatar from '@/web/components/status-avatar';
import { FollowRequestNotificationItem } from '@sound-connect/common/types';

type Props = {
    open: boolean;
    setOpen: (value: boolean) => void;
};

const NotificationsSheet = ({ open, setOpen }: Props) => {
    const { followRequestNotifications } = useUserStatuses();
    const [users, setUsers] = useState<UserDTO[]>([]);

    useEffect(() => {
        for (const notification of Array.from(followRequestNotifications.values())) {
            getUser({ data: { userId: notification.userId } }).then((res) => {
                if (res.success) {
                    setUsers((prev) => [...prev, res.body]);
                }
            });
        }
    }, [followRequestNotifications]);

    const router = useRouter();

    const renderContent = (notification: FollowRequestNotificationItem) => {
        const user = users.find((u) => u.id === notification.userId);

        if (!user) return null;

        return (
            <div
                className="inline-flex w-full items-center justify-between"
                role="button"
                onClick={() => {
                    setOpen(false);
                    router.navigate({ to: `/users/${user.id}` });
                }}
            >
                <div className="inline-flex items-center gap-3 pr-3">
                    <StatusAvatar user={user} />
                    <div>
                        <span className="font-bold">{user.name}</span> requested to follow you.{' '}
                        <span className="text-muted-foreground">
                            {formatDistanceToNowStrict(parseISO(notification.date), {
                                addSuffix: true
                            })}
                        </span>
                    </div>
                </div>
                <div className="inline-flex gap-2">
                    {notification.accepted ? (
                        <Button
                            size="sm"
                            onClick={async (e) => {
                                e.stopPropagation();
                                await sendFollowRequest({ data: { userId: notification.userId } });
                            }}
                        >
                            Follow
                        </Button>
                    ) : (
                        <Button
                            size="sm"
                            onClick={async (e) => {
                                e.stopPropagation();
                                await acceptFollowRequest({ data: { notification } });
                            }}
                        >
                            Accept
                        </Button>
                    )}
                    <Button
                        size="sm"
                        variant="secondary"
                        onClick={(e) => {
                            e.stopPropagation();
                            console.log('b2');
                        }}
                    >
                        Delete
                    </Button>
                </div>
            </div>
        );
    };

    return (
        <Sheet open={open} onOpenChange={setOpen} modal={false}>
            <SheetContent side="left">
                <SheetHeader>
                    <SheetTitle className="text-2xl">Notifications</SheetTitle>
                </SheetHeader>
                {Array.from(followRequestNotifications.values()).map((n) => (
                    <div key={n.id} className="hover:bg-muted/50 px-7 py-5 text-sm">
                        {renderContent(n)}
                    </div>
                ))}
            </SheetContent>
        </Sheet>
    );
};

export default NotificationsSheet;
