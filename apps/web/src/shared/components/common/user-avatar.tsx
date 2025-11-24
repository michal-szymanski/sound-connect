import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { cn } from '@/shared/lib/utils';

type Props = {
    user: {
        id: string;
        name: string;
        image: string | null;
    };
    className?: string;
    fallbackClassName?: string;
};

const UserAvatar = ({ user, className, fallbackClassName = 'bg-primary text-primary-foreground' }: Props) => {
    return (
        <Avatar className={cn('relative top-0', className)}>
            <AvatarImage src={user.image ?? undefined} alt={user.name} />
            <AvatarFallback className={fallbackClassName}>{user.name.charAt(0)}</AvatarFallback>
        </Avatar>
    );
};

export default UserAvatar;
