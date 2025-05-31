import OnlineStatusIcon from '@/web/components/online-status-icon';
import { Avatar, AvatarFallback, AvatarImage } from '@/web/components/ui/avatar';
import { useUserStatuses } from '@/web/providers/user-statuses-provider';
import { DEFAULT_AVATAR_URL } from '@sound-connect/common/constants';
import { UserDTO } from '@sound-connect/common/types/models';

type Props = {
    user: UserDTO;
};

const StatusAvatar = ({ user }: Props) => {
    const { statuses } = useUserStatuses();

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
