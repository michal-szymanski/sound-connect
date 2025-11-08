import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/web/components/ui/dialog';
import { Input } from '@/web/components/ui/input';
import { Button } from '@/web/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/web/components/ui/avatar';
import { ScrollArea } from '@/web/components/ui/scroll-area';
import { Search, Loader2 } from 'lucide-react';
import { search } from '@/web/server-functions/users';
import type { UserDTO } from '@sound-connect/common/types/models';

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onAddMember: (userId: string) => void;
    existingMemberIds: string[];
    isAdding: boolean;
};

export function AddMemberModal({ open, onOpenChange, onAddMember, existingMemberIds, isAdding }: Props) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<UserDTO[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const handleSearch = async () => {
        if (!query.trim()) {
            setResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const result = await search({ data: { query: query.trim() } });
            if (result.success) {
                setResults(result.body.filter((user) => !existingMemberIds.includes(user.id)));
            } else {
                setResults([]);
            }
        } catch {
            setResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSearch();
        }
    };

    const handleAddMember = (userId: string) => {
        onAddMember(userId);
        setQuery('');
        setResults([]);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Add Band Member</DialogTitle>
                    <DialogDescription>Search for users to add to your band. They will be added as regular members.</DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                            <Input
                                placeholder="Search by name or email..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyPress={handleKeyPress}
                                className="pl-9"
                                aria-label="Search for users"
                            />
                        </div>
                        <Button onClick={handleSearch} disabled={isSearching || !query.trim()} aria-busy={isSearching}>
                            {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
                        </Button>
                    </div>

                    <ScrollArea className="h-[300px] rounded-md border">
                        {isSearching ? (
                            <div className="flex h-full items-center justify-center">
                                <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
                            </div>
                        ) : results.length > 0 ? (
                            <div className="space-y-2 p-4">
                                {results.map((user) => {
                                    const initials = user.name
                                        .split(' ')
                                        .map((n) => n[0])
                                        .join('')
                                        .toUpperCase()
                                        .slice(0, 2);

                                    return (
                                        <div key={user.id} className="flex items-center justify-between rounded-lg border p-3">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-10 w-10">
                                                    <AvatarImage src={user.image || undefined} alt={user.name} />
                                                    <AvatarFallback>{initials}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium">{user.name}</p>
                                                    <p className="text-muted-foreground text-sm">{user.id}</p>
                                                </div>
                                            </div>
                                            <Button
                                                onClick={() => handleAddMember(user.id)}
                                                disabled={isAdding}
                                                size="sm"
                                                aria-label={`Add ${user.name} to band`}
                                            >
                                                {isAdding ? 'Adding...' : 'Add'}
                                            </Button>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : query && !isSearching ? (
                            <div className="flex h-full flex-col items-center justify-center p-4 text-center">
                                <p className="text-muted-foreground">No users found matching &quot;{query}&quot;</p>
                                <p className="text-muted-foreground text-sm">Try a different search term</p>
                            </div>
                        ) : (
                            <div className="flex h-full items-center justify-center p-4 text-center">
                                <p className="text-muted-foreground">Search for users to add to your band</p>
                            </div>
                        )}
                    </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>
    );
}
