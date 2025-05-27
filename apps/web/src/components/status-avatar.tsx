import OnlineStatusIcon from '@/web/components/online-status-icon';
import { Avatar, AvatarFallback, AvatarImage } from '@/web/components/ui/avatar';
import { UserDTO } from '@/web/types/auth';
import { SHADCN_DEFAULT_AVATAR } from '@sound-connect/api/constants';
import { OnlineStatus } from '@sound-connect/api/types';

type Props = {
    user: UserDTO;
    status?: OnlineStatus;
};

const StatusAvatar = ({ user, status }: Props) => {
    return (
        <div className="relative">
            <Avatar className="relative top-0">
                <AvatarImage src={user.image ?? SHADCN_DEFAULT_AVATAR} />
                <AvatarFallback>{user.name}</AvatarFallback>
            </Avatar>
            <OnlineStatusIcon status={status} />
        </div>
    );
};

export default StatusAvatar;
