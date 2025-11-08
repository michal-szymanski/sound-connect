import { TrendingUp } from 'lucide-react';
import { useChatWindows } from '@/features/chat/components/chat-window-manager';
import UserAvatar from '@/shared/components/common/user-avatar';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import useContacts from '@/features/chat/hooks/use-contacts';
import type { UserDTO } from '@/common/types/models';

export default function RightSidebar() {
    const { users } = useContacts();
    const { openChatWindow } = useChatWindows();

    const handleContactClick = (user: UserDTO) => {
        openChatWindow(user);
    };

    return (
        <aside className="hidden lg:col-span-3 lg:block">
            <div className="sticky top-20 space-y-4">
                <Card className="border-border/40">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold">Contacts</CardTitle>
                    </CardHeader>
                    <CardContent className="pb-4">
                        {users.length === 0 ? (
                            <p className="text-muted-foreground text-sm">No mutual followers found</p>
                        ) : (
                            <div className="space-y-2">
                                {users.slice(0, 5).map((user) => (
                                    <Button
                                        key={user.id}
                                        variant="ghost"
                                        onClick={() => handleContactClick(user)}
                                        className="h-auto w-full justify-start gap-2 rounded-md p-2"
                                        aria-label={`Chat with ${user.name}`}
                                    >
                                        <div className="relative">
                                            <UserAvatar user={user} className="h-8 w-8" />
                                            <span
                                                className="border-card absolute right-0 bottom-0 h-2.5 w-2.5 rounded-full border-2 bg-green-500"
                                                aria-hidden="true"
                                            />
                                        </div>
                                        <span className="text-foreground truncate text-sm font-medium">{user.name}</span>
                                    </Button>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="border-border/40">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold">Trending Topics</CardTitle>
                    </CardHeader>
                    <CardContent className="pb-4">
                        <div className="space-y-3">
                            {['#JazzFusion', '#GuitarTips', '#BandMates', '#LiveMusic'].map((topic) => (
                                <button
                                    key={topic}
                                    className="focus-visible:ring-ring group hover:bg-accent block w-full rounded-md p-2 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none"
                                >
                                    <div className="flex items-center gap-2">
                                        <TrendingUp className="text-muted-foreground h-4 w-4" aria-hidden="true" />
                                        <span className="text-foreground text-sm font-medium group-hover:underline">{topic}</span>
                                    </div>
                                    <p className="text-muted-foreground ml-6 text-xs">1.2k posts</p>
                                </button>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </aside>
    );
}
