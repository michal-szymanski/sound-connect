import { X } from 'lucide-react';
import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Button } from '@/shared/components/ui/button';
import type { UserDTO } from '@sound-connect/common/types/models';

const BASE_BOTTOM_OFFSET = 24;
const BASE_RIGHT_OFFSET = 24;
const AVATAR_SIZE = 48;
const STACK_SPACING = 8;

type Props = {
    user: UserDTO;
    position: number;
    onRestore: () => void;
    onClose: () => void;
};

export const MinimizedChatButton = ({ user, position, onRestore, onClose }: Props) => {
    const [isHovered, setIsHovered] = useState(false);
    const bottomOffset = BASE_BOTTOM_OFFSET + position * (AVATAR_SIZE + STACK_SPACING);

    return (
        <div
            className="z-dialog fixed"
            style={{
                bottom: `${bottomOffset}px`,
                right: `${BASE_RIGHT_OFFSET}px`,
                transition: 'bottom 300ms cubic-bezier(0.4, 0, 0.2, 1)'
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <button
                onClick={onRestore}
                className="bg-card border-border focus-visible:ring-ring flex h-14 w-14 items-center justify-center rounded-full border-2 shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                aria-label={`Restore chat with ${user.name}`}
            >
                <Avatar className="h-12 w-12">
                    <AvatarImage src={user.image || undefined} alt={user.name} />
                    <AvatarFallback className="bg-primary text-primary-foreground">{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
            </button>

            {isHovered && (
                <Button
                    size="icon"
                    variant="destructive"
                    className="animate-in fade-in zoom-in absolute -top-2 -right-2 h-6 w-6 rounded-full shadow-md duration-150"
                    onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                    }}
                    aria-label={`Close chat with ${user.name}`}
                >
                    <X className="h-3 w-3" />
                </Button>
            )}
        </div>
    );
};
