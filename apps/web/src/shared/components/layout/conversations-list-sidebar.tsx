import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import type { UserDTO } from '@/common/types/models';
import UserAvatar from '@/shared/components/common/user-avatar';
import { Input } from '@/shared/components/ui/input';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { Skeleton } from '@/shared/components/ui/skeleton';
import useContacts from '@/features/chat/hooks/use-contacts';
import { cn } from '@/shared/lib/utils';

type Props = {
    selectedPeer: UserDTO | null;
    onSelectPeer: (peer: UserDTO) => void;
};

export function ConversationsListSidebar({ selectedPeer, onSelectPeer }: Props) {
    const { users: contacts } = useContacts();
    const [searchQuery, setSearchQuery] = useState('');

    const filteredContacts = contacts?.filter((contact) => contact.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <aside className="bg-background fixed top-16 right-0 h-[calc(100vh-4rem)] w-[calc(25%-0.75rem)] border-l">
            <div className="flex h-full flex-col">
                <div className="flex-none space-y-3 border-b px-4 py-4">
                    <h2 className="text-lg font-semibold">Conversations</h2>
                    <Input
                        type="search"
                        placeholder="Search contacts..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-9"
                        aria-label="Search contacts"
                    />
                </div>

                <ScrollArea className="flex-1">
                    {!contacts ? (
                        <ContactsSkeleton />
                    ) : filteredContacts.length > 0 ? (
                        <div className="py-2">
                            {filteredContacts.map((contact) => (
                                <button
                                    key={contact.id}
                                    onClick={() => onSelectPeer(contact)}
                                    className={cn(
                                        'flex w-full items-center gap-3 px-4 py-3 transition-colors',
                                        'hover:bg-accent focus-visible:bg-accent focus-visible:outline-none',
                                        selectedPeer?.id === contact.id && 'bg-accent border-primary border-l-2'
                                    )}
                                    aria-current={selectedPeer?.id === contact.id}
                                >
                                    <div className="relative">
                                        <UserAvatar user={contact} className="h-10 w-10" />
                                        <span
                                            className="border-background absolute right-0 bottom-0 h-2.5 w-2.5 rounded-full border-2 bg-green-500"
                                            aria-hidden="true"
                                        />
                                    </div>
                                    <div className="min-w-0 flex-1 text-left">
                                        <div className="truncate text-sm font-medium">{contact.name}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="flex h-full flex-col items-center justify-center px-4 py-12 text-center">
                            {searchQuery ? (
                                <>
                                    <MessageCircle className="text-muted-foreground/50 h-12 w-12" />
                                    <p className="text-muted-foreground mt-4 text-sm">No contacts found matching &ldquo;{searchQuery}&rdquo;</p>
                                </>
                            ) : (
                                <>
                                    <MessageCircle className="text-muted-foreground/50 h-12 w-12" />
                                    <p className="text-muted-foreground mt-4 text-sm">No contacts yet</p>
                                    <p className="text-muted-foreground mt-1 text-xs">Follow users who follow you back to start messaging</p>
                                </>
                            )}
                        </div>
                    )}
                </ScrollArea>
            </div>
        </aside>
    );
}

function ContactsSkeleton() {
    return (
        <div className="space-y-3 px-4 py-3">
            {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-20" />
                    </div>
                </div>
            ))}
        </div>
    );
}
