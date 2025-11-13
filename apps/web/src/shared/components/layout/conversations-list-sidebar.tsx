import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import type { UserDTO } from '@/common/types/models';
import type { ConversationDTO } from '@/common/types/conversations';
import UserAvatar from '@/shared/components/common/user-avatar';
import { Input } from '@/shared/components/ui/input';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { Badge } from '@/shared/components/ui/badge';
import { useConversations } from '@/features/chat/hooks/use-conversations';
import { formatRelativeTime } from '@/shared/lib/utils/date';
import { cn } from '@/shared/lib/utils';

type Props = {
    selectedPeer: UserDTO | null;
    onSelectPeer: (peer: UserDTO) => void;
};

export function ConversationsListSidebar({ selectedPeer, onSelectPeer }: Props) {
    const { data, isLoading } = useConversations();
    const [searchQuery, setSearchQuery] = useState('');

    const conversations = data?.conversations ?? [];

    const filteredConversations = conversations.filter((conversation: ConversationDTO) =>
        conversation.partner?.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
                                const partner = conversation.partner;
                                const isDeleted = !partner;

                                return (
                                    <button
                                        key={conversation.partnerId}
                                        onClick={() => {
                                            if (isDeleted) return;
                                            onSelectPeer({
                                                id: partner.id,
                                                name: partner.name,
                                                image: partner.image
                                            } as UserDTO);
                                        }}
                                        disabled={isDeleted}
                                        className={cn(
                                            'flex w-full items-center gap-3 px-4 py-3 transition-colors',
                                            !isDeleted && 'hover:bg-accent focus-visible:bg-accent focus-visible:outline-none',
                                            selectedPeer?.id === conversation.partnerId ? 'bg-accent border-primary border-l-2' : 'border-l-2 border-transparent',
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
                                    <p className="text-muted-foreground mt-4 text-sm">No messages yet</p>
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
