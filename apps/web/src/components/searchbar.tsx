import { useDebouncedValue } from '@tanstack/react-pacer';
import { ChevronsUpDownIcon } from 'lucide-react';
import { Button } from '@/web/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/web/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/web/components/ui/popover';
import { useState } from 'react';
import StatusAvatar from '@/web/components/status-avatar';
import { useRouter } from '@tanstack/react-router';
import { useSearch } from '@/web/lib/react-query';
import Loader from '@/web/components/loader';

const SearchBar = () => {
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState('');
    const [debouncedValue] = useDebouncedValue(value, { wait: 1000 });
    const { data: users = [], isFetching } = useSearch(debouncedValue);
    const router = useRouter();

    const showLoader = value !== debouncedValue || isFetching;
    const showNoResults = !showLoader && !users.length;
    const showResults = users.length > 0;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={open} className="w-[350px] justify-between">
                    Search...
                    <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[350px] p-0">
                <Command shouldFilter={false}>
                    <div className="relative">
                        <CommandInput placeholder="Search..." autoFocus onValueChange={setValue} inputMode="search" className="pr-5" />
                        {showLoader && (
                            <figure className="absolute right-3 top-1/2 -translate-y-1/2">
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
                                        onSelect={(currentValue) => {
                                            setValue('');
                                            router.navigate({ to: `/users/${user.id}` });
                                            setOpen(false);
                                        }}
                                    >
                                        <div className="inline-flex items-center gap-2">
                                            <StatusAvatar user={user} />
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
