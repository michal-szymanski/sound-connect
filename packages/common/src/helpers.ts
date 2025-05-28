export const getRoomId = (senderId: string, peerId: string): string => {
    return [senderId, peerId].sort().join(':');
};
