import StatusAvatar from '@/web/components/small/status-avatar';
import { Button } from '@/web/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/web/components/ui/sheet';
import { useChatWindows } from '@/web/components/chat/chat-window-manager';
import useContacts from '@/web/hooks/use-contacts';
import { useState } from 'react';
import { Users } from 'lucide-react';

const RightSidebar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const { users } = useContacts();
    const { openChatWindow } = useChatWindows();

    const executeWithAnimation = (action: () => void, duration: number) => {
        if (isAnimating) return;

        setIsAnimating(true);
        action();

        setTimeout(() => {
            setIsAnimating(false);
        }, duration);
    };

    const handleToggleClick = () => {
        executeWithAnimation(
            () => {
                const newOpenState = !isOpen;
                setIsOpen(newOpenState);
            },
            !isOpen ? 500 : 300
        );
    };

    const handleSheetOpenChange = (open: boolean) => {
        executeWithAnimation(
            () => {
                setIsOpen(open);
            },
            open ? 500 : 300
        );
    };

    const handleContactClick = (user: any) => {
        executeWithAnimation(() => {
            openChatWindow(user);
            setIsOpen(false);
        }, 300);
    };

    return (
        <>
            <Button
                onClick={handleToggleClick}
                variant="outline"
                size="sm"
                className="fixed right-4 top-20 z-[70] h-12 w-12 rounded-full p-0 shadow-lg hover:shadow-xl"
                title="Show contacts"
                disabled={isAnimating}
            >
                <Users className="h-5 w-5" />
            </Button>

            <Sheet open={isOpen} onOpenChange={handleSheetOpenChange} modal={false}>
                <SheetContent side="right" className="z-[80] w-64 p-4">
                    <SheetHeader className="mb-4 p-0">
                        <SheetTitle>Contacts</SheetTitle>
                    </SheetHeader>

                    {users.length === 0 ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400">No mutual followers found</p>
                    ) : (
                        <div className="space-y-2">
                            {users.map((user) => (
                                <Button
                                    key={user.id}
                                    variant="ghost"
                                    onClick={() => handleContactClick(user)}
                                    className="h-auto w-full justify-start gap-2 rounded-md p-2 hover:bg-gray-200 dark:hover:bg-gray-700"
                                    disabled={isAnimating}
                                >
                                    <StatusAvatar user={user} />
                                    <span className="text-sm font-medium">{user.name}</span>
                                </Button>
                            ))}
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </>
    );
};
export default RightSidebar;
