import { OnlineStatus } from '@sound-connect/api/types';

type Props = {
    status?: OnlineStatus;
};

const OnlineStatusIcon = ({ status }: Props) => {
    if (!status || status === 'offline') return null;

    return (
        <span className="relative bottom-0 left-full flex size-5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75"></span>
            <span className="relative inline-flex size-3 rounded-full bg-sky-500"></span>
        </span>
    );
};

export default OnlineStatusIcon;
