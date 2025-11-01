import OnlineStatusIcon from '@/web/components/small/online-status-icon';
import { Avatar, AvatarFallback, AvatarImage } from '@/web/components/ui/avatar';
import { useAuth } from '@/web/lib/react-query';
import { cn } from '@/web/lib/utils';
import { useWebSocket } from '@/web/providers/websocket-provider';

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
    const { statuses } = useWebSocket();
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
