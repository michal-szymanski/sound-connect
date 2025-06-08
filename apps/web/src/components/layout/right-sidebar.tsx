import StatusAvatar from '@/web/components/small/status-avatar';
import { Button } from '@/web/components/ui/button';
import { useChatWindows } from '@/web/components/chat/chat-window-manager';
import useContacts from '@/web/hooks/use-contacts';
import { useState } from 'react';
import { Users, X } from 'lucide-react';
import clsx from 'clsx';

const RightSidebar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { users } = useContacts();
    const { openChatWindow } = useChatWindows();

    const handleContactClick = (user: any) => {
        openChatWindow(user);
        setIsOpen(false);
    };

    return (
        <>
            {!isOpen && (
                <Button
                    onClick={() => setIsOpen(true)}
                    variant="outline"
                    size="sm"
                    className="fixed right-4 top-20 z-[70] h-12 w-12 rounded-full p-0 shadow-lg hover:shadow-xl"
                    title="Show contacts"
                >
                    <Users className="h-5 w-5" />
                </Button>
            )}

            <div
                className={clsx(
                    'bg-background fixed right-0 top-0 z-[60] h-full w-64 transform overflow-y-auto border-l p-4 shadow-lg transition-transform duration-300 ease-in-out',
                    isOpen ? 'translate-x-0' : 'translate-x-full'
                )}
            >
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Contacts</h2>
                    <Button onClick={() => setIsOpen(false)} variant="ghost" size="sm" className="h-8 w-8 p-0" title="Hide contacts">
                        <X className="h-4 w-4" />
                    </Button>
                </div>

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
                            >
                                <StatusAvatar user={user} />
                                <span className="text-sm font-medium">{user.name}</span>
                            </Button>
                        ))}
                    </div>
                )}
            </div>

            {isOpen && <div className="fixed inset-0 z-[55] bg-black/20" onClick={() => setIsOpen(false)} />}
        </>
    );
};
export default RightSidebar;
