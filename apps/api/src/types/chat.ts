import { ChatMessage } from '@sound-connect/common/types/models';

// Extended chat message with additional properties for internal use
export type StoredChatMessage = ChatMessage & {
    roomId: string;
    senderId: string;
    timestamp: number;
};

// User join/leave notification message
export type UserNotificationMessage = {
    type: 'user-joined' | 'user-left';
    roomId: string;
    userId: string;
};

// Union type for all messages that can be sent between Durable Objects
export type InternalMessage = StoredChatMessage | UserNotificationMessage;
