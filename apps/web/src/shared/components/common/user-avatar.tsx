import OnlineStatusIcon from '@/shared/components/common/online-status-icon';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { useAuth } from '@/shared/lib/react-query';
import { cn } from '@/shared/lib/utils';
import { useChat } from '@/shared/components/providers/chat-provider';

type Props = {
    user: {
        id: string;
        name: string;
        image: string | null;
    };
    className?: string;
    fallbackClassName?: string;
};

const UserAvatar = ({ user, className, fallbackClassName }: Props) => {
    const { statuses } = useChat();
    const { data: auth } = useAuth();
    const isCurrentUser = auth?.user?.id === user.id;

    return (
        <div className="relative">
            <Avatar className={cn('relative top-0', className)}>
                <AvatarImage src={user.image ?? undefined} alt={user.name} />
                <AvatarFallback className={fallbackClassName}>{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            {!isCurrentUser && <OnlineStatusIcon status={statuses.get(user.id)} />}
        </div>
    );
};

export default UserAvatar;
