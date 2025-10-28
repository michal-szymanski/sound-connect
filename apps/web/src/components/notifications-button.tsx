import { Bell } from 'lucide-react';
import { Button } from '@/web/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/web/components/ui/popover';
import { ScrollArea } from '@/web/components/ui/scroll-area';
import { useState } from 'react';
import { cn } from '@/web/lib/utils';

type Notification = {
    id: string;
    type: 'follow' | 'general';
    title: string;
    message: string;
    time: string;
    read: boolean;
};

export function NotificationsButton() {
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([
        {
            id: '1',
            type: 'follow',
            title: 'New follower',
            message: 'Alex Martinez started following you',
            time: '2m ago',
            read: false
        },
        {
            id: '2',
            type: 'follow',
            title: 'Connection request',
            message: 'Sarah Johnson wants to connect with your band',
            time: '1h ago',
            read: false
        },
        {
            id: '3',
            type: 'general',
            title: 'New comment',
            message: 'Someone commented on your post about jazz improvisation',
            time: '3h ago',
            read: false
        },
        {
            id: '4',
            type: 'general',
            title: 'Post reaction',
            message: 'Your latest track got 50 likes!',
            time: '5h ago',
            read: true
        }
    ]);

    const unreadCount = notifications.filter((n) => !n.read).length;

    const handleFollow = (id: string) => {
        console.log('[v0] Follow action for notification:', id);
        // Handle follow logic here
    };

    const handleDelete = (id: string) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    };

    const handleOpenChange = (isOpen: boolean) => {
        if (!isOpen && open && unreadCount > 0) {
            setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
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
                                            <p className="text-foreground mb-1 text-sm font-medium">{notification.title}</p>
                                            <p className="text-muted-foreground line-clamp-2 text-sm">{notification.message}</p>
                                            <p className="text-muted-foreground mt-1 text-xs">{notification.time}</p>
                                        </div>
                                        {!notification.read && <div className="bg-destructive mt-1 h-2 w-2 shrink-0 rounded-full" />}
                                    </div>
                                    <div className="mt-3 flex gap-2">
                                        {notification.type === 'follow' && (
                                            <Button
                                                size="sm"
                                                className="flex-1"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleFollow(notification.id);
                                                }}
                                            >
                                                Follow
                                            </Button>
                                        )}
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className={cn(notification.type === 'follow' ? 'flex-1' : 'w-full')}
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
