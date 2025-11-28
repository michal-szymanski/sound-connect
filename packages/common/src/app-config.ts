export const appConfig = {
    emailsEnabled: false,

    appName: 'Sound Connect',
    appNameNormalized: 'sound-connect',

    chatMessageMaxLength: 1000,
    postTextMaxLength: 1000,
    onlineStatusInterval: 2000,
    notificationRetentionTime: 30 * 24 * 60 * 60 * 1000,
    jwtExpirationTimeInSeconds: 60 * 15,

    maxImageSize: 10 * 1024 * 1024,
    maxVideoSize: 100 * 1024 * 1024,
    maxAudioSize: 50 * 1024 * 1024,
    maxPostMediaCount: 5,
    maxMusicSampleCount: 10,
    presignedUrlExpiryMinutes: 15,
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    allowedVideoTypes: ['video/mp4', 'video/webm', 'video/quicktime'],
    allowedAudioTypes: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm']
} as const;

export type AppConfig = typeof appConfig;
