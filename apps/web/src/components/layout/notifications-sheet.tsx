import { Button } from '@/web/components/ui/button';
import { SheetContent, SheetHeader, SheetTitle, Sheet, SheetDescription } from '@/web/components/ui/sheet';
import { useWebSocket } from '@/web/providers/websocket-provider';
import { deleteNotification, getUser, sendFollowRequest, updateNotification } from '@/web/server-functions/models';
import { useRouter } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { formatDistanceToNowStrict, parseISO } from 'date-fns';
import StatusAvatar from '@/web/components/small/status-avatar';
import { FollowRequestNotificationItem, FollowRequestAcceptedNotificationItem, UserDTO } from '@sound-connect/common/types/models';
import { useQueryClient } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import { showSidebar } from '@/web/redux/slices/ui-slice';
import { useUser } from '@/web/lib/react-query';

type Props = {
    open: boolean;
    setOpen: (value: boolean) => void;
};

const NotificationsSheet = ({ open, setOpen }: Props) => {
    const { followRequestNotifications, followRequestAcceptedNotifications } = useWebSocket();
    const [users, setUsers] = useState<UserDTO[]>([]);
    const dispatch = useDispatch();
    const { data: currentUser } = useUser();

    useEffect(() => {
        for (const notification of Array.from(followRequestNotifications.values())) {
            getUser({ data: { userId: notification.from } }).then((res) => {
                if (res.success) {
                    setUsers((prev) => {
                        if (!prev.find((u) => u.id === res.body.id)) {
                            return [...prev, res.body];
                        }
                        return prev;
                    });
                }
            });
        }

        for (const notification of Array.from(followRequestAcceptedNotifications.values())) {
            getUser({ data: { userId: notification.from } }).then((res) => {
                if (res.success) {
                    setUsers((prev) => {
                        if (!prev.find((u) => u.id === res.body.id)) {
                            return [...prev, res.body];
                        }
                        return prev;
                    });
                }
            });
        }
    }, [followRequestNotifications, followRequestAcceptedNotifications]);

    useEffect(() => {
        dispatch(showSidebar(!open));

        if (!open) return;

        const unseenFollowRequestNotifications = Array.from(followRequestNotifications.values()).filter((n) => !n.seen);
        if (unseenFollowRequestNotifications.length > 0) {
            for (const notification of unseenFollowRequestNotifications) {
                updateNotification({
                    data: {
                        notificationId: notification.id,
                        notification: { ...notification, seen: true }
                    }
                });
            }
        }

        const unseenAcceptedNotifications = Array.from(followRequestAcceptedNotifications.values()).filter((n) => !n.seen);
        if (unseenAcceptedNotifications.length > 0) {
            for (const notification of unseenAcceptedNotifications) {
                updateNotification({
                    data: {
                        notificationId: notification.id,
                        notification: { ...notification, seen: true }
                    }
                });
            }
        }
    }, [open, followRequestNotifications, followRequestAcceptedNotifications]);

    const router = useRouter();
    const queryClient = useQueryClient();

    const renderFollowRequestContent = (notification: FollowRequestNotificationItem) => {
        const user = users.find((u) => u.id === notification.from);

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
                        <span className="font-bold">{user.name}</span>{' '}
                        {notification.accepted ? 'follow request was accepted. You can now follow back.' : 'requested to follow you.'}{' '}
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
                                await sendFollowRequest({ data: { userId: notification.from } });
                                await queryClient.invalidateQueries({ queryKey: ['follow-request-status', notification.from] });
                            }}
                        >
                            Follow
                        </Button>
                    ) : (
                        <Button
                            size="sm"
                            onClick={async (e) => {
                                e.stopPropagation();
                                await updateNotification({
                                    data: {
                                        notificationId: notification.id,
                                        notification: { ...notification, accepted: true }
                                    }
                                });
                                await queryClient.invalidateQueries({ queryKey: ['followers', currentUser?.id] });
                                await queryClient.invalidateQueries({ queryKey: ['followings', currentUser?.id] });
                                await queryClient.invalidateQueries({ queryKey: ['follow-request-status'] });
                            }}
                        >
                            Accept
                        </Button>
                    )}
                    <Button
                        size="sm"
                        variant="secondary"
                        onClick={async (e) => {
                            e.stopPropagation();
                            await deleteNotification({ data: { notificationId: notification.id } });
                            await queryClient.invalidateQueries({ queryKey: ['follow-request-status', notification.from] });
                        }}
                    >
                        Delete
                    </Button>
                </div>
            </div>
        );
    };

    const renderFollowRequestAcceptedContent = (notification: FollowRequestAcceptedNotificationItem) => {
        const user = users.find((u) => u.id === notification.from);

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
                        <span className="font-bold">{user.name}</span> accepted your follow request.{' '}
                        <span className="text-muted-foreground">
                            {formatDistanceToNowStrict(parseISO(notification.date), {
                                addSuffix: true
                            })}
                        </span>
                    </div>
                </div>
                <div className="inline-flex gap-2">
                    <Button
                        size="sm"
                        variant="secondary"
                        onClick={async (e) => {
                            e.stopPropagation();
                            await deleteNotification({ data: { notificationId: notification.id } });
                        }}
                    >
                        Delete
                    </Button>
                </div>
            </div>
        );
    };

    const allNotifications = [
        ...Array.from(followRequestNotifications.values()).map((n) => ({ type: 'follow-request' as const, notification: n })),
        ...Array.from(followRequestAcceptedNotifications.values()).map((n) => ({ type: 'follow-request-accepted' as const, notification: n }))
    ].sort((a, b) => new Date(b.notification.date).getTime() - new Date(a.notification.date).getTime());

    return (
        <Sheet open={open} onOpenChange={setOpen} modal={false}>
            <SheetContent side="left">
                <SheetHeader>
                    <SheetTitle className="text-2xl">Notifications</SheetTitle>
                </SheetHeader>
                {allNotifications.length === 0 && <SheetDescription className="px-7 py-5 text-sm">You don't have any notifications.</SheetDescription>}
                {allNotifications.map((item) => (
                    <div key={item.notification.id} className="hover:bg-muted/50 px-7 py-5 text-sm">
                        {item.type === 'follow-request'
                            ? renderFollowRequestContent(item.notification as FollowRequestNotificationItem)
                            : renderFollowRequestAcceptedContent(item.notification as FollowRequestAcceptedNotificationItem)}
                    </div>
                ))}
            </SheetContent>
        </Sheet>
    );
};

export default NotificationsSheet;
