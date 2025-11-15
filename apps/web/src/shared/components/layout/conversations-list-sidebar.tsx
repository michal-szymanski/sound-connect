import { useState } from 'react';
import { MessageCircle, Users } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { getRoomId } from '@sound-connect/common/helpers';
import type { UserDTO } from '@/common/types/models';
import type { ConversationDTO } from '@/common/types/conversations';
import type { BandWithMembers } from '@sound-connect/common/types/bands';
import UserAvatar from '@/shared/components/common/user-avatar';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Input } from '@/shared/components/ui/input';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { Badge } from '@/shared/components/ui/badge';
import { useConversations } from '@/features/chat/hooks/use-conversations';
import { useAuth } from '@/shared/lib/react-query';
import { formatRelativeTime } from '@/shared/lib/utils/date';
import { cn } from '@/shared/lib/utils';
import { usePrefillConversationMetadata } from '@/features/chat/hooks/use-conversation-metadata';

type Props = {
    selectedPeer: UserDTO | null;
    onSelectPeer: (peer: UserDTO) => void;
    selectedBand?: BandWithMembers | null;
    onSelectBand?: (band: BandWithMembers) => void;
};

export function ConversationsListSidebar({ selectedPeer, onSelectPeer: _onSelectPeer, selectedBand, onSelectBand: _onSelectBand }: Props) {
    const navigate = useNavigate();
    const { data: auth } = useAuth();
    const { data, isLoading } = useConversations();
    const [searchQuery, setSearchQuery] = useState('');
    const { prefillUser } = usePrefillConversationMetadata();

    const conversations = data?.conversations ?? [];

    const filteredConversations = conversations.filter((conversation: ConversationDTO) => {
        const searchLower = searchQuery.toLowerCase();
        if (conversation.type === 'user') {
            return conversation.partner?.name.toLowerCase().includes(searchLower);
        } else {
            return conversation.band?.name.toLowerCase().includes(searchLower);
        }
    });

    return (
        <aside className="bg-background fixed top-16 right-0 h-[calc(100vh-4rem)] w-[calc(25%-0.75rem)] border-l">
            <div className="flex h-full flex-col">
                <div className="flex-none space-y-3 border-b px-4 py-4">
                    <h2 className="text-lg font-semibold">Conversations</h2>
                    <Input
                        type="search"
                        placeholder="Search conversations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-9"
                        aria-label="Search conversations"
                    />
                </div>

                <ScrollArea className="flex-1">
                    {isLoading ? (
                        <ConversationsSkeleton />
                    ) : filteredConversations.length > 0 ? (
                        <div className="py-2">
                            {filteredConversations.map((conversation: ConversationDTO) => {
                                if (conversation.type === 'user') {
                                    const partner = conversation.partner;
                                    const isDeleted = !partner;

                                    return (
                                        <button
                                            key={conversation.partnerId}
                                            onClick={() => {
                                                if (isDeleted || !auth?.user || !partner) return;
                                                const roomId = getRoomId(auth.user.id, partner.id);
                                                prefillUser(roomId, auth.user.id, partner);
                                                navigate({ to: '/messages', search: { room: roomId }, replace: true });
                                            }}
                                            disabled={isDeleted}
                                            className={cn(
                                                'flex w-full items-center gap-3 px-4 py-3 transition-colors',
                                                !isDeleted && 'hover:bg-accent focus-visible:bg-accent focus-visible:outline-none',
                                                selectedPeer?.id === conversation.partnerId
                                                    ? 'bg-accent border-primary border-l-2'
                                                    : 'border-l-2 border-transparent',
                                                isDeleted && 'cursor-not-allowed opacity-60'
                                            )}
                                            aria-current={selectedPeer?.id === conversation.partnerId}
                                        >
                                            <UserAvatar
                                                user={
                                                    partner
                                                        ? { id: partner.id, name: partner.name, image: partner.image }
                                                        : { id: 'deleted', name: 'Deleted User', image: null }
                                                }
                                                className="h-10 w-10"
                                            />
                                            <div className="min-w-0 flex-1 text-left">
                                                <div className="flex items-center gap-2">
                                                    <span className="truncate text-sm font-medium">{partner?.name ?? 'Deleted User'}</span>
                                                    {conversation.isMutualFollow && !isDeleted && (
                                                        <Badge variant="secondary" className="shrink-0 text-xs">
                                                            Mutual
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="text-muted-foreground flex items-center gap-2 text-xs">
                                                    <span className="line-clamp-1 truncate">{conversation.lastMessage.content}</span>
                                                    <span>·</span>
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
                                            onClick={() => {
                                                const roomId = `band:${band.id}`;
                                                navigate({ to: '/messages', search: { room: roomId }, replace: true });
                                            }}
                                            className={cn(
                                                'flex w-full items-center gap-3 px-4 py-3 transition-colors',
                                                'hover:bg-accent focus-visible:bg-accent focus-visible:outline-none',
                                                selectedBand?.id === conversation.bandId
                                                    ? 'bg-accent border-primary border-l-2'
                                                    : 'border-l-2 border-transparent'
                                            )}
                                            aria-label={`Open band chat: ${band.name}`}
                                            aria-current={selectedBand?.id === conversation.bandId}
                                        >
                                            <Avatar className="h-10 w-10 rounded-md">
                                                <AvatarImage src={band.image || undefined} alt={band.name} />
                                                <AvatarFallback className="bg-primary text-primary-foreground rounded-md">
                                                    <Users className="h-5 w-5" />
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0 flex-1 text-left">
                                                <div className="flex items-center gap-2">
                                                    <span className="truncate text-sm font-medium">{band.name}</span>
                                                    <Badge variant="outline" className="shrink-0 text-xs">
                                                        {band.memberCount} {band.memberCount === 1 ? 'member' : 'members'}
                                                    </Badge>
                                                </div>
                                                <div className="text-muted-foreground flex items-center gap-2 text-xs">
                                                    <span className="line-clamp-1 truncate">
                                                        {conversation.lastMessage.senderName
                                                            ? `${conversation.lastMessage.senderName}: ${conversation.lastMessage.content}`
                                                            : conversation.lastMessage.content}
                                                    </span>
                                                    <span>·</span>
                                                    <span className="shrink-0">{formatRelativeTime(conversation.lastMessage.createdAt)}</span>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                }
                            })}
                        </div>
                    ) : (
                        <div className="flex h-full flex-col items-center justify-center px-4 py-12 text-center">
                            {searchQuery ? (
                                <>
                                    <MessageCircle className="text-muted-foreground/50 h-12 w-12" />
                                    <p className="text-muted-foreground mt-4 text-sm">No conversations found matching &ldquo;{searchQuery}&rdquo;</p>
                                </>
                            ) : (
                                <>
                                    <MessageCircle className="text-muted-foreground/50 h-12 w-12" />
                                    <p className="text-muted-foreground mt-4 text-sm">No conversations yet</p>
                                    <p className="text-muted-foreground mt-1 text-xs">Start a conversation by messaging someone!</p>
                                </>
                            )}
                        </div>
                    )}
                </ScrollArea>
            </div>
        </aside>
    );
}

function ConversationsSkeleton() {
    return (
        <div className="space-y-3 px-4 py-3">
            {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                    </div>
                </div>
            ))}
        </div>
    );
}
