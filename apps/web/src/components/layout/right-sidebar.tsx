import StatusAvatar from '@/web/components/small/status-avatar';
import { Button } from '@/web/components/ui/button';
import { useChatWindows } from '@/web/components/chat/chat-window-manager';
import useContacts from '@/web/hooks/use-contacts';

const RightSidebar = () => {
    const { users } = useContacts();
    const { openChatWindow } = useChatWindows();

    return (
        <div className="bg-background fixed right-0 top-0 z-50 hidden h-full w-64 overflow-y-auto border-l p-4 lg:block">
            <h2 className="mb-4 text-xl font-semibold">Contacts</h2>

            {users.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">No mutual followers found</p>
            ) : (
                <div className="space-y-2">
                    {users.map((user) => (
                        <Button
                            key={user.id}
                            variant="ghost"
                            onClick={() => openChatWindow(user)}
                            className="h-auto w-full justify-start gap-2 rounded-md p-2 hover:bg-gray-200 dark:hover:bg-gray-700"
                        >
                            <StatusAvatar user={user} />
                            <span className="text-sm font-medium">{user.name}</span>
                        </Button>
                    ))}
                </div>
            )}
        </div>
    );
};
export default RightSidebar;
