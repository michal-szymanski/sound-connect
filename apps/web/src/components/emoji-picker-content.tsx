import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/tooltip';
import { searchEmojis, getRecentEmojis, addRecentEmoji } from '@/web/utils/emoji-utils';
import emojiData from '@/web/data/emojis.json';

type Emoji = {
    emoji: string;
    name: string;
    keywords: string[];
    category: string;
};

type Props = {
    onEmojiSelect: (emoji: string) => void;
    onClose?: () => void;
};

type CategoryInfo = {
    id: string;
    icon: string;
    name: string;
};

type EmojiData = {
    categories: CategoryInfo[];
    emojis: Emoji[];
};

export function EmojiPickerContent({ onEmojiSelect, onClose }: Props) {
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('smileys-people');
    const [focusedIndex, setFocusedIndex] = useState(-1);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const gridRef = useRef<HTMLDivElement>(null);

    const { categories, emojis } = emojiData as EmojiData;
    const recentEmojis = getRecentEmojis();

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(searchQuery);
        }, 150);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        setTimeout(() => {
            searchInputRef.current?.focus();
        }, 0);
    }, []);

    const filteredEmojis = useMemo(() => {
        if (debouncedQuery) {
            return searchEmojis(debouncedQuery, emojis);
        }
        return emojis.filter((emoji) => emoji.category === selectedCategory);
    }, [debouncedQuery, selectedCategory, emojis]);

    const handleEmojiClick = (emoji: string) => {
        onEmojiSelect(emoji);
        addRecentEmoji(emoji);
        onClose?.();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        const cols = window.innerWidth < 640 ? 6 : 8;
        const totalEmojis = filteredEmojis.length;

        switch (e.key) {
            case 'ArrowRight':
                e.preventDefault();
                setFocusedIndex((prev) => (prev + 1) % totalEmojis);
                break;
            case 'ArrowLeft':
                e.preventDefault();
                setFocusedIndex((prev) => (prev - 1 + totalEmojis) % totalEmojis);
                break;
            case 'ArrowDown':
                e.preventDefault();
                setFocusedIndex((prev) => Math.min(prev + cols, totalEmojis - 1));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setFocusedIndex((prev) => Math.max(prev - cols, 0));
                break;
            case 'Enter':
            case ' ':
                e.preventDefault();
                if (focusedIndex >= 0 && focusedIndex < totalEmojis && filteredEmojis[focusedIndex]) {
                    handleEmojiClick(filteredEmojis[focusedIndex].emoji);
                }
                break;
            case 'Escape':
                e.preventDefault();
                if (searchQuery) {
                    setSearchQuery('');
                    setDebouncedQuery('');
                } else {
                    onClose?.();
                }
                break;
            case 'Home':
                e.preventDefault();
                setFocusedIndex(0);
                break;
            case 'End':
                e.preventDefault();
                setFocusedIndex(totalEmojis - 1);
                break;
        }
    };

    const focusedEmoji = focusedIndex >= 0 && focusedIndex < filteredEmojis.length ? filteredEmojis[focusedIndex] : null;

    return (
        <div className="flex h-full flex-col" onKeyDown={handleKeyDown}>
            <div className="border-border relative border-b p-2">
                <Search className="text-muted-foreground absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2" />
                <Input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search emojis..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-10 pr-9 pl-9 text-base sm:text-sm"
                />
                {searchQuery && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            setSearchQuery('');
                            setDebouncedQuery('');
                            searchInputRef.current?.focus();
                        }}
                        className="absolute top-1/2 right-3 h-6 w-6 -translate-y-1/2 p-0"
                    >
                        <X className="h-3 w-3" />
                    </Button>
                )}
            </div>

            {!debouncedQuery && recentEmojis.length > 0 && (
                <div className="border-border border-b p-2">
                    <h3 className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">Recently Used</h3>
                    <div className="grid grid-cols-6 gap-1 sm:grid-cols-8">
                        {recentEmojis.slice(0, 24).map((emoji, index) => {
                            const emojiData = emojis.find((e) => e.emoji === emoji);
                            return (
                                <TooltipProvider key={`recent-${index}`} delayDuration={300}>
                                    <Tooltip disableHoverableContent>
                                        <TooltipTrigger asChild>
                                            <button
                                                type="button"
                                                onClick={() => handleEmojiClick(emoji)}
                                                className="hover:bg-accent focus:ring-ring pointer-events-auto flex h-10 w-10 items-center justify-center rounded transition-all duration-150 hover:scale-95 hover:shadow-sm focus:ring-offset-2 focus-visible:ring-2 focus-visible:outline-none"
                                            >
                                                <span className="text-2xl">{emoji}</span>
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent className="z-tooltip pointer-events-none">
                                            <p className="text-xs">{emojiData?.name || emoji}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            );
                        })}
                    </div>
                </div>
            )}

            <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="flex flex-1 flex-col overflow-hidden">
                {!debouncedQuery && (
                    <TabsList className="border-border sticky top-0 z-10 h-auto justify-start gap-0 rounded-none border-b bg-transparent p-0">
                        {categories.map((category) => (
                            <TabsTrigger
                                key={category.id}
                                value={category.id}
                                className="data-[state=active]:bg-accent data-[state=active]:border-primary h-10 w-10 rounded-none border-b-2 border-transparent p-0 transition-all duration-150"
                                aria-label={category.name}
                            >
                                <span className="text-xl">{category.icon}</span>
                            </TabsTrigger>
                        ))}
                    </TabsList>
                )}

                <ScrollArea className="flex-1">
                    <div ref={gridRef} className="p-2">
                        {filteredEmojis.length === 0 ? (
                            <div className="text-muted-foreground flex flex-col items-center justify-center py-12">
                                <span className="mb-2 text-4xl">🔍</span>
                                <p className="mb-3 text-sm">No emojis found</p>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setSearchQuery('');
                                        setDebouncedQuery('');
                                        searchInputRef.current?.focus();
                                    }}
                                >
                                    Clear search
                                </Button>
                            </div>
                        ) : (
                            <>
                                {categories.map((category) => {
                                    const categoryEmojis = debouncedQuery
                                        ? filteredEmojis.filter((e) => e.category === category.id)
                                        : selectedCategory === category.id
                                          ? filteredEmojis
                                          : [];

                                    if (categoryEmojis.length === 0) return null;

                                    return (
                                        <TabsContent key={category.id} value={category.id} className="mt-0" {...(debouncedQuery ? { forceMount: true } : {})}>
                                            {debouncedQuery && (
                                                <h3 className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">{category.name}</h3>
                                            )}
                                            <div className="grid grid-cols-6 gap-1 sm:grid-cols-8">
                                                {categoryEmojis.map((emoji, index) => {
                                                    const globalIndex = filteredEmojis.indexOf(emoji);
                                                    const isFocused = focusedIndex === globalIndex;
                                                    return (
                                                        <TooltipProvider key={`${emoji.emoji}-${index}`} delayDuration={300}>
                                                            <Tooltip disableHoverableContent>
                                                                <TooltipTrigger asChild>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleEmojiClick(emoji.emoji)}
                                                                        className={`hover:bg-accent focus:ring-ring pointer-events-auto flex h-10 w-10 items-center justify-center rounded transition-all duration-150 hover:scale-95 hover:shadow-sm focus:ring-offset-2 focus-visible:ring-2 focus-visible:outline-none ${
                                                                            isFocused ? 'ring-ring ring-2 ring-offset-2' : ''
                                                                        }`}
                                                                    >
                                                                        <span className="text-2xl">{emoji.emoji}</span>
                                                                    </button>
                                                                </TooltipTrigger>
                                                                <TooltipContent className="z-tooltip pointer-events-none">
                                                                    <p className="text-xs">{emoji.name}</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    );
                                                })}
                                            </div>
                                        </TabsContent>
                                    );
                                })}
                            </>
                        )}
                    </div>
                </ScrollArea>
            </Tabs>

            {focusedEmoji && <div className="border-border text-muted-foreground border-t p-2 text-center text-xs">{focusedEmoji.name}</div>}
        </div>
    );
}
