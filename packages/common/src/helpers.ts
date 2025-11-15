export const getRoomId = (senderId: string, peerId: string): string => {
    return `dm:${[senderId, peerId].sort().join('-')}`;
};
