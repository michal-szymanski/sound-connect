import { Bell } from 'lucide-react';
import { Button } from '@/web/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/web/components/ui/popover';
import { ScrollArea } from '@/web/components/ui/scroll-area';
import { useState } from 'react';
import { useNotifications } from '@/web/providers/notifications-provider';
import { deleteNotification, markAllNotificationsAsSeen } from '@/web/server-functions/models';
import { formatDistanceToNow } from 'date-fns';

export function NotificationsButton() {
    const [open, setOpen] = useState(false);
    const { notifications, unreadCount, removeNotification, markAllAsSeen } = useNotifications();

    const handleDelete = async (notificationId: number) => {
        const result = await deleteNotification({ data: { notificationId } });
        if (result.success) {
            removeNotification(notificationId);
        }
    };

    const handleOpenChange = async (isOpen: boolean) => {
        if (!isOpen && open && unreadCount > 0) {
            const result = await markAllNotificationsAsSeen();
            if (result.success) {
                markAllAsSeen();
            }
        }
        setOpen(isOpen);
    };

    return (
        <Popover open={open} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-foreground hover:text-foreground hover:bg-accent relative"
                    aria-label="Notifications"
                    data-testid="notifications-button"
                >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && !open && (
                        <span className="bg-destructive absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold text-white">
                            {unreadCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="border-border flex items-center justify-between border-b px-4 py-3">
                    <h3 className="text-foreground font-semibold">Notifications</h3>
                </div>
                <ScrollArea className="h-[400px]">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <Bell className="text-muted-foreground mb-2 h-8 w-8" />
                            <p className="text-muted-foreground text-sm">No notifications yet</p>
                        </div>
                    ) : (
                        <div className="divide-border divide-y">
                            {notifications.map((notification) => (
                                <div key={notification.id} className="hover:bg-accent/50 relative p-4 transition-colors">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0 flex-1">
                                            <p className="text-foreground mb-1 text-sm font-medium">
                                                {notification.type === 'follow_request' ? 'New follower' : 'Notification'}
                                            </p>
                                            <p className="text-muted-foreground line-clamp-2 text-sm">{notification.content}</p>
                                            <p className="text-muted-foreground mt-1 text-xs">
                                                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                            </p>
                                        </div>
                                        {!notification.seen && <div className="bg-destructive mt-1 h-2 w-2 shrink-0 rounded-full" />}
                                    </div>
                                    <div className="mt-3 flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="w-full"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(notification.id);
                                            }}
                                        >
                                            Delete
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}
