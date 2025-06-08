import { ChatMessage } from '@sound-connect/common/types/models';

export type StoredChatMessage = ChatMessage & {
    roomId: string;
    senderId: string;
    timestamp: number;
};

export type UserNotificationMessage = {
    type: 'user-joined' | 'user-left';
    roomId: string;
    userId: string;
};

export type InternalMessage = StoredChatMessage | UserNotificationMessage;
