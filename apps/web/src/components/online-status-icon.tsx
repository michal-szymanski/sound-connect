import { OnlineStatus } from '@sound-connect/common/types/models';

type Props = {
    status?: OnlineStatus;
};

const OnlineStatusIcon = ({ status }: Props) => {
    if (!status || status === 'offline') return null;

    return (
        <span className="absolute -bottom-1 -right-1 flex size-3">
            <span className="relative inline-flex size-3 rounded-full border-2 border-black bg-green-700" />
        </span>
    );
};

export default OnlineStatusIcon;
