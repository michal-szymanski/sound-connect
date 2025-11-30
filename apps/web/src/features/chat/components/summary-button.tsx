import { X } from 'lucide-react';
import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Button } from '@/shared/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover';
import type { UserDTO } from '@sound-connect/common/types/models';

const BASE_BOTTOM_OFFSET = 24;
const BASE_RIGHT_OFFSET = 24;
const AVATAR_SIZE = 48;
const STACK_SPACING = 8;

type ChatWindowState = {
    user: UserDTO;
    isMinimized: boolean;
};

type Props = {
    hiddenCount: number;
    hiddenWindows: ChatWindowState[];
    position: number;
    onRestoreChat: (userId: string) => void;
    onCloseChat: (userId: string) => void;
};

export const SummaryButton = ({ hiddenCount, hiddenWindows, position, onRestoreChat, onCloseChat }: Props) => {
    const [isOpen, setIsOpen] = useState(false);
    const bottomOffset = BASE_BOTTOM_OFFSET + position * (AVATAR_SIZE + STACK_SPACING);

    return (
        <div
            className="z-dialog fixed"
            style={{
                bottom: `${bottomOffset}px`,
                right: `${BASE_RIGHT_OFFSET}px`,
                transition: 'bottom 300ms cubic-bezier(0.4, 0, 0.2, 1)'
            }}
        >
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <button
                        className="focus-visible:ring-ring bg-muted border-border relative flex h-12 w-12 items-center justify-center rounded-full border-2 shadow-lg transition-shadow hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                        aria-label={`View ${hiddenCount} hidden chat${hiddenCount > 1 ? 's' : ''}`}
                        aria-expanded={isOpen}
                        aria-haspopup="dialog"
                    >
                        <span className="text-muted-foreground text-sm font-semibold">+{hiddenCount}</span>
                    </button>
                </PopoverTrigger>

                <PopoverContent className="z-popover max-h-[320px] w-[280px] p-2" side="left" align="end" sideOffset={8}>
                    <div className="space-y-1">
                        <div className="border-border mb-1 border-b px-2 py-1.5">
                            <h3 className="text-foreground text-sm font-semibold">Hidden Chats</h3>
                        </div>

                        <div className="max-h-[260px] space-y-1 overflow-y-auto">
                            {hiddenWindows.map((window) => {
                                const isBand = window.user.id.startsWith('band-');
                                return (
                                    <div
                                        key={window.user.id}
                                        className="group hover:bg-accent flex w-full items-center gap-3 rounded-md px-2 py-2 transition-colors duration-150"
                                    >
                                        <button
                                            onClick={() => {
                                                onRestoreChat(window.user.id);
                                                setIsOpen(false);
                                            }}
                                            className="focus-visible:ring-ring flex min-w-0 flex-1 items-center gap-3 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                                        >
                                            <Avatar className={`h-8 w-8 shrink-0 ${isBand ? 'rounded-md' : 'rounded-full'}`}>
                                                <AvatarImage src={window.user.image || undefined} alt={window.user.name} />
                                                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                                    {window.user.name.charAt(0).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex min-w-0 flex-1 flex-col items-start">
                                                <span className="text-foreground truncate text-left text-sm font-medium">{window.user.name}</span>
                                                {!isBand && (
                                                    <span className="text-muted-foreground truncate text-xs">@{window.user.username || window.user.id.slice(0, 8)}</span>
                                                )}
                                            </div>
                                        </button>

                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="hover:bg-destructive hover:text-destructive-foreground h-6 w-6 shrink-0 opacity-0 transition-opacity duration-150 group-hover:opacity-100"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onCloseChat(window.user.id);
                                            }}
                                            aria-label={`Close chat with ${window.user.name}`}
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
};
