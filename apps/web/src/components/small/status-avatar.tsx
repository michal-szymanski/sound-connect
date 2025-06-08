import OnlineStatusIcon from '@/web/components/small/online-status-icon';
import { Avatar, AvatarFallback, AvatarImage } from '@/web/components/ui/avatar';
import { useWebSocket } from '@/web/providers/websocket-provider';
import { DEFAULT_AVATAR_URL } from '@sound-connect/common/constants';
import { UserDTO } from '@sound-connect/common/types/models';

type Props = {
    user: UserDTO;
};

const StatusAvatar = ({ user }: Props) => {
    const { statuses } = useWebSocket();

    return (
        <div className="relative">
            <Avatar className="relative top-0">
                <AvatarImage src={user.image ?? DEFAULT_AVATAR_URL} />
                <AvatarFallback>{user.name}</AvatarFallback>
            </Avatar>
            <OnlineStatusIcon status={statuses.get(user.id)} />
        </div>
    );
};

export default StatusAvatar;
