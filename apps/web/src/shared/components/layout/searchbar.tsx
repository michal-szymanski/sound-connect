import { useDebouncedValue } from '@tanstack/react-pacer';
import { useRouter } from '@tanstack/react-router';
import { ChevronsUpDownIcon } from 'lucide-react';
import { useState } from 'react';
import Loader from '@/shared/components/common/loader';
import UserAvatar from '@/shared/components/common/user-avatar';
import { Button } from '@/shared/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/shared/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover';
import { useSearch } from '@/shared/lib/react-query';

const SearchBar = () => {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [debouncedQuery] = useDebouncedValue(query, { wait: 500 });
    const { data: users = [], isFetching } = useSearch(debouncedQuery);
    const router = useRouter();

    const showLoader = query !== debouncedQuery || isFetching;
    const showNoResults = !showLoader && !users.length;
    const showResults = users.length > 0;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={open} className="w-[350px] justify-between" data-testid="search-button">
                    Search...
                    <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[350px] p-0">
                <Command shouldFilter={false}>
                    <div className="relative">
                        <CommandInput
                            placeholder="Search..."
                            autoFocus
                            onValueChange={setQuery}
                            inputMode="search"
                            className="pr-5"
                            data-testid="search-input"
                        />
                        {showLoader && (
                            <figure className="absolute top-1/2 right-3 -translate-y-1/2">
                                <Loader />
                            </figure>
                        )}
                    </div>
                    <CommandList>
                        {showNoResults && <CommandEmpty>Nothing found.</CommandEmpty>}
                        {showResults && (
                            <CommandGroup heading="Users">
                                {users.map((user) => (
                                    <CommandItem
                                        key={user.id}
                                        value={user.id}
                                        className="h-10 cursor-pointer"
                                        onSelect={(_currentValue) => {
                                            setQuery('');
                                            router.navigate({ to: `/users/${user.id}` });
                                            setOpen(false);
                                        }}
                                    >
                                        <div className="inline-flex items-center gap-2">
                                            <UserAvatar user={user} />
                                            <span>{user.name}</span>
                                        </div>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
};

export default SearchBar;
