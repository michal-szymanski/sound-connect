import { Button } from '@/web/components/ui/button';
import { SheetContent, SheetHeader, SheetTitle, Sheet } from '@/web/components/ui/sheet';
import { useUserStatuses } from '@/web/providers/user-statuses-provider';
import { getUser } from '@/web/server-functions/models';
import { UserDTO } from '@/web/types/auth';
import { NotificationMessage } from '@sound-connect/common/types';
import { useRouter } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { formatDistanceToNowStrict, parseISO } from 'date-fns';

type Props = {
    open: boolean;
    setOpen: (value: boolean) => void;
};

const NotificationsSheet = ({ open, setOpen }: Props) => {
    const { notifications } = useUserStatuses();
    const [users, setUsers] = useState<UserDTO[]>([]);

    useEffect(() => {
        for (const notification of notifications) {
            if (notification.kind === 'follow-request' || notification.kind === 'reaction') {
                getUser({ data: { userId: notification.userId } }).then((res) => {
                    if (res.success) {
                        setUsers((prev) => [...prev, res.body]);
                    }
                });
            }
        }
    }, [notifications]);

    const router = useRouter();

    const renderContent = (notification: NotificationMessage) => {
        if (notification.kind === 'follow-request') {
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
                    <div className="pr-3">
                        <span className="font-bold">{user.name}</span> requested to follow you.{' '}
                        <span className="text-muted-foreground">
                            {formatDistanceToNowStrict(parseISO(notification.date), {
                                addSuffix: true
                            })}
                        </span>
                    </div>
                    <div className="inline-flex gap-2">
                        <Button
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                console.log('b1');
                            }}
                        >
                            Accept
                        </Button>
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
        }

        if (notification.kind === 'reaction') {
            return 'Reaction';
        }

        return null;
    };

    return (
        <Sheet open={open} onOpenChange={setOpen} modal={false}>
            <SheetContent side="left">
                <SheetHeader>
                    <SheetTitle className="text-2xl">Notifications</SheetTitle>
                </SheetHeader>
                {notifications.map((n) => (
                    <div key={n.id} className="hover:bg-muted/50 px-7 py-5 text-sm">
                        {renderContent(n)}
                    </div>
                ))}
            </SheetContent>
        </Sheet>
    );
};

export default NotificationsSheet;
