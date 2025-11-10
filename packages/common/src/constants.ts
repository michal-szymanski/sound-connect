export const APP_NAME = 'Sound Connect';
export const APP_NAME_NORMALIZED = 'sound-connect';
export const CHAT_MESSAGE_MAX_LENGTH = 1000;
export const POST_TEXT_MAX_LENGTH = 1000;
export const ONLINE_STATUS_INTERVAL = 2000;
export const NOTIFICATION_RETENTION_TIME = 30 * 24 * 60 * 60 * 1000;
export const JWT_EXPIRATION_TIME_IN_SECONDS = 60 * 15;

export const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
export const MAX_VIDEO_SIZE = 100 * 1024 * 1024;
export const MAX_POST_MEDIA_COUNT = 5;
export const PRESIGNED_URL_EXPIRY_MINUTES = 15;
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;
export const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'] as const;
