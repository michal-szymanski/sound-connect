import { TrendingUp, Maximize2, MessageCircle, Users } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import UserAvatar from '@/shared/components/common/user-avatar';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { Badge } from '@/shared/components/ui/badge';
import { useConversations } from '@/features/chat/hooks/use-conversations';
import { formatRelativeTime } from '@/shared/lib/utils/date';
import { cn } from '@/shared/lib/utils';
import { useChatWindows } from '@/features/chat/components/chat-window-manager';
import type { ConversationDTO, UserConversationDTO, BandConversationDTO } from '@/common/types/conversations';
import type { UserDTO } from '@/common/types/models';

export default function RightSidebar() {
    const { data, isLoading } = useConversations();
    const { openChatWindow } = useChatWindows();

    const conversations = data?.conversations ?? [];

    const handleUserConversationClick = (conversation: UserConversationDTO) => {
        if (!conversation.partner) return;

        const partnerAsUser: UserDTO = {
            id: conversation.partner.id,
            name: conversation.partner.name,
            image: conversation.partner.image,
            lastActiveAt: null
        };

        openChatWindow(partnerAsUser);
    };

    const handleBandConversationClick = (conversation: BandConversationDTO) => {
        if (!conversation.band) return;

        const bandAsUser: UserDTO = {
            id: `band-${conversation.band.id}`,
            name: conversation.band.name,
            image: conversation.band.image,
            lastActiveAt: null
        };

        openChatWindow(bandAsUser);
    };

    return (
        <aside className="hidden lg:col-span-3 lg:block">
            <div className="sticky top-20 space-y-4">
                <Card className="border-border/40">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base font-semibold">Messages</CardTitle>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground hover:text-foreground hover:bg-accent h-8 w-8 transition-colors"
                                asChild
                            >
                                <Link to="/messages">
                                    <Maximize2 className="h-4 w-4" aria-hidden="true" />
                                    <span className="sr-only">Open full messages view</span>
                                </Link>
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="pb-4">
                        {isLoading && (
                            <div className="space-y-2">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <div key={i} className="flex items-center gap-3 p-2">
                                        <Skeleton className="h-10 w-10 rounded-full" />
                                        <div className="flex-1 space-y-1.5">
                                            <Skeleton className="h-4 w-24" />
                                            <Skeleton className="h-3 w-full" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {!isLoading && conversations.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <MessageCircle className="text-muted-foreground/50 h-8 w-8" aria-hidden="true" />
                                <p className="text-muted-foreground mt-3 text-sm">No recent conversations</p>
                                <p className="text-muted-foreground mt-1 text-xs">Start messaging your connections!</p>
                            </div>
                        )}
                        {!isLoading && conversations.length > 0 && (
                            <div className="space-y-2">
                                {conversations.slice(0, 5).map((conversation: ConversationDTO) => {
                                    if (conversation.type === 'user') {
                                        const partner = conversation.partner;
                                        const isDeleted = !partner;
                                        const name = partner?.name ?? 'Deleted User';

                                        return (
                                            <button
                                                key={conversation.partnerId}
                                                onClick={() => !isDeleted && handleUserConversationClick(conversation)}
                                                disabled={isDeleted}
                                                className={cn(
                                                    'flex w-full items-center gap-3 rounded-md p-2 transition-colors',
                                                    'hover:bg-accent focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
                                                    conversation.unreadCount > 0 && 'bg-accent/50',
                                                    isDeleted && 'cursor-not-allowed opacity-60'
                                                )}
                                                aria-label={`Open conversation with ${name}`}
                                            >
                                                <div className="shrink-0">
                                                    <UserAvatar
                                                        user={
                                                            partner
                                                                ? { id: partner.id, name: partner.name, image: partner.image }
                                                                : { id: 'deleted', name: 'Deleted User', image: null }
                                                        }
                                                        className="h-10 w-10"
                                                    />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-foreground truncate text-sm font-medium">{name}</p>
                                                        {conversation.unreadCount > 0 && (
                                                            <Badge variant="default" className="ml-auto bg-primary text-primary-foreground shrink-0 text-xs">
                                                                {conversation.unreadCount}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
                                                        <span className="line-clamp-1 truncate">{conversation.lastMessage.content}</span>
                                                        <span aria-hidden="true">·</span>
                                                        <span className="shrink-0">{formatRelativeTime(conversation.lastMessage.createdAt)}</span>
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    } else {
                                        const band = conversation.band;
                                        if (!band) return null;

                                        return (
                                            <button
                                                key={`band-${conversation.bandId}`}
                                                onClick={() => handleBandConversationClick(conversation)}
                                                className={cn(
                                                    'flex w-full items-center gap-3 rounded-md p-2 transition-colors',
                                                    'hover:bg-accent focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
                                                    conversation.unreadCount > 0 && 'bg-accent/50'
                                                )}
                                                aria-label={`Open conversation with ${band.name}`}
                                            >
                                                <div className="shrink-0">
                                                    <Avatar className="h-10 w-10 rounded-md">
                                                        <AvatarImage src={band.image || undefined} alt={band.name} />
                                                        <AvatarFallback className="bg-primary text-primary-foreground rounded-md">
                                                            <Users className="h-5 w-5" />
                                                        </AvatarFallback>
                                                    </Avatar>
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-foreground truncate text-sm font-medium">{band.name}</p>
                                                        {conversation.unreadCount > 0 && (
                                                            <Badge variant="default" className="ml-auto bg-primary text-primary-foreground shrink-0 text-xs">
                                                                {conversation.unreadCount}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
                                                        <span className="line-clamp-1 truncate">
                                                            {conversation.lastMessage.senderName
                                                                ? `${conversation.lastMessage.senderName}: ${conversation.lastMessage.content}`
                                                                : conversation.lastMessage.content}
                                                        </span>
                                                        <span aria-hidden="true">·</span>
                                                        <span className="shrink-0">{formatRelativeTime(conversation.lastMessage.createdAt)}</span>
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    }
                                })}
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
