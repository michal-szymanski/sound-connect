CREATE TABLE `upload_sessions` (
    `id` text PRIMARY KEY NOT NULL,
    `user_id` text NOT NULL,
    `upload_type` text NOT NULL,
    `band_id` integer,
    `file_name` text NOT NULL,
    `file_size` integer NOT NULL,
    `content_type` text NOT NULL,
    `temp_key` text NOT NULL,
    `expires_at` text NOT NULL,
    `created_at` text NOT NULL,
    `confirmed_at` text,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
    FOREIGN KEY (`band_id`) REFERENCES `bands`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE INDEX `idx_upload_sessions_user_id` ON `upload_sessions` (`user_id`);
CREATE INDEX `idx_upload_sessions_expires_at` ON `upload_sessions` (`expires_at`);
CREATE INDEX `idx_upload_sessions_confirmed_at` ON `upload_sessions` (`confirmed_at`);
